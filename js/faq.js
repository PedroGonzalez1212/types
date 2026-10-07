/* Types — FAQ. Reads the questions/answers from #faq-data in the HTML and
   renders them into #faq-root:
   - wide: vertical tabs on the left, the selected answer in a panel on the right
     (hover or click selects; ↑/↓ move between questions).
   - narrow (below data-bp, default 1024px — the tablet breakpoint): an accordion,
     one answer open at a time. Its rows rise in one after another on first view.
   Used on every page that has a FAQ section.
   The first sentence of each answer is set in bold accent, as in the design. */

(function () {
  "use strict";

  var data = document.getElementById('faq-data');
  var mount = document.getElementById('faq-root');
  if (!data || !mount) return;

  var BP = +mount.dataset.bp || 1024; // accordion below this width (data-bp on #faq-root)
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = [].slice.call(data.querySelectorAll('[data-faq]')).map(function (n) {
    var q = n.querySelector('dt').textContent.trim(), a = n.querySelector('dd').textContent.trim();
    var m = a.match(/^.*?[.?!](?=\s|$)/);
    return { q: q, a1: m ? m[0] : a, a2: m ? a.slice(m[0].length).trim() : '' };
  });

  var mobile = null, sel = 0;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (k) { n.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return n;
  }
  function tri() { return el('span', { 'class': 'ty-tri faq-tri', 'aria-hidden': 'true' }); }
  function answer(it) {
    return [el('p', {}, [el('strong', {}, [it.a1])]), el('p', {}, [it.a2])];
  }

  // ---------- Desktop: tabs + panel ----------
  function renderDesk() {
    var list = el('div', { role: 'tablist', 'aria-label': 'FAQs', 'aria-orientation': 'vertical', 'class': 'faq-tabs' });
    var body = el('div', { 'class': 'faq-panel__body' });
    var panel = el('div', { id: 'faq-panel', role: 'tabpanel', tabindex: '0', 'class': 'faq-panel' }, [
      el('span', { 'class': 'faq-panel__bar', 'aria-hidden': 'true' }), body
    ]);
    var tabs = items.map(function (it, i) {
      var b = el('button', { type: 'button', role: 'tab', id: 'faq-t' + i, 'aria-controls': 'faq-panel', 'class': 'faq-tab' }, [el('span', {}, [it.q]), tri()]);
      b.addEventListener('click', function () { pick(i); });
      b.addEventListener('mouseenter', function () { pick(i); });
      b.addEventListener('keydown', function (e) {
        var d = { ArrowDown: 1, ArrowUp: -1 }[e.key]; if (!d) return;
        e.preventDefault();
        var k = (sel + d + items.length) % items.length;
        pick(k); tabs[k].focus();
      });
      list.appendChild(b);
      return b;
    });
    var prev = null;
    function pick(i) {
      if (i === prev) return;
      sel = i;
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', 'faq-t' + i);
      body.replaceChildren.apply(body, answer(items[i]));
      if (prev !== null && !rm) body.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      prev = i;
    }
    pick(Math.max(0, sel));
    return el('div', { 'class': 'faq-desk' }, [list, panel]);
  }

  // ---------- Mobile: accordion ----------
  function renderMob() {
    var wrap = el('div', { 'class': 'faq-mob' });
    var rows = items.map(function (it, i) {
      var btn = el('button', { type: 'button', 'aria-controls': 'faq-m' + i, 'class': 'faq-acc__btn' }, [el('span', {}, [it.q]), tri()]);
      var pane = el('div', { id: 'faq-m' + i, 'class': 'faq-acc__panel' }, answer(it));
      btn.addEventListener('click', function () { pick(sel === i ? -1 : i); });
      wrap.appendChild(el('div', { 'class': 'faq-acc' }, [el('h3', {}, [btn]), pane]));
      return { btn: btn, pane: pane };
    });
    function pick(i) {
      sel = i;
      rows.forEach(function (r, k) {
        r.btn.setAttribute('aria-expanded', String(k === i));
        r.pane.hidden = k !== i;
      });
    }
    pick(sel);
    stagger(wrap);
    return wrap;
  }

  // Accordion entrance: rows rise in one after another the first time they show.
  var staggered = false;
  function stagger(wrap) {
    if (rm || staggered || !('IntersectionObserver' in window)) return;
    var rows = [].slice.call(wrap.children);
    rows.forEach(function (r) { r.style.opacity = '0'; });
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect(); staggered = true;
      rows.forEach(function (r, i) {
        r.style.opacity = '';
        r.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: 120 + i * 90, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(wrap);
  }

  function render() {
    var m = innerWidth < BP;
    if (m === mobile) return;
    mobile = m;
    if (!m && sel < 0) sel = 0;
    mount.replaceChildren(m ? renderMob() : renderDesk());
  }

  render();
  addEventListener('resize', render);
})();
