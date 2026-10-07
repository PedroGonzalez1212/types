/* Types — Contact form. Client-side validation and the success state.
   Errors only appear after the first submit attempt, then update live as the
   visitor types. There is no backend yet: a valid submit just shows the
   confirmation (hook the real request in at `send()`). */

(function () {
  "use strict";

  var form = document.getElementById('cf-form');
  var done = document.getElementById('cf-done');
  if (!form || !done) return;

  var FIELDS = ['name', 'role', 'company', 'email'];
  var MSG = {
    name: 'Enter your name',
    role: 'Enter your role',
    company: 'Enter your company',
    email: 'Enter your email',
    emailInvalid: 'Enter a valid email, like name@company.com',
    svc: 'Select at least one service'
  };
  var input = function (k) { return document.getElementById('cf-' + k); };
  var svcBtns = [].slice.call(form.querySelectorAll('[data-svc]'));
  var notes = document.getElementById('cf-notes');
  var svcErr = document.getElementById('cf-svc-err');
  var count = document.getElementById('cf-count');
  var tried = false;

  function errors() {
    var e = {};
    FIELDS.forEach(function (k) { if (!input(k).value.trim()) e[k] = MSG[k]; });
    var em = input('email').value.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) e.email = MSG.emailInvalid;
    if (!svcBtns.some(function (b) { return b.getAttribute('aria-pressed') === 'true'; })) e.svc = MSG.svc;
    return e;
  }

  function showError(p, msg) {
    p.hidden = !msg;
    p.querySelector('[data-msg]').textContent = msg || '';
  }

  function paint() {
    var e = tried ? errors() : {};
    FIELDS.forEach(function (k) {
      var i = input(k);
      i.setAttribute('aria-invalid', String(!!e[k]));
      i.classList.toggle('is-filled', !!i.value);
      showError(document.getElementById('cf-' + k + '-err'), e[k]);
    });
    notes.classList.toggle('is-filled', !!notes.value);
    form.querySelector('#cf-services').classList.toggle('has-error', !!e.svc);
    showError(svcErr, e.svc);
    var n = Object.keys(e).length;
    count.hidden = !n;
    count.textContent = n ? (n === 1 ? '1 field needs your attention.' : n + ' fields need your attention.') : '';
    return e;
  }

  svcBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      paint();
    });
  });
  form.addEventListener('input', paint);

  function send(payload) {
    // TODO: post `payload` to the real endpoint once there is one.
    return Promise.resolve(payload);
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    tried = true;
    var e = paint();
    if (Object.keys(e).length) {
      var first = FIELDS.filter(function (k) { return e[k]; })[0];
      (first ? input(first) : svcBtns[0]).focus();
      return;
    }
    var payload = {
      name: input('name').value.trim(), role: input('role').value.trim(),
      company: input('company').value.trim(), email: input('email').value.trim(),
      services: svcBtns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.dataset.svc; }),
      notes: notes.value.trim()
    };
    send(payload).then(function () {
      document.getElementById('cf-sent-to').textContent = payload.email;
      form.hidden = true;
      done.hidden = false;
      document.getElementById('cf-ok').focus();
    });
  });

  document.getElementById('cf-reset').addEventListener('click', function () {
    form.reset();
    svcBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    tried = false;
    paint();
    done.hidden = true;
    form.hidden = false;
    input('name').focus();
  });

  paint();
})();
