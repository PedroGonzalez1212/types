/* Types — About page. Hero grid/blob animation, the "same uncertainty"
   question tracker, word-by-word highlights, stat count-ups and fade/clip
   reveals, ported from the Claude Design canvas component to plain JS.
   Header: nav.js. FAQ: faq.js. Loaded with `defer`. */

(function () {
  "use strict";

  var hero = document.getElementById('hero');
  var gridA = document.getElementById('grid-a');
  var gridB = document.getElementById('grid-b');
  var blobsA = document.getElementById('blobs-a');
  var blobsB = document.getElementById('blobs-b');
  var cta = document.getElementById('closing');
  var qs = document.getElementById('questions');
  var wordBlocks = [document.getElementById('issue-words'), document.getElementById('believe-words')];

  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gA = 0, gB = 0, raf = 0;
  var cl = function (v) { return Math.min(1, Math.max(0, v)); };
  var EZ = 'cubic-bezier(.22,1,.36,1)';

  // ---------- Background triangle grid (canvas) ----------
  function drawGrid(cv, t, ox) {
    if (!cv) return;
    var W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    var dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) cv.width = Math.round(W * dpr);
    if (cv.height !== Math.round(H * dpr)) cv.height = Math.round(H * dpr);
    var c = cv.getContext('2d'), TW = 56, TH = 97, maxD = Math.hypot(W, H);
    var s = 7, r = function () { return (s = (s * 16807) % 2147483647) / 2147483647; };
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.07)'; c.beginPath();
    var dots = [];
    for (var y = -TH + 14; y < H + TH; y += TH) for (var x = -14; x < W + TW; x += TW) {
      var rn = r(), dot = r() < .28, d = Math.hypot(x + 28 - W * ox, y) / maxD;
      var k = cl((t - d * .75 - rn * .12) / .25); if (k <= 0) continue;
      var p = 1 - Math.pow(1 - k, 3);
      c.moveTo(x, y + .5); c.lineTo(x + TW * p, y + .5); c.moveTo(x, y + 48.5); c.lineTo(x + TW * p, y + 48.5);
      c.moveTo(x, y); c.lineTo(x + TW * p, y + TH * p); c.moveTo(x + TW, y); c.lineTo(x + TW - TW * p, y + TH * p);
      if (dot) dots.push([x, y + .5, p]);
    }
    c.stroke();
    dots.forEach(function (d) { c.fillStyle = 'rgba(255,255,255,' + (.28 * d[2]) + ')'; c.beginPath(); c.arc(d[0], d[1], 3.5 * d[2], 0, Math.PI * 2); c.fill(); });
  }
  function redrawGrids() { drawGrid(gridA, gA, .9); drawGrid(gridB, gB, .5); }
  function animGrid(which, delay) {
    var t0 = 0;
    var step = function (now) {
      if (!t0) t0 = now;
      var v = Math.min(1.2, Math.max(0, (now - t0 - delay) / 2800 * 1.2));
      if (which === 'a') { gA = v; drawGrid(gridA, gA, .9); } else { gB = v; drawGrid(gridB, gB, .5); }
      if (v < 1.2) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Scroll-driven bits ----------
  function tick() {
    // Closing CTA glow fades in as the section arrives.
    if (cta && blobsB) {
      var r = cta.getBoundingClientRect();
      blobsB.style.opacity = rm ? .4 : .4 * cl((innerHeight * 1.1 - r.top) / (innerHeight * .7));
    }
    // Questions: the one nearest the middle of the screen lights up in its color.
    if (qs) {
      var lis = [].slice.call(qs.querySelectorAll('[data-q]')), a = 0, best = 1e9;
      lis.forEach(function (li, i) {
        var b = li.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - innerHeight * .5);
        if (d < best) { best = d; a = i; }
      });
      lis.forEach(function (li, i) {
        var on = rm || i === a, t = li.querySelector('[data-tri]');
        li.style.color = on ? 'var(--ink)' : 'var(--ink-subtle)';
        if (t) t.style.background = on ? t.getAttribute('data-c') : 'var(--border-control)';
      });
      qs.querySelectorAll('[data-seg]').forEach(function (g, i) { g.style.width = (i <= a ? 100 : 0) + '%'; });
      var qc = qs.querySelector('[data-qc]'); if (qc) qc.textContent = '0' + (a + 1) + ' / 04';
    }
    // Paragraphs that light up word by word.
    wordBlocks.forEach(function (p) {
      if (!p) return;
      var ws = p.querySelectorAll('[data-w]');
      if (rm) { ws.forEach(function (w) { w.style.opacity = ''; }); return; }
      var b = p.getBoundingClientRect(), pr = cl((innerHeight * .8 - b.top) / (b.height + innerHeight * .25)), n = ws.length;
      ws.forEach(function (w, i) { w.style.opacity = .16 + .84 * cl(pr * n * 1.15 - i); });
    });
  }

  function countUp(el) {
    var end = +el.getAttribute('data-count'), t0 = performance.now(), D = 1400;
    var step = function (now) {
      var k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(end * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Fade-up / clip reveals for content below the fold ----------
  // Items that come into view together cascade; one that arrives on its own (e.g.
  // a card stacked further down on mobile) doesn't wait for the others. On
  // mobile items rise further with a touch of scale; tablet staggers tighter.
  function revealIn() {
    var mobile = innerWidth < 768, step = innerWidth < 1024 ? 80 : 110;
    var io = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target; io.unobserve(n);
        if (n.hasAttribute('data-clip')) { n.style.transition = 'clip-path 1.4s ' + EZ; n.style.clipPath = 'inset(-10% 0 -10% 0)'; return; }
        var sib = k++;
        n.style.transition = 'opacity .8s ' + EZ + ',transform .8s ' + EZ; n.style.transitionDelay = (sib * step) + 'ms';
        n.style.opacity = '1'; n.style.transform = 'none';
        n.querySelectorAll('[data-draw]').forEach(function (d) { d.style.transition = 'transform 1.1s ' + EZ; d.style.transitionDelay = (sib * step) + 'ms'; d.style.transform = 'scaleX(1)'; });
        n.querySelectorAll('[data-count]').forEach(function (c) { setTimeout(function () { countUp(c); }, sib * step); });
      });
    }, { rootMargin: mobile ? '0px 0px -6% 0px' : '0px 0px -12% 0px' });
    document.querySelectorAll('[data-in],[data-clip]').forEach(function (n) {
      if (n.getBoundingClientRect().top < innerHeight * .9) return;
      if (n.hasAttribute('data-clip')) n.style.clipPath = 'inset(-10% 100% -10% 0)';
      else {
        n.style.opacity = '0'; n.style.transform = mobile ? 'translateY(40px) scale(.98)' : 'translateY(32px)';
        n.querySelectorAll('[data-draw]').forEach(function (d) { d.style.transform = 'scaleX(0)'; });
        n.querySelectorAll('[data-count]').forEach(function (c) { c.textContent = '0'; });
      }
      io.observe(n);
    });
  }

  // ---------- Boot ----------
  function init() {
    addEventListener('resize', function () { redrawGrids(); tick(); });
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; tick(); }); }, { passive: true });
    if (rm) { gA = gB = 1.2; redrawGrids(); }
    else {
      animGrid('a', 200);
      var io = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; io.disconnect(); animGrid('b', 0); }, { threshold: .2 });
      if (gridB) io.observe(gridB);
      hero.querySelectorAll('[data-line] > span, [data-hf]').forEach(function (n, i) {
        n.animate([{ transform: 'translateY(60%)', opacity: 0, filter: 'blur(6px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: 1500, delay: 300 + i * 200, easing: EZ, fill: 'backwards' });
      });
      blobsA.animate([{ opacity: 0 }, { opacity: .4 }], { duration: 2400, easing: 'ease-out', fill: 'backwards' });
      [blobsA, blobsB].forEach(function (b) {
        if (!b) return;
        b.querySelectorAll('[data-blob]').forEach(function (n, i) {
          var d = 5 + i * 2;
          n.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (i % 2 ? -d : d) + 'vw,' + d / 2 + 'vw) scale(1.12)' }, { transform: 'translate(0,0) scale(1)' }], { duration: 15000 + i * 3000, iterations: Infinity, easing: 'ease-in-out' });
        });
      });
      revealIn();
    }
    tick();
  }

  init();
})();
