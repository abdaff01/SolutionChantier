/* Liquid-glass header (vendor/quick-liquid.js, MIT).
   new-home.css already gives the header a CSS frost look. The element only gets [data-glass]
   once the engine has mounted, so any failure or skipped device keeps the plain CSS version. */
(() => {
  const Engine = window.QuickLiquid && window.QuickLiquid.LiquidGlassEngine;
  const mq = q => window.matchMedia(q).matches;
  const n = navigator;
  // ponytail: static device gate; upgrade path = measure real frame cost at runtime and downgrade.
  const lite = !Engine || !window.ResizeObserver
    || mq('(prefers-reduced-motion: reduce)') || mq('(prefers-reduced-transparency: reduce)')
    || (n.deviceMemory && n.deviceMemory <= 4) || (n.hardwareConcurrency && n.hardwareConcurrency <= 4)
    || (n.connection && n.connection.saveData);
  const layer = document.querySelector('.hdr-glass');
  if (lite || !layer) { document.documentElement.classList.add('glass-lite'); return; }

  // Tint keeps white text >= 4.5:1 even when the backdrop behind the header is white.
  try {
    new Engine(layer, {
      respectPreferences: true, appearance: 'dark', quality: 'medium',
      refractionMode: 'css', refractionStrength: 0, blur: 14, saturation: 1.45,
      tint: '12, 22, 48', tintOpacity: .78, borderRadius: 0,
      bezelWidth: 10, thickness: 10, edgeHighlight: .45, specularStrength: .18, elevation: .3
    });
    layer.dataset.glass = '1';
    layer.parentElement.dataset.glass = '1';
  } catch (err) { console.warn('glass skipped:', err); }
})();
