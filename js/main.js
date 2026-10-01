/* Types — Solutions (4 cards, white header). Scroll-driven hero/solutions/method
   animation, ported from the Claude Design canvas component to plain JS.
   Loaded with `defer`, so the DOM below is already parsed when this runs. */

(function () {
  "use strict";

  // Defaults for the knobs the canvas editor used to expose as live-tunable props.
  var PROPS = { skipIntro: false, gridDuration: 3800, scrollLength: 1.5, exitLength: 1.5, titleLength: 1.4 };

  var root = document.getElementById('root');
  var blobs = document.getElementById('blobs');
  var grid = document.getElementById('grid'); // canvas
  var content = document.getElementById('content');
  var mark = document.getElementById('mark');
  var nav = document.getElementById('nav');
  var mf = document.getElementById('mf');
  var word = document.getElementById('word');
  var dd = document.getElementById('dd');
  var intro = document.getElementById('intro');
  var tri = document.getElementById('tri');
  var sol = document.getElementById('solutions');
  var meth = document.getElementById('method');

  var reduce, entered, revealed;
  var graf = 0, lraf = 0, timer, timeouts = [];
  var markX = null, lineCap, lineT = 0, line = 0;
  var gOff, gTarget, exCell = null, cells = [];
  var drawGrid = null, onResize, ro;
  var onGridScroll, onKey, onSolResize, onSolScroll, onNav;
  var fitGrid, fitDD, hdRo, solRo, mOff;

  function later(f, ms) { timeouts.push(setTimeout(f, ms)); }

  // ---------- Language toggle (visual state only — no translated copy yet) ----------
  function setLang(l) {
    document.getElementById('lang-en').setAttribute('aria-pressed', String(l === 'en'));
    document.getElementById('lang-es').setAttribute('aria-pressed', String(l === 'es'));
  }
  window.setLang = setLang;

  // ---------- Background triangle grid (canvas) ----------
  function setupGrid() {
    var cv = grid, ctx = cv.getContext('2d'), TW = 56, TH = 97, DUR = 1700;
    var W, H, VH, dpr;
    var ease = function (p) { return 1 - Math.pow(1 - p, 3); };
    var size = function () {
      var old = new Map(cells.map(function (c) { return [c.i + ',' + c.j, c.st]; }));
      dpr = Math.min(1.5, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; VH = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cells = [];
      var maxD = Math.hypot(W, VH);
      var dm = new Set(), nb = function (i, j) {
        return [[i - 1, j], [i, j - 1], [i - 1, j - 1], [i + 1, j - 1]].some(function (p) { return dm.has(p[0] + ',' + p[1]); });
      };
      for (var j = -2; j * TH + 14 < H; j++) for (var i = -1; i * TW - 14 < W; i++) {
        var x = i * TW - 14, y = j * TH + 14;
        cells.push({ i: i, j: j, x: x, y: y, hero: y < VH, d: Math.hypot(x + 28 - W, y + 48) / maxD, rnd: Math.random(), dot: (Math.random() < .36 && !nb(i, j)) ? (dm.add(i + ',' + j), 3.5) : 0, st: old.get(i + ',' + j) ?? null });
      }
    };
    drawGrid = function (now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
      { var o = gOff || { x: 0, y: 0 }; ctx.setTransform(dpr, 0, 0, dpr, dpr * o.x, dpr * o.y); }
      var busy = false;
      for (var k = 0; k < cells.length; k++) {
        var c = cells[k], r;
        if (c.hero) { if (c.st == null) continue; r = Math.min(1, Math.max(0, (now - c.st) / DUR)); if (r < 1) busy = true; }
        else { if (!revealed) continue; r = Math.min(1, Math.max(0, (line - c.y - Math.pow(1 - c.x / W, 1.3) * VH * 1.2 - c.rnd * VH * .1) / (VH * .45))); }
        if (r <= 0) continue;
        var p = ease(r), x = c.x, y = c.y;
        ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.beginPath();
        ctx.moveTo(x, y + .5); ctx.lineTo(x + TW * p, y + .5);
        ctx.moveTo(x, y + 48.5); ctx.lineTo(x + TW * p, y + 48.5);
        ctx.moveTo(x, y); ctx.lineTo(x + TW * p, y + TH * p);
        ctx.moveTo(x + TW, y); ctx.lineTo(x + TW - TW * p, y + TH * p);
        ctx.stroke();
        if (c.dot) { ctx.fillStyle = 'rgba(255,255,255,' + (.28 * p) + ')'; ctx.beginPath(); ctx.arc(x, y + .5, c.dot * p, 0, Math.PI * 2); ctx.fill(); }
      }
      return busy;
    };
    size();
    onResize = function () { size(); kick(); gridScroll(); };
    addEventListener('resize', onResize);
    ro = new ResizeObserver(function () { if (cv.clientWidth !== W || cv.clientHeight !== H) onResize(); });
    ro.observe(cv);
  }

  function gridScroll() {
    var cv = grid; if (!cv) return;
    lineT = -cv.getBoundingClientRect().top + innerHeight * 1.5;
    if (lineCap != null) lineT = Math.min(lineT, lineCap);
    if (reduce) { line = lineT; if (!graf) drawGrid(performance.now()); return; }
    if (!lraf) lraf = requestAnimationFrame(function () { lineTick(); });
  }
  function lineTick() {
    lraf = 0;
    line += (lineT - line) * .08;
    if (Math.abs(lineT - line) < .5) line = lineT;
    if (!graf) drawGrid(performance.now());
    if (line !== lineT) lraf = requestAnimationFrame(function () { lineTick(); });
  }
  function kick() {
    if (graf) return;
    var loop = function () { graf = 0; if (drawGrid(performance.now())) graf = requestAnimationFrame(loop); };
    loop();
  }

  // ---------- Solutions section: pinned scroll choreography ----------
  function solTick() {
    var s = sol; if (!s) return;
    var L = PROPS.scrollLength ?? 1.5, EL = PROPS.exitLength ?? 1.5;
    var TLf = PROPS.titleLength ?? 1.4, nh = (100 + 200 * L + 100 * EL + 100 * TLf) + 'vh';
    if (s.style.height !== nh) { s.style.height = nh; fitGrid && fitGrid(); }
    var r = s.getBoundingClientRect(), cl = function (v) { return Math.min(1, Math.max(0, v)); }, ease = function (v) { return 1 - Math.pow(1 - v, 3); }, io = function (v) { return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
    var RV = innerHeight * 2 * L, EX = innerHeight * EL, rmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var p = rmo ? 1 : cl(-r.top / Math.max(1, RV) * 1.08);
    var ex = rmo ? 0 : cl((-r.top - RV) / Math.max(1, EX));
    var cv = grid;
    if (cv) { lineCap = r.top - cv.getBoundingClientRect().top + RV + innerHeight * 1.5; if (lineT > lineCap) gridScroll(); }
    solExit(s, ex, cl, io);
    solTitle(s, rmo ? 0 : cl((-r.top - RV - EX) / Math.max(1, innerHeight * TLf)), cl, io);
    var tEl = s.querySelector('[data-type]'), caret = s.querySelector('[data-caret]');
    if (tEl) {
      var full = "What's Next?", rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      var tp = rm ? 1 : cl((innerHeight * .85 - r.top) / (innerHeight * .7));
      var n = Math.round(tp * full.length);
      if (tEl.textContent.length !== n) tEl.textContent = full.slice(0, n);
      caret.style.opacity = rm ? 0 : 1 - cl((p - .02) / .06);
    }
    var st = s.querySelector('[data-sol-sticky]');
    if (st) st.style.top = '0px';
    s.querySelectorAll('[data-sol]').forEach(function (col, i) {
      var card = col.querySelector('[data-sol-card]');
      var R = (1 - ease(cl((p - i * .035) / .12))) * 100;
      var qb = io(cl((p - .12 - i * .05) / .32)), qt = io(cl((p - .17 - i * .05) / .32));
      card.style.clipPath = 'inset(' + ((1 - qt) * 50) + '% ' + R + '% calc(' + ((1 - qb) * 50) + '% - ' + ((1 - qb) * 3) + 'px) 0)';
      card.querySelector('[data-sol-fill]').style.opacity = 1 - ease(cl((qb - .1) / .7));
      var num = card.querySelector('[data-sol-num]');
      num.textContent = String(i + 1).padStart(2, '0');
      var ni = ease(cl((p - .56 - i * .03) / .08)), no = ease(cl((p - .72 - i * .03) / .08));
      num.style.opacity = ni * (1 - no); num.style.transform = 'translateY(' + ((1 - ni) * 16 - no * 24) + 'px)';
      card.querySelectorAll('[data-sol-in]').forEach(function (n2, k) {
        var c = ease(cl((p - .8 - i * .025 - k * .015) / .1));
        n2.style.opacity = c; n2.style.transform = 'translateY(' + ((1 - c) * 20) + 'px)';
      });
    });
  }

  function solExit(s, ex, cl, io) {
    var st = s.querySelector('[data-sol-sticky]'), gridEl = s.querySelector('[data-sol-grid]'), head = st.firstElementChild;
    var cover = s.querySelector('[data-sol-cover]');
    var m = io(cl(ex / .6)), z = parseFloat(gridEl.style.zoom) || 1;
    var D = head.offsetTop + head.offsetHeight + 40, up = m ? 'translateY(' + (-m * D) + 'px)' : '';
    head.style.transform = up;
    var hd = root && root.querySelector('header');
    if (hd) hd.style.transform = up;
    var e0 = cl(ex / .6);
    s.querySelectorAll('[data-sol]').forEach(function (col, i) {
      var dir = i < 2 ? -1 : 1, dl = (i === 1 || i === 2) ? .1 : 0, p = cl((e0 - dl) / (1 - dl));
      if (!p) { col.style.transform = ''; return; }
      var x = dir * Math.pow(p, 1.6) * innerWidth / z, y = (-140 * p + 900 * p * p) / z, r = dir * 22 * Math.pow(p, 1.3);
      col.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg)';
    });
    var sb = st.getBoundingClientRect(), cv = grid, cr = cv ? cv.getBoundingClientRect() : { left: 0, top: 0 };
    var sx = innerWidth / 2, sy = innerHeight / 2;
    if (cv) { var q = cl((ex - .06) / .18); cv.style.opacity = q ? 1 - q : ''; cv.style.transform = q ? 'translateY(' + (q * q * 60) + 'px)' : ''; }
    if (ex <= 0) { exCell = null; cover.style.opacity = 0; cover.style.clipPath = 'polygon(0 0,0 0,0 0)'; return; }
    if (!exCell && cells) {
      var best = null, bd = 1e9;
      var o = gOff || { x: 0, y: 0 }, gb = gridEl.getBoundingClientRect(), tx = gb.left + gb.width / 2, ty = gb.top + gb.height / 2;
      var T = gTarget || { x: tx - cr.left, y: ty - cr.top };
      cells.forEach(function (c) { var d = Math.hypot(o.x + c.x + 28 - T.x, o.y + c.y + 16.17 - T.y); if (d < bd) { bd = d; best = c; } });
      exCell = best;
    }
    var c0 = exCell, R0 = 56 / Math.sqrt(3);
    var oo = gOff || { x: 0, y: 0 }, x0 = c0 ? cr.left + oo.x + c0.x + 28 : sx, y0 = c0 ? cr.top + oo.y + c0.y + 16.17 : sy;
    var t = cl((ex - .06) / .9), rot = io(cl(t / .35)), mv = io(cl(t / .45)), g = cl((t - .12) / .88);
    var pop = 1 + .35 * Math.sin(Math.PI * cl(t / .22)) * (1 - cl((t - .11) / .2)), R = R0 * pop + (4.3 * Math.hypot(innerWidth, innerHeight) / 2 - R0) * Math.pow(g, 2.4);
    var X = x0 + (sx - R / 4 - x0) * mv - sb.left, Y = y0 + (sy - y0) * mv - sb.top, th = (1 - rot) * Math.PI / 2;
    var pts = [0, 1, 2].map(function (k) { return (X + R * Math.cos(th + k * 2 * Math.PI / 3)) + 'px ' + (Y + R * Math.sin(th + k * 2 * Math.PI / 3)) + 'px'; });
    cover.style.opacity = cl((ex - .06) / .03);
    cover.style.clipPath = t >= 1 ? 'none' : 'polygon(' + pts.join(',') + ')';
  }

  function solTitle(s, ti, cl, io) {
    var st = s.querySelector('[data-sol-sticky]'), el = s.querySelector('[data-m-title]'); if (!el) return;
    var hd = root && root.querySelector('header');
    var on = ti > 0, gy = on ? '#ffffff' : '';
    if (root) root.style.zIndex = on ? '3' : '';
    s.style.background = on ? '#ffffff' : 'transparent';
    document.documentElement.style.background = gy; document.body.style.background = gy;
    if (!on) { el.style.opacity = 0; return; }
    var mh = document.querySelector('[data-m-h2]'), ms = mh && mh.closest('section'), mr = mh ? mh.getBoundingClientRect() : null, sr = st.getBoundingClientRect();
    var big = parseFloat(getComputedStyle(el).fontSize), scF = mh ? parseFloat(getComputedStyle(mh).fontSize) * (parseFloat(mh.parentElement.style.zoom) || 1) / big : .5;
    el.style.width = 'max-content';
    var W = st.offsetWidth, H = st.offsetHeight, w = el.offsetWidth, h = el.offsetHeight, cs = getComputedStyle(st);
    var g = io(cl(ti / .38)), mv = io(cl((ti - .5) / .4));
    var s0 = .12 + .88 * g, sc = s0 + (scF - s0) * mv;
    var cx = (W - w * sc) / 2, cy = (H - h * sc) / 2, fx = mr ? mr.left - sr.left : parseFloat(cs.paddingLeft), fy = mr ? mr.top - ms.getBoundingClientRect().top : parseFloat(cs.paddingTop);
    el.style.opacity = cl(ti / .12);
    el.style.transform = 'translate(' + (cx + (fx - cx) * mv) + 'px,' + (cy + (fy - cy) * mv) + 'px) scale(' + sc + ')';
    if (hd) { var D = hd.offsetHeight + 40; hd.style.transform = mv < 1 ? 'translateY(' + (-(1 - mv) * D) + 'px)' : ''; }
  }

  function solLayout() {
    var s = sol; if (!s) return;
    var cols = innerWidth < 640 ? 1 : (innerWidth < 1000 && innerHeight >= 860) ? 2 : 4, gridEl = s.querySelector('[data-sol-grid]');
    gridEl.style.gridTemplateColumns = 'repeat(' + cols + ',minmax(0,1fr))';
    gridEl.style.gap = innerWidth < 1280 ? '16px' : '24px';
    var hd = root && root.querySelector('header');
    var st = s.querySelector('[data-sol-sticky]'), pt = (hd ? hd.offsetHeight : 80) + Math.max(24, innerHeight * .05); st.style.paddingTop = pt + 'px';
    var eb = s.querySelector('[data-sol-h2]').previousElementSibling, cs = getComputedStyle(st);
    gridEl.style.zoom = 1;
    var avail = innerHeight - pt - eb.parentElement.offsetHeight - parseFloat(cs.rowGap || 0) - parseFloat(cs.paddingBottom || 0);
    var lim = innerHeight - parseFloat(cs.paddingBottom || 0);
    var zMin = innerWidth < 1000 ? .6 : .75;
    var z = cols === 1 ? 1 : Math.max(zMin, Math.min(1, (avail - 4) / gridEl.offsetHeight));
    gridEl.style.zoom = z;
    for (var k = 0; k < 4 && cols > 1 && z > zMin; k++) {
      var b = gridEl.getBoundingClientRect().bottom - st.getBoundingClientRect().top;
      if (b <= lim) break;
      z = Math.max(zMin, z * (lim - 4) / b); gridEl.style.zoom = z;
    }
    var cv = grid;
    if (cv) {
      var cr = cv.getBoundingClientRect(), r = s.getBoundingClientRect(), gb = gridEl.getBoundingClientRect(), sb = st.getBoundingClientRect(), RV = innerHeight * 2 * (PROPS.scrollLength ?? 1.5);
      var gx = gb.left + gb.width / 2 - cr.left, gy = gb.top + gb.height / 2 - sb.top - (cr.top - r.top - RV - .06 * innerHeight * (PROPS.exitLength ?? 1.5)), md = function (a, n) { return ((a % n) + n) % n; };
      gOff = { x: md(gx - 14 + 28, 56) - 28, y: md(gy - 30.17 + 48.5, 97) - 48.5 };
      gTarget = { x: gx, y: gy }; exCell = null;
      if (drawGrid && !graf) drawGrid(performance.now());
    }
  }

  // ---------- Header nav indicator ----------
  function navMark() {
    if (!nav || !mark) return;
    var links = [].slice.call(nav.querySelectorAll('a[href^="#"]')), hdr = mark.parentNode.getBoundingClientRect();
    var on = null;
    links.forEach(function (a) {
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target && target.getBoundingClientRect().top <= innerHeight * .45 && target.getBoundingClientRect().bottom > innerHeight * .45) on = a;
    });
    links.forEach(function (a) { if (a === on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    if (on) { var b = on.getBoundingClientRect(); markX = b.left + b.width / 2 - hdr.left - 12; }
    if (markX == null) return;
    mark.style.transform = 'translate(' + markX + 'px,' + (on ? '0' : '-100%') + ')';
  }

  // ---------- Hero intro sequence ----------
  function startIntro() {
    if (reduce || PROPS.skipIntro) { intro.style.display = 'none'; reveal(true); return; }
    entered = false;
    tri.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 900, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
    later(function () { enter(); }, 1100);
  }
  function enter() {
    if (entered) return; entered = true;
    intro.style.background = 'transparent';
    tri.animate([
      { transform: 'translateX(0) scale(1)', offset: 0 },
      { transform: 'translateX(-5vmin) scale(.9,1.06)', offset: .28 },
      { transform: 'translateX(130vw) scale(2.2,.7)', offset: 1 }
    ], { duration: 900, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' }).onfinish = function () { intro.style.display = 'none'; };
    later(function () { reveal(false); }, 450);
  }
  function reveal(instant) {
    var r = root, e = 'cubic-bezier(.2,.8,.2,1)', gd = PROPS.gridDuration ?? 3800, now = performance.now();
    cells.forEach(function (c) { c.st = instant ? -1e9 : now + c.d * gd + c.rnd * 300; });
    revealed = true; line = lineT = -grid.getBoundingClientRect().top + innerHeight * 1.5;
    if (instant) {
      drawGrid(now); blobs.style.opacity = '.4'; content.style.opacity = '1';
      if (!reduce) { startBlobs(); startRotation(); }
      return;
    }
    kick();
    blobs.animate([{ opacity: 0 }, { opacity: .4 }], { duration: 2400, delay: gd * .4, easing: 'ease-out', fill: 'backwards' });
    later(function () { blobs.style.opacity = '.4'; }, gd * .4);
    startBlobs();
    later(function () {
      content.style.opacity = '1';
      r.querySelectorAll('header[data-in]').forEach(function (n) {
        n.animate([{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'none' }], { duration: 800, easing: e, fill: 'backwards' });
      });
      r.querySelectorAll('[data-line] > span').forEach(function (n, i) {
        n.animate([{ transform: 'translateY(55%)', opacity: 0, filter: 'blur(6px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: 1700, delay: 150 + i * 240, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      });
      r.querySelectorAll('[data-in]:not(header)').forEach(function (n, i) {
        n.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 700 + i * 140, easing: e, fill: 'backwards' });
      });
      later(function () { startRotation(); }, 1600);
    }, gd * .75);
  }
  function replay() {
    clearInterval(timer); cancelAnimationFrame(graf); graf = 0; timeouts.forEach(clearTimeout); timeouts = [];
    root.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    if (word) word.textContent = 'clarity.';
    content.style.opacity = '0'; blobs.style.opacity = '0';
    revealed = false; cells.forEach(function (c) { c.st = null; }); drawGrid(0);
    intro.style.display = ''; intro.style.background = 'var(--surface-page)';
    startIntro();
  }
  function startBlobs() {
    root.querySelectorAll('[data-blob]').forEach(function (n, i) {
      var base = n.style.transform || '', d = 6 + i * 2;
      n.animate([
        { transform: base + ' translate(0,0) scale(1)' },
        { transform: base + ' translate(' + (i % 2 ? -d : d) + 'vw,' + (i % 3 ? d / 2 : -d / 2) + 'vw) scale(1.12)' },
        { transform: base + ' translate(0,0) scale(1)' }
      ], { duration: 14000 + i * 3000, iterations: Infinity, easing: 'ease-in-out' });
    });
  }
  function startRotation() {
    clearInterval(timer);
    var words = ['clarity.', 'confidence.', 'focus.', 'intelligence.'], e = 'cubic-bezier(.7,0,.2,1)';
    var i = 0;
    timer = setInterval(function () {
      i = (i + 1) % words.length;
      var next = words[i];
      [word].filter(Boolean).forEach(function (w) {
        w.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-105%)', opacity: 0 }], { duration: 450, easing: e, fill: 'forwards' }).onfinish = function () {
          w.textContent = next;
          w.animate([{ transform: 'translateY(105%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 550, easing: e, fill: 'forwards' });
        };
      });
    }, 2800);
  }

  // ---------- Method section: sticky timeline scrubber ----------
  function methSetup(el) {
    if (mOff) { mOff(); mOff = null; }
    if (!el) return;
    var cl = function (v) { return Math.min(1, Math.max(0, v)); }, ease = function (v) { return 1 - Math.pow(1 - v, 3); }, rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (s) { return [].slice.call(el.querySelectorAll(s)); };
    var lblOn = function (a) { $('[data-m-lbl]').forEach(function (l, i) { l.style.color = i === a ? 'var(--brand-teal)' : i < a ? 'var(--ink-muted)' : 'var(--ink-subtle)'; }); };
    var N = ['Explore', 'Design', 'Build', 'Measure', 'Evolve'];
    var gridEl = el.querySelector('[data-m-grid]'), left = el.querySelector('[data-m-left]'), right = el.querySelector('[data-m-right]'), fill = el.querySelector('[data-m-fill]'), markEl = el.querySelector('[data-m-mark]'), wordEl = el.querySelector('[data-m-word]'), count = el.querySelector('[data-m-count]'), steps = $('[data-m-step]');
    var track = el.querySelector('[data-m-track]'), divL = count.parentElement;
    var act = 0, busy = false, pb = innerHeight * .3, tb = pb, ty = innerHeight * .5;
    var swap = function () {
      if (busy || wordEl.textContent === N[act]) return;
      if (rm) { wordEl.textContent = N[act]; return; }
      busy = true;
      wordEl.animate([{ transform: 'none' }, { transform: 'translateY(-105%)' }], { duration: 280, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).onfinish = function () {
        wordEl.textContent = N[act];
        wordEl.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).onfinish = function () { busy = false; swap(); };
      };
    };
    var layout = function () {
      var narrow = innerWidth < 900, hd = root && root.querySelector('header'), hh = hd ? hd.offsetHeight : 79;
      gridEl.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : 'minmax(0,5fr) minmax(0,7fr)';
      left.style.position = narrow ? 'relative' : 'sticky'; left.style.top = '0';
      left.style.height = narrow ? 'auto' : innerHeight + 'px'; left.style.paddingTop = narrow ? (hh + 48) + 'px' : hh + 'px';
      fitBox(left, [].slice.call(left.children));
      var last = steps[steps.length - 1], g = last && last.querySelector('[data-m-in]:last-child');
      if (narrow || !g) { pb = tb = innerHeight * .3; ty = innerHeight * .5; }
      else {
        var dl = divL.getBoundingClientRect().top - left.getBoundingClientRect().top;
        var inner = last.getBoundingClientRect().bottom - g.getBoundingClientRect().top;
        pb = Math.max(0, innerHeight - dl - inner); tb = pb + inner; ty = dl;
      }
      right.style.paddingBottom = pb + 'px'; track.style.bottom = tb + 'px';
    };
    var tick = function () {
      el.style.visibility = el.getBoundingClientRect().top <= 1 ? 'visible' : 'hidden';
      var rr = right.getBoundingClientRect(), top = rr.top + innerHeight * .7, len = rr.height - innerHeight * .7 - tb, f = cl((ty - top) / len);
      fill.style.height = (f * len) + 'px'; markEl.style.transform = 'translateY(' + (f * len) + 'px)';
      var a = 0;
      steps.forEach(function (s, i) {
        var b = s.getBoundingClientRect(); if (b.top < innerHeight * .5) a = i;
        var e = rm ? 1 : ease(cl((innerHeight * .92 - b.top) / (innerHeight * .45)));
        var focus = .35 + .65 * (1 - cl((Math.abs(b.top + b.height / 2 - innerHeight / 2) - b.height * .3) / (innerHeight * .3)));
        s.querySelectorAll('[data-m-in]').forEach(function (n, k) {
          var v = ease(cl(e * 1.5 - k * .14));
          n.style.opacity = v * focus; n.style.transform = 'translateX(' + ((1 - v) * 72) + 'px)';
        });
      });
      count.textContent = String(a + 1).padStart(2, '0') + ' / 05'; lblOn(a);
      if (a !== act) { act = a; swap(); }
    };
    var fitBox = function (box, kids) {
      kids.forEach(function (k) { k.style.zoom = 1; });
      for (var n = 0; n < 3; n++) {
        var cs = getComputedStyle(box), pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom), avail = box.clientHeight - pad, need = box.scrollHeight - pad;
        if (need <= avail + 1) break;
        var z = Math.max(.72, parseFloat(kids[0].style.zoom || 1) * avail / need);
        kids.forEach(function (k) { k.style.zoom = z; });
      }
    };
    var fitAll = function () {
      var sh = innerHeight < 760;
      el.querySelectorAll('[style*="46ch"]').forEach(function (n) { n.style.display = sh ? 'none' : ''; });
      layout(); tick();
    };
    var raf2 = 0, on = function () { if (!raf2) raf2 = requestAnimationFrame(function () { raf2 = 0; tick(); }); };
    fitAll(); addEventListener('resize', fitAll); document.fonts && document.fonts.ready.then(fitAll);
    var to = setTimeout(fitAll, 1500);
    addEventListener('scroll', on, { passive: true });
    mOff = function () { clearTimeout(to); removeEventListener('resize', fitAll); removeEventListener('scroll', on); cancelAnimationFrame(raf2); };
  }

  // ---------- Boot ----------
  function init() {
    reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setupGrid();
    onGridScroll = function () { gridScroll(); };
    addEventListener('scroll', onGridScroll, { passive: true });
    onKey = function (ev) { if ((ev.key === 'r' || ev.key === 'R') && !ev.metaKey && !ev.ctrlKey && entered !== false) replay(); };
    addEventListener('keydown', onKey);
    startIntro();
    solLayout(); solTick();
    document.fonts && document.fonts.ready.then(function () { solLayout(); solTick(); });
    later(function () { solLayout(); solTick(); }, 1500);
    {
      var hd = root.querySelector('header');
      hdRo = new ResizeObserver(function () { solLayout(); solTick(); });
      if (hd) hdRo.observe(hd);
    }
    onSolResize = function () { solLayout(); solTick(); };
    addEventListener('resize', onSolResize);
    onSolScroll = function () { solTick(); };
    addEventListener('scroll', onSolScroll, { passive: true });
    fitGrid = function () {
      var cv = grid, r = root, s = sol;
      if (cv && r && s) {
        var h = Math.floor(s.getBoundingClientRect().bottom - cv.getBoundingClientRect().top);
        if (Math.abs(cv.offsetHeight - h) > 1) cv.style.height = h + 'px';
      }
    };
    fitGrid();
    addEventListener('resize', fitGrid);
    solRo = new ResizeObserver(function () { fitGrid(); });
    solRo.observe(sol); solRo.observe(root);
    fitDD = function () {
      var m = mf, p = dd;
      if (!m || !p) return;
      p.style.fontSize = '20px';
      var w = p.scrollWidth;
      if (w) p.style.fontSize = (20 * m.getBoundingClientRect().width / w) + 'px';
    };
    onNav = function () { navMark(); };
    addEventListener('scroll', onNav, { passive: true });
    addEventListener('resize', onNav);
    navMark();
    fitDD();
    addEventListener('resize', fitDD);
    document.fonts && document.fonts.ready.then(fitDD);
    methSetup(meth);
  }

  init();
})();
