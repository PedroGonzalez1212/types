/* Types — solution detail pages (Lead Generation, Content Globalization,
   Business Intelligence). Hero grid/blob animation, intro word highlight,
   service-row reveal, method strip and fade-up reveals, ported from the
   Claude Design canvas components to plain JS. Header: nav.js. FAQ: faq.js.
   Loaded with `defer`, so the DOM below is already parsed when this runs. */

(function () {
  "use strict";

  var hero = document.getElementById('hero');
  var gridA = document.getElementById('grid-a');
  var gridB = document.getElementById('grid-b');
  var blobsA = document.getElementById('blobs-a');
  var blobsB = document.getElementById('blobs-b');
  var intro = document.getElementById('intro');
  var svc = document.getElementById('services');
  var meth = document.getElementById('how-we-work');
  var next = document.getElementById('next');
  var bld = document.getElementById('bld');
  var quote = document.getElementById('quote');

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gA = 0, gB = 0, raf = 0;
  var cl = function (v) { return Math.min(1, Math.max(0, v)); };
  var ez = function (t) { return 1 - Math.pow(1 - t, 3); };

  // ---------- Hero quote: same width as the second title line ----------
  function fitQuote() {
    if (!bld || !quote) return;
    quote.style.fontSize = '20px';
    var w = function (el) { var r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
    var bw = w(bld), qw = w(quote);
    if (bw && qw) quote.style.fontSize = (20 * bw / qw) + 'px';
  }

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
      var p = ez(k);
      c.moveTo(x, y + .5); c.lineTo(x + TW * p, y + .5); c.moveTo(x, y + 48.5); c.lineTo(x + TW * p, y + 48.5);
      c.moveTo(x, y); c.lineTo(x + TW * p, y + TH * p); c.moveTo(x + TW, y); c.lineTo(x + TW - TW * p, y + TH * p);
      if (dot) dots.push([x, y + .5, p]);
    }
    c.stroke();
    dots.forEach(function (d) { c.fillStyle = 'rgba(255,255,255,' + (.28 * d[2]) + ')'; c.beginPath(); c.arc(d[0], d[1], 3.5 * d[2], 0, Math.PI * 2); c.fill(); });
  }
  function redrawGrids() { drawGrid(gridA, gA, .95); drawGrid(gridB, gB, .5); }
  function animGrid(which, delay) {
    var t0 = 0;
    var step = function (now) {
      if (!t0) t0 = now;
      var v = Math.min(1.2, Math.max(0, (now - t0 - delay) / 2800 * 1.2));
      if (which === 'a') { gA = v; drawGrid(gridA, gA, .95); } else { gB = v; drawGrid(gridB, gB, .5); }
      if (v < 1.2) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Intro paragraph: word-by-word scroll highlight ----------
  function splitWords() {
    if (!intro) return;
    [].slice.call(intro.querySelectorAll('p')).forEach(function (p) {
      var words = p.textContent.trim().split(/\s+/);
      p.textContent = '';
      words.forEach(function (w) {
        var s = document.createElement('span'); s.setAttribute('data-w', ''); s.textContent = w + ' ';
        p.appendChild(s);
      });
    });
  }
  function words() {
    if (!intro) return;
    var ws = intro.querySelectorAll('[data-w]');
    if (reduce) { ws.forEach(function (w) { w.style.opacity = ''; }); return; }
    var r = intro.getBoundingClientRect(), pr = cl((innerHeight * .85 - r.top) / (r.height + innerHeight * .3)), n = ws.length;
    ws.forEach(function (w, i) { w.style.opacity = .2 + .8 * cl(pr * n * 1.15 - i); });
  }

  // ---------- Services rows: line draw + staggered column reveal ----------
  // Side by side (tablet/desktop) the cells share the row's progress, offset per
  // column. Stacked on mobile each cell follows its own position on screen.
  function revealRows() {
    if (!svc) return;
    var H = innerHeight, mobile = innerWidth < 768;
    svc.querySelectorAll('[data-row]').forEach(function (r) {
      var p = reduce ? 1 : cl((H * .95 - r.getBoundingClientRect().top) / (H * .45));
      var l = r.querySelector('[data-rl]'); if (l) l.style.transform = 'scaleX(' + ez(cl(p / .7)) + ')';
      r.querySelectorAll('[data-rc]').forEach(function (c, k) {
        var q = reduce ? 1 : mobile ? ez(cl((H * .94 - c.getBoundingClientRect().top) / (H * .28))) : ez(cl((p - .15 - k * .12) / .45));
        c.style.opacity = q; c.style.transform = q >= 1 ? 'none' : 'translateY(' + (1 - q) * (mobile ? 18 : 24) + 'px)';
      });
    });
  }

  // ---------- Method strip: progress fill up to "Build" ----------
  function setupMethod() {
    var m = meth; if (!m || m.getBoundingClientRect().top < innerHeight * .7) return;
    var fill = m.querySelector('[data-fill]'), mk = m.querySelector('[data-mk]'), ls = [].slice.call(m.querySelectorAll('[data-sl]'));
    var set = function (p) {
      fill.style.width = (p * 40) + '%'; mk.style.left = (p * 40) + '%';
      ls.forEach(function (l, i) { l.style.color = (i === 2 && p >= 1) ? 'var(--accent)' : (i * .5 <= p ? 'var(--ink)' : 'var(--ink-muted)'); });
    };
    set(0);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect(); var t0 = 0;
      var step = function (now) {
        if (!t0) t0 = now;
        var k = Math.min(1, (now - t0 - 300) / 1600), e = k <= 0 ? 0 : ez(k);
        set(e); if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .4 });
    io.observe(m);
  }

  // ---------- Generic fade-up reveal for [data-in] below the fold ----------
  // Items that come into view together cascade; one that arrives on its own (e.g.
  // a card stacked further down on mobile) doesn't wait for the others.
  // Larger rise and a touch of scale on mobile, shorter stagger on tablet.
  function revealIn() {
    var mobile = innerWidth < 768, step = innerWidth < 1024 ? 70 : 90;
    var from = mobile ? 'translateY(32px) scale(.98)' : 'translateY(24px)';
    var ins = [].slice.call(document.querySelectorAll('[data-in]')).filter(function (n) { return n.getBoundingClientRect().top > innerHeight * .9; });
    ins.forEach(function (n) { n.style.opacity = '0'; n.style.transform = from; });
    var io = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var n = e.target; io.unobserve(n);
        n.style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)';
        n.style.transitionDelay = (k++ * step) + 'ms';
        n.style.opacity = '1'; n.style.transform = 'none';
      });
    }, { rootMargin: mobile ? '0px 0px -6% 0px' : '0px 0px -10% 0px' });
    ins.forEach(function (n) { io.observe(n); });
  }

  // ---------- Blobs: slow drifting loop ----------
  function startBlobs() {
    blobsA.animate([{ opacity: 0 }, { opacity: .4 }], { duration: 2400, easing: 'ease-out', fill: 'backwards' });
    [blobsA, blobsB].forEach(function (b) {
      if (!b) return;
      b.querySelectorAll('[data-blob]').forEach(function (n, i) {
        var base = n.style.transform || '', d = 5 + i * 2;
        n.animate([
          { transform: base + ' translate(0,0) scale(1)' },
          { transform: base + ' translate(' + (i % 2 ? -d : d) + 'vw,' + (i % 3 ? d / 2 : -d / 2) + 'vw) scale(1.12)' },
          { transform: base + ' translate(0,0) scale(1)' }
        ], { duration: 14000 + i * 3000, iterations: Infinity, easing: 'ease-in-out' });
      });
    });
  }

  // ---------- Boot ----------
  function init() {
    splitWords();
    addEventListener('resize', function () { redrawGrids(); words(); });
    addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; words(); revealRows(); });
    }, { passive: true });
    var ro = new ResizeObserver(redrawGrids);
    [gridA, gridB].forEach(function (c) { if (c) ro.observe(c); });

    if (reduce) { gA = gB = 1.2; redrawGrids(); }
    else {
      animGrid('a', 200);
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect(); animGrid('b', 0);
      }, { threshold: .15 });
      if (next) io.observe(next);
      hero.querySelectorAll('[data-line] > span').forEach(function (n, i) {
        n.animate([{ transform: 'translateY(60%)', opacity: 0, filter: 'blur(6px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: 1500, delay: 500 + i * 220, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      });
      hero.querySelectorAll('[data-hi]').forEach(function (n, i) {
        n.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: i === 0 ? 300 : 1200, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      });
      startBlobs();
      setupMethod();
      revealIn();
    }
    words(); revealRows();

    fitQuote();
    document.fonts && document.fonts.ready.then(fitQuote);
    if (bld) new ResizeObserver(fitQuote).observe(bld);
  }

  init();
})();
