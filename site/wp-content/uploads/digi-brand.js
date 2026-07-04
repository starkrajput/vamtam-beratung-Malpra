/* Digicomplish — header visibility.
   Inner pages carry body.digi-page (solid header, set statically in the
   HTML). On the home page we add body.digi-stuck once the dark hero is
   scrolled past, so the transparent white-logo header flips to the solid
   white bar. Uses an IntersectionObserver sentinel so it works regardless
   of which element actually scrolls. All colours live in digi-brand.css. */
(function () {
  function init() {
    if (document.body.classList.contains('digi-page')) return; // inner pages: always solid
    var sen = document.createElement('div');
    sen.setAttribute('aria-hidden', 'true');
    sen.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:90px;pointer-events:none;opacity:0';
    document.body.appendChild(sen);
    function set(stuck) { document.body.classList.toggle('digi-stuck', stuck); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { set(!e[0].isIntersecting); }, { threshold: 0 }).observe(sen);
    }
    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      set(y > 70);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    onScroll();
  }
  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
