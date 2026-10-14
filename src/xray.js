// Capabilities as an x-ray of the car: a pinned stage where scrolling orbits the camera and lights up
// one system at a time, with a leader line from that part of the car to its card.
import { loadThree, MODEL_URL } from './intro.js';

// Regions of the car in model space (metres; nose towards +z). x ranges are on |x|, so each box is mirrored.
const REGIONS = {
  power: [{ min: [0, 0.12, -1.5], max: [0.42, 1.0, -0.05] }],
  chassis: [{ min: [0, 0.05, -0.05], max: [0.3, 0.8, 2.45] }],
  aero: [
    { min: [0, 0, 1.62], max: [0.9, 0.42, 2.5] },
    { min: [0, 0.36, -2.5], max: [0.9, 1.0, -1.9] }
  ],
  telemetry: [{ min: [0.33, 0.08, -1.0], max: [0.78, 0.66, 0.75] }]
};
// Where the leader line pins onto the car
const ANCHORS = { power: [0, 0.93, -0.35], chassis: [0, 0.7, 0.35], aero: [0.78, 0.3, 2.05], telemetry: [0.66, 0.5, -0.15] };
// Camera for each system: azimuth from the nose (rad), elevation (rad), distance (m), target
const VIEWS = {
  power: { az: -2.35, el: 0.42, r: 7.4, t: [0, 0.4, -0.5] },
  chassis: { az: 1.2, el: 0.3, r: 9.2, t: [0, 0.35, 0.1] },
  aero: { az: 0.55, el: 0.12, r: 6.8, t: [0, 0.3, 0.2] },
  telemetry: { az: -0.3, el: 1.2, r: 10.8, t: [0, 0, -0.1] }
};

const MAX_BOXES = 8;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export async function initXray(setup) {
  const section = document.getElementById('capabilities');
  const track = document.getElementById('xrTrack');
  const stage = document.getElementById('xrStage');
  const canvas = document.getElementById('xrCanvas');
  const leader = document.getElementById('xrLeader');
  const pin = document.getElementById('xrPin');
  const pinRing = document.getElementById('xrPinRing');
  const cards = [...document.querySelectorAll('.xr-card')];
  const steps = [...document.querySelectorAll('#xrSteps li')];
  const parts = setup.map((s) => s.part);

  const { THREE, GLTFLoader, MeshoptDecoder } = await loadThree();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // Boxes: each system owns one or two, and gets a weight that fades its glow in and out
  const owner = [];
  const boxMin = [], boxMax = [];
  parts.forEach((p, i) => REGIONS[p].forEach((b) => {
    owner.push(i);
    boxMin.push(new THREE.Vector3(...b.min));
    boxMax.push(new THREE.Vector3(...b.max));
  }));
  while (boxMin.length < MAX_BOXES) { owner.push(-1); boxMin.push(new THREE.Vector3(9, 9, 9)); boxMax.push(new THREE.Vector3(9, 9, 9)); }
  const weights = new Array(MAX_BOXES).fill(0);

  const material = new THREE.ShaderMaterial({
    uniforms: { uMin: { value: boxMin }, uMax: { value: boxMax }, uW: { value: weights } },
    vertexShader: `
      varying vec3 vPos; varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vPos = world.xyz;
        vec4 mv = viewMatrix * world;
        vV = -mv.xyz;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uMin[${MAX_BOXES}]; uniform vec3 uMax[${MAX_BOXES}]; uniform float uW[${MAX_BOXES}];
      varying vec3 vPos; varying vec3 vN; varying vec3 vV;
      float inBox(vec3 p, vec3 mn, vec3 mx) {
        vec3 q = vec3(abs(p.x), p.y, p.z);
        vec3 a = smoothstep(mn - 0.05, mn + 0.05, q) * (1.0 - smoothstep(mx - 0.05, mx + 0.05, q));
        return a.x * a.y * a.z;
      }
      void main() {
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        f = f * f;
        float h = 0.0;
        for (int i = 0; i < ${MAX_BOXES}; i++) h = max(h, uW[i] * inBox(vPos, uMin[i], uMax[i]));
        vec3 base = vec3(0.86, 0.85, 0.82) * (0.012 + 0.16 * f);
        vec3 hot = vec3(1.0, 0.09, 0.05) * (0.05 + 0.55 * f);
        gl_FragColor = vec4(mix(base, hot, h), 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  // A faint drawing-board grid under the car
  const grid = new THREE.GridHelper(14, 28, 0x3a3936, 0x1d1c1b);
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  grid.material.depthWrite = false;
  scene.add(grid);

  const gltf = await new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(MODEL_URL, resolve, undefined, reject);
  });
  const car = gltf.scene;
  car.traverse((o) => {
    if (!o.isMesh) return;
    const old = o.material;
    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'clearcoatMap', 'clearcoatRoughnessMap'].forEach((k) => old[k] && old[k].dispose());
    old.dispose();
    o.material = material;
  });
  scene.add(car);

  // ---------- Layout ----------
  let W = 1, H = 1, mobile = false;
  function resize() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    mobile = W < 860;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // Push the car away from the cards: to the right on desktop, up on phones
    if (mobile) camera.setViewOffset(W, H, 0, H * 0.2, W, H);
    else camera.setViewOffset(W, H, -W * 0.17, 0, W, H);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- Scroll → chapter ----------
  const n = parts.length;
  let pointerX = 0, pointerY = 0;
  window.addEventListener('pointermove', (e) => {
    pointerX = e.clientX / window.innerWidth - 0.5;
    pointerY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function progress() {
    const r = track.getBoundingClientRect();
    const span = Math.max(1, r.height - window.innerHeight);
    const t = Math.max(0, Math.min(1, -r.top / span));
    const u = t * (n - 1);
    const i = Math.min(n - 2, Math.floor(u));
    // Hold on each system, then move briskly to the next
    return i + smooth(0.3, 0.7, u - i);
  }

  const cam = { az: 0, el: 0, r: 0, tx: 0, ty: 0, tz: 0 };
  let cur = null;
  function viewAt(u) {
    const i = Math.min(n - 2, Math.floor(u)), f = u - i;
    const a = VIEWS[parts[i]], b = VIEWS[parts[i + 1]];
    return {
      az: lerp(a.az, b.az, f), el: lerp(a.el, b.el, f), r: lerp(a.r, b.r, f),
      tx: lerp(a.t[0], b.t[0], f), ty: lerp(a.t[1], b.t[1], f), tz: lerp(a.t[2], b.t[2], f)
    };
  }

  const anchor = new THREE.Vector3();
  let active = -1;
  function frame() {
    const u = progress();
    const want = viewAt(u);
    if (!cur) Object.assign(cam, want);
    cur = true;
    for (const k in cam) cam[k] += (want[k] - cam[k]) * 0.09;

    const k = mobile ? Math.min(2.4, 1.3 / camera.aspect) : 1;
    const az = cam.az + pointerX * 0.16, el = Math.max(0.04, cam.el - pointerY * 0.06), r = cam.r * k;
    camera.position.set(
      cam.tx + r * Math.cos(el) * Math.sin(az),
      cam.ty + r * Math.sin(el),
      cam.tz + r * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(cam.tx, cam.ty, cam.tz);

    for (let b = 0; b < MAX_BOXES; b++) {
      const target = owner[b] < 0 ? 0 : Math.max(0, 1 - Math.abs(u - owner[b]) * 1.6);
      weights[b] += (target - weights[b]) * 0.12;
    }

    const now = Math.round(u);
    if (now !== active) {
      active = now;
      cards.forEach((c, i) => c.classList.toggle('on', i === now));
      steps.forEach((s, i) => s.classList.toggle('on', i === now));
    }

    // Leader line from the lit part to its card, faded out while the camera travels
    const settle = 1 - smooth(0.08, 0.3, Math.abs(u - now));
    anchor.set(...ANCHORS[parts[now]]);
    anchor.project(camera);
    const px = (anchor.x * 0.5 + 0.5) * W, py = (-anchor.y * 0.5 + 0.5) * H;
    const sr = stage.getBoundingClientRect();
    const cr = cards[now].getBoundingClientRect();
    let pts;
    if (mobile) {
      const ex = cr.left - sr.left + 28, ey = cr.top - sr.top - 14;
      pts = [[px, py], [px, ey - 18], [ex, ey - 18], [ex, ey]];
    } else {
      const ex = cr.right - sr.left + 28, ey = cr.top - sr.top + 34;
      const elbow = Math.max(ex + 20, px - Math.abs(py - ey) * 0.6);
      pts = [[px, py], [elbow, ey], [ex, ey]];
    }
    leader.setAttribute('points', pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '));
    pin.setAttribute('cx', px.toFixed(1)); pin.setAttribute('cy', py.toFixed(1));
    pinRing.setAttribute('cx', px.toFixed(1)); pinRing.setAttribute('cy', py.toFixed(1));
    stage.style.setProperty('--lead', settle.toFixed(3));

    renderer.render(scene, camera);
  }

  // Only draw while the stage is on screen
  let running = false;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; renderer.setAnimationLoop(frame); }
    else if (!e.isIntersecting && running) { running = false; renderer.setAnimationLoop(null); }
  });
  io.observe(track);
  section.classList.add('ready');
}
