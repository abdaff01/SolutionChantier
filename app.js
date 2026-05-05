/* ═══════════════════════════════════════════
   STARS CANVAS
═══════════════════════════════════════════ */
const starCanvas = document.getElementById('stars');
const sCtx = starCanvas.getContext('2d');
let starsList = [];

function resizeStars() {
  starCanvas.width  = window.innerWidth;
  starCanvas.height = window.innerHeight;
}
resizeStars();
window.addEventListener('resize', resizeStars);

class Star {
  constructor() { this.reset(); }
  reset() {
    this.x    = Math.random() * starCanvas.width;
    this.y    = Math.random() * starCanvas.height;
    this.r    = Math.random() * 1.2 + 0.2;
    this.base = Math.random() * 0.7 + 0.1;
    this.speed= Math.random() * 0.02 + 0.005;
    this.phase= Math.random() * Math.PI * 2;
    this.hue  = Math.random() > 0.7 ? '255,200,150' : '255,255,255';
  }
  draw(t) {
    const o = this.base + Math.sin(t * this.speed + this.phase) * 0.3;
    sCtx.beginPath();
    sCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    sCtx.fillStyle = `rgba(${this.hue},${Math.max(0, o)})`;
    sCtx.fill();
  }
}

function initStars() { starsList = Array.from({ length: 220 }, () => new Star()); }
initStars();

let starsT = 0;
function animStars() {
  sCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  starsT++;
  starsList.forEach(s => s.draw(starsT));
  requestAnimationFrame(animStars);
}
animStars();

/* ═══════════════════════════════════════════
   ROSE PETALS CANVAS
═══════════════════════════════════════════ */
const petalCanvas = document.getElementById('petals');
const pCtx = petalCanvas.getContext('2d');
let petalList = [];

function resizePetals() {
  petalCanvas.width  = window.innerWidth;
  petalCanvas.height = window.innerHeight;
}
resizePetals();
window.addEventListener('resize', resizePetals);

const PETAL_COLORS = [
  'rgba(255,77,125,',
  'rgba(255,143,171,',
  'rgba(255,184,204,',
  'rgba(247,201,72,',
  'rgba(220,80,100,',
];

class Petal {
  constructor(x) {
    this.x    = x !== undefined ? x : Math.random() * petalCanvas.width;
    this.y    = -20;
    this.size = Math.random() * 10 + 5;
    this.speedY = Math.random() * 1.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 1.2;
    this.rot    = Math.random() * Math.PI * 2;
    this.rotSpd = (Math.random() - 0.5) * 0.05;
    this.opacity= Math.random() * 0.5 + 0.2;
    this.color  = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    this.swing  = Math.random() * 0.02 + 0.01;
    this.swingT = Math.random() * Math.PI * 2;
  }
  update() {
    this.swingT += this.swing;
    this.x += Math.sin(this.swingT) * 1.2 + this.speedX;
    this.y += this.speedY;
    this.rot += this.rotSpd;
    return this.y < petalCanvas.height + 30;
  }
  draw() {
    pCtx.save();
    pCtx.translate(this.x, this.y);
    pCtx.rotate(this.rot);
    pCtx.beginPath();
    pCtx.ellipse(0, 0, this.size * 0.5, this.size, 0, 0, Math.PI * 2);
    pCtx.fillStyle = this.color + this.opacity + ')';
    pCtx.fill();
    pCtx.restore();
  }
}

function initPetals() { petalList = Array.from({ length: 25 }, () => { const p = new Petal(); p.y = Math.random() * petalCanvas.height; return p; }); }
initPetals();

let lastPetalTime = 0;
function animPetals(ts) {
  pCtx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
  if (ts - lastPetalTime > 600) { petalList.push(new Petal()); lastPetalTime = ts; }
  petalList = petalList.filter(p => { const alive = p.update(); p.draw(); return alive; });
  if (petalList.length < 30) petalList.push(new Petal());
  requestAnimationFrame(animPetals);
}
requestAnimationFrame(animPetals);

/* ═══════════════════════════════════════════
   FLOATING HEARTS
═══════════════════════════════════════════ */
const heartsContainer = document.getElementById('hearts-container');
const HEART_CHARS = ['♥', '♡', '❤', '💕', '💗', '💓', '💖'];

function spawnHeart() {
  const el = document.createElement('div');
  el.className = 'float-heart';
  el.textContent = HEART_CHARS[Math.floor(Math.random() * HEART_CHARS.length)];
  const size = Math.random() * 1.4 + 0.6;
  const dur  = Math.random() * 8 + 7;
  el.style.cssText = `
    left: ${Math.random() * 100}%;
    font-size: ${size}rem;
    color: ${Math.random() > 0.5 ? '#ff4d7d' : Math.random() > 0.5 ? '#f7c948' : '#c084fc'};
    animation-duration: ${dur}s;
  `;
  heartsContainer.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

setInterval(spawnHeart, 1200);
for (let i = 0; i < 8; i++) setTimeout(spawnHeart, i * 400);

/* ═══════════════════════════════════════════
   BIG HEART CLICK BURST
═══════════════════════════════════════════ */
document.getElementById('bigHeart').addEventListener('click', () => {
  for (let i = 0; i < 12; i++) setTimeout(spawnHeart, i * 60);
});
document.getElementById('navHeart').addEventListener('click', () => {
  for (let i = 0; i < 6; i++) setTimeout(spawnHeart, i * 80);
});

/* ═══════════════════════════════════════════
   SCROLL REVEAL — LOVE CARDS
═══════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const d = parseInt(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), d);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.love-card').forEach(el => revealObserver.observe(el));

/* ═══════════════════════════════════════════
   COUNTER ANIMATION
═══════════════════════════════════════════ */
function animCounter(el) {
  if (el.dataset.isInfinity) { el.textContent = '∞'; return; }
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const dur    = 2200;
  const start  = performance.now();
  const fn = now => {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.floor(e * target).toLocaleString() + (p === 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(fn);
  };
  requestAnimationFrame(fn);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.moment-number').forEach(animCounter);
      counterObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const momentsSection = document.getElementById('moments');
if (momentsSection) counterObserver.observe(momentsSection);

/* ═══════════════════════════════════════════
   ENVELOPE / LETTER
═══════════════════════════════════════════ */
let envelopeOpened = false;

function openEnvelope() {
  if (envelopeOpened) return;
  envelopeOpened = true;
  const env     = document.getElementById('envelope');
  const content = document.getElementById('letterContent');
  const seal    = document.getElementById('seal');

  env.classList.add('opened');
  seal.style.opacity = '0';

  setTimeout(() => {
    content.classList.add('open');

    const paper    = content.querySelector('.letter-paper');
    const allLines = Array.from(paper.children); // deco, salutation, p×5, closing, signature, deco

    // Mark everything hidden initially
    allLines.forEach(el => el.classList.add('letter-line'));

    // Top decoration — instant
    allLines[0].classList.add('appear');

    // Typewriter on salutation
    const sal     = paper.querySelector('.salutation');
    const salText = sal.textContent;
    sal.textContent = '';
    sal.classList.add('appear');

    let ci = 0;
    const typeTimer = setInterval(() => {
      if (ci < salText.length) { sal.textContent += salText[ci++]; }
      else clearInterval(typeTimer);
    }, 55);

    // Stagger each paragraph in
    const bodyLines = allLines.filter(el => el !== allLines[0] && !el.classList.contains('salutation'));
    bodyLines.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('appear');
        if (i % 2 === 0) spawnHeart();
      }, 900 + i * 420);
    });

    // Hearts burst on open
    for (let i = 0; i < 14; i++) setTimeout(spawnHeart, i * 90);

  }, 900);
}

/* ═══════════════════════════════════════════
   FIREWORKS
═══════════════════════════════════════════ */
function spawnFirework(x, y) {
  const colors = ['#ff4d7d','#f7c948','#c084fc','#ff8fab','#ff847c','#fde68a'];
  const count  = 22;
  for (let i = 0; i < count; i++) {
    const el    = document.createElement('div');
    el.className = 'firework';
    const angle = (i / count) * Math.PI * 2;
    const dist  = Math.random() * 100 + 50;
    el.style.cssText = `
      left: ${x}px; top: ${y}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      box-shadow: 0 0 6px currentColor;
      --fx: ${Math.cos(angle) * dist}px;
      --fy: ${Math.sin(angle) * dist}px;
      animation-duration: ${Math.random() * 0.4 + 0.6}s;
      animation-delay: ${Math.random() * 0.15}s;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function launchFireworks() {
  const positions = [
    [window.innerWidth * 0.25, window.innerHeight * 0.3],
    [window.innerWidth * 0.5,  window.innerHeight * 0.2],
    [window.innerWidth * 0.75, window.innerHeight * 0.3],
    [window.innerWidth * 0.35, window.innerHeight * 0.5],
    [window.innerWidth * 0.65, window.innerHeight * 0.45],
    [window.innerWidth * 0.5,  window.innerHeight * 0.35],
  ];
  positions.forEach(([x, y], i) => setTimeout(() => spawnFirework(x, y), i * 200));
  for (let i = 0; i < 20; i++) setTimeout(spawnHeart, i * 100);
}

document.addEventListener('click', e => {
  if (e.target.closest('button, a, input, textarea, .envelope-seal, #bigHeart, #navHeart, #footerHeart')) return;
  spawnFirework(e.clientX, e.clientY);
});

document.addEventListener('touchstart', e => {
  const t = e.touches[0];
  if (e.target.closest('button, a, input, textarea, .envelope-seal, #bigHeart, #navHeart, #footerHeart')) return;
  spawnFirework(t.clientX, t.clientY);
}, { passive: true });

/* ═══════════════════════════════════════════
   MAKE A WISH
═══════════════════════════════════════════ */
const WISHES = [
  '✨ Your wish is the universe\'s command. It is already on its way. ✨',
  '💫 Every candle you blow out sends love into the stars. 💫',
  '♥ The brightest wish for the brightest soul. ♥',
  '🌸 May everything you dreamed of bloom this year. 🌸',
  '🌟 The universe heard you. Miracles are coming. 🌟',
];

function makeWish() {
  const el = document.getElementById('wishMessage');
  el.textContent = WISHES[Math.floor(Math.random() * WISHES.length)];
  launchFireworks();
  document.querySelector('#wish .wish-icon').textContent = '🎊';
  for (let i = 0; i < 30; i++) setTimeout(spawnHeart, i * 80);
}

/* ═══════════════════════════════════════════
   SCROLL HELPERS
═══════════════════════════════════════════ */
function scrollToLetter() {
  document.getElementById('letter').scrollIntoView({ behavior: 'smooth' });
}

/* ═══════════════════════════════════════════
   ACTIVE NAV
═══════════════════════════════════════════ */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('nav ul a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 130) current = s.id; });
  navLinks.forEach(a => { a.style.color = a.getAttribute('href') === `#${current}` ? '#ff8fab' : ''; });
}, { passive: true });

/* ═══════════════════════════════════════════
   FOOTER HEART — EXTRA LOVE
═══════════════════════════════════════════ */
document.getElementById('footerHeart').addEventListener('click', () => {
  launchFireworks();
  for (let i = 0; i < 25; i++) setTimeout(spawnHeart, i * 70);
});

/* ═══════════════════════════════════════════
   CURSOR SPARKLE TRAIL
═══════════════════════════════════════════ */
let lastTrailTime = 0;
document.addEventListener('mousemove', e => {
  const now = Date.now();
  if (now - lastTrailTime < 60) return;
  lastTrailTime = now;
  const spark = document.createElement('div');
  spark.style.cssText = `
    position:fixed; left:${e.clientX}px; top:${e.clientY}px;
    width:6px; height:6px; border-radius:50%;
    background:${Math.random() > 0.5 ? '#ff4d7d' : '#f7c948'};
    pointer-events:none; z-index:9999;
    box-shadow:0 0 8px currentColor;
    transform:translate(-50%,-50%);
    animation:sparkFade 0.7s ease forwards;
  `;
  document.body.appendChild(spark);
  spark.addEventListener('animationend', () => spark.remove());
});

const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes sparkFade {
    0%   { opacity:1; transform:translate(-50%,-50%) scale(1); }
    100% { opacity:0; transform:translate(-50%,-150%) scale(0.2); }
  }
`;
document.head.appendChild(styleEl);
