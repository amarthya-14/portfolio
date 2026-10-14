// Opening sequence: the F1 car rolls onto a dark, reflective grid, five lights come on,
// lights out, it launches past the camera, and the page fades up behind it.

const SEEN_KEY = 'introSeen';
const FORWARD = 1; // the model's nose points along +z
const MODEL_URL = '/models/sf23.glb';
const MODEL_BYTES = 3.3e6; // used for the progress bar when the server sends no length
const CAR_SCALE = 1.15; // the source model is ~85% of a real car; bring it up to ~5.5 m
// Axles in model space (metres): y = centre height, z = position along the car, r = tyre radius,
// x = inner face of the wheel (everything outboard of it spins).
const AXLES = [
  { z: 1.301, y: 0.296, r: 0.296, x: 0.535 },
  { z: -1.754, y: 0.303, r: 0.298, x: 0.565 }
];
const params = new URLSearchParams(location.search);
// ?slowmo plays at quarter speed; ?at=6.2 freezes on that second. Both are for tuning only.
const SPEED = params.has('slowmo') ? 0.25 : 1;
const FREEZE_AT = params.has('at') ? parseFloat(params.get('at')) : NaN;
const frozen = !Number.isNaN(FREEZE_AT);

let running = false;
let threeModules = null;

function loadThree() {
  if (!threeModules) {
    threeModules = Promise.all([
      import('three'),
      import('three/addons/environments/RoomEnvironment.js'),
      import('three/addons/objects/Reflector.js'),
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/libs/meshopt_decoder.module.js')
    ]).then(([THREE, r, m, g, d]) => ({
      THREE, RoomEnvironment: r.RoomEnvironment, Reflector: m.Reflector,
      GLTFLoader: g.GLTFLoader, MeshoptDecoder: d.MeshoptDecoder
    }));
    threeModules.catch(() => { threeModules = null; });
  }
  return threeModules;
}

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export async function playIntro() {
  if (running) return;
  running = true;

  const root = document.documentElement;
  const intro = document.getElementById('intro');
  const canvas = document.getElementById('introCanvas');
  const lights = document.getElementById('lights');
  const status = document.getElementById('introStatus');
  const loadFill = document.getElementById('loadFill');
  const loadPct = document.getElementById('loadPct');
  const skipBtn = document.getElementById('skipIntro');

  intro.className = 'intro active';
  document.body.classList.remove('arrive');
  status.textContent = 'Loading';
  loadFill.style.width = '0%';
  loadPct.textContent = '0';
  if (!lights.children.length) {
    for (let i = 0; i < 5; i++) lights.appendChild(Object.assign(document.createElement('span'), { className: 'lamp' }));
  }
  const lamps = [...lights.children];
  lamps.forEach((l) => l.classList.remove('on'));
  lights.classList.remove('show');

  let finished = false;
  let sceneReady = false;
  let disposeScene = () => {};
  const timers = [];
  const later = (fn, ms) => {
    if (frozen && ms / 1000 > FREEZE_AT) return;
    timers.push(setTimeout(fn, ms / SPEED));
  };

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
    skipBtn.removeEventListener('click', finish);
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* storage blocked */ }

    root.classList.remove('intro-on');
    window.scrollTo(0, 0);
    document.body.classList.add('arrive');
    intro.classList.add('fade');
    setTimeout(() => {
      disposeScene();
      intro.className = 'intro';
      running = false;
    }, 1050);
  }
  function onKey(e) { if (e.key === 'Escape') finish(); }
  window.addEventListener('keydown', onKey);
  skipBtn.addEventListener('click', finish);

  // Never trap the visitor behind a slow network or a missing GPU.
  later(() => { if (!sceneReady) finish(); }, 12000);

  let mods;
  try {
    mods = await loadThree();
  } catch (e) {
    return lightsOnly();
  }
  if (finished) return;
  const { THREE, RoomEnvironment, Reflector, GLTFLoader, MeshoptDecoder } = mods;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return lightsOnly();
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030304);
  scene.fog = new THREE.Fog(0x030304, 8, 26);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.7;

  const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 200);
  const lookAt = new THREE.Vector3(0, 0.42, 0);

  // Polished black floor: a mirror under a dark, translucent coat
  const mirror = new Reflector(new THREE.PlaneGeometry(80, 80), {
    textureWidth: Math.round(window.innerWidth * dpr * 0.5),
    textureHeight: Math.round(window.innerHeight * dpr * 0.5),
    color: 0x8a8a8a
  });
  mirror.rotation.x = -Math.PI / 2;
  scene.add(mirror);
  const coat = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshBasicMaterial({ color: 0x050506, transparent: true, opacity: 0.86 })
  );
  coat.rotation.x = -Math.PI / 2;
  coat.position.y = 0.002;
  scene.add(coat);

  // Two hairline red light lines running down the straight
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xff1a10 });
  [-2.9, 2.9].forEach((x) => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.01, 200), lineMat);
    line.position.set(x, 0.01, FORWARD * 80);
    scene.add(line);
  });

  // Lighting: a soft white key from above, a red rim from behind
  const key = new THREE.SpotLight(0xffffff, 120, 30, 0.5, 0.95, 1.6);
  key.position.set(1.2, 7, FORWARD * 1.8);
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);
  const rim = new THREE.PointLight(0xff2010, 40, 16, 1.6);
  rim.position.set(0, 1.6, -FORWARD * 4.2);
  scene.add(rim, new THREE.HemisphereLight(0x2a2a33, 0x030303, 0.2));

  const car = new THREE.Group();
  scene.add(car);

  function frameCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    // Portrait screens look at the car more nose-on, so it can sit larger in a narrow frame
    const portrait = aspect < 1;
    const k = portrait ? Math.min(1.9, 1.0 / aspect) : 1;
    camera.userData.dist = 8.8 * k;
    camera.userData.height = 1.15 + (k - 1) * 0.5;
    camera.userData.angles = portrait ? [0.56, 0.34] : [0.78, 0.5];
    scene.fog.near = camera.userData.dist * 0.9;
    scene.fog.far = camera.userData.dist * 2.8;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  frameCamera();
  window.addEventListener('resize', frameCamera);

  disposeScene = () => {
    window.removeEventListener('resize', frameCamera);
    renderer.setAnimationLoop(null);
    scene.traverse((o) => {
      if (o.isMesh && o !== mirror && !car.getObjectById(o.id)) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
    });
    mirror.dispose();
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
  };

  let built;
  try {
    built = await loadCar(THREE, GLTFLoader, MeshoptDecoder, (f) => {
      const pct = Math.round(f * 100);
      loadFill.style.width = pct + '%';
      loadPct.textContent = String(pct);
    });
  } catch (e) {
    disposeScene();
    disposeScene = () => {};
    return lightsOnly();
  }
  if (finished) { built.dispose(); return; }
  const wheels = built.wheels;
  car.add(built.car);
  const prevDispose = disposeScene;
  disposeScene = () => { built.dispose(); prevDispose(); };
  sceneReady = true;
  loadFill.style.width = '100%';
  loadPct.textContent = '100';
  intro.classList.add('loaded');
  status.textContent = 'Car on the grid';

  // ---------- Timeline (seconds from car ready) ----------
  const ROLL_IN = 2.4;
  const LIGHTS_START = 2.7;
  const LIGHT_GAP = 0.7;
  const outAt = LIGHTS_START + 4 * LIGHT_GAP + 0.8 + (frozen ? 0.3 : Math.random() * 0.6);
  const ACCEL = 32;
  const START_Z = -FORWARD * 14;

  let lightsOn = 0;
  let launched = false;
  const clock = new THREE.Clock();
  let prevZ = START_Z;

  later(() => lights.classList.add('show'), (LIGHTS_START - 0.6) * 1000);
  for (let i = 0; i < 5; i++) {
    later(() => { lamps[i].classList.add('on'); lightsOn = i + 1; }, (LIGHTS_START + i * LIGHT_GAP) * 1000);
  }
  later(() => {
    lamps.forEach((l) => l.classList.remove('on'));
    status.textContent = 'Lights out';
    launched = true;
  }, outAt * 1000);
  if (!frozen) later(finish, (outAt + 0.75) * 1000);

  renderer.setAnimationLoop(() => {
    const t = frozen ? Math.min(clock.getElapsedTime(), FREEZE_AT) : clock.getElapsedTime() * SPEED;

    let z;
    if (t < ROLL_IN) z = START_Z * (1 - easeOutCubic(t / ROLL_IN));
    else if (!launched) z = 0;
    else { const tau = t - outAt; z = FORWARD * 0.5 * ACCEL * tau * tau; }
    car.position.z = z;

    const dz = z - prevZ;
    prevZ = z;
    wheels.forEach((w) => { w.rotation.x += dz / w.userData.radius; });

    // A faint idle tremor that tightens with each light
    const shake = t > ROLL_IN && !launched ? 0.0012 + (lightsOn / 5) * 0.003 : 0;
    car.position.y = Math.sin(t * 90) * shake;

    // Camera drifts slowly around the front three-quarter, then holds as the car leaves
    const drift = easeInOut(clamp01(t / outAt));
    const angle = THREE.MathUtils.lerp(camera.userData.angles[0], camera.userData.angles[1], drift);
    const dist = camera.userData.dist * THREE.MathUtils.lerp(1.08, 0.95, drift);
    camera.position.set(Math.sin(angle) * dist, camera.userData.height, FORWARD * Math.cos(angle) * dist);
    if (launched) {
      const tau = t - outAt;
      lookAt.z = THREE.MathUtils.lerp(0, z, Math.min(0.45, tau * 0.8));
      camera.fov = 30 + Math.min(8, tau * 16);
      camera.updateProjectionMatrix();
    } else {
      lookAt.z = Math.min(z, 3) * 0.3;
    }
    camera.lookAt(lookAt);

    renderer.render(scene, camera);
  });

  // Without 3D: the five lights alone, then the page.
  function lightsOnly() {
    if (finished) return;
    sceneReady = true;
    intro.classList.add('loaded');
    lights.classList.add('show');
    for (let i = 0; i < 5; i++) later(() => lamps[i].classList.add('on'), 300 + i * 500);
    later(() => lamps.forEach((l) => l.classList.remove('on')), 3100);
    later(finish, 3500);
  }
}

// Load the car and cut each wheel out of the merged body mesh, so the wheels can turn.
function loadCar(THREE, GLTFLoader, MeshoptDecoder, onProgress) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return new Promise((resolve, reject) => {
    loader.load(MODEL_URL, (gltf) => {
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      const car = new THREE.Group();
      car.scale.setScalar(CAR_SCALE);
      const pivots = [];
      AXLES.forEach((a) => [-1, 1].forEach((side) => {
        const p = new THREE.Group();
        p.position.set(0, a.y, a.z);
        p.userData = { side, axle: a, radius: a.r * CAR_SCALE };
        car.add(p);
        pivots.push(p);
      }));
      const geometries = [];

      root.traverse((o) => {
        if (!o.isMesh) return;
        const geo = toFloatGeometry(THREE, o.geometry);
        geo.applyMatrix4(o.matrixWorld);
        const pos = geo.attributes.position;
        const index = geo.index ? geo.index.array : Array.from({ length: pos.count }, (_, i) => i);
        const groups = pivots.map(() => []);
        const body = [];
        for (let t = 0; t < index.length; t += 3) {
          const i0 = index[t], i1 = index[t + 1], i2 = index[t + 2];
          const x = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
          const y = (pos.getY(i0) + pos.getY(i1) + pos.getY(i2)) / 3;
          const z = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;
          let hit = -1;
          for (let k = 0; k < pivots.length; k++) {
            const { side, axle } = pivots[k].userData;
            if (x * side < axle.x || x * side > 0.95) continue;
            if (Math.hypot(y - axle.y, z - axle.z) > axle.r + 0.012) continue;
            hit = k;
            break;
          }
          (hit < 0 ? body : groups[hit]).push(i0, i1, i2);
        }
        const make = (tris) => {
          const g = new THREE.BufferGeometry();
          for (const name in geo.attributes) g.setAttribute(name, geo.attributes[name]);
          g.setIndex(tris);
          geometries.push(g);
          return g;
        };
        const material = o.material;
        material.envMapIntensity = 1;
        car.add(new THREE.Mesh(make(body), material));
        groups.forEach((tris, k) => {
          if (!tris.length) return;
          const m = new THREE.Mesh(make(tris), material);
          m.position.set(0, -pivots[k].userData.axle.y, -pivots[k].userData.axle.z);
          pivots[k].add(m);
        });
      });

      resolve({
        car,
        wheels: pivots,
        dispose() {
          geometries.forEach((g) => g.dispose());
          root.traverse((o) => {
            if (!o.isMesh) return;
            o.geometry.dispose();
            const m = o.material;
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'clearcoatMap', 'clearcoatRoughnessMap'].forEach((k) => m[k] && m[k].dispose());
            m.dispose();
          });
        }
      });
    }, (e) => {
      onProgress(Math.min(0.99, e.loaded / (e.lengthComputable && e.total ? e.total : MODEL_BYTES)));
    }, reject);
  });
}

// Compressed models store positions as quantised integers; turn every attribute into plain floats
// so the geometry can be transformed and split safely.
function toFloatGeometry(THREE, source) {
  const geo = new THREE.BufferGeometry();
  for (const name in source.attributes) {
    const a = source.attributes[name];
    const n = a.count, size = a.itemSize;
    const arr = new Float32Array(n * size);
    for (let i = 0; i < n; i++) for (let c = 0; c < size; c++) arr[i * size + c] = a.getComponent(i, c);
    geo.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  if (source.index) geo.setIndex(new THREE.BufferAttribute(source.index.array.slice(), 1));
  return geo;
}
