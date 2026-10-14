import { featured, more, milestones, setup } from './data.js';
import { playIntro } from './intro.js';

document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chips = (list) => (list.length ? `<div class="chips">${list.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : '');

/* ---------- Work ---------- */
document.getElementById('featured').innerHTML = featured.map((p, i) => `
  <article class="work reveal">
    <div class="work-idx">0${i + 1}</div>
    <div>
      <h3 class="work-name">${esc(p.name)}</h3>
      <p class="work-tag">${esc(p.tagline)}</p>
      <div class="work-status"><span class="status ${p.status}">${p.statusText}</span><span>${esc(p.year)}</span></div>
    </div>
    <div class="work-body">
      <p>${esc(p.desc)}</p>
      <ul class="work-notes">${p.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      ${p.stack.length ? `<div class="stack">${p.stack.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="work-links">
        ${p.live ? `<a class="link-arrow" href="${p.live}" target="_blank" rel="noopener">Visit live site</a>` : ''}
        ${p.repo ? `<a class="link-arrow" href="${p.repo}" target="_blank" rel="noopener">Source code</a>` : ''}
      </div>
    </div>
  </article>`).join('');

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

/* ---------- Capabilities ---------- */
document.getElementById('caps').innerHTML = setup.map((s) => `
  <div class="cap reveal">
    <h3>${esc(s.title)}</h3>
    <ul>${s.items.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join('')}</ul>
  </div>`).join('');

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

/* ---------- Reaction test: five lights, random hold, then lights out ---------- */
(() => {
  const box = document.getElementById('rx');
  const pods = [...box.querySelectorAll('.rx-pod')];
  const timeEl = document.getElementById('rxTime');
  const msgEl = document.getElementById('rxMsg');
  const bestEl = document.getElementById('rxBest');
  let state = 'idle'; // idle → lighting → waiting → done
  let timers = [];
  let outAt = 0;
  let best = null;
  try { best = parseFloat(localStorage.getItem('rxBest')) || null; } catch (e) { /* storage blocked */ }
  if (best) bestEl.textContent = best.toFixed(3);

  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const setTime = (txt, cls = '') => { timeEl.textContent = txt; timeEl.className = 'rx-time ' + cls; };

  function start() {
    clear();
    state = 'lighting';
    pods.forEach((p) => p.classList.remove('on'));
    setTime('0.000');
    msgEl.textContent = 'Wait for lights out…';
    pods.forEach((p, i) => timers.push(setTimeout(() => p.classList.add('on'), 600 + i * 900)));
    const hold = 600 + 4 * 900 + 400 + Math.random() * 2600;
    timers.push(setTimeout(() => {
      pods.forEach((p) => p.classList.remove('on'));
      state = 'waiting';
      outAt = performance.now();
    }, hold));
  }

  function press() {
    if (state === 'idle' || state === 'done') return start();
    if (state === 'lighting') {
      clear();
      pods.forEach((p) => p.classList.remove('on'));
      state = 'done';
      setTime('Jump start', 'jump');
      msgEl.textContent = 'You moved before lights out. Click to try again';
      return;
    }
    const rt = (performance.now() - outAt) / 1000;
    state = 'done';
    setTime(rt.toFixed(3), rt < 0.25 ? 'good' : '');
    msgEl.textContent = rt < 0.2 ? 'Faster than an F1 start. Click to go again'
      : rt < 0.3 ? 'Close to F1 pace. Click to go again'
      : 'Click to go again';
    if (!best || rt < best) {
      best = rt;
      bestEl.textContent = rt.toFixed(3);
      try { localStorage.setItem('rxBest', String(rt)); } catch (e) { /* storage blocked */ }
    }
  }

  box.addEventListener('pointerdown', (e) => { if (e.button === 0) press(); });
  box.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) press(); }
  });
})();

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

/* ---------- Intro ---------- */
if (document.documentElement.classList.contains('intro-on')) playIntro();
document.getElementById('replayIntro').addEventListener('click', () => {
  document.documentElement.classList.add('intro-on');
  playIntro();
});
