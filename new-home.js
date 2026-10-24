const K = window.SCCore, C = K.C;
const { el, ic, fill, wa, pick, pickList } = K;
const LANGS = ['ar', 'fr', 'en'];
let L = (() => { try { const s = localStorage.getItem('sc_lang'); return LANGS.includes(s) ? s : 'ar'; } catch (e) { return 'ar'; } })();
let FILTER = 'all', DATA = null, VISIBLE = [], READY = false, ERR = false, swapT;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const T = k => K.T(k, L);
const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;

const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
const observe = () => $$('.rv:not(.in)').forEach(e => io.observe(e));

/* ---------- catalogue (everything below reads DATA.products) ---------- */
const inFilter = p => FILTER === 'all' || p.cats.includes(FILTER);
const wait = ms => new Promise(r => setTimeout(r, ms));
const cardEls = new Map();
let morphing = false, shownFilter = 'all', shownCount = 0, tickRaf;

function usedCats() {
  const seen = [];
  DATA.products.forEach(p => p.cats.forEach(c => seen.includes(c) || seen.push(c)));
  const order = Object.keys({ ...K.DEFAULT_CATS, ...DATA.categories });
  return seen.sort((a, b) => { const x = order.indexOf(a), y = order.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
}

// Decorative gold ring that glides to the selected chip. Chip colours never depend on it.
function moveInd() {
  const a = $('.chip[aria-pressed=true]'), ind = $('.chip-ind');
  if (!a || !ind) return;
  ind.style.width = (a.offsetWidth + 10) + 'px'; ind.style.height = (a.offsetHeight + 10) + 'px';
  ind.style.transform = `translate(${a.offsetLeft - 5}px,${a.offsetTop - 5}px)`;
}

function renderCats() {
  const box = $('#chips'); $$('.chip', box).forEach(c => c.remove());
  const cats = usedCats();
  if (FILTER !== 'all' && !cats.includes(FILTER)) FILTER = 'all';
  [['all', T('f_all')], ...cats.map(c => [c, K.catLabel(c, L, DATA.categories)])].forEach(([id, label]) => {
    const b = el('button', 'chip', label); b.type = 'button'; b.dataset.f = id; b.setAttribute('aria-pressed', id === FILTER);
    b.addEventListener('click', () => setFilter(id)); box.append(b);
  });
  moveInd();
}

function setCount(n) { $('#pcount').textContent = n ? fill(T(n === 1 ? 'p_count1' : 'p_count'), { n }) : ''; }
function tickCount(to) {
  cancelAnimationFrame(tickRaf);
  const from = shownCount; shownCount = to;
  if (REDUCED || !from || from === to) { setCount(to); return; }
  const t0 = performance.now(), dur = 560;
  const step = now => { const k = Math.min(1, (now - t0) / dur); setCount(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) tickRaf = requestAnimationFrame(step); };
  tickRaf = requestAnimationFrame(step);
}

function cardFor(p) {
  let c = cardEls.get(p.id);
  if (!c) { c = K.buildCard(p, 0, { L, onZoom: () => openLB(p) }); cardEls.set(p.id, c); }
  return c;
}

// Full (re)build: first paint and language change.
function renderProducts() {
  const grid = $('#pgrid'); cardEls.clear(); grid.replaceChildren();
  VISIBLE = DATA.products.filter(inFilter); shownFilter = FILTER;
  VISIBLE.forEach((p, i) => { const c = cardFor(p); c.style.setProperty('--d', (i % 3 * .07) + 's'); grid.append(c); });
  if (!VISIBLE.length) grid.append(el('p', 'catalog-msg', T('p_empty')));
  shownCount = VISIBLE.length; cancelAnimationFrame(tickRaf); setCount(shownCount);
  K.layoutGrid(grid);
}

// Filter change: leaving cards fade/scale out, the rest glide to their new place (FLIP), new ones rise in.
async function morphTo() {
  const grid = $('#pgrid'), next = DATA.products.filter(inFilter), keep = new Set(next.map(p => p.id));
  VISIBLE = next; shownFilter = FILTER;
  const cur = [...grid.querySelectorAll(':scope > .card')];
  if (REDUCED || !cur.length) { renderProducts(); observe(); return; }
  tickCount(next.length);
  const first = new Map(cur.map(c => [c, c.getBoundingClientRect()]));
  const leaving = cur.filter(c => !keep.has(c.dataset.id));
  leaving.forEach(c => c.classList.add('leave'));
  if (leaving.length) await wait(230);
  leaving.forEach(c => c.remove());
  grid.querySelector('.catalog-msg')?.remove();
  let k = 0;
  const order = next.map(p => {
    let c = cardEls.get(p.id); const fresh = !c || !c.isConnected;
    if (!c) c = cardFor(p);
    if (fresh) { c.classList.remove('in', 'leave'); c.classList.add('rv'); c.style.setProperty('--d', (k++ * .07) + 's'); }
    return c;
  });
  order.forEach(c => grid.append(c));
  if (!next.length) grid.append(el('p', 'catalog-msg', T('p_empty')));
  K.layoutGrid(grid);
  const moved = [];
  order.forEach(c => {
    const a = first.get(c);
    if (!a || (c.classList.contains('rv') && !c.classList.contains('in'))) return;
    const b = c.getBoundingClientRect();
    if (Math.abs(a.width - b.width) > 2 || Math.abs(a.height - b.height) > 2) { c.classList.remove('in'); c.classList.add('rv'); c.style.setProperty('--d', '0s'); return; }
    const dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) { c.style.transition = 'none'; c.style.transform = `translate(${dx}px,${dy}px)`; moved.push(c); }
  });
  void grid.offsetWidth;
  moved.forEach(c => { c.style.transition = 'transform .55s var(--ease)'; c.style.transform = ''; setTimeout(() => { c.style.transition = ''; }, 620); });
  observe();
}

async function setFilter(f) {
  if (!READY || f === FILTER) return;
  FILTER = f;
  $$('.chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.f === f)); moveInd();
  if (morphing) return;
  morphing = true;
  try { while (shownFilter !== FILTER) await morphTo(); } finally { morphing = false; }
}

function renderBrands() {
  const grid = $('#bgrid'); grid.replaceChildren();
  C.brands.forEach((b, i) => {
    const card = el('article', 'card rv'); card.style.setProperty('--d', (i % 4 * .07) + 's');
    const pic = el('div', b.fit ? 'pic fit' : 'pic');
    const img = el('img'); img.src = b.image; img.alt = b.name; img.loading = 'lazy'; img.decoding = 'async';
    pic.append(img);
    const body = el('div', 'body');
    body.append(el('span', 'brandtag', b.brand), el('h3', null, b.name), el('p', 'desc', b.kind[L]));
    const a = el('a', 'btn btn-sm'); a.style.background = 'var(--navy)'; a.style.color = '#fff';
    a.href = wa(fill(C.texts.msg_ask[L], { name: `${b.brand} — ${b.name}` })); a.target = '_blank'; a.rel = 'noopener';
    a.append(ic('fab fa-whatsapp'), el('span', null, T('b_btn')));
    body.append(a); card.append(pic, body); grid.append(card);
  });
  K.layoutGrid(grid);
}

function renderBrandNames() {
  const box = $('#bchips'); box.replaceChildren();
  C.brandChips.forEach(n => box.append(el('span', null, n)));
  box.append(el('span', null, T('b_more')));
}

function renderAll() { renderCats(); renderProducts(); renderBrands(); observe(); }

function showError(err) {
  if (err) console.error(err);
  const g = $('#pgrid'); g.replaceChildren();
  const box = el('div', 'catalog-msg');
  box.append(el('h3', null, T('p_err_t')), el('p', null, T('p_err_d')));
  const a = el('a', 'btn btn-wa'); a.href = wa(T('msg_generic')); a.target = '_blank'; a.rel = 'noopener';
  a.append(ic('fab fa-whatsapp'), el('span', null, T('cta_wa')));
  box.append(a); g.append(box);
  $('#pcount').textContent = ''; renderBrands(); observe();
}

/* ---------- lightbox (zooms out of / back into the clicked card) ---------- */
const lb = $('#lb');
let LB = { list: [], i: 0 };
function fillLB() {
  const p = LB.list[LB.i]; if (!p) return;
  const img = $('#lbImg'); img.hidden = !p.image; $('#lbPh').hidden = !!p.image;
  if (p.image) { img.src = p.image; img.alt = p.name; }
  $('#lbB').textContent = p.brand; $('#lbT').textContent = p.name;
  $('#lbK').textContent = pick(p.kind, L); $('#lbD').textContent = pick(p.desc, L);
  const ul = $('#lbU'); ul.replaceChildren(); pickList(p.more, L).forEach(x => ul.append(el('li', null, x)));
  $('#lbN').textContent = pick(p.note, L);
  $('#lbW').href = wa(fill(T('msg_ask'), { name: p.name }));
  $('#lbC').textContent = `${LB.i + 1} / ${LB.list.length}`;
  $('#lbPrev').hidden = $('#lbNext').hidden = LB.list.length < 2;
}
function lbFrom() {
  const p = LB.list[LB.i], c = p && cardEls.get(p.id), src = c && c.isConnected ? c.querySelector('.pic') : null;
  if (!src || REDUCED) { ['--fx', '--fy', '--fs'].forEach(v => lb.style.removeProperty(v)); return; }
  const r = src.getBoundingClientRect(), w = lb.offsetWidth;
  lb.style.setProperty('--fx', (r.left + r.width / 2 - document.documentElement.clientWidth / 2) + 'px');
  lb.style.setProperty('--fy', (r.top + r.height / 2 - innerHeight / 2) + 'px');
  lb.style.setProperty('--fs', Math.max(.18, Math.min(.9, r.width / w)));
}
function openLB(p) {
  LB = { list: VISIBLE, i: Math.max(0, VISIBLE.findIndex(x => x.id === p.id)) }; fillLB();
  if (lb.open) return;
  lb.showModal(); document.documentElement.classList.add('lb-open');
  lbFrom();
  requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('show')));
}
function closeLB() {
  lbFrom(); lb.classList.remove('show');
  setTimeout(() => { if (lb.open) lb.close(); document.documentElement.classList.remove('lb-open'); }, REDUCED ? 0 : 520);
}
function stepLB(d) {
  const n = LB.list.length; if (n < 2) return;
  LB.i = (LB.i + d + n) % n;
  const b = $('.lb-box', lb); b.classList.add('swap');
  setTimeout(() => { fillLB(); b.classList.remove('swap'); }, REDUCED ? 0 : 140);
}
$('#lbX').addEventListener('click', closeLB);
$('#lbPrev').addEventListener('click', () => stepLB(-1));
$('#lbNext').addEventListener('click', () => stepLB(1));
lb.addEventListener('cancel', e => { e.preventDefault(); closeLB(); });
lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
lb.addEventListener('keydown', e => {
  const rtl = document.documentElement.dir === 'rtl';
  if (e.key === 'ArrowLeft') stepLB(rtl ? 1 : -1); else if (e.key === 'ArrowRight') stepLB(rtl ? -1 : 1);
});

/* ---------- page text, language, hero ---------- */
function splitHero() {
  let n = 0;
  $$('.hero h1 [data-i18n]').forEach(s => {
    const words = s.textContent.trim().split(/\s+/); s.replaceChildren();
    words.forEach((w, i) => { if (i) s.append(' '); const x = el('span', 'w', w); x.style.setProperty('--i', n++); s.append(x); });
  });
}

function splitTitles() {
  $$('.head h2.title').forEach(h => {
    const words = h.textContent.trim().split(/\s+/); h.replaceChildren();
    words.forEach((w, i) => { if (i) h.append(' '); const x = el('span', 'w', w); x.style.setProperty('--i', i); h.append(x); });
  });
}

function apply() {
  const h = document.documentElement; h.lang = L; h.dir = L === 'ar' ? 'rtl' : 'ltr';
  document.title = T('meta_title');
  $('meta[name=description]').content = T('meta_desc');
  $$('[data-i18n]').forEach(e => e.textContent = T(e.dataset.i18n));
  $$('[data-i18n-ph]').forEach(e => e.placeholder = T(e.dataset.i18nPh));
  $$('[data-i18n-aria]').forEach(e => e.setAttribute('aria-label', T(e.dataset.i18nAria)));
  $$('.lang').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === L));
  $$('[data-wa=generic]').forEach(a => a.href = wa(T('msg_generic')));
  $$('[data-field=address]').forEach(e => e.textContent = C.contact.address[L]);
  $$('[data-tel]').forEach(a => { a.href = 'tel:' + C.contact.tel; });
  $$('[data-field-tel]').forEach(a => { a.href = 'tel:' + C.contact.tel; a.textContent = C.contact.phone; });
  $$('[data-fb]').forEach(a => a.href = C.contact.facebook);
  $$('[data-tt]').forEach(a => a.href = C.contact.tiktok);
  $$('[data-img=logo]').forEach(i => i.src = C.images.logo);
  $$('[data-img-bg=storefront]').forEach(i => i.style.backgroundImage = `url(${C.images.storefront})`);
  const q = encodeURIComponent(C.contact.mapQuery[L]);
  $('#dir').href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const f = $('#mapf'), src = `https://www.google.com/maps?q=${q}&hl=${L}&output=embed`;
  if (f.getAttribute('src') !== src) f.src = src;
  renderBrandNames();
  if (READY) renderAll(); else if (ERR) showError(); else renderBrands();
  splitHero(); splitTitles(); observe();
  if (lb.open) fillLB();
  try { localStorage.setItem('sc_lang', L); } catch (e) {}
}

function setLang(code) {
  if (!LANGS.includes(code) || code === L) return;
  L = code; apply();
}
$$('.lang').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

const nav = $('#nav'), burger = $('#burger');
burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
$$('#nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
$$('[data-filter]').forEach(a => a.addEventListener('click', () => { setFilter(a.dataset.filter); $('#products').scrollIntoView({ behavior: 'smooth' }); }));

$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const t = $('#ft'), type = t.value ? t.options[t.selectedIndex].textContent : '-';
  window.open(wa(fill(C.texts.msg_form[L], { name: $('#fn').value.trim(), type, desc: $('#fd').value.trim() })), '_blank', 'noopener');
});

// Scroll-reveal for static blocks, staggered by position among siblings.
$$('.head, .plist>div, .why>div, .steps li, .info>*, .form, .map, .indep, .cat-bar, .help-call').forEach(e => {
  e.classList.add('rv'); e.style.setProperty('--d', ([...e.parentNode.children].indexOf(e) * .08) + 's');
});

document.documentElement.classList.add('js');
apply();
try { DATA = K.get(); READY = true; renderAll(); } catch (e) { ERR = true; showError(e); }

/* ---------- scroll: header state, progress line, hero parallax, nav highlight ---------- */
const toTop = $('#toTop'), hdr = $('.hdr'), heroPhoto = $('.hero-photo');
const secs = ['problems', 'products', 'brands', 'help', 'visit'].map(id => document.getElementById(id));
let ticking = false;
function onScroll() {
  ticking = false;
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  toTop.classList.toggle('show', y > 500);
  hdr.classList.toggle('scrolled', y > 8);
  hdr.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  if (!REDUCED && y < innerHeight * 1.3) heroPhoto.style.transform = `translate3d(0,${Math.min(y * .18, 140)}px,0)`;
  let cur = ''; secs.forEach(s => { if (s.getBoundingClientRect().top < 140) cur = s.id; });
  $$('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
onScroll();

let rz;
addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (READY) K.layoutGrid($('#pgrid')); K.layoutGrid($('#bgrid')); moveInd(); }); });
if (window.ResizeObserver) new ResizeObserver(moveInd).observe($('#chips'));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);

/* ---------- mascot ---------- */
const mascot = $('#mascot');
if (mascot) {
  const sp = $('#mascotSprite'), DIR = 'images/mascot/kamran-directions.webp', REA = 'images/mascot/kamran-reactions.webp';
  [DIR, REA].forEach(u => { new Image().src = u; });
  const show = (img, i) => { sp.style.backgroundImage = `url(${img})`; sp.style.backgroundPosition = `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`; };
  let look = 4, busy = false, last = -1;
  mascot.addEventListener('click', () => {
    let k; do { k = Math.floor(Math.random() * 9); } while (k === last); last = k;
    busy = true; show(REA, k);
    mascot.classList.remove('poke'); void mascot.offsetWidth; mascot.classList.add('poke');
    setTimeout(() => { busy = false; show(DIR, look); }, 1100);
  });
  mascot.addEventListener('animationend', () => mascot.classList.remove('poke'));
  if (matchMedia('(pointer:fine)').matches) {
    addEventListener('mousemove', e => {
      const r = mascot.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy);
      const col = d < 90 ? 1 : (dx / d < -.38 ? 0 : dx / d > .38 ? 2 : 1), row = d < 90 ? 1 : (dy / d < -.38 ? 0 : dy / d > .38 ? 2 : 1), i = row * 3 + col;
      if (i !== look) { look = i; if (!busy) show(DIR, look); }
    }, { passive: true });
  }
}
