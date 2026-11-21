/* Admin dashboard. No URL: it is an overlay that only exists for a signed-in administrator. */
(function () {
  const { esc, $, $$ } = UI;
  const A = {};
  window.Admin = A;
  let site = null, tab = 'overview', root = null, cache = {};
  const days = 30;

  const SCHEMAS = {
    timeline: { label: 'Journey timeline', icon: 'clock', title: (d) => d.title, sub: (d) => [(d.start || '') + (d.end ? ' – ' + d.end : ''), d.org].filter(Boolean).join(' · '),
      fields: [{ k: 'kind', t: 'select', o: ['study', 'work', 'current'], label: 'Type' }, { k: 'start', label: 'Start (year or date)' }, { k: 'end', label: 'End (blank if single date; "Present" if ongoing)' }, { k: 'title', label: 'Title' }, { k: 'org', label: 'Institution / organisation' }, { k: 'detail', t: 'textarea', label: 'Details' }] },
    courses: { label: 'Courses taught', icon: 'book-open', title: (d) => d.title, sub: (d) => [d.level, d.code, d.area].filter(Boolean).join(' · '),
      fields: [{ k: 'level', t: 'select', o: ['Undergraduate', 'Postgraduate', 'Executive'], label: 'Level' }, { k: 'code', label: 'Course code (e.g. MGT 301)' }, { k: 'title', label: 'Course title' }, { k: 'area', label: 'Programme / session (e.g. MSc / PhD, 2025/2026)' }, { k: 'description', t: 'textarea', label: 'Description' }] },
    publications: { label: 'Publications', icon: 'file-text', title: (d) => d.title, sub: (d) => [d.type, d.year, d.venue].filter(Boolean).join(' · '),
      fields: [{ k: 'type', t: 'select', o: ['Journal article', 'Book', 'Book chapter', 'Lecture', 'Conference paper', 'Report'], label: 'Type' }, { k: 'title', label: 'Title' }, { k: 'authors', label: 'Authors' }, { k: 'venue', label: 'Journal / publisher / venue' }, { k: 'year', label: 'Year' }, { k: 'topic', t: 'select', o: ['hr', 'productivity', 'leadership', 'ir', 'sdg', 'culture', 'conflict', 'employee', 'book'], label: 'Cover style (used when there is no image)' }, { k: 'url', label: 'Link (DOI, journal page, PDF)' }, { k: 'image_url', t: 'image', label: 'Cover image (optional)' }, { k: 'featured', t: 'check', label: 'Feature this work' }] },
    awards: { label: 'Recognition & awards', icon: 'award', title: (d) => d.title, sub: (d) => [d.org, d.year].filter(Boolean).join(' · '),
      fields: [{ k: 'title', label: 'Award / honour' }, { k: 'org', label: 'Awarding body' }, { k: 'year', label: 'Year' }, { k: 'icon', t: 'select', o: ['award', 'star', 'globe', 'users', 'briefcase', 'graduation'], label: 'Icon' }, { k: 'description', t: 'textarea', label: 'Description' }, { k: 'url', label: 'Link (news story, certificate)' }, { k: 'image_url', t: 'image', label: 'Photo (optional)' }] },
    conferences: { label: 'Conferences', icon: 'mic', title: (d) => d.title, sub: (d) => [d.role, d.date, d.event].filter(Boolean).join(' · '),
      fields: [{ k: 'title', label: 'Title' }, { k: 'role', label: 'His role (Keynote speaker, Chair, Host...)' }, { k: 'event', label: 'Organiser / event' }, { k: 'date', label: 'Date' }, { k: 'location', label: 'Location' }, { k: 'description', t: 'textarea', label: 'Description' }, { k: 'url', label: 'Link' }, { k: 'image_url', t: 'image', label: 'Photo (optional)' }] },
    session_types: { label: 'Session types', icon: 'layers', title: (d) => d.label, sub: (d) => d.durations + ' min · ' + (d.enabled === false ? 'hidden' : 'visible'),
      fields: [{ k: 'key', label: 'Key (letters, no spaces; do not change once bookings exist)' }, { k: 'label', label: 'Name' }, { k: 'icon', t: 'select', o: ['users', 'video', 'phone', 'graduation', 'mic', 'calendar', 'briefcase'], label: 'Icon' }, { k: 'description', t: 'textarea', label: 'Description' }, { k: 'durations', label: 'Durations in minutes, comma separated (e.g. 30,45,60)' }, { k: 'location_hint', label: 'Location / link note' }, { k: 'flexible', t: 'check', label: 'Let the visitor choose the format (in-person / video / phone)' }, { k: 'enabled', t: 'check', label: 'Visible on the booking page' }] }
  };

  const TABS = [
    { id: 'overview', icon: 'bar-chart', label: 'Overview' },
    { id: 'bookings', icon: 'calendar', label: 'Bookings' },
    { id: 'blog', icon: 'pen', label: 'Blog' },
    { id: 'site', icon: 'settings', label: 'Site & contact' },
    { id: 'timeline', icon: 'clock', label: 'Journey' },
    { id: 'courses', icon: 'book-open', label: 'Courses' },
    { id: 'publications', icon: 'file-text', label: 'Publications' },
    { id: 'awards', icon: 'award', label: 'Awards' },
    { id: 'conferences', icon: 'mic', label: 'Conferences' },
    { id: 'session_types', icon: 'layers', label: 'Session types' }
  ];

  A.open = async function () {
    if (!UI.user || UI.user.role !== 'admin') return;
    if (!root) { root = document.createElement('div'); root.id = 'admin'; document.body.appendChild(root); }
    root.classList.add('open'); document.body.classList.add('no-scroll');
    site = await API.loadSite();
    draw();
  };
  A.close = function () { if (window.ADMIN_ROUTE) { location.href = '../'; return; } if (root) root.classList.remove('open'); document.body.classList.remove('no-scroll'); };

  function pendingCount() { return (cache.bookings || []).filter((b) => b.status === 'pending').length; }

  function draw() {
    root.innerHTML =
      '<aside class="adm-side"><div class="adm-brand"><span>IZ</span><div><strong>Dashboard</strong><small>' + (API.mode === 'demo' ? 'Demo mode' : 'Supabase') + '</small></div></div>' +
      '<nav>' + TABS.map((t) => '<button class="adm-tab ' + (tab === t.id ? 'on' : '') + '" data-tab="' + t.id + '">' + icon(t.icon, 18) + '<span>' + t.label + '</span>' + (t.id === 'bookings' && pendingCount() ? '<em>' + pendingCount() + '</em>' : '') + '</button>').join('') + '</nav>' +
      '<div class="adm-foot"><button class="adm-tab" id="admView">' + icon('eye', 18) + '<span>View website</span></button><button class="adm-tab" id="admOut">' + icon('log-out', 18) + '<span>Sign out</span></button></div></aside>' +
      '<section class="adm-main"><header class="adm-top"><h2>' + esc((TABS.find((t) => t.id === tab) || {}).label) + '</h2><button class="icon-btn" id="admClose" aria-label="Close dashboard">' + icon('x', 20) + '</button></header>' +
      (site.fromDefaults ? '<div class="adm-banner">Your database is empty, so the website is showing starter content. <button class="btn btn-dark btn-sm" id="seedBtn">Save starter content to Supabase</button> to start editing.</div>' : '') +
      '<div class="adm-body" id="admBody"></div></section>';
    $$('[data-tab]', root).forEach((b) => (b.onclick = () => { tab = b.dataset.tab; draw(); }));
    $('#admClose', root).onclick = A.close; $('#admView', root).onclick = A.close;
    $('#admOut', root).onclick = () => UI.signOut();
    const sb = $('#seedBtn', root); if (sb) sb.onclick = async () => { sb.disabled = true; try { await API.seedDefaults(); site = await API.loadSite(); UI.toast('Starter content saved.', 'ok'); refresh(); draw(); } catch (e) { UI.toast(e.message, 'err'); sb.disabled = false; } };
    renderTab();
    hydrateIcons(root);
  }

  async function renderTab() {
    const body = $('#admBody', root);
    body.innerHTML = '<p class="hint">Loading…</p>';
    try {
      if (tab === 'overview') await overview(body);
      else if (tab === 'bookings') await bookings(body);
      else if (tab === 'blog') await blog(body);
      else if (tab === 'site') siteForm(body);
      else collection(body, tab);
    } catch (e) { body.innerHTML = '<p class="form-err">' + esc(e.message) + '</p>'; }
    hydrateIcons(body);
  }
  function refresh() { if (window.reloadSite) window.reloadSite(); }

  /* ------------------------------------------------ helpers */
  const fld = (label, inner, cls) => '<label class="fld ' + (cls || '') + '"><span>' + label + '</span>' + inner + '</label>';
  async function pickImage(onDone) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      if (f.size > 8 * 1024 * 1024) return UI.toast('Please choose an image under 8 MB.', 'err');
      try { UI.toast('Uploading…'); const url = await API.uploadImage(f); onDone(url); UI.toast('Image uploaded.', 'ok'); } catch (e) { UI.toast(e.message, 'err'); }
    };
    inp.click();
  }
  function imageField(name, value, label) {
    return '<div class="fld img-fld full"><span>' + label + '</span><div class="img-row"><div class="img-prev" data-prev="' + name + '">' + (value ? '<img src="' + esc(value) + '" alt="">' : icon('image', 22)) + '</div>' +
      '<div class="img-act"><button type="button" class="btn btn-ghost btn-sm" data-pick="' + name + '">' + icon('upload', 15) + 'Upload image</button><button type="button" class="link-btn" data-clear="' + name + '">Remove</button></div><input type="hidden" name="' + name + '" value="' + esc(value || '') + '"></div></div>';
  }
  function bindImages(form) {
    $$('[data-pick]', form).forEach((b) => (b.onclick = () => pickImage((url) => { form[b.dataset.pick].value = url; $('[data-prev="' + b.dataset.pick + '"]', form).innerHTML = '<img src="' + esc(url) + '" alt="">'; })));
    $$('[data-clear]', form).forEach((b) => (b.onclick = () => { form[b.dataset.clear].value = ''; $('[data-prev="' + b.dataset.clear + '"]', form).innerHTML = icon('image', 22); }));
  }
  const guard = () => { if (site.fromDefaults) { UI.toast('Save the starter content to Supabase first (banner at the top).', 'err'); return false; } return true; };

  /* ------------------------------------------------ overview / analytics */
  function line(el, labels, series, colors) {
    const W = 760, H = 230, p = { l: 36, r: 12, t: 12, b: 26 };
    const max = Math.max(1, ...series.flat());
    const nice = Math.ceil(max / 4) * 4 || 4;
    const x = (i) => p.l + (i * (W - p.l - p.r)) / Math.max(1, labels.length - 1);
    const y = (v) => p.t + (H - p.t - p.b) * (1 - v / nice);
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = (nice / 4) * i; g += '<line x1="' + p.l + '" x2="' + (W - p.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="currentColor" opacity=".1"/><text x="' + (p.l - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="10" fill="currentColor" opacity=".55">' + Math.round(v) + '</text>'; }
    const step = Math.ceil(labels.length / 6);
    labels.forEach((l, i) => { if (i % step === 0) g += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="currentColor" opacity=".55">' + l + '</text>'; });
    series.forEach((s, k) => {
      const pts = s.map((v, i) => x(i) + ',' + y(v)).join(' ');
      g += '<polyline fill="none" stroke="' + colors[k] + '" stroke-width="2.4" stroke-linejoin="round" points="' + pts + '"/>';
      if (k === 0) g += '<polygon fill="' + colors[k] + '" opacity=".1" points="' + p.l + ',' + y(0) + ' ' + pts + ' ' + x(s.length - 1) + ',' + y(0) + '"/>';
    });
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Visits over time">' + g + '</svg>';
  }
  function bars(items, color, total) {
    if (!items.length) return '<p class="hint">No data yet.</p>';
    const max = Math.max(...items.map((i) => i[1]), 1);
    return '<ul class="bars">' + items.map((i) => '<li><span class="b-l">' + esc(i[0]) + '</span><span class="b-t"><i style="width:' + Math.round((i[1] / max) * 100) + '%;background:' + color + '"></i></span><span class="b-v">' + i[1] + (total ? ' <small>' + Math.round((i[1] / total) * 100) + '%</small>' : '') + '</span></li>').join('') + '</ul>';
  }
  const count = (arr, f) => { const m = {}; arr.forEach((x) => { const k = f(x); if (k != null) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };

  async function overview(body) {
    const [ev, bk, posts] = await Promise.all([API.getEvents(days), API.allBookings(), API.listPosts({ all: true })]);
    cache.bookings = bk;
    const pv = ev.filter((e) => e.type === 'pageview');
    const visitors = new Set(ev.map((e) => e.visitor_id)).size;
    const sessions = new Set(ev.map((e) => e.session_id)).size;
    const bookVisits = new Set(ev.filter((e) => e.type === 'pageview' && e.label === 'book').map((e) => e.session_id)).size;
    const recent = bk.filter((b) => (Date.now() - new Date(b.created_at)) / 86400000 <= days);
    const conv = visitors ? ((recent.length / visitors) * 100).toFixed(1) : '0.0';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const labels = [], pvS = [], vS = [];
    for (let i = days - 1; i >= 0; i--) {
      const d0 = new Date(today.getTime() - i * 86400000), d1 = new Date(d0.getTime() + 86400000);
      labels.push(d0.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
      const day = ev.filter((e) => { const t = new Date(e.created_at); return t >= d0 && t < d1; });
      pvS.push(day.filter((e) => e.type === 'pageview').length); vS.push(new Set(day.map((e) => e.visitor_id)).size);
    }
    const sectionNames = { home: 'Home', bio: 'Biography', journey: 'Journey', courses: 'Courses', research: 'Research', awards: 'Awards', conferences: 'Conferences', writing: 'Writing' };
    const secs = count(ev.filter((e) => e.type === 'section_view'), (e) => sectionNames[e.label] || e.label);
    const clicks = count(ev.filter((e) => e.type === 'click' && e.label !== 'Booking submitted'), (e) => e.label).slice(0, 6);
    const dev = count(ev.filter((e) => e.type === 'pageview'), (e) => e.device);
    const refs = count(ev.filter((e) => e.type === 'pageview'), (e) => e.referrer).slice(0, 6);
    const byStatus = { pending: 0, approved: 0, declined: 0, cancelled: 0 }; bk.forEach((b) => (byStatus[b.status] = (byStatus[b.status] || 0) + 1));
    const byType = count(bk, (b) => b.session_label);
    const byTopic = count(bk, (b) => b.topic);
    const byDow = count(bk, (b) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(b.date + 'T12:00:00').getDay()]);
    const upcoming = bk.filter((b) => b.status === 'approved' && b.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
    const postViews = count(ev.filter((e) => e.type === 'post_view'), (e) => (posts.find((p) => p.slug === e.label) || {}).title || e.label);
    const demoEv = ev.some((e) => e.demo);
    const kpi = (ic, v, l, sub, c) => '<div class="kpi ' + (c || '') + '"><span class="kpi-ico">' + icon(ic, 20) + '</span><strong>' + v + '</strong><span>' + l + '</span><small>' + (sub || '') + '</small></div>';
    body.innerHTML =
      (demoEv ? '<div class="adm-banner soft">Visitor figures below include <strong>sample data</strong> so you can preview the dashboard. Real analytics begin as soon as visitors arrive after you connect Supabase.</div>' : '') +
      '<div class="kpi-grid">' +
      kpi('eye', pv.length.toLocaleString(), 'Page views', 'last ' + days + ' days', 'k-blue') +
      kpi('users', visitors.toLocaleString(), 'Unique visitors', sessions.toLocaleString() + ' sessions', 'k-black') +
      kpi('calendar', recent.length, 'Session requests', conv + '% of visitors', 'k-green') +
      kpi('inbox', byStatus.pending, 'Awaiting your decision', byStatus.approved + ' approved · ' + byStatus.declined + ' declined', 'k-yellow') + '</div>' +
      '<div class="grid2"><div class="panel-a wide2"><h3>Visits, last ' + days + ' days</h3><div class="legend"><span><i style="background:#2563eb"></i>Page views</span><span><i style="background:#16a34a"></i>Unique visitors</span></div><div id="lineChart" class="chart"></div></div>' +
      '<div class="panel-a"><h3>Booking requests</h3>' + bars([['Pending', byStatus.pending], ['Approved', byStatus.approved], ['Declined', byStatus.declined], ['Cancelled', byStatus.cancelled]], '#f5b50a', bk.length) + '<p class="sub">Visitors who opened the booking page: <strong>' + bookVisits + '</strong></p></div></div>' +
      '<div class="grid3"><div class="panel-a"><h3>Most viewed sections</h3>' + bars(secs, '#2563eb') + '</div>' +
      '<div class="panel-a"><h3>Where visitors come from</h3>' + bars(refs, '#16a34a') + '</div>' +
      '<div class="panel-a"><h3>Devices</h3>' + bars(dev, '#0a0a0a', pv.length) + '</div></div>' +
      '<div class="grid3"><div class="panel-a"><h3>Most requested sessions</h3>' + bars(byType, '#2563eb') + '</div>' +
      '<div class="panel-a"><h3>What people want to discuss</h3>' + bars(byTopic, '#16a34a') + '</div>' +
      '<div class="panel-a"><h3>Busiest request days</h3>' + bars(byDow, '#f5b50a') + '</div></div>' +
      '<div class="grid2"><div class="panel-a"><h3>Upcoming approved sessions</h3>' + (upcoming.length ? '<ul class="plain-list">' + upcoming.map((b) => '<li><strong>' + UI.fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + UI.fmtTime(b.time) + '</strong><span>' + esc(b.name) + ' — ' + esc(b.session_label) + '</span></li>').join('') + '</ul>' : '<p class="hint">Nothing scheduled yet.</p>') + '</div>' +
      '<div class="panel-a"><h3>Link clicks &amp; article reads</h3>' + bars(clicks, '#0a0a0a') + (postViews.length ? '<h4 class="mt">Articles</h4>' + bars(postViews.slice(0, 5), '#2563eb') : '') + '</div></div>';
    line($('#lineChart', body), labels, [pvS, vS], ['#2563eb', '#16a34a']);
    draw_badge();
  }
  function draw_badge() { const t = $('.adm-tab[data-tab="bookings"]', root); if (t && pendingCount() && !$('em', t)) t.insertAdjacentHTML('beforeend', '<em>' + pendingCount() + '</em>'); }

  /* ------------------------------------------------ bookings */
  let bkFilter = 'pending';
  async function bookings(body) {
    const list = await API.allBookings(); cache.bookings = list;
    const counts = { all: list.length }; ['pending', 'approved', 'declined', 'cancelled'].forEach((s) => (counts[s] = list.filter((b) => b.status === s).length));
    const shown = list.filter((b) => bkFilter === 'all' || b.status === bkFilter);
    body.innerHTML = '<div class="chips-row mb">' + ['pending', 'approved', 'declined', 'cancelled', 'all'].map((s) => '<button class="fchip light ' + (bkFilter === s ? 'on' : '') + '" data-f="' + s + '">' + s[0].toUpperCase() + s.slice(1) + ' <small>' + counts[s] + '</small></button>').join('') + '</div>' +
      (shown.length ? '<div class="bk-list">' + shown.map((b) =>
        '<article class="bk"><div class="bk-top"><div><strong>' + esc(b.session_label) + '</strong><span>' + UI.fmtDate(b.date) + ' · ' + UI.fmtTime(b.time) + ' WAT · ' + b.duration + ' min · ' + esc((b.mode || '').replace('_', '-')) + '</span></div><span class="status ' + esc(b.status) + '">' + esc(b.status) + '</span></div>' +
        '<div class="bk-who"><div class="avatar lg">' + esc(UI.initials(b.name)) + '</div><div><strong>' + esc(b.name) + '</strong><span>' + esc(b.email) + (b.phone ? ' · ' + esc(b.phone) : '') + '</span>' + (b.organisation ? '<span>' + esc(b.organisation) + '</span>' : '') + '</div></div>' +
        '<p class="bk-topic">' + esc(b.topic) + ' · ' + b.attendees + ' attendee' + (b.attendees > 1 ? 's' : '') + '</p><p class="bk-msg">' + esc(b.message) + '</p>' +
        (b.meeting_detail ? '<p class="req-note ok">' + icon('link', 15) + '<span>' + esc(b.meeting_detail) + '</span></p>' : '') + (b.admin_note ? '<p class="req-note">' + icon('pen', 15) + '<span>' + esc(b.admin_note) + '</span></p>' : '') +
        '<div class="bk-act">' + (b.status === 'pending' ? '<button class="btn btn-green btn-sm" data-ap="' + esc(b.id) + '">' + icon('check', 15) + 'Approve</button><button class="btn btn-ghost btn-sm" data-dc="' + esc(b.id) + '">Decline</button>' :
          b.status === 'approved' ? '<button class="btn btn-ghost btn-sm" data-dc="' + esc(b.id) + '">Change to declined</button>' : b.status === 'declined' ? '<button class="btn btn-ghost btn-sm" data-ap="' + esc(b.id) + '">Approve instead</button>' : '') +
        '<span class="bk-time">Requested ' + UI.timeAgo(b.created_at) + '</span></div></article>').join('') + '</div>' : '<div class="empty-state sm"><p>No ' + (bkFilter === 'all' ? '' : bkFilter + ' ') + 'requests.</p></div>');
    $$('[data-f]', body).forEach((b) => (b.onclick = () => { bkFilter = b.dataset.f; renderTab(); }));
    $$('[data-ap]', body).forEach((b) => (b.onclick = () => decide(list.find((x) => x.id === b.dataset.ap), 'approved')));
    $$('[data-dc]', body).forEach((b) => (b.onclick = () => decide(list.find((x) => x.id === b.dataset.dc), 'declined')));
  }
  function decide(b, status) {
    const ap = status === 'approved';
    const m = UI.modal('<h3 class="m-title">' + (ap ? 'Approve' : 'Decline') + ' this request</h3><p class="m-text">' + esc(b.name) + ' · ' + esc(b.session_label) + ' · ' + UI.fmtDate(b.date) + ' at ' + UI.fmtTime(b.time) + '</p>' +
      '<form class="form" id="decForm">' + (ap ? fld('Meeting link, venue or call details (shown to the visitor)', '<input name="detail" value="' + esc(b.meeting_detail || (b.mode === 'in_person' ? 'Office of the Vice-Chancellor, Rivers State University, Nkpolu-Oroworukwo' : '')) + '" placeholder="e.g. https://meet.google.com/... or office location">') : '') +
      fld(ap ? 'Note to the visitor (optional)' : 'Reason / suggestion shown to the visitor (optional)', '<textarea name="note" rows="3" placeholder="' + (ap ? 'Anything they should prepare or bring' : 'e.g. Please request a slot next week or contact the Registrar') + '">' + esc(b.admin_note || '') + '</textarea>') +
      '<div class="m-actions"><button type="button" class="btn btn-ghost" data-x>Cancel</button><button class="btn ' + (ap ? 'btn-green' : 'btn-dark') + '" type="submit">' + (ap ? 'Approve request' : 'Decline request') + '</button></div></form>');
    $('[data-x]', m.el).onclick = () => m.close();
    $('#decForm', m.el).onsubmit = async (e) => {
      e.preventDefault();
      try { await API.updateBooking(b.id, { status, admin_note: e.target.note.value.trim(), meeting_detail: ap ? e.target.detail.value.trim() : '' }); m.close(); UI.toast(ap ? 'Request approved.' : 'Request declined.', 'ok'); renderTab(); } catch (x) { UI.toast(x.message, 'err'); }
    };
  }

  /* ------------------------------------------------ generic collection editor */
  function collection(body, key) {
    const sc = SCHEMAS[key]; const items = site.items[key] || [];
    body.innerHTML = '<div class="adm-bar"><p>' + items.length + ' item' + (items.length === 1 ? '' : 's') + '. Order here is the order shown on the website.</p><button class="btn btn-dark btn-sm" id="addItem">' + icon('plus', 15) + 'Add new</button></div>' +
      '<ul class="items">' + items.map((it, i) => '<li class="item"><div class="it-main"><strong>' + esc(sc.title(it)) + '</strong><span>' + esc(sc.sub(it)) + '</span></div><div class="it-act">' +
        '<button class="icon-btn" data-up="' + i + '" ' + (i === 0 ? 'disabled' : '') + ' aria-label="Move up">' + icon('arrow-up', 16) + '</button><button class="icon-btn" data-dn="' + i + '" ' + (i === items.length - 1 ? 'disabled' : '') + ' aria-label="Move down">' + icon('arrow-down', 16) + '</button>' +
        '<button class="icon-btn" data-ed="' + i + '" aria-label="Edit">' + icon('edit', 16) + '</button><button class="icon-btn danger" data-del="' + i + '" aria-label="Delete">' + icon('trash', 16) + '</button></div></li>').join('') + '</ul>';
    $('#addItem', body).onclick = () => editItem(key, null);
    $$('[data-ed]', body).forEach((b) => (b.onclick = () => editItem(key, items[+b.dataset.ed])));
    $$('[data-del]', body).forEach((b) => (b.onclick = async () => { if (!guard()) return; const it = items[+b.dataset.del]; if (await UI.confirm('Delete "' + sc.title(it) + '"? This cannot be undone.', 'Delete')) { await API.deleteItem(it.id); await reload(); UI.toast('Deleted.'); renderTab(); } }));
    const move = async (i, dir) => {
      if (!guard()) return;
      const a = items[i], b = items[i + dir];
      const sa = typeof a.sort === 'number' ? a.sort : i, sb = typeof b.sort === 'number' ? b.sort : i + dir;
      await API.setItemSort(a.id, sb === sa ? sa + dir : sb); await API.setItemSort(b.id, sa === sb ? sb - dir : sa);
      await reload(); renderTab();
    };
    $$('[data-up]', body).forEach((b) => (b.onclick = () => move(+b.dataset.up, -1)));
    $$('[data-dn]', body).forEach((b) => (b.onclick = () => move(+b.dataset.dn, 1)));
  }
  async function reload() { site = await API.loadSite(); refresh(); }

  function editItem(key, item) {
    if (!guard()) return;
    const sc = SCHEMAS[key]; const d = item || {};
    const m = UI.modal('<h3 class="m-title">' + (item ? 'Edit' : 'Add') + ' · ' + esc(sc.label) + '</h3><form class="form two" id="itemForm">' + sc.fields.map((f) => {
      const v = d[f.k] != null ? d[f.k] : (f.t === 'check' ? (f.k === 'enabled') : '');
      if (f.t === 'textarea') return fld(f.label, '<textarea name="' + f.k + '" rows="4">' + esc(v) + '</textarea>', 'full');
      if (f.t === 'select') return fld(f.label, '<select name="' + f.k + '">' + f.o.map((o) => '<option ' + (v === o ? 'selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>');
      if (f.t === 'image') return imageField(f.k, v, f.label);
      if (f.t === 'check') return '<label class="chk full"><input type="checkbox" name="' + f.k + '" ' + (v ? 'checked' : '') + '><span>' + f.label + '</span></label>';
      return fld(f.label, '<input name="' + f.k + '" value="' + esc(v) + '">', f.k === 'title' || f.k === 'url' ? 'full' : '');
    }).join('') + '<div class="m-actions full"><button type="button" class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-dark" type="submit">Save</button></div></form>', { wide: true });
    const form = $('#itemForm', m.el); bindImages(form);
    $('[data-x]', m.el).onclick = () => m.close();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const out = item ? { id: item.id, sort: item.sort } : {};
      sc.fields.forEach((f) => { out[f.k] = f.t === 'check' ? form[f.k].checked : (form[f.k].value || '').trim(); });
      if (!out[sc.fields.find((f) => f.k === 'title' || f.k === 'label').k]) return UI.toast('A title is required.', 'err');
      try { await API.saveItem(key, out); await reload(); m.close(); UI.toast('Saved.', 'ok'); renderTab(); } catch (x) { UI.toast(x.message, 'err'); }
    };
  }

  /* ------------------------------------------------ site & contact */
  function siteForm(body) {
    const s = site.settings; const h = s.hero, b = s.bio, c = s.contact, f = s.footer, av = s.availability;
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    body.innerHTML =
      '<form class="sform" id="fHero"><h3>' + icon('user', 18) + 'Hero & photo</h3><div class="form two">' + imageField('headshot_url', h.headshot_url, 'Headshot (appears in the hero circle; use a square or portrait photo, face centred)') +
      fld('First line of name', '<input name="name_first" value="' + esc(h.name_first) + '">') + fld('Second line of name', '<input name="name_last" value="' + esc(h.name_last) + '">') +
      fld('Small label above name', '<input name="eyebrow" value="' + esc(h.eyebrow) + '">') + fld('Title', '<input name="title" value="' + esc(h.title) + '">') + fld('Tagline', '<input name="tagline" value="' + esc(h.tagline) + '">', 'full') +
      '</div><div class="sf-act"><button class="btn btn-dark btn-sm">Save hero</button></div></form>' +

      '<form class="sform" id="fBio"><h3>' + icon('file-text', 18) + 'Biography</h3><div class="form">' + fld('Headline', '<input name="lead" value="' + esc(b.lead) + '">') +
      fld('Biography paragraphs (separate paragraphs with a blank line)', '<textarea name="paragraphs" rows="14">' + esc((b.paragraphs || []).join('\n\n')) + '</textarea>') +
      fld('Highlight stats (one per line: value | label)', '<textarea name="highlights" rows="4">' + esc((b.highlights || []).map((x) => x.value + ' | ' + x.label).join('\n')) + '</textarea>') +
      fld('Qualification chips (comma separated)', '<input name="credentials" value="' + esc((b.credentials || []).join(', ')) + '">') + fld('Memberships line', '<textarea name="memberships" rows="2">' + esc(b.memberships || '') + '</textarea>') +
      fld('Pull quote', '<textarea name="quote" rows="2">' + esc(b.quote || '') + '</textarea>') + fld('Quote source', '<input name="quote_source" value="' + esc(b.quote_source || '') + '">') + '</div><div class="sf-act"><button class="btn btn-dark btn-sm">Save biography</button></div></form>' +

      '<form class="sform" id="fContact"><h3>' + icon('mail', 18) + 'Contact, socials & footer</h3><div class="form two">' + fld('Public email', '<input name="email" value="' + esc(c.email) + '">') + fld('Phone (optional)', '<input name="phone" value="' + esc(c.phone || '') + '">') +
      fld('Office address', '<input name="office" value="' + esc(c.office) + '">', 'full') + fld('Website', '<input name="website" value="' + esc(c.website) + '">', 'full') +
      fld('Social links (one per line: icon | label | url). Icons: linkedin, facebook, twitter, instagram, youtube, globe, file-text, book-open, graduation, link', '<textarea name="socials" rows="7">' + esc((s.socials || []).map((x) => x.key + ' | ' + x.label + ' | ' + x.url).join('\n')) + '</textarea>', 'full') +
      fld('Footer about text', '<textarea name="about" rows="3">' + esc(f.about) + '</textarea>', 'full') + fld('Copyright name', '<input name="copyright" value="' + esc(f.copyright) + '">') + fld('Footer note', '<input name="note" value="' + esc(f.note) + '">') +
      '</div><div class="sf-act"><button class="btn btn-dark btn-sm">Save contact & footer</button></div></form>' +

      '<form class="sform" id="fAv"><h3>' + icon('calendar', 18) + 'Booking availability</h3><div class="form two"><div class="fld full"><span>Days he accepts sessions</span><div class="chips-row">' + wd.map((n, i) => '<label class="chk pill-chk"><input type="checkbox" name="d' + i + '" ' + (av.days.includes(i) ? 'checked' : '') + '><span>' + n + '</span></label>').join('') + '</div></div>' +
      fld('Start time', '<input type="time" name="start" value="' + esc(av.start) + '">') + fld('End time', '<input type="time" name="end" value="' + esc(av.end) + '">') +
      fld('Break starts', '<input type="time" name="break_start" value="' + esc(av.break_start || '') + '">') + fld('Break ends', '<input type="time" name="break_end" value="' + esc(av.break_end || '') + '">') +
      fld('Slot interval (minutes)', '<input type="number" name="step_minutes" min="5" step="5" value="' + (av.step_minutes || 30) + '">') + fld('Minimum notice (days)', '<input type="number" name="lead_days" min="0" value="' + (av.lead_days || 0) + '">') +
      fld('How far ahead people can book (days)', '<input type="number" name="horizon_days" min="7" value="' + (av.horizon_days || 60) + '">') + fld('Blocked dates (YYYY-MM-DD, comma separated)', '<input name="blocked" value="' + esc((av.blocked_dates || []).join(', ')) + '">') +
      fld('Notice shown on the booking page', '<textarea name="notice" rows="2">' + esc(av.notice || '') + '</textarea>', 'full') + '</div><div class="sf-act"><button class="btn btn-dark btn-sm">Save availability</button></div></form>' +
      (API.mode === 'demo' ? '<div class="sform"><h3>Demo data</h3><p class="hint">Everything in demo mode lives in this browser only.</p><button class="btn btn-ghost btn-sm" id="resetDemo">Reset demo data</button></div>' : '');

    ['fHero', 'fBio', 'fContact', 'fAv'].forEach((id) => bindImages($('#' + id, body)));
    const save = (id, fn) => ($('#' + id, body).onsubmit = async (e) => { e.preventDefault(); if (!guard()) return; try { await fn(e.target); await reload(); UI.toast('Saved.', 'ok'); } catch (x) { UI.toast(x.message, 'err'); } });
    const lines = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean);
    const pair = (l) => { const i = l.indexOf('|'); return i < 0 ? { value: l, label: '' } : { value: l.slice(0, i).trim(), label: l.slice(i + 1).trim() }; };
    save('fHero', (f) => API.saveSetting('hero', Object.assign({}, h, { headshot_url: f.headshot_url.value, name_first: f.name_first.value.trim(), name_last: f.name_last.value.trim(), eyebrow: f.eyebrow.value.trim(), title: f.title.value.trim(), tagline: f.tagline.value.trim(), badges: [] })));
    save('fBio', (f) => API.saveSetting('bio', Object.assign({}, b, { lead: f.lead.value.trim(), paragraphs: f.paragraphs.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean), highlights: lines(f.highlights.value).map(pair), credentials: f.credentials.value.split(',').map((x) => x.trim()).filter(Boolean), memberships: f.memberships.value.trim(), quote: f.quote.value.trim(), quote_source: f.quote_source.value.trim() })));
    save('fContact', async (f) => {
      await API.saveSetting('contact', { email: f.email.value.trim(), phone: f.phone.value.trim(), office: f.office.value.trim(), website: f.website.value.trim() });
      await API.saveSetting('socials', lines(f.socials.value).map((l) => { const p = l.split('|').map((x) => x.trim()); return { key: p[0], label: p[1] || p[0], url: p[2] || '' }; }));
      await API.saveSetting('footer', { about: f.about.value.trim(), copyright: f.copyright.value.trim(), note: f.note.value.trim() });
    });
    save('fAv', (f) => API.saveSetting('availability', Object.assign({}, av, { days: [0, 1, 2, 3, 4, 5, 6].filter((i) => f['d' + i].checked), start: f.start.value, end: f.end.value, break_start: f.break_start.value, break_end: f.break_end.value, step_minutes: +f.step_minutes.value || 30, lead_days: +f.lead_days.value || 0, horizon_days: +f.horizon_days.value || 60, blocked_dates: f.blocked.value.split(',').map((x) => x.trim()).filter(Boolean), notice: f.notice.value.trim() })));
    const rd = $('#resetDemo', body); if (rd) rd.onclick = async () => { if (await UI.confirm('Erase all demo content, bookings and posts?', 'Reset')) API.resetDemo(); };
  }

  /* ------------------------------------------------ blog */
  const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'post-' + Date.now();
  async function blog(body) {
    const posts = await API.listPosts({ all: true });
    body.innerHTML = '<div class="adm-bar"><p>Write articles that appear in the Writing section of the website.</p><button class="btn btn-dark btn-sm" id="newPost">' + icon('plus', 15) + 'New article</button></div>' +
      (posts.length ? '<ul class="items">' + posts.map((p, i) => '<li class="item"><div class="it-main"><strong>' + esc(p.title) + '</strong><span><b class="status ' + (p.published ? 'approved' : 'pending') + '">' + (p.published ? 'Published' : 'Draft') + '</b> ' + UI.fmtDate(p.created_at, { day: 'numeric', month: 'short', year: 'numeric' }) + '</span></div><div class="it-act"><button class="icon-btn" data-ed="' + i + '" aria-label="Edit">' + icon('edit', 16) + '</button><button class="icon-btn danger" data-del="' + i + '" aria-label="Delete">' + icon('trash', 16) + '</button></div></li>').join('') + '</ul>' : '<div class="empty-state sm"><p>No articles yet. Write the first one.</p></div>');
    $('#newPost', body).onclick = () => editPost(null);
    $$('[data-ed]', body).forEach((b) => (b.onclick = () => editPost(posts[+b.dataset.ed])));
    $$('[data-del]', body).forEach((b) => (b.onclick = async () => { if (await UI.confirm('Delete this article permanently?', 'Delete')) { await API.deletePost(posts[+b.dataset.del].id); refresh(); UI.toast('Deleted.'); renderTab(); } }));
  }
  function editPost(p) {
    p = p || { title: '', slug: '', excerpt: '', cover_url: '', content: '', published: false };
    const m = UI.modal('<h3 class="m-title">' + (p.id ? 'Edit article' : 'New article') + '</h3><form class="form" id="postForm">' +
      fld('Title', '<input name="title" value="' + esc(p.title) + '" required>') + fld('Short summary (shown on the card)', '<textarea name="excerpt" rows="2">' + esc(p.excerpt) + '</textarea>') + imageField('cover_url', p.cover_url, 'Cover image (optional)') +
      '<div class="fld"><span>Article</span><div class="rte-bar">' +
      [['bold', 'B'], ['italic', 'I'], ['formatBlock:h2', 'H2'], ['formatBlock:h3', 'H3'], ['insertUnorderedList', '• List'], ['insertOrderedList', '1. List'], ['formatBlock:blockquote', '❝'], ['createLink', 'Link'], ['removeFormat', 'Clear']].map((c) => '<button type="button" data-cmd="' + c[0] + '">' + c[1] + '</button>').join('') +
      '</div><div class="rte" contenteditable="true" id="rte">' + UI.sanitize(p.content) + '</div></div>' +
      '<label class="chk"><input type="checkbox" name="published" ' + (p.published ? 'checked' : '') + '><span>Published (visible on the website)</span></label>' +
      '<div class="m-actions"><button type="button" class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-dark" type="submit">Save article</button></div></form>', { wide: true });
    const form = $('#postForm', m.el); bindImages(form);
    $$('[data-cmd]', m.el).forEach((b) => (b.onmousedown = (e) => {
      e.preventDefault(); const [c, v] = b.dataset.cmd.split(':');
      if (c === 'createLink') { const u = prompt('Link address (https://...)'); if (u) document.execCommand('createLink', false, u); }
      else document.execCommand(c, false, v ? '<' + v + '>' : null);
    }));
    $('[data-x]', m.el).onclick = () => m.close();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const content = UI.sanitize($('#rte', m.el).innerHTML);
      if (!form.title.value.trim()) return UI.toast('Please add a title.', 'err');
      const row = { title: form.title.value.trim(), excerpt: form.excerpt.value.trim(), cover_url: form.cover_url.value, content, published: form.published.checked, slug: p.slug || slugify(form.title.value) };
      if (p.id) row.id = p.id;
      try { await API.savePost(row); m.close(); refresh(); UI.toast(row.published ? 'Article saved and published.' : 'Draft saved.', 'ok'); renderTab(); } catch (x) { UI.toast(x.message, 'err'); }
    };
  }

  /* keyboard shortcut to open the sign-in door */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); if (UI.user) { if (UI.user.role === 'admin') A.open(); } else UI.openAuth(); }
    if (e.key === 'Escape' && root && root.classList.contains('open') && !$('.modal-wrap')) A.close();
  });
})();
