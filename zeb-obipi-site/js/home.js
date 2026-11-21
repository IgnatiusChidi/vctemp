/* Public home page renderer */
(function () {
  const { esc, $, $$, safeUrl } = UI;
  let SITE = null;
  let POSTS = [];
  const state = { tl: { study: true, work: true, current: true }, level: 'All', pubType: 'All', pubGrid: false };

  async function boot() {
    UI.initChrome('home');
    await UI.refreshUser();
    API.onAuthChange(() => UI.refreshUser());
    SITE = await API.loadSite();
    try { POSTS = await API.listPosts(); } catch (e) { POSTS = []; }
    renderAll();
    UI.renderFooter(SITE);
    UI.track('pageview', 'home');
    UI.trackSections();
    window.reloadSite = async () => { SITE = await API.loadSite(); try { POSTS = await API.listPosts(); } catch (e) {} renderAll(); UI.renderFooter(SITE); };
    window.onSignedOut = () => {};
    openPostFromHash();
    window.addEventListener('hashchange', openPostFromHash);
    if (location.hash && document.getElementById(location.hash.slice(1))) setTimeout(() => document.getElementById(location.hash.slice(1)).scrollIntoView(), 120);
  }

  function renderAll() {
    renderHero(); renderBio(); renderTimeline(); renderCourses(); renderResearch(); renderAwards(); renderConferences(); renderWriting();
    hydrateIcons(document);
  }

  /* ------------------------------------------------ hero */
  function renderHero() {
    const h = SITE.settings.hero || {};
    const img = safeUrl(h.headshot_url);
    $('#heroMount').innerHTML =
      '<div class="hero-copy">' +
      '<span class="eyebrow">' + esc(h.eyebrow) + '</span>' +
      '<h1><span class="h-first">' + esc(h.name_first) + '</span><span class="h-last">' + esc(h.name_last) + '</span></h1>' +
      '<p class="h-title">' + esc(h.title) + '</p>' +
      '<p class="h-sub">' + esc(h.tagline) + '</p>' +
      '<div class="hero-cta"><a class="btn btn-dark btn-lg" href="book.html" data-track="Book Session (hero)">' + icon('calendar', 18) + 'Book Session</a></div>' +
      '</div>' +
      '<div class="hero-portrait">' +
            '<div class="circle"><div class="ph">' + icon('user', 120) + '</div><img src="' + esc(img || 'images/hero.jpg') + '" alt="' + esc(h.name_first + ' ' + h.name_last) + '" onerror="this.remove()"></div>' +
      '</div>';
  }

  /* ------------------------------------------------ bio */
  function renderBio() {
    const b = SITE.settings.bio || {};
    $('#bioMount').innerHTML =
      '<header class="sec-head"><span class="eyebrow">Biography</span><h2>' + esc(b.lead) + '</h2></header>' +
      '<div class="bio-grid"><div class="bio-text">' +
      (b.paragraphs || []).map((p, i) => '<p class="' + (i === 0 ? 'drop' : '') + '">' + esc(p) + '</p>').join('') +
      '</div><aside class="bio-side">' +
      '<div class="stat-grid">' + (b.highlights || []).map((s) => '<div class="stat"><strong>' + esc(s.value) + '</strong><span>' + esc(s.label) + '</span></div>').join('') + '</div>' +
      '<div class="cred"><h4>Qualifications &amp; fellowships</h4><div class="chips">' + (b.credentials || []).map((c) => '<span class="chip">' + esc(c) + '</span>').join('') + '</div>' +
      (b.memberships ? '<p class="small">' + esc(b.memberships) + '</p>' : '') + '</div>' +
      (b.quote ? '<blockquote class="quote"><p>“' + esc(b.quote) + '”</p><cite>' + esc(b.quote_source) + '</cite></blockquote>' : '') +
      '</aside></div>';
  }

  /* ------------------------------------------------ timeline */
  const KINDS = { study: { label: 'Study', color: 'blue' }, work: { label: 'Work', color: 'green' }, current: { label: 'Current point', color: 'yellow' } };
  function renderTimeline() {
    $('#tlLegend').innerHTML = Object.keys(KINDS).map((k) => '<button class="lg ' + KINDS[k].color + (state.tl[k] ? ' on' : '') + '" data-k="' + k + '" aria-pressed="' + state.tl[k] + '"><i></i>' + KINDS[k].label + '</button>').join('');
    $$('#tlLegend .lg').forEach((b) => (b.onclick = () => { state.tl[b.dataset.k] = !state.tl[b.dataset.k]; renderTimeline(); }));
    const items = SITE.items.timeline.filter((t) => state.tl[t.kind]);
    $('#tlMount').innerHTML = items.length ? items.map((t) => {
      const k = KINDS[t.kind] || KINDS.work;
      const range = t.end ? (t.start + ' – ' + t.end) : t.start;
      return '<li class="tl-item ' + k.color + '"><div class="tl-date"><strong>' + esc(range) + '</strong><span>' + k.label + '</span></div><div class="tl-node"><i></i></div>' +
        '<div class="tl-card"><h3>' + esc(t.title) + '</h3><p class="tl-org">' + esc(t.org) + '</p>' + (t.detail ? '<p class="tl-detail">' + esc(t.detail) + '</p>' : '') + '</div></li>';
    }).join('') : '<li class="empty">Turn a filter back on to see the timeline.</li>';
  }

  /* ------------------------------------------------ courses */
  function renderCourses() {
    const all = SITE.items.courses;
    const levels = ['All'].concat(Array.from(new Set(all.map((c) => c.level))));
    const shown = all.filter((c) => state.level === 'All' || c.level === state.level);
    const groups = {};
    shown.forEach((c) => { (groups[c.level] = groups[c.level] || []).push(c); });
    $('#coursesMount').innerHTML =
      '<div class="panel"><div class="panel-head"><h3>' + icon('book-open', 20) + 'Courses taught</h3><p>Teaching areas in the Department of Management, Rivers State University.</p>' +
      '<div class="seg" role="tablist">' + levels.map((l) => '<button class="' + (state.level === l ? 'on' : '') + '" data-l="' + esc(l) + '" role="tab">' + esc(l) + '</button>').join('') + '</div></div>' +
      (Object.keys(groups).map((g) => '<div class="c-group"><h4><span>' + esc(g) + '</span><em>' + groups[g].length + '</em></h4>' +
        groups[g].map((c) => '<details class="course"><summary><span class="c-ico ' + (g === 'Postgraduate' ? 'blue' : g === 'Undergraduate' ? 'green' : 'yellow') + '">' + icon(g === 'Postgraduate' ? 'graduation' : 'book-open', 18) + '</span>' +
          '<span class="c-main"><strong>' + esc(c.title) + '</strong><small>' + esc([c.code, c.area].filter(Boolean).join(' · ')) + '</small></span><span class="c-chev">' + icon('chevron-right', 16) + '</span></summary>' +
          '<p>' + esc(c.description) + '</p></details>').join('') + '</div>').join('') || '<p class="empty">No courses to show yet.</p>') +
      '</div>';
    $$('#coursesMount [data-l]').forEach((b) => (b.onclick = () => { state.level = b.dataset.l; renderCourses(); hydrateIcons(); }));
  }

  /* ------------------------------------------------ research */
  function renderResearch() {
    const pubs = SITE.items.publications;
    const types = ['All'].concat(Array.from(new Set(pubs.map((p) => p.type))));
    const list = pubs.filter((p) => state.pubType === 'All' || p.type === state.pubType);
    const links = (SITE.settings.socials || []).filter((s) => /scholar|researchgate|academia/i.test(s.label) && safeUrl(s.url));
    $('#researchMount').innerHTML =
      '<header class="sec-head light"><span class="eyebrow">Publications &amp; works</span><h2>Research on people, productivity and organizations</h2>' +
      '<p>' + pubs.length + ' selected works across journals, books and his inaugural lecture. Research interests: organizational behaviour, human resource management, industrial relations and business research.</p></header>' +
      '<div class="pub-bar"><div class="chips-row">' + types.map((t) => '<button class="fchip ' + (state.pubType === t ? 'on' : '') + '" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
      '<div class="pub-tools">' + links.map((l) => '<a class="ghost-link" href="' + esc(l.url) + '" target="_blank" rel="noopener" data-track="' + esc(l.label) + '">' + esc(l.label) + icon('external-link', 14) + '</a>').join('') +
      '<button class="ghost-link" id="pubGrid">' + (state.pubGrid ? 'Carousel view' : 'Grid view') + '</button></div></div>' +
      '<div class="car-wrap"><button class="car-btn l" id="carL" aria-label="Previous" ' + (state.pubGrid ? 'hidden' : '') + '>' + icon('chevron-left', 22) + '</button>' +
      '<div class="car ' + (state.pubGrid ? 'grid' : '') + '" id="car">' + list.map(pubCard).join('') + '</div>' +
      '<button class="car-btn r" id="carR" aria-label="Next" ' + (state.pubGrid ? 'hidden' : '') + '>' + icon('chevron-right', 22) + '</button></div>';
    $$('#researchMount [data-t]').forEach((b) => (b.onclick = () => { state.pubType = b.dataset.t; renderResearch(); hydrateIcons(); }));
    $('#pubGrid').onclick = () => { state.pubGrid = !state.pubGrid; renderResearch(); hydrateIcons(); };
    const car = $('#car');
    const step = () => Math.max(280, Math.round(car.clientWidth * 0.8));
    if ($('#carL')) { $('#carL').onclick = () => car.scrollBy({ left: -step(), behavior: 'smooth' }); $('#carR').onclick = () => car.scrollBy({ left: step(), behavior: 'smooth' }); }
  }
  function pubCard(p) {
    const img = safeUrl(p.image_url);
    const url = safeUrl(p.url);
    const art = img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : UI.cover(p.title, p.topic === 'book' ? 'Book' : p.type === 'Lecture' ? 'Inaugural lecture' : (p.topic || 'Journal'), p.year);
    return '<article class="pub ' + (p.featured ? 'feat' : '') + '"><div class="pub-img">' + art + (p.featured ? '<span class="badge-y">Featured</span>' : '') + '</div>' +
      '<div class="pub-body"><div class="pub-meta"><span class="tag">' + esc(p.type) + '</span><span>' + esc(p.year) + '</span></div>' +
      '<h3>' + esc(p.title) + '</h3><p class="pub-auth">' + esc(p.authors) + '</p><p class="pub-venue">' + esc(p.venue) + '</p>' +
      (url ? '<a class="pub-link" href="' + esc(url) + '" target="_blank" rel="noopener" data-track="Publication link">View source' + icon('arrow-right', 14) + '</a>' : '') + '</div></article>';
  }

  /* ------------------------------------------------ awards */
  function renderAwards() {
    const a = SITE.items.awards;
    $('#awardsMount').innerHTML =
      '<header class="sec-head"><span class="eyebrow">Recognition &amp; awards</span><h2>Honours earned in service</h2><p>From national ICT recognition to honours from his students, his community and the wider South-South region.</p></header>' +
      '<div class="aw-grid">' + a.map((x, i) => {
        const img = safeUrl(x.image_url); const url = safeUrl(x.url);
        const art = UI.cover('aw' + x.title, '', '') + '<img class="aw-photo" src="' + esc(img || 'images/awards/award-' + (i + 1) + '.jpg') + '" alt="' + esc(x.title) + '" loading="lazy" onerror="this.remove()">';
        return '<article class="aw"><div class="aw-img">' + art + '<span class="aw-year">' + esc(x.year) + '</span></div>' +
          '<div class="aw-body"><h3>' + esc(x.title) + '</h3><p class="aw-org">' + esc(x.org) + '</p><p>' + esc(x.description) + '</p>' +
          (url ? '<a class="pub-link dark" href="' + esc(url) + '" target="_blank" rel="noopener" data-track="Award link">Read more' + icon('arrow-right', 14) + '</a>' : '') + '</div></article>';
      }).join('') + '</div>';
  }

  /* ------------------------------------------------ conferences */
  function renderConferences() {
    const c = SITE.items.conferences;
    $('#confMount').innerHTML =
      '<header class="sec-head"><span class="eyebrow">Conferences &amp; engagements</span><h2>On stage and at the head table</h2><p>Keynotes, addresses and events hosted at Rivers State University.</p></header>' +
      '<div class="cf-list">' + c.map((x) => {
        const img = safeUrl(x.image_url); const url = safeUrl(x.url);
        const art = img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : UI.cover('cf' + x.title, '', '');
        return '<article class="cf"><div class="cf-img">' + art + '<span class="cf-date">' + esc(x.date) + '</span></div>' +
          '<div class="cf-body"><span class="tag y">' + esc(x.role) + '</span><h3>' + esc(x.title) + '</h3>' +
          '<p class="cf-event">' + esc(x.event) + (x.location ? ' · ' + icon('map-pin', 13) + esc(x.location) : '') + '</p><p>' + esc(x.description) + '</p>' +
          (url ? '<a class="pub-link dark" href="' + esc(url) + '" target="_blank" rel="noopener" data-track="Conference link">Coverage' + icon('arrow-right', 14) + '</a>' : '') + '</div></article>';
      }).join('') + '</div>';
  }

  /* ------------------------------------------------ writing */
  function readTime(html) { const w = (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length; return Math.max(1, Math.round(w / 220)); }
  function renderWriting() {
    $('#writingMount').innerHTML =
      '<header class="sec-head"><span class="eyebrow">Writing</span><h2>Notes on leadership, work and learning</h2><p>Articles written by the Vice-Chancellor, published from time to time.</p></header>' +
      (POSTS.length ? '<div class="post-grid">' + POSTS.map((p) => {
        const img = safeUrl(p.cover_url);
        return '<a class="post" href="#post=' + esc(p.slug) + '"><div class="post-img">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : UI.cover('post' + p.title, 'Article', UI.fmtDate(p.created_at, { month: 'short', year: 'numeric' }))) + '</div>' +
          '<div class="post-body"><span class="post-meta">' + UI.fmtDate(p.created_at, { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + readTime(p.content) + ' min read</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.excerpt || '') + '</p></div></a>';
      }).join('') + '</div>' : '<div class="empty-state">' + icon('pen', 28) + '<h3>The first article is on its way</h3><p>Articles will appear here as soon as they are published from the dashboard.</p></div>');
  }
  function openPostFromHash() {
    const m = location.hash.match(/^#post=(.+)$/);
    if (!m) return;
    const slug = decodeURIComponent(m[1]);
    const p = POSTS.find((x) => x.slug === slug);
    if (!p) return;
    UI.track('post_view', p.slug);
    const modal = UI.modal('<article class="article"><span class="post-meta">' + UI.fmtDate(p.created_at, { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + readTime(p.content) + ' min read</span><h2>' + esc(p.title) + '</h2>' +
      (safeUrl(p.cover_url) ? '<img class="article-cover" src="' + esc(p.cover_url) + '" alt="">' : '') +
      '<div class="prose">' + UI.sanitize(p.content) + '</div><p class="by">By Prof. Isaac Zeb-Obipi</p></article>', { wide: true, onClose: () => history.replaceState(null, '', location.pathname + '#writing') });
  }

  boot();
})();
