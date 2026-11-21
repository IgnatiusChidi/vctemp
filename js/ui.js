/* Shared UI: helpers, navigation chrome, sign-in modal, footer, analytics tracking. */
(function () {
  const UI = {};
  window.UI = UI;

  UI.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  UI.$ = (sel, root) => (root || document).querySelector(sel);
  UI.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  UI.safeUrl = (u) => (/^(https?:|mailto:|tel:|data:image\/)/i.test(u || '') ? u : '');
  UI.initials = (name) => (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'U';

  UI.fmtDate = (iso, opts) => {
    if (!iso) return '';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date(iso);
    return d.toLocaleDateString('en-GB', opts || { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  UI.fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + ' ' + ap;
  };
  UI.timeAgo = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    return Math.floor(s / 86400) + ' d ago';
  };
  UI.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ---- rich text sanitiser for blog posts ---- */
  UI.sanitize = (html) => {
    const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H2', 'H3', 'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE', 'IMG', 'HR']);
    const doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    (function walk(node) {
      Array.from(node.children).forEach((el) => {
        if (!allowed.has(el.tagName)) {
          if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'].includes(el.tagName)) { el.remove(); return; }
          walk(el);
          while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
          el.remove();
          return;
        }
        Array.from(el.attributes).forEach((a) => {
          const n = a.name.toLowerCase();
          const ok = (el.tagName === 'A' && (n === 'href' || n === 'target' || n === 'rel')) || (el.tagName === 'IMG' && (n === 'src' || n === 'alt'));
          if (!ok) el.removeAttribute(a.name);
        });
        if (el.tagName === 'A') {
          const href = el.getAttribute('href') || '';
          if (!/^(https?:|mailto:|#)/i.test(href)) el.removeAttribute('href');
          el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer');
        }
        if (el.tagName === 'IMG' && !/^(https?:|data:image\/)/i.test(el.getAttribute('src') || '')) el.remove();
        else walk(el);
      });
    })(doc.body.firstChild);
    return doc.body.firstChild.innerHTML;
  };

  /* ---- toast ---- */
  UI.toast = (msg, kind) => {
    let host = UI.$('#toasts');
    if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = msg;
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 3800);
  };

  /* ---- modal ---- */
  UI.modal = (html, opts) => {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true"><button class="modal-x" aria-label="Close">' + icon('x', 18) + '</button><div class="modal-body">' + html + '</div></div>';
    document.body.appendChild(wrap);
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => wrap.classList.add('in'));
    const close = () => {
      wrap.classList.remove('in');
      setTimeout(() => { wrap.remove(); if (!UI.$('.modal-wrap') && !UI.$('#admin.open')) document.body.classList.remove('no-scroll'); }, 200);
      if (opts.onClose) opts.onClose();
    };
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    UI.$('.modal-x', wrap).addEventListener('click', close);
    const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
    return { el: wrap, close, body: UI.$('.modal-body', wrap) };
  };

  UI.confirm = (message, okLabel) => new Promise((resolve) => {
    const m = UI.modal('<h3 class="m-title">Are you sure?</h3><p class="m-text">' + UI.esc(message) + '</p><div class="m-actions"><button class="btn btn-ghost" data-no>Cancel</button><button class="btn btn-dark" data-yes>' + UI.esc(okLabel || 'Confirm') + '</button></div>', { onClose: () => resolve(false) });
    UI.$('[data-no]', m.el).onclick = () => m.close();
    UI.$('[data-yes]', m.el).onclick = () => { resolve(true); m.el.querySelector('.modal-x').click(); };
  });

  /* ---- auth ---- */
  UI.user = null;
  UI.refreshUser = async () => { try { UI.user = await API.getUser(); } catch (e) { UI.user = null; } UI.renderAccount(); return UI.user; };

  UI.openAuth = (opts) => new Promise((resolve) => {
    opts = opts || {};
    let mode = opts.mode || 'in';
    let done = false;
    const demo = API.mode === 'demo';
    const m = UI.modal('<div class="auth"></div>', { onClose: () => { if (!done) resolve(null); } });
    const root = UI.$('.auth', m.el);

    function draw() {
      root.innerHTML =
        '<div class="auth-head"><span class="auth-ico">' + icon('lock', 22) + '</span><h3 class="m-title">' + (mode === 'in' ? 'Welcome back' : 'Create your account') + '</h3>' +
        '<p class="m-text">' + (opts.reason ? UI.esc(opts.reason) : (mode === 'in' ? 'Sign in to request sessions and follow their status.' : 'An account lets you request sessions and track their approval.')) + '</p></div>' +
        '<div class="seg auth-seg"><button class="' + (mode === 'in' ? 'on' : '') + '" data-m="in">Sign in</button><button class="' + (mode === 'up' ? 'on' : '') + '" data-m="up">Create account</button></div>' +
        '<form class="form" novalidate>' +
        (mode === 'up' ? '<label class="fld"><span>Full name</span><input name="name" autocomplete="name" required placeholder="Your full name"></label>' : '') +
        '<label class="fld"><span>Email</span><input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label>' +
        '<label class="fld"><span>Password</span><input name="password" type="password" autocomplete="' + (mode === 'in' ? 'current-password' : 'new-password') + '" required minlength="6" placeholder="At least 6 characters"></label>' +
        '<p class="form-err" hidden></p>' +
        '<button class="btn btn-dark btn-block" type="submit">' + (mode === 'in' ? 'Sign in' : 'Create account') + '</button>' +
        (mode === 'in' ? '<button type="button" class="link-btn" data-forgot>Forgot password?</button>' : '') +
        '</form>' +
        (demo ? '<p class="demo-hint"><strong>Demo mode.</strong> Admin sign-in: <code>admin@demo.com</code> / <code>admin123</code></p>' : '');
      UI.$$('[data-m]', root).forEach((b) => (b.onclick = () => { mode = b.dataset.m; draw(); }));
      const f = UI.$('form', root);
      const err = UI.$('.form-err', root);
      const forgot = UI.$('[data-forgot]', root);
      if (forgot) forgot.onclick = async () => {
        const em = f.email.value.trim();
        if (!em) { err.textContent = 'Enter your email first, then press "Forgot password".'; err.hidden = false; return; }
        try { await API.resetPassword(em); UI.toast('Password reset link sent to ' + em, 'ok'); } catch (e) { err.textContent = e.message; err.hidden = false; }
      };
      f.onsubmit = async (ev) => {
        ev.preventDefault(); err.hidden = true;
        const btn = UI.$('button[type=submit]', f); btn.disabled = true;
        try {
          const email = f.email.value.trim(); const pw = f.password.value;
          if (!email || pw.length < 6) throw new Error('Enter a valid email and a password of at least 6 characters.');
          let u;
          if (mode === 'in') u = await API.signIn(email, pw);
          else { if (!f.name.value.trim()) throw new Error('Please enter your name.'); u = await API.signUp(email, pw, f.name.value.trim()); }
          done = true; await UI.refreshUser(); m.close(); resolve(u);
          UI.toast(u && u.role === 'admin' ? 'Signed in as administrator.' : 'Signed in.', 'ok');
        } catch (e) { err.textContent = e.message; err.hidden = false; btn.disabled = false; }
      };
    }
    draw();
  });

  UI.signOut = async () => { await API.signOut(); await UI.refreshUser(); UI.toast('Signed out.'); if (window.Admin) Admin.close(); if (window.onSignedOut) window.onSignedOut(); };

  /* ---- navigation chrome ---- */
  const NAV = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'bio', icon: 'user', label: 'Biography' },
    { id: 'journey', icon: 'clock', label: 'Journey' },
    { id: 'courses', icon: 'book-open', label: 'Courses' },
    { id: 'research', icon: 'file-text', label: 'Research' },
    { id: 'awards', icon: 'award', label: 'Recognition' },
    { id: 'conferences', icon: 'mic', label: 'Conferences' },
    { id: 'writing', icon: 'pen', label: 'Writing' }
  ];
  UI.NAV = NAV;

  UI.initChrome = (page) => {
    const host = UI.$('#chrome');
    const onHome = page === 'home';
    host.innerHTML =
      '<header class="topbar"><nav class="pill" aria-label="Sections">' +
      NAV.map((n) => '<a class="pill-item" data-nav="' + n.id + '" href="' + (onHome ? '#' : 'index.html#') + n.id + '" aria-label="' + n.label + '">' + icon(n.icon, 19) + '<span class="tip">' + n.label + '</span></a>').join('') +
      '<span class="pill-sep admin-only" hidden></span>' +
      '<button class="pill-item admin-only" id="adminBtn" hidden aria-label="Admin dashboard">' + icon('shield', 19) + '<span class="tip">Admin dashboard</span></button>' +
      '</nav>' +
      '<div class="topbar-right"><button class="theme-btn" id="themeBtn" aria-label="Toggle dark mode"></button><button class="acct" id="acctBtn" aria-label="Account"></button>' +
      '<a class="btn btn-dark btn-sm book-top" href="' + (page === 'book' ? '#top' : 'book.html') + '" data-track="Book Session (nav)">' + icon('calendar', 16) + '<span>Book Session</span></a></div></header>' +
      '<div class="acct-menu" id="acctMenu" hidden></div>';
    const setTheme = (t, save) => {
      document.documentElement.setAttribute('data-theme', t);
      if (save) { try { localStorage.setItem('zo_theme', t); } catch (e) {} }
      UI.$('#themeBtn').innerHTML = icon(t === 'dark' ? 'sun' : 'moon', 18);
    };
    setTheme(document.documentElement.getAttribute('data-theme') || 'light', false);
    UI.$('#themeBtn').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    UI.$('#adminBtn').onclick = () => window.Admin && Admin.open();
    UI.$('#acctBtn').onclick = (e) => {
      e.stopPropagation();
      if (!UI.user) { UI.openAuth(); return; }
      const mn = UI.$('#acctMenu'); mn.hidden = !mn.hidden;
    };
    document.addEventListener('click', (e) => { const mn = UI.$('#acctMenu'); if (mn && !mn.contains(e.target)) mn.hidden = true; });
    UI.renderAccount();

    if (onHome) {
      const links = UI.$$('[data-nav]');
      const setActive = (id) => links.forEach((l) => l.classList.toggle('on', l.dataset.nav === id));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      NAV.forEach((n) => { const el = document.getElementById(n.id); if (el) io.observe(el); });
      links.forEach((l) => l.addEventListener('click', (e) => {
        const t = document.getElementById(l.dataset.nav);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', '#' + l.dataset.nav); }
      }));
    } else {
      UI.$$('[data-nav]').forEach((l) => l.classList.remove('on'));
    }
  };

  UI.renderAccount = () => {
    const b = UI.$('#acctBtn'); if (!b) return;
    const u = UI.user;
    b.innerHTML = u ? '<span class="avatar">' + UI.esc(UI.initials(u.full_name || u.email)) + '</span>' : icon('log-in', 18) + '<span class="acct-label">Sign in</span>';
    b.classList.toggle('in', !!u);
    UI.$$('.admin-only').forEach((el) => (el.hidden = !(u && u.role === 'admin')));
    const mn = UI.$('#acctMenu');
    if (mn) {
      mn.innerHTML = u ? '<div class="am-head"><strong>' + UI.esc(u.full_name || 'Signed in') + '</strong><span>' + UI.esc(u.email) + '</span></div>' +
        '<a href="book.html#requests">' + icon('inbox', 16) + 'My session requests</a>' +
        (u.role === 'admin' ? '<button id="amAdmin">' + icon('shield', 16) + 'Admin dashboard</button>' : '') +
        '<button id="amOut">' + icon('log-out', 16) + 'Sign out</button>' : '';
      const o = UI.$('#amOut'); if (o) o.onclick = () => { mn.hidden = true; UI.signOut(); };
      const a = UI.$('#amAdmin'); if (a) a.onclick = () => { mn.hidden = true; window.Admin && Admin.open(); };
    }
  };

  /* ---- footer ---- */
  UI.renderFooter = (site) => {
    const s = site.settings; const c = s.contact || {}; const f = s.footer || {};
    const socials = (s.socials || []).filter((x) => UI.safeUrl(x.url));
    const host = UI.$('#footer'); if (!host) return;
    const base = location.pathname.endsWith('book.html') ? 'index.html' : '';
    host.innerHTML =
      '<div class="foot-in"><div class="foot-top">' +
      '<div class="foot-brand"><h3>' + UI.esc((s.hero && (s.hero.name_first + ' ' + s.hero.name_last)) || '') + '</h3><p>' + UI.esc(f.about || '') + '</p>' +
      '<div class="socials">' +
      (c.email ? '<a class="soc" href="mailto:' + UI.esc(c.email) + '" aria-label="Email" data-track="Email">' + icon('mail', 18) + '</a>' : '') +
      socials.map((x) => '<a class="soc" href="' + UI.esc(x.url) + '" target="_blank" rel="noopener" aria-label="' + UI.esc(x.label) + '" title="' + UI.esc(x.label) + '" data-track="' + UI.esc(x.label) + '">' + icon(x.key || 'link', 18) + '</a>').join('') +
      '</div></div>' +
      '<div class="foot-col"><h4>Explore</h4>' + NAV.map((n) => '<a href="' + base + '#' + n.id + '">' + n.label + '</a>').join('') + '</div>' +
      '<div class="foot-col"><h4>Work with him</h4><a href="book.html">Book a session</a><a href="book.html#requests">My session requests</a>' + (c.email ? '<a href="mailto:' + UI.esc(c.email) + '">Email the office</a>' : '') + (c.website ? '<a href="' + UI.esc(c.website) + '" target="_blank" rel="noopener">Rivers State University</a>' : '') + '</div>' +
      '<div class="foot-col"><h4>Contact</h4>' +
      (c.office ? '<p class="fc-line">' + icon('map-pin', 16) + '<span>' + UI.esc(c.office) + '</span></p>' : '') +
      (c.email ? '<p class="fc-line">' + icon('mail', 16) + '<a href="mailto:' + UI.esc(c.email) + '">' + UI.esc(c.email) + '</a></p>' : '') +
      (c.phone ? '<p class="fc-line">' + icon('phone', 16) + '<a href="tel:' + UI.esc(c.phone.replace(/\s/g, '')) + '">' + UI.esc(c.phone) + '</a></p>' : '') +
      '</div></div>' +
      '<div class="foot-bottom"><span>© ' + new Date().getFullYear() + ' ' + UI.esc(f.copyright || '') + '. All rights reserved.</span><span class="foot-note">' + UI.esc(f.note || '') + '</span>' +
      '<button class="foot-lock" id="footSignIn" aria-label="Sign in">' + icon('lock', 14) + '<span>Sign in</span></button></div></div>';
    const fb = UI.$('#footSignIn'); if (fb) fb.onclick = () => (UI.user ? UI.$('#acctBtn').click() : UI.openAuth());
  };

  /* ---- analytics ---- */
  const seen = new Set();
  UI.track = (type, label, meta) => {
    const key = type + '|' + label;
    if (type === 'section_view' || type === 'post_view') { if (seen.has(key)) return; seen.add(key); }
    if (UI.user && UI.user.role === 'admin') return; // don't count the owner's own visits
    API.track({ type, path: location.pathname.replace(/.*\//, '') || 'index.html', label, meta: meta || null });
  };
  UI.trackSections = () => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) UI.track('section_view', e.target.id); }), { threshold: 0.35 });
    NAV.forEach((n) => { const el = document.getElementById(n.id); if (el) io.observe(el); });
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track]');
    if (t) UI.track('click', t.dataset.track);
  });

  /* ---- generated cover art (used where no photo has been uploaded) ---- */
  function rng(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const PALS = [['#0a0a0a', '#2563eb', '#f5b50a'], ['#0a0a0a', '#16a34a', '#f5f5f0'], ['#111111', '#f5b50a', '#2563eb'], ['#0a0a0a', '#2563eb', '#16a34a'], ['#101418', '#16a34a', '#f5b50a']];
  UI.cover = (seed, label, sub) => {
    const r = rng(String(seed));
    const p = PALS[Math.floor(r() * PALS.length)];
    let shapes = '';
    for (let i = 0; i < 5; i++) {
      const cx = Math.round(r() * 400), cy = Math.round(r() * 300), rad = 40 + Math.round(r() * 120);
      shapes += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="' + p[1 + (i % 2)] + '" opacity="' + (0.12 + r() * 0.3).toFixed(2) + '"/>';
    }
    for (let i = 0; i < 6; i++) {
      const y = 30 + i * 46 + Math.round(r() * 10);
      shapes += '<rect x="' + (-20) + '" y="' + y + '" width="' + (140 + Math.round(r() * 280)) + '" height="2" fill="#fff" opacity="0.08"/>';
    }
    const l = UI.esc(String(label || '').toUpperCase().slice(0, 18));
    return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + UI.esc(label || 'cover') + '"><rect width="400" height="300" fill="' + p[0] + '"/>' + shapes +
      '<rect x="28" y="28" width="34" height="5" rx="2" fill="' + p[2] + '"/>' +
      '<text x="28" y="248" fill="#fff" font-family="Fraunces, Georgia, serif" font-size="30" font-weight="600">' + l + '</text>' +
      (sub ? '<text x="28" y="274" fill="' + p[2] + '" font-family="Inter, system-ui, sans-serif" font-size="14" letter-spacing="2">' + UI.esc(String(sub)) + '</text>' : '') + '</svg>';
  };
})();
