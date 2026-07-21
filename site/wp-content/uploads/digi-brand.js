/* ============================================================
   Digicomplish — navbar green detector.
   The client wants: WHEN a header bar's background actually turns
   green, its text becomes white; OTHERWISE the header is left
   exactly as it was. This script only ADDS/REMOVES the
   `.nav-on-green` class (styled in digi-brand.css) — it never
   changes any colour directly, so non-green states stay original.
   ============================================================ */
(function () {
  'use strict';

  // Brand green is #8FD299 => rgb(143,210,153). Treat a bar as green
  // when its background is opaque and clearly green-dominant.
  function isGreen(bg) {
    if (!bg) return false;
    var m = bg.match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    var p = m[1].split(',').map(function (n) { return parseFloat(n); });
    var r = p[0], g = p[1], b = p[2], a = p.length > 3 ? p[3] : 1;
    if (a < 0.5) return false;                 // transparent bar => not green
    return g > 120 && (g - r) > 25 && (g - b) > 25;
  }

  function bars() {
    return document.querySelectorAll('header .vamtam-sticky-header, header .elementor-sticky');
  }

  function update() {
    bars().forEach(function (bar) {
      var green = isGreen(getComputedStyle(bar).backgroundColor);
      bar.classList.toggle('nav-on-green', green);
    });
  }

  function boot() {
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    // Catch class/style changes made by the theme's sticky script.
    try {
      var mo = new MutationObserver(update);
      bars().forEach(function (bar) {
        mo.observe(bar, { attributes: true, attributeFilter: ['class', 'style'] });
      });
    } catch (e) { /* MutationObserver unsupported — scroll/resize still cover it */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
