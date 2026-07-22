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

  // Buttons: when a button's own background actually turns green (e.g. the
  // theme's green hover fill), give it white text. Non-green buttons
  // (transparent / underline styles) are never touched.
  function markBtn(btn) {
    if (!btn) return;
    btn.classList.toggle('btn-on-green', isGreen(getComputedStyle(btn).backgroundColor));
  }
  function btnFrom(e) {
    var t = e.target;
    return t && t.closest ? t.closest('.elementor-button') : null;
  }
  function bindButtons() {
    // Delegated hover — measured AFTER the hover style applies (rAF).
    document.addEventListener('mouseover', function (e) {
      var b = btnFrom(e); if (b) requestAnimationFrame(function () { markBtn(b); });
    }, true);
    document.addEventListener('focusin', function (e) {
      var b = btnFrom(e); if (b) requestAnimationFrame(function () { markBtn(b); });
    }, true);
    document.addEventListener('mouseout', function (e) {
      var b = btnFrom(e); if (b) b.classList.remove('btn-on-green');
    }, true);
    document.addEventListener('focusout', function (e) {
      var b = btnFrom(e); if (b) b.classList.remove('btn-on-green');
    }, true);
    // Also catch buttons that are green in their RESTING state.
    document.querySelectorAll('.elementor-button').forEach(markBtn);
  }

  // ---------- Home hero slider: advance the slides one by one ----------
  function initSliders() {
    document.querySelectorAll('.digi-slider').forEach(function (root) {
      var slides = [].slice.call(root.querySelectorAll('.digi-slide'));
      if (slides.length < 2) return;
      var dotsWrap = root.querySelector('.digi-slider-dots');
      var delay = parseInt(root.getAttribute('data-interval'), 10) || 6000;
      var i = Math.max(0, slides.findIndex(function (s) { return s.classList.contains('is-active'); }));
      var timer = null, dots = [];

      function show(n) {
        i = (n + slides.length) % slides.length;
        slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
        dots.forEach(function (d, k) {
          d.classList.toggle('is-active', k === i);
          d.setAttribute('aria-selected', k === i ? 'true' : 'false');
        });
      }
      function start() { stop(); timer = setInterval(function () { show(i + 1); }, delay); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }

      if (dotsWrap) {
        slides.forEach(function (_, k) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', 'Go to slide ' + (k + 1));
          b.addEventListener('click', function () { show(k); start(); });
          dotsWrap.appendChild(b); dots.push(b);
        });
      }
      show(i);
      start();
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { stop(); } else { start(); }
      });
    });
  }

  // ---------- Stat counters: numbers count up when scrolled into view ----------
  function initCounters() {
    var els = [].slice.call(document.querySelectorAll('.digi-count, .digi-stat .big'));
    if (!els.length) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Parse "1000+", "100%", "3+" into prefix / number / suffix, then zero it out.
    els = els.filter(function (el) {
      var m = el.textContent.trim().match(/^(\D*?)([\d.,]+)(\D*)$/);
      if (!m) return false;
      el.setAttribute('data-pre', m[1]);
      el.setAttribute('data-target', m[2].replace(/,/g, ''));
      el.setAttribute('data-suf', m[3]);
      if (!reduced) el.textContent = m[1] + '0' + m[3];
      return true;
    });
    if (reduced || !els.length) return;

    function run(el) {
      if (el.getAttribute('data-counted')) return;
      el.setAttribute('data-counted', '1');
      var pre = el.getAttribute('data-pre') || '';
      var suf = el.getAttribute('data-suf') || '';
      var target = parseFloat(el.getAttribute('data-target'));
      var dec = (el.getAttribute('data-target').split('.')[1] || '').length;
      var dur = 1800, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);            // ease-out cubic
        var v = target * eased;
        el.textContent = pre + (dec ? v.toFixed(dec) : Math.round(v)) + suf;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = pre + (dec ? target.toFixed(dec) : target) + suf;
      }
      requestAnimationFrame(step);
    }

    function inView(el) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh * 0.9 && r.bottom > 0;
    }
    function pending() { return els.filter(function (el) { return !el.getAttribute('data-counted'); }); }

    var ticking = false;
    function check() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var left = pending();
        left.forEach(function (el) { if (inView(el)) run(el); });
        if (!pending().length) {
          window.removeEventListener('scroll', check);
          window.removeEventListener('resize', check);
        }
      });
    }

    // Scroll-driven check is the primary trigger — it works even where
    // IntersectionObserver callbacks are throttled (e.g. background tabs).
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.35 });
      els.forEach(function (el) { io.observe(el); });
    }
    check();
    // Re-check once the tab becomes visible (counters parked off-screen in a
    // background tab would otherwise sit at zero).
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
    // Failsafe: never leave a stat stuck showing 0 — if anything above failed,
    // snap any still-pending, already-visible counter to its final value.
    setTimeout(function () {
      pending().forEach(function (el) {
        if (inView(el)) {
          el.setAttribute('data-counted', '1');
          el.textContent = (el.getAttribute('data-pre') || '') +
                           el.getAttribute('data-target') +
                           (el.getAttribute('data-suf') || '');
        }
      });
    }, 5000);
  }

  function boot() {
    update();
    bindButtons();
    initSliders();
    initCounters();
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
