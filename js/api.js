/* Data layer. Uses Supabase when configured, otherwise a browser-only demo backend with the same interface. */
(function () {
  const cfg = window.SITE_CONFIG || {};
  const useSB = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  const COLLECTIONS = ['timeline', 'courses', 'publications', 'awards', 'conferences', 'session_types'];

  function visitorId() {
    try {
      let v = localStorage.getItem('zo_vid');
      if (!v) { v = uid(); localStorage.setItem('zo_vid', v); }
      return v;
    } catch (e) { return 'anon'; }
  }
  function sessionId() {
    try {
      let v = sessionStorage.getItem('zo_sid');
      if (!v) { v = uid(); sessionStorage.setItem('zo_sid', v); }
      return v;
    } catch (e) { return 'anon'; }
  }
  function deviceType() {
    const w = window.innerWidth;
    return w < 700 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop';
  }
  function refHost() {
    try {
      if (!document.referrer) return 'Direct';
      const h = new URL(document.referrer).hostname.replace(/^www\./, '');
      return h === location.hostname ? 'Internal' : h;
    } catch (e) { return 'Direct'; }
  }

  function flat(rows) {
    const out = {};
    COLLECTIONS.forEach((c) => (out[c] = []));
    rows.sort((a, b) => (a.sort || 0) - (b.sort || 0)).forEach((r) => {
      if (out[r.collection]) out[r.collection].push(Object.assign({}, r.data, { id: r.id, sort: r.sort }));
    });
    return out;
  }
  function splitItem(item) {
    const data = Object.assign({}, item);
    const id = data.id; const sort = data.sort;
    delete data.id; delete data.sort;
    return { id, sort, data };
  }

  /* ---------------------------------------------------------------- LOCAL (demo) */
  const Local = (function () {
    const KEY = 'zo_demo_db_v1';
    const listeners = [];

    function seedEvents() {
      const ev = [];
      const sections = ['home', 'bio', 'journey', 'courses', 'research', 'awards', 'conferences', 'writing'];
      const weights = [10, 8, 6, 5, 7, 5, 4, 3];
      const refs = ['Direct', 'Direct', 'google.com', 'linkedin.com', 'rsu.edu.ng', 'facebook.com', 'whatsapp.com', 't.co'];
      const devs = ['mobile', 'mobile', 'mobile', 'desktop', 'desktop', 'tablet'];
      const now = Date.now();
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      for (let d = 29; d >= 0; d--) {
        const visits = Math.round(14 + rnd() * 22 + (29 - d) * 0.6);
        for (let i = 0; i < visits; i++) {
          const t = now - d * 86400000 - Math.round(rnd() * 70000000);
          const vid = 'v' + d + '-' + Math.floor(rnd() * 40);
          const sid = 's' + d + '-' + i;
          const device = devs[Math.floor(rnd() * devs.length)];
          const referrer = refs[Math.floor(rnd() * refs.length)];
          const base = { visitor_id: vid, session_id: sid, device, referrer, demo: true };
          ev.push(Object.assign({ type: 'pageview', path: '/', label: 'home', created_at: new Date(t).toISOString() }, base));
          sections.forEach((s, k) => {
            if (rnd() * 12 < weights[k]) ev.push(Object.assign({ type: 'section_view', path: '/', label: s, created_at: new Date(t + 4000 * (k + 1)).toISOString() }, base));
          });
          if (rnd() < 0.18) ev.push(Object.assign({ type: 'pageview', path: '/book', label: 'book', created_at: new Date(t + 60000).toISOString() }, base));
          if (rnd() < 0.2) ev.push(Object.assign({ type: 'click', path: '/', label: ['Google Scholar', 'LinkedIn', 'Publication link', 'Email'][Math.floor(rnd() * 4)], created_at: new Date(t + 90000).toISOString() }, base));
        }
      }
      return ev;
    }

    function seed() {
      const D = window.DEFAULTS;
      const items = [];
      COLLECTIONS.forEach((c) => (D.items[c] || []).forEach((data, i) => items.push({ id: uid(), collection: c, sort: i, data: clone(data) })));
      return {
        settings: clone(D.settings), items, posts: [], bookings: [], events: seedEvents(),
        users: [{ id: 'admin-demo', email: 'admin@demo.com', password: 'admin123', full_name: 'Site Admin', role: 'admin' }],
        session: null
      };
    }
    function load() {
      let db = null;
      try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
      if (!db) { db = seed(); save(db); }
      return db;
    }
    function save(db) {
      try { localStorage.setItem(KEY, JSON.stringify(db)); }
      catch (e) { console.warn('Demo storage is full; the latest change may not persist.', e); }
    }
    function publicUser(u) { return u ? { id: u.id, email: u.email, full_name: u.full_name, role: u.role } : null; }
    function emit() { listeners.forEach((f) => f()); }

    return {
      mode: 'demo',
      async loadSite() {
        const db = load();
        return { settings: clone(db.settings), items: flat(clone(db.items)), fromDefaults: false };
      },
      async saveSetting(key, value) { const db = load(); db.settings[key] = clone(value); save(db); },
      async seedDefaults() {},
      async saveItem(collection, item) {
        const db = load();
        const { id, sort, data } = splitItem(item);
        if (id) {
          const row = db.items.find((r) => r.id === id);
          if (row) { row.data = data; if (typeof sort === 'number') row.sort = sort; }
        } else {
          const max = db.items.filter((r) => r.collection === collection).reduce((m, r) => Math.max(m, r.sort || 0), -1);
          db.items.push({ id: uid(), collection, sort: max + 1, data });
        }
        save(db);
      },
      async setItemSort(id, sort) { const db = load(); const r = db.items.find((x) => x.id === id); if (r) r.sort = sort; save(db); },
      async deleteItem(id) { const db = load(); db.items = db.items.filter((r) => r.id !== id); save(db); },

      async listPosts(opts) {
        const db = load();
        let p = clone(db.posts);
        if (!(opts && opts.all)) p = p.filter((x) => x.published);
        return p.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      },
      async savePost(post) {
        const db = load(); const now = new Date().toISOString();
        if (post.id) { const i = db.posts.findIndex((p) => p.id === post.id); if (i >= 0) db.posts[i] = Object.assign(db.posts[i], post, { updated_at: now }); }
        else db.posts.push(Object.assign({}, post, { id: uid(), created_at: now, updated_at: now }));
        save(db);
      },
      async deletePost(id) { const db = load(); db.posts = db.posts.filter((p) => p.id !== id); save(db); },

      async createBooking(b) {
        const db = load();
        if (!db.session) throw new Error('Please sign in first.');
        const clash = db.bookings.find((x) => x.date === b.date && x.time === b.time && ['pending', 'approved'].includes(x.status));
        if (clash) throw new Error('That time was just taken. Please choose another slot.');
        const row = Object.assign({}, b, { id: uid(), user_id: db.session.id, status: 'pending', admin_note: '', meeting_detail: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        db.bookings.push(row); save(db); return clone(row);
      },
      async myBookings() {
        const db = load(); if (!db.session) return [];
        return clone(db.bookings.filter((b) => b.user_id === db.session.id)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      },
      async allBookings() { return clone(load().bookings).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); },
      async updateBooking(id, patch) {
        const db = load(); const b = db.bookings.find((x) => x.id === id);
        if (b) Object.assign(b, patch, { updated_at: new Date().toISOString() });
        save(db);
      },
      async cancelBooking(id) {
        const db = load(); const b = db.bookings.find((x) => x.id === id && db.session && x.user_id === db.session.id && x.status === 'pending');
        if (b) { b.status = 'cancelled'; b.updated_at = new Date().toISOString(); }
        save(db);
      },
      async bookedSlots(date) {
        return load().bookings.filter((b) => b.date === date && ['pending', 'approved'].includes(b.status)).map((b) => ({ time: b.time, duration: b.duration }));
      },

      async track(e) {
        const db = load();
        db.events.push(Object.assign({ created_at: new Date().toISOString(), visitor_id: visitorId(), session_id: sessionId(), device: deviceType(), referrer: refHost() }, e));
        if (db.events.length > 6000) db.events = db.events.slice(-6000);
        save(db);
      },
      async getEvents(days) {
        const since = Date.now() - (days || 30) * 86400000;
        return clone(load().events).filter((e) => new Date(e.created_at).getTime() >= since);
      },

      async signUp(email, password, name) {
        const db = load();
        email = email.trim().toLowerCase();
        if (db.users.find((u) => u.email === email)) throw new Error('An account with this email already exists. Try signing in.');
        const u = { id: uid(), email, password, full_name: name, role: 'user' };
        db.users.push(u); db.session = publicUser(u); save(db); emit(); return publicUser(u);
      },
      async signIn(email, password) {
        const db = load(); email = email.trim().toLowerCase();
        const u = db.users.find((x) => x.email === email && x.password === password);
        if (!u) throw new Error('Incorrect email or password.');
        db.session = publicUser(u); save(db); emit(); return publicUser(u);
      },
      async signOut() { const db = load(); db.session = null; save(db); emit(); },
      async getUser() { return publicUser(load().session); },
      async resetPassword() { throw new Error('Password reset is available once Supabase is connected.'); },
      onAuthChange(cb) { listeners.push(cb); },

      async uploadImage(file) {
        return new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onerror = () => reject(new Error('Could not read the image.'));
          fr.onload = () => {
            const img = new Image();
            img.onload = () => {
              const max = 1100; const r = Math.min(1, max / Math.max(img.width, img.height));
              const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
              c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
              resolve(c.toDataURL('image/jpeg', 0.82));
            };
            img.onerror = () => reject(new Error('That file is not a valid image.'));
            img.src = fr.result;
          };
          fr.readAsDataURL(file);
        });
      },
      resetDemo() { localStorage.removeItem(KEY); location.reload(); }
    };
  })();

  /* ---------------------------------------------------------------- SUPABASE */
  const Remote = (function () {
    const sb = useSB ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
    const chk = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };

    async function profile() {
      const { data: s } = await sb.auth.getSession();
      const u = s && s.session && s.session.user;
      if (!u) return null;
      const { data } = await sb.from('profiles').select('id,email,full_name,role').eq('id', u.id).maybeSingle();
      return data || { id: u.id, email: u.email, full_name: (u.user_metadata && u.user_metadata.full_name) || '', role: 'user' };
    }

    return {
      mode: 'supabase',
      async loadSite() {
        const [s, i] = await Promise.all([sb.from('site_settings').select('key,value'), sb.from('content_items').select('id,collection,sort,data')]);
        const settings = {}; (chk(s) || []).forEach((r) => (settings[r.key] = r.value));
        const rows = chk(i) || [];
        if (!Object.keys(settings).length && !rows.length) {
          return { settings: clone(window.DEFAULTS.settings), items: flat(window.DEFAULTS.items ? (function () { const out = []; COLLECTIONS.forEach((c) => (window.DEFAULTS.items[c] || []).forEach((d, n) => out.push({ id: 'default-' + c + n, collection: c, sort: n, data: d }))); return out; })() : []), fromDefaults: true };
        }
        const merged = Object.assign(clone(window.DEFAULTS.settings), settings);
        return { settings: merged, items: flat(rows), fromDefaults: false };
      },
      async saveSetting(key, value) { chk(await sb.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() })); },
      async seedDefaults() {
        const D = window.DEFAULTS;
        const settingRows = Object.keys(D.settings).map((k) => ({ key: k, value: D.settings[k] }));
        chk(await sb.from('site_settings').upsert(settingRows));
        const rows = [];
        COLLECTIONS.forEach((c) => (D.items[c] || []).forEach((data, i) => rows.push({ collection: c, sort: i, data })));
        chk(await sb.from('content_items').insert(rows));
      },
      async saveItem(collection, item) {
        const { id, sort, data } = splitItem(item);
        if (id && !String(id).startsWith('default-')) {
          const patch = { data }; if (typeof sort === 'number') patch.sort = sort;
          chk(await sb.from('content_items').update(patch).eq('id', id));
        } else {
          const { data: last } = await sb.from('content_items').select('sort').eq('collection', collection).order('sort', { ascending: false }).limit(1);
          const next = last && last.length ? (last[0].sort || 0) + 1 : 0;
          chk(await sb.from('content_items').insert({ collection, sort: next, data }));
        }
      },
      async setItemSort(id, sort) { chk(await sb.from('content_items').update({ sort }).eq('id', id)); },
      async deleteItem(id) { chk(await sb.from('content_items').delete().eq('id', id)); },

      async listPosts(opts) {
        let q = sb.from('posts').select('*').order('created_at', { ascending: false });
        if (!(opts && opts.all)) q = q.eq('published', true);
        return chk(await q) || [];
      },
      async savePost(post) {
        const row = Object.assign({}, post, { updated_at: new Date().toISOString() });
        if (row.id) chk(await sb.from('posts').update(row).eq('id', row.id));
        else { delete row.id; chk(await sb.from('posts').insert(row)); }
      },
      async deletePost(id) { chk(await sb.from('posts').delete().eq('id', id)); },

      async createBooking(b) {
        const u = await profile();
        if (!u) throw new Error('Please sign in first.');
        const row = Object.assign({}, b, { user_id: u.id, status: 'pending' });
        const r = await sb.from('bookings').insert(row).select().single();
        if (r.error) {
          if (r.error.code === '23505') throw new Error('That time was just taken. Please choose another slot.');
          throw new Error(r.error.message);
        }
        return r.data;
      },
      async myBookings() {
        const u = await profile(); if (!u) return [];
        return chk(await sb.from('bookings').select('*').eq('user_id', u.id).order('created_at', { ascending: false })) || [];
      },
      async allBookings() { return chk(await sb.from('bookings').select('*').order('created_at', { ascending: false })) || []; },
      async updateBooking(id, patch) { chk(await sb.from('bookings').update(Object.assign({}, patch, { updated_at: new Date().toISOString() })).eq('id', id)); },
      async cancelBooking(id) { chk(await sb.from('bookings').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id)); },
      async bookedSlots(date) {
        const r = await sb.rpc('booked_slots', { d: date });
        if (r.error) return [];
        return (r.data || []).map((x) => ({ time: x.slot_time, duration: x.duration }));
      },

      async track(e) {
        try {
          await sb.from('events').insert(Object.assign({ visitor_id: visitorId(), session_id: sessionId(), device: deviceType(), referrer: refHost() }, e));
        } catch (err) { /* analytics must never break the page */ }
      },
      async getEvents(days) {
        const since = new Date(Date.now() - (days || 30) * 86400000).toISOString();
        return chk(await sb.from('events').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(30000)) || [];
      },

      async signUp(email, password, name) {
        const r = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (r.error) throw new Error(r.error.message);
        if (!r.data.session) throw new Error('Account created. Check your email to confirm it, then sign in.');
        return profile();
      },
      async signIn(email, password) {
        const r = await sb.auth.signInWithPassword({ email, password });
        if (r.error) throw new Error(r.error.message);
        return profile();
      },
      async signOut() { await sb.auth.signOut(); },
      async getUser() { return profile(); },
      async resetPassword(email) {
        const r = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
        if (r.error) throw new Error(r.error.message);
      },
      onAuthChange(cb) { sb.auth.onAuthStateChange(() => cb()); },

      async uploadImage(file) {
        const name = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const r = await sb.storage.from('media').upload(name, file, { cacheControl: '31536000', upsert: false });
        if (r.error) throw new Error(r.error.message);
        return sb.storage.from('media').getPublicUrl(name).data.publicUrl;
      },
      resetDemo() {}
    };
  })();

  window.API = useSB ? Remote : Local;
  window.API.COLLECTIONS = COLLECTIONS;
})();
