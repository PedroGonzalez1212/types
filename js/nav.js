/* Types — shared header behavior, loaded on every page:
   - mobile menu (burger) open/close, closes on link tap, outside tap or Esc
   - EN/ES toggle (visual state only — no translated copy yet)
   - "The types Method" wordmark: shows assets/types-wordmark-white.svg, or
     keeps the text "types" if the image is missing. */

(function () {
  "use strict";

  var header = document.querySelector('.ty-header');
  var burger = header && header.querySelector('.nav-burger');

  function setOpen(o) {
    if (!header) return;
    if (o) header.setAttribute('data-open', ''); else header.removeAttribute('data-open');
    if (burger) {
      burger.setAttribute('aria-expanded', String(o));
      burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!header || !t.closest) return;
    if (t.closest('.nav-burger')) setOpen(!header.hasAttribute('data-open'));
    else if (t.closest('.ty-nav a') || !t.closest('.ty-header')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !header || !header.hasAttribute('data-open')) return;
    setOpen(false);
    if (burger) burger.focus();
  });

  // ---------- Language toggle ----------
  var en = document.getElementById('lang-en'), es = document.getElementById('lang-es');
  function setLang(l) {
    if (en) en.setAttribute('aria-pressed', String(l === 'en'));
    if (es) es.setAttribute('aria-pressed', String(l === 'es'));
  }
  if (en) en.addEventListener('click', function () { setLang('en'); });
  if (es) es.addEventListener('click', function () { setLang('es'); });

  // ---------- Button text roll (hover: text slides up, copy rises from below) ----------
  document.querySelectorAll('.ty-btn').forEach(function (btn) {
    [].slice.call(btn.childNodes).forEach(function (n) {
      var t = n.nodeType === 3 && n.textContent.trim();
      if (!t) return;
      var roll = document.createElement('span'), inner = document.createElement('span');
      roll.className = 'ty-roll';
      inner.className = 'ty-roll__in';
      inner.setAttribute('data-t', t);
      inner.textContent = t;
      roll.appendChild(inner);
      btn.replaceChild(roll, n);
    });
  });

  // ---------- Wordmark with text fallback ----------
  document.querySelectorAll('[data-tw-logo]').forEach(function (img) {
    var txt = img.parentElement.querySelector('[data-tw-txt]');
    var show = function (on) {
      img.style.display = on ? 'inline-block' : 'none';
      if (txt) txt.style.display = on ? 'none' : '';
      if (on) dispatchEvent(new Event('resize')); // let pages re-measure layout
    };
    if (img.complete) show(img.naturalWidth > 0);
    img.addEventListener('load', function () { show(true); });
    img.addEventListener('error', function () { show(false); });
  });
})();
