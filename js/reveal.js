/* Types — slide-in reveal for the lower home sections (About, FAQ, Contact).
   Elements marked data-ab-in="left|right" come in the first time a quarter of
   them is on screen. The entrance follows the breakpoint:
     ≥ 1024px  slide in from their side (80px)
     768–1023  shorter side slide (40px)
     < 768px   stacked layout, so they rise from below instead
   Skipped under reduced motion. */

(function () {
  "use strict";

  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  var w = innerWidth, mobile = w < 768;
  var dist = w >= 1024 ? 80 : 40;
  var els = [].slice.call(document.querySelectorAll('[data-ab-in]'));
  els.forEach(function (el) {
    var d = el.dataset.abIn === 'left' ? -1 : 1;
    el.style.opacity = '0';
    el.style.transform = mobile ? 'translateY(32px)' : 'translateX(' + (d * dist) + 'px)';
    el.style.transition = 'opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1)';
    if (el.dataset.abIn === 'right') el.style.transitionDelay = mobile ? '.06s' : '.12s';
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.opacity = '1';
      e.target.style.transform = 'none';
      io.unobserve(e.target);
    });
  }, { threshold: mobile ? 0.12 : 0.25 });
  els.forEach(function (el) { io.observe(el); });

  // Staggered groups: data-ab-stagger="<selector>" names the pieces inside the
  // element that rise in one after another (the contact form: note, fields,
  // each service, notes, submit). Once in, their inline styles are cleared so
  // the pieces' own hover/focus transitions apply again.
  [].slice.call(document.querySelectorAll('[data-ab-stagger]')).forEach(function (g) {
    var items = [].slice.call(g.querySelectorAll(g.dataset.abStagger));
    items.forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity .7s cubic-bezier(.2,.7,.2,1) ' + (i * .06) + 's, transform .7s cubic-bezier(.2,.7,.2,1) ' + (i * .06) + 's';
    });
    var gio = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      gio.disconnect();
      items.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      setTimeout(function () {
        items.forEach(function (el) { el.style.opacity = el.style.transform = el.style.transition = ''; });
      }, 700 + items.length * 60 + 100);
    }, { threshold: mobile ? 0.08 : 0.15 });
    gio.observe(g);
  });
})();
