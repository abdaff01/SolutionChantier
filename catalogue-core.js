/* Shared catalogue logic for new-home.html and new-product.html.
   Needs content.js (window.SC_CONTENT) loaded first. Exposes window.SCCore. */
(function () {
  const C = window.SC_CONTENT;
  const t = (ar, fr, en) => ({ ar, fr, en });
  const SPAN = 12;
  const DEFAULT_CATS = {
    moisture: t('الرطوبة', 'Humidité', 'Moisture'),
    concrete: t('الخرسانة', 'Béton', 'Concrete'),
    floors: t('الأرضيات', 'Sols', 'Floors')
  };

  Object.assign(C.texts, {
    p_title: t('منتجات متوفرة في المحل', 'Produits disponibles en magasin', 'Products in store'),
    p_sub: t('منتجات Granitex، Sika، Terraco، Dilmi Paint وغيرها، متوفرة عندنا حسب المخزون.', 'Granitex, Sika, Terraco, Dilmi Paint et d’autres marques, selon le stock.', 'Granitex, Sika, Terraco, Dilmi Paint and more, depending on stock.'),
    p_more: t('التفاصيل', 'Détails', 'Details'),
    p_count: t('{n} منتج', '{n} produits', '{n} products'),
    p_count1: t('{n} منتج', '{n} produit', '{n} product'),
    p_empty: t('لا توجد منتجات في هذا القسم حاليًا.', 'Aucun produit dans cette catégorie pour le moment.', 'No products in this category yet.'),
    p_err_t: t('تعذّر تحميل قائمة المنتجات', 'Impossible de charger la liste des produits', 'Couldn’t load the product list'),
    p_err_d: t('حدّث الصفحة أو تواصل معنا عبر واتساب لمعرفة المنتجات المتوفرة.', 'Actualisez la page ou écrivez-nous sur WhatsApp pour connaître les produits disponibles.', 'Refresh the page, or message us on WhatsApp to see what is available.'),
    lb_close: t('إغلاق', 'Fermer', 'Close'),
    lb_prev: t('السابق', 'Précédent', 'Previous'),
    lb_next: t('التالي', 'Suivant', 'Next')
  });

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const ic = c => { const i = document.createElement('i'); i.className = c; return i; };
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  const wa = s => `https://wa.me/${C.contact.whatsapp}?text=${encodeURIComponent(s)}`;

  // Missing language -> Arabic -> any other available one.
  const pick = (o, L) => {
    if (o == null) return '';
    if (typeof o === 'string') return o;
    return o[L] || o.ar || o.fr || o.en || Object.values(o).find(Boolean) || '';
  };
  const pickList = (o, L) => {
    if (!o) return [];
    if (Array.isArray(o)) return o;
    if (o[L] && o[L].length) return o[L];
    if (o.ar && o.ar.length) return o.ar;
    return Object.values(o).find(v => Array.isArray(v) && v.length) || [];
  };
  const T = (k, L) => (C.texts[k] ? pick(C.texts[k], L) : k);
  const catLabel = (id, L, cats) => (cats && cats[id] ? pick(cats[id], L) : DEFAULT_CATS[id] ? pick(DEFAULT_CATS[id], L) : id);

  const slug = s => {
    const x = String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return x || 'product-' + Date.now().toString(36);
  };

  const norm = p => ({
    ...p,
    id: p.id || slug(p.name),
    name: String(p.name || ''),
    brand: String(p.brand || ''),
    cats: Array.isArray(p.cats) ? p.cats.filter(Boolean).map(String) : [],
    image: p.image || ''
  });

  // Reads window.SC_PRODUCTS (products.js). Throws if it is missing or not an array.
  function get() {
    const list = window.SC_PRODUCTS;
    if (!Array.isArray(list)) throw new Error('products.js: window.SC_PRODUCTS is missing or not an array');
    return { categories: window.SC_CATEGORIES || {}, products: list.map(norm) };
  }

  // o: { L, onZoom(i)|null, rv (default true), src(p)->url }
  function buildCard(p, i, o) {
    const L = o.L;
    const card = el('article', 'card' + (o.rv === false ? '' : ' rv'));
    card.dataset.id = p.id; card.style.setProperty('--d', (i % 3 * .07) + 's');
    const url = o.src ? o.src(p) : p.image;
    const pic = el('div', url ? 'pic' : 'pic noimg');
    if (p.isNew) pic.append(el('span', 'new', T('p_new', L)));
    const link = el('a'); link.href = url || '#'; link.setAttribute('aria-label', p.name);
    if (url) {
      const img = el('img'); img.alt = p.name; img.loading = 'lazy'; img.decoding = 'async';
      if (p.pos) img.style.objectPosition = p.pos;
      img.onerror = () => { img.remove(); pic.classList.add('noimg'); link.prepend(ic('fas fa-image')); };
      img.src = url;
      const zoom = el('span', 'zoom'); zoom.append(ic('fas fa-magnifying-glass-plus'));
      link.append(img, zoom);
    } else {
      link.append(ic('fas fa-image'));
    }
    link.addEventListener('click', e => { e.preventDefault(); if (o.onZoom) o.onZoom(i); });
    pic.append(link);

    const body = el('div', 'body');
    body.append(el('span', 'brandtag', p.brand), el('h3', null, p.name), el('p', 'kind', pick(p.kind, L)), el('p', 'desc', pick(p.desc, L)));
    const more = pickList(p.more, L), note = pick(p.note, L);
    if (more.length || note) {
      const d = el('details', 'more'); d.append(el('summary', null, T('p_more', L)));
      if (more.length) { const ul = el('ul'); more.forEach(x => ul.append(el('li', null, x))); d.append(ul); }
      if (note) d.append(el('p', 'note', note));
      body.append(d);
    }
    const a = el('a', 'btn btn-wa btn-sm'); a.href = wa(fill(T('msg_ask', L), { name: p.name })); a.target = '_blank'; a.rel = 'noopener';
    a.append(ic('fab fa-whatsapp'), el('span', null, T('p_btn', L)));
    body.append(a);
    card.append(pic, body);
    return card;
  }

  // Make every row full: the last (n % cols) cards share the row between them.
  function layoutGrid(grid) {
    const cols = parseInt(getComputedStyle(grid).getPropertyValue('--cols'), 10) || 1;
    const cards = [...grid.children].filter(c => c.classList.contains('card'));
    const r = cards.length % cols;
    cards.forEach((c, i) => {
      const s = r && i >= cards.length - r ? SPAN / r : 0;
      s ? c.style.setProperty('--s', s) : c.style.removeProperty('--s');
      const wide = s >= SPAN / 2, full = s === SPAN;
      c.classList.toggle('wide', wide); c.classList.toggle('full', full);
      const d = c.querySelector('details');
      if (d) {
        if (full && !d.open) { d.open = true; d.dataset.auto = 1; }
        else if (!full && d.dataset.auto) { d.open = false; delete d.dataset.auto; }
      }
    });
  }

  window.SCCore = { C, SPAN, DEFAULT_CATS, el, ic, fill, wa, pick, pickList, T, catLabel, slug, norm, get, buildCard, layoutGrid };
})();
