/* Booking page: choose session → date/time → details → pending approval */
(function () {
  const { esc, $, $$ } = UI;
  let SITE, AV, TYPES;
  const S = { step: 1, type: null, duration: null, mode: 'in_person', date: null, time: null, month: null, busy: [], done: null, form: {} };
  const MODES = { in_person: ['Meet in person', 'users'], video: ['Video meeting', 'video'], phone: ['Phone call', 'phone'] };
  const TOPICS = ['Academic mentorship', 'Research collaboration', 'University matters', 'Partnership or sponsorship', 'Speaking or event invitation', 'Media or interview request', 'Other'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const hhmm = (n) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  const durations = (t) => String(t.durations || '30').split(',').map((x) => parseInt(x, 10)).filter(Boolean);
  const modeOf = () => (S.type && S.type.flexible ? S.mode : S.type ? S.type.key === 'video' ? 'video' : S.type.key === 'phone' ? 'phone' : 'in_person' : 'in_person');

  async function boot() {
    UI.initChrome('book');
    await UI.refreshUser();
    API.onAuthChange(async () => { await UI.refreshUser(); renderAll(); });
    SITE = await API.loadSite();
    AV = SITE.settings.availability;
    TYPES = SITE.items.session_types.filter((t) => t.enabled !== false);
    const now = new Date(); S.month = new Date(now.getFullYear(), now.getMonth(), 1);
    UI.renderFooter(SITE);
    UI.track('pageview', 'book');
    window.onSignedOut = renderAll;
    renderAll();
    if (location.hash === '#requests') setTimeout(() => $('#requests').scrollIntoView({ behavior: 'smooth' }), 200);
    setInterval(() => { if (!document.hidden && UI.user) renderRequests(); }, 30000);
  }

  function renderAll() { renderWizard(); renderSummary(); renderRequests(); renderNote(); hydrateIcons(); }

  /* ------------------------------------------------ stepper */
  function stepper() {
    const labels = ['Session', 'Date & time', 'Details'];
    return '<ol class="stepper">' + labels.map((l, i) => {
      const n = i + 1; const cls = S.step === n ? 'on' : (S.step > n || S.done) ? 'done' : '';
      return '<li class="' + cls + '"><b>' + (cls === 'done' ? icon('check', 14) : n) + '</b><span>' + l + '</span></li>';
    }).join('') + '</ol>';
  }

  function renderWizard() {
    const w = $('#wizard');
    if (S.done) { w.innerHTML = successView(); bindSuccess(); return; }
    w.innerHTML = stepper() + '<div class="step">' + (S.step === 1 ? step1() : S.step === 2 ? step2() : step3()) + '</div>';
    if (S.step === 1) bind1(); if (S.step === 2) bind2(); if (S.step === 3) bind3();
    hydrateIcons(w);
  }

  /* ------------------------------------------------ step 1 */
  function step1() {
    return '<h2>What kind of session would you like?</h2><p class="step-sub">Pick the format that suits your purpose.</p>' +
      '<div class="type-grid">' + TYPES.map((t) => {
        const on = S.type && S.type.key === t.key;
        return '<button class="type ' + (on ? 'on' : '') + '" data-key="' + esc(t.key) + '"><span class="type-ico">' + icon(t.icon || 'calendar', 22) + '</span><span class="type-main"><strong>' + esc(t.label) + '</strong><small>' + esc(t.description) + '</small>' +
          '<em>' + icon('clock', 13) + durations(t).join(' / ') + ' min' + (t.location_hint ? ' · ' + esc(t.location_hint) : '') + '</em></span><span class="type-check">' + icon('check', 16) + '</span></button>';
      }).join('') + '</div>' +
      (S.type ? '<div class="opt-row"><div class="opt"><label>Duration</label><div class="chips-row">' + durations(S.type).map((d) => '<button class="fchip light ' + (S.duration === d ? 'on' : '') + '" data-dur="' + d + '">' + d + ' min</button>').join('') + '</div></div>' +
        (S.type.flexible ? '<div class="opt"><label>Preferred format</label><div class="chips-row">' + Object.keys(MODES).map((k) => '<button class="fchip light ' + (S.mode === k ? 'on' : '') + '" data-mode="' + k + '">' + MODES[k][0] + '</button>').join('') + '</div></div>' : '') + '</div>' : '') +
      '<div class="step-actions"><span></span><button class="btn btn-dark" id="n1" ' + (S.type && S.duration ? '' : 'disabled') + '>Continue' + icon('arrow-right', 16) + '</button></div>';
  }
  function bind1() {
    $$('.type').forEach((b) => (b.onclick = () => { S.type = TYPES.find((t) => t.key === b.dataset.key); S.duration = durations(S.type)[0]; S.time = null; renderAll(); }));
    $$('[data-dur]').forEach((b) => (b.onclick = () => { S.duration = +b.dataset.dur; S.time = null; renderAll(); }));
    $$('[data-mode]').forEach((b) => (b.onclick = () => { S.mode = b.dataset.mode; renderAll(); }));
    const n = $('#n1'); if (n) n.onclick = () => { S.step = 2; renderAll(); window.scrollTo({ top: $('#wizard').offsetTop - 90, behavior: 'smooth' }); };
  }

  /* ------------------------------------------------ step 2 */
  function dayOk(d) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const min = new Date(today); min.setDate(min.getDate() + (AV.lead_days || 0));
    const max = new Date(today); max.setDate(max.getDate() + (AV.horizon_days || 60));
    return AV.days.includes(d.getDay()) && d >= min && d <= max && !(AV.blocked_dates || []).includes(ymd(d));
  }
  function slotsFor(dateStr) {
    const step = AV.step_minutes || 30; const dur = S.duration || 30;
    const start = mins(AV.start), end = mins(AV.end);
    const bs = AV.break_start ? mins(AV.break_start) : null, be = AV.break_end ? mins(AV.break_end) : null;
    const out = [];
    for (let t = start; t + dur <= end; t += step) {
      if (bs != null && t < be && t + dur > bs) continue;
      const clash = S.busy.some((b) => { const s = mins(b.time), e = s + (b.duration || 30); return t < e && t + dur > s; });
      out.push({ time: hhmm(t), taken: clash });
    }
    return out;
  }
  function calendar() {
    const y = S.month.getFullYear(), m = S.month.getMonth();
    const first = new Date(y, m, 1); const days = new Date(y, m + 1, 0).getDate();
    let cells = ''; for (let i = 0; i < first.getDay(); i++) cells += '<span class="cal-blank"></span>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d); const k = ymd(dt); const ok = dayOk(dt);
      cells += '<button class="cal-day ' + (ok ? '' : 'off') + (S.date === k ? ' on' : '') + '" data-d="' + k + '" ' + (ok ? '' : 'disabled') + '>' + d + '</button>';
    }
    const now = new Date(); const prevOk = !(y === now.getFullYear() && m === now.getMonth());
    return '<div class="cal"><div class="cal-head"><button class="icon-btn" id="mPrev" ' + (prevOk ? '' : 'disabled') + ' aria-label="Previous month">' + icon('chevron-left', 18) + '</button><strong>' + S.month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + '</strong><button class="icon-btn" id="mNext" aria-label="Next month">' + icon('chevron-right', 18) + '</button></div>' +
      '<div class="cal-week">' + WD.map((x) => '<span>' + x + '</span>').join('') + '</div><div class="cal-grid">' + cells + '</div></div>';
  }
  function step2() {
    let slots = '<p class="hint">Select a date to see available times.</p>';
    if (S.date) {
      const list = slotsFor(S.date);
      slots = list.length ? '<div class="slots">' + list.map((s) => '<button class="slot ' + (S.time === s.time ? 'on' : '') + '" data-t="' + s.time + '" ' + (s.taken ? 'disabled' : '') + '>' + UI.fmtTime(s.time) + '</button>').join('') + '</div>' : '<p class="hint">No times fit this duration.</p>';
    }
    return '<h2>Pick a date and time</h2><p class="step-sub">' + esc(AV.notice || '') + '</p><div class="dt-grid">' + calendar() +
      '<div class="times"><h4>' + (S.date ? UI.fmtDate(S.date, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Available times') + '</h4>' + slots + '</div></div>' +
      '<div class="step-actions"><button class="btn btn-ghost" id="b2">' + icon('chevron-left', 16) + 'Back</button><button class="btn btn-dark" id="n2" ' + (S.date && S.time ? '' : 'disabled') + '>Continue' + icon('arrow-right', 16) + '</button></div>';
  }
  function bind2() {
    $('#mPrev').onclick = () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() - 1, 1); renderWizard(); };
    $('#mNext').onclick = () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() + 1, 1); renderWizard(); };
    $$('.cal-day:not(.off)').forEach((b) => (b.onclick = async () => {
      S.date = b.dataset.d; S.time = null; S.busy = [];
      renderWizard(); renderSummary();
      try { S.busy = await API.bookedSlots(S.date); } catch (e) { S.busy = []; }
      renderWizard(); hydrateIcons();
    }));
    $$('.slot:not([disabled])').forEach((b) => (b.onclick = () => { S.time = b.dataset.t; renderWizard(); renderSummary(); hydrateIcons(); }));
    $('#b2').onclick = () => { S.step = 1; renderAll(); };
    $('#n2').onclick = () => { S.step = 3; renderAll(); window.scrollTo({ top: $('#wizard').offsetTop - 90, behavior: 'smooth' }); };
  }

  /* ------------------------------------------------ step 3 */
  function step3() {
    const u = UI.user || {}; const f = S.form;
    const val = (k, d) => esc(f[k] != null ? f[k] : (d || ''));
    return '<h2>Tell him about your request</h2><p class="step-sub">' + (UI.user ? 'Signed in as ' + esc(u.email) + '.' : 'You will be asked to sign in or create an account when you submit.') + '</p>' +
      '<form class="form two" id="bookForm" novalidate>' +
      '<label class="fld"><span>Full name</span><input name="name" required value="' + val('name', u.full_name) + '" autocomplete="name"></label>' +
      '<label class="fld"><span>Email</span><input name="email" type="email" required value="' + val('email', u.email) + '" autocomplete="email"></label>' +
      '<label class="fld"><span>Phone / WhatsApp</span><input name="phone" value="' + val('phone') + '" autocomplete="tel" placeholder="+234 ..."></label>' +
      '<label class="fld"><span>Organisation or role</span><input name="organisation" value="' + val('organisation') + '" placeholder="e.g. 400-level student, Department of ..."></label>' +
      '<label class="fld"><span>Topic</span><select name="topic">' + TOPICS.map((t) => '<option ' + (f.topic === t ? 'selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>' +
      '<label class="fld"><span>Number of attendees</span><input name="attendees" type="number" min="1" max="50" value="' + val('attendees', '1') + '"></label>' +
      '<label class="fld full"><span>What would you like to discuss?</span><textarea name="message" rows="5" required minlength="20" placeholder="Share some context so the Vice-Chancellor can prepare (at least 20 characters).">' + val('message') + '</textarea></label>' +
      '<p class="form-err full" id="bkErr" hidden></p>' +
      '<div class="step-actions full"><button type="button" class="btn btn-ghost" id="b3">' + icon('chevron-left', 16) + 'Back</button><button class="btn btn-dark" type="submit" id="submitBk">' + icon('send', 16) + 'Submit request</button></div></form>';
  }
  function bind3() {
    const f = $('#bookForm'); const err = $('#bkErr');
    const keep = () => { ['name', 'email', 'phone', 'organisation', 'topic', 'attendees', 'message'].forEach((k) => (S.form[k] = f[k].value)); };
    $('#b3').onclick = () => { keep(); S.step = 2; renderAll(); };
    f.onsubmit = async (e) => {
      e.preventDefault(); keep(); err.hidden = true;
      const fail = (m) => { err.textContent = m; err.hidden = false; };
      if (!S.form.name.trim()) return fail('Please enter your name.');
      if (!/^\S+@\S+\.\S+$/.test(S.form.email)) return fail('Please enter a valid email address.');
      if (S.form.message.trim().length < 20) return fail('Please add a little more detail (at least 20 characters).');
      if (!UI.user) {
        const u = await UI.openAuth({ mode: 'up', reason: 'Create an account (or sign in) to submit your request. Your details are saved.' });
        if (!u) return;
      }
      const btn = $('#submitBk'); btn.disabled = true; btn.innerHTML = 'Submitting…';
      try {
        const t = S.type;
        const row = await API.createBooking({
          name: S.form.name.trim(), email: S.form.email.trim(), phone: S.form.phone.trim(), organisation: S.form.organisation.trim(),
          session_type: t.key, session_label: t.label, mode: modeOf(), duration: S.duration, date: S.date, time: S.time,
          topic: S.form.topic, message: S.form.message.trim(), attendees: Math.max(1, parseInt(S.form.attendees, 10) || 1)
        });
        UI.track('click', 'Booking submitted');
        S.done = row; renderAll(); window.scrollTo({ top: $('#wizard').offsetTop - 90, behavior: 'smooth' });
      } catch (ex) { fail(ex.message); btn.disabled = false; btn.innerHTML = icon('send', 16) + 'Submit request'; }
    };
  }

  /* ------------------------------------------------ success */
  function successView() {
    const b = S.done;
    return '<div class="success"><span class="s-ico">' + icon('check', 30) + '</span><h2>Request received</h2>' +
      '<p>Your request for a <strong>' + esc(b.session_label) + '</strong> on <strong>' + UI.fmtDate(b.date) + ' at ' + UI.fmtTime(b.time) + '</strong> is now <span class="status pending">Pending</span>.</p>' +
      '<ol class="next"><li>The Vice-Chancellor\'s office reviews your request.</li><li>You will see it marked <span class="status approved">Approved</span> or <span class="status declined">Declined</span> under <em>My session requests</em> below.</li><li>If approved, the meeting link or location appears on the request.</li></ol>' +
      '<div class="step-actions center"><button class="btn btn-ghost" id="again">Request another session</button><a class="btn btn-dark" href="#requests" id="goReq">View my requests</a></div></div>';
  }
  function bindSuccess() {
    $('#again').onclick = () => { Object.assign(S, { step: 1, type: null, duration: null, date: null, time: null, done: null, form: {} }); renderAll(); };
    $('#goReq').onclick = (e) => { e.preventDefault(); $('#requests').scrollIntoView({ behavior: 'smooth' }); };
  }

  /* ------------------------------------------------ summary + notes */
  function renderSummary() {
    const row = (ic, k, v) => '<li class="' + (v ? 'set' : '') + '"><span>' + icon(ic, 16) + k + '</span><strong>' + (v ? esc(v) : '—') + '</strong></li>';
    $('#summary').innerHTML = '<h3>Your request</h3><ul class="sum">' +
      row('layers', 'Session', S.type && S.type.label) + row('clock', 'Duration', S.duration && S.duration + ' minutes') +
      row(MODES[modeOf()][1], 'Format', S.type && MODES[modeOf()][0]) + row('calendar', 'Date', S.date && UI.fmtDate(S.date)) + row('clock', 'Time', S.time && UI.fmtTime(S.time) + ' WAT') + '</ul>' +
      '<p class="sum-foot">' + (S.type && S.type.location_hint ? icon('map-pin', 14) + esc(S.type.location_hint) : 'Nothing is booked until the Vice-Chancellor approves your request.') + '</p>';
  }
  function renderNote() {
    $('#noteCard').innerHTML = '<h3>Good to know</h3><ul class="plain"><li>Sessions are free of charge.</li><li>Requests are approved or declined personally, usually within a few working days.</li><li>You can cancel a pending request from your account at any time.</li></ul>';
  }

  /* ------------------------------------------------ my requests */
  async function renderRequests() {
    const m = $('#requestsMount');
    if (!UI.user) {
      m.innerHTML = '<h3 class="card-title">' + icon('inbox', 20) + 'My session requests</h3><div class="empty-state sm"><p>Sign in to see the status of your requests.</p><button class="btn btn-dark btn-sm" id="reqIn">Sign in</button></div>';
      $('#reqIn').onclick = () => UI.openAuth(); hydrateIcons(m); return;
    }
    let list = [];
    try { list = await API.myBookings(); } catch (e) {}
    m.innerHTML = '<h3 class="card-title">' + icon('inbox', 20) + 'My session requests</h3>' + (list.length ? '<div class="req-list">' + list.map((b) =>
      '<article class="req"><div class="req-top"><div><strong>' + esc(b.session_label) + '</strong><span>' + UI.fmtDate(b.date) + ' · ' + UI.fmtTime(b.time) + ' · ' + b.duration + ' min</span></div><span class="status ' + esc(b.status) + '">' + esc(b.status) + '</span></div>' +
      '<p class="req-msg">' + esc(b.topic) + ' — ' + esc(b.message.slice(0, 140)) + (b.message.length > 140 ? '…' : '') + '</p>' +
      (b.status === 'approved' && b.meeting_detail ? '<p class="req-note ok">' + icon('link', 15) + '<span>' + esc(b.meeting_detail) + '</span></p>' : '') +
      (b.admin_note ? '<p class="req-note">' + icon('pen', 15) + '<span>' + esc(b.admin_note) + '</span></p>' : '') +
      (b.status === 'pending' ? '<button class="link-btn" data-cancel="' + esc(b.id) + '">Cancel request</button>' : '') + '</article>').join('') + '</div>'
      : '<div class="empty-state sm"><p>You have not requested a session yet.</p></div>');
    $$('[data-cancel]', m).forEach((b) => (b.onclick = async () => { if (await UI.confirm('Cancel this request?', 'Cancel request')) { await API.cancelBooking(b.dataset.cancel); UI.toast('Request cancelled.'); renderRequests(); } }));
    hydrateIcons(m);
  }

  boot();
})();
