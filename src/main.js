import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { featured, more, milestones, setup } from './data.js';
import { playIntro } from './intro.js';

document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chips = (list) => (list.length ? `<div class="chips">${list.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '');

/* ---------- Work: projects on the left, a sticky screen on the right that follows them ---------- */
const host = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
document.getElementById('featured').innerHTML = featured.map((p, i) => `
  <article class="work reveal" data-i="${i}">
    ${p.shot ? `<img class="work-shot" src="${p.shot}" alt="${esc(p.name)} home screen" loading="lazy" width="1100" height="688">` : ''}
    <div class="work-idx">0${i + 1}</div>
    <h3 class="work-name">${esc(p.name)}</h3>
    <p class="work-tag">${esc(p.tagline)}</p>
    <div class="work-status"><span class="status ${p.status}">${p.statusText}</span><span>${esc(p.year)}</span></div>
    <p class="work-desc">${esc(p.desc)}</p>
    <ul class="work-notes">${p.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    ${p.stack.length ? `<div class="stack">${p.stack.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    <div class="work-links">
      ${p.live ? `<a class="link-arrow" href="${p.live}" target="_blank" rel="noopener">Visit live site</a>` : ''}
      ${p.repo ? `<a class="link-arrow" href="${p.repo}" target="_blank" rel="noopener">Source code</a>` : ''}
    </div>
  </article>`).join('');

const screenFrame = document.getElementById('screenFrame');
screenFrame.insertAdjacentHTML('afterbegin', featured.map((p, i) =>
  `<img src="${p.shot}" alt="" width="1100" height="688" class="${i === 0 ? 'on' : ''}" decoding="async">`).join(''));
const shots = [...screenFrame.querySelectorAll('img')];
const screenIdx = document.getElementById('screenIdx');
const screenUrl = document.getElementById('screenUrl');
const workEls = [...document.querySelectorAll('.work')];
let shotNow = -1;
function setShot(i) {
  if (i === shotNow) return;
  const prev = shotNow;
  shotNow = i;
  shots.forEach((img, k) => {
    img.classList.toggle('on', k === i);
    img.classList.toggle('below', k > i);
  });
  workEls.forEach((el, k) => el.classList.toggle('hot', k === i));
  screenIdx.textContent = `0${i + 1} / 0${featured.length}`;
  screenUrl.textContent = featured[i].live ? host(featured[i].live) : '';
  if (prev >= 0) {
    screenFrame.classList.remove('scan');
    void screenFrame.offsetWidth;
    screenFrame.classList.add('scan');
  }
}
function updateWork() {
  const mid = window.innerHeight * 0.55;
  let active = 0;
  workEls.forEach((el, i) => { if (el.getBoundingClientRect().top < mid) active = i; });
  setShot(active);
}

document.getElementById('archive').innerHTML = more.map((p) => `
  <div class="arow reveal">
    <span class="arow-name">${esc(p.name)}</span>
    <span class="arow-desc">${esc(p.desc)}</span>
    <span class="arow-stack">${p.stack.map(esc).join(' · ')}</span>
    <span class="arow-year">${esc(p.year)}</span>
    <span class="arow-links">
      ${p.live ? `<a href="${p.live}" target="_blank" rel="noopener">Live</a>` : ''}
      ${p.repo ? `<a href="${p.repo}" target="_blank" rel="noopener">Code</a>` : ''}
    </span>
  </div>`).join('');

/* ---------- Capabilities: the x-ray car ---------- */
document.getElementById('caps').innerHTML = setup.map((s, i) => `
  <li class="xr-card${i === 0 ? ' on' : ''}" data-i="${i}">
    <p class="xr-part"><span>0${i + 1}</span>${esc(s.label)}</p>
    <h3>${esc(s.title)}</h3>
    <p class="xr-line">${esc(s.line)}</p>
    <ul>${s.items.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join('')}</ul>
  </li>`).join('');
document.getElementById('xrSteps').innerHTML = setup.map((s, i) => `<li class="${i === 0 ? 'on' : ''}"><span>0${i + 1}</span>${esc(s.label)}</li>`).join('');
const xrSection = document.getElementById('capabilities');
if (reduceMotion) {
  xrSection.classList.add('static');
} else {
  // Start loading three.js and the car a little before the section scrolls into view
  const near = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    near.disconnect();
    import('./xray.js').then((m) => m.initXray(setup)).catch(() => xrSection.classList.add('static'));
  }, { rootMargin: '150% 0px' });
  near.observe(xrSection);
}

/* ---------- Journey: milestones + scroll-driven marker ---------- */
const list = document.getElementById('milestones');
list.innerHTML = milestones.map((m, i) => `
  <li class="ms" data-i="${i}">
    <span class="ms-t">T${i + 1}</span>
    <div>
      <div class="ms-meta">${esc(m.corner)} · ${esc(m.when)}</div>
      <h3>${esc(m.title)}</h3>
      <p>${esc(m.text)}</p>
    </div>
  </li>`).join('');

const track = document.getElementById('track');
const d = track.getAttribute('d');
document.getElementById('driven').setAttribute('d', d);
const total = track.getTotalLength();
const driven = document.getElementById('driven');
driven.setAttribute('stroke-dasharray', `0 ${total}`);
const mapCar = document.getElementById('mapCar');
const mapNow = document.getElementById('mapNow');
const cornersG = document.getElementById('corners');
const NS = 'http://www.w3.org/2000/svg';
const cornerEls = milestones.map((m, i) => {
  const pt = track.getPointAtLength(m.f * total);
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'corner');
  g.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  g.innerHTML = `<circle r="15"></circle><text text-anchor="middle" dy="4">${i + 1}</text>`;
  cornersG.appendChild(g);
  return g;
});
const msEls = [...list.children];

function placeCar(frac) {
  const L = Math.max(0, Math.min(1, frac)) * total;
  const pt = track.getPointAtLength(L);
  mapCar.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  driven.setAttribute('stroke-dasharray', `${L} ${total}`);
}

// Car progress follows the reader: the milestone crossing the middle of the screen is the one the car is taking.
function updateLap() {
  const mid = window.innerHeight * 0.5;
  let active = 0;
  let frac = 0;
  for (let i = 0; i < msEls.length; i++) {
    const r = msEls[i].getBoundingClientRect();
    if (r.top <= mid) {
      active = i;
      const within = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
      const from = milestones[i].f;
      const to = i < milestones.length - 1 ? milestones[i + 1].f : 1;
      frac = from + (to - from) * within;
    }
  }
  const first = msEls[0].getBoundingClientRect();
  if (first.top > mid) frac = Math.max(0, milestones[0].f * (1 - Math.min(1, (first.top - mid) / mid)));
  placeCar(frac);
  msEls.forEach((el, i) => {
    el.classList.toggle('hot', i === active && first.top <= mid);
    el.classList.toggle('done', i < active);
  });
  cornerEls.forEach((el, i) => {
    el.classList.toggle('hot', i === active && first.top <= mid);
    el.classList.toggle('done', i < active);
  });
  mapNow.textContent = first.top <= mid ? milestones[active].corner : 'Start';
}

/* ---------- Nav, progress bar, active section ---------- */
const nav = document.getElementById('nav');
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')));

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', window.scrollY > 10);
    let current = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) current = i; });
    if (max > 0 && window.scrollY >= max - 4) current = sections.length - 1;
    navLinks.forEach((a, i) => a.classList.toggle('active', i === current));
    updateLap();
    updateWork();
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach((el) => io.observe(el));
}

/* ---------- Contact ---------- */
const copyBtn = document.getElementById('copyEmail');
const email = document.getElementById('email');
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(email.textContent.trim());
    copyBtn.textContent = 'Copied';
  } catch {
    const r = document.createRange();
    r.selectNodeContents(email);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    copyBtn.textContent = 'Selected';
  }
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
});

/* ---------- Local time, ticking ---------- */
const clock = document.getElementById('clock');
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const tick = () => { clock.textContent = `${fmt.format(new Date())} IST`; };
tick();
setInterval(tick, 1000);

/* ---------- What I'm building right now, live from GitHub ---------- */
(async () => {
  const now = document.getElementById('now');
  const KEY = 'ghNow';
  let data = null;
  try { data = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { /* storage blocked */ }
  if (!data) {
    try {
      const res = await fetch('https://api.github.com/users/amarthya-14/repos?per_page=30&sort=pushed');
      if (!res.ok) return;
      const repos = (await res.json()).filter((r) => !r.fork && r.name.toLowerCase() !== 'amarthya-14');
      if (!repos.length) return;
      data = { name: repos[0].name, url: repos[0].html_url, at: repos[0].pushed_at };
      try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
    } catch (e) { return; }
  }
  const days = (Date.now() - new Date(data.at).getTime()) / 864e5;
  if (!(days >= 0) || days > 45) return;
  const ago = days < 1 / 24 ? 'minutes ago' : days < 1 ? `${Math.round(days * 24)}h ago` : `${Math.round(days)}d ago`;
  const project = featured.find((p) => p.repo && p.repo.toLowerCase() === data.url.toLowerCase());
  now.innerHTML = `<i></i>Now building <a href="${esc(data.url)}" target="_blank" rel="noopener">${esc(project ? project.name : data.name)}</a> · last push ${ago}`;
  now.hidden = false;
})();

/* ---------- Smooth scrolling ---------- */
if (!reduceMotion) {
  const lenis = new Lenis({ anchors: { offset: 0 }, lerp: 0.11 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  const sync = () => (document.documentElement.classList.contains('intro-on') ? lenis.stop() : lenis.start());
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  sync();
}

/* ---------- Intro ---------- */
if (document.documentElement.classList.contains('intro-on')) playIntro();
document.getElementById('replayIntro').addEventListener('click', () => {
  document.documentElement.classList.add('intro-on');
  playIntro();
});
