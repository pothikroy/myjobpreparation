/* Shared persistence, user isolation, cloud hydration, and lossless backups. */
(function () {
  'use strict';
  const catalog = window.STUDY_CATALOG || [];
  const hubSpec = { type:'keys', keys:['studyHub_v1'] };
  const hub = { id:'_hub', storage:hubSpec };
  const all = [...catalog.filter(m => m.storage), hub];
  const native = { get:Storage.prototype.getItem, set:Storage.prototype.setItem, remove:Storage.prototype.removeItem, key:Storage.prototype.key };
  const managed = key => all.some(m => matches(m.storage, key)) || key === 'buApp_v1';
  let uid = null, prefix = '', db = null, activePage = null, timer = null, hydrated = false, busy = false;
  let cloudState = 'Waiting for sign-in', lastError = '', lastSync = null;
  const listeners = new Set();
  const rawGet = k => native.get.call(localStorage, k);
  const rawSet = (k,v) => native.set.call(localStorage, k, v);
  const parse = (s, fallback = {}) => { try { return s ? JSON.parse(s) : fallback; } catch (_) { return fallback; } };
  function matches(spec, key) { return spec && (spec.type === 'keys' ? spec.keys.includes(key) : spec.type === 'prefix' && key.startsWith(spec.prefix)); }
  function notify() { listeners.forEach(fn => fn()); window.dispatchEvent(new CustomEvent('study-progress')); }
  function state(label, error = '') { cloudState = label; lastError = error; notify(); }
  function metadata() { return parse(rawGet(prefix + '__meta')); }
  function mark(id, savedAt = Date.now(), dirty = true) {
    const meta = metadata(); meta[id] = { savedAt, dirty }; rawSet(prefix + '__meta', JSON.stringify(meta));
  }
  function keys(spec) {
    if (spec.type === 'keys') return spec.keys;
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = native.key.call(localStorage, i);
      if (k.startsWith(prefix) && matches(spec, k.slice(prefix.length))) list.push(k.slice(prefix.length));
    }
    return list;
  }
  function local(spec) {
    const out = {};
    keys(spec).forEach(k => { const v = rawGet(prefix + k); if (v !== null) out[k] = v; });
    return out;
  }
  function touched(key) {
    const mod = all.find(m => matches(m.storage, key));
    if (mod) mark(mod.id);
    notify();
  }
  Storage.prototype.getItem = function (key) {
    key = String(key); return native.get.call(this, this === localStorage && uid && managed(key) ? prefix + key : key);
  };
  Storage.prototype.setItem = function (key, value) {
    key = String(key);
    if (this === localStorage && uid && managed(key)) {
      if (rawGet(prefix + key) === String(value)) return;
      native.set.call(this, prefix + key, value); touched(key);
    } else native.set.call(this, key, value);
  };
  Storage.prototype.removeItem = function (key) {
    key = String(key);
    if (this === localStorage && uid && managed(key)) { native.remove.call(this, prefix + key); touched(key); }
    else native.remove.call(this, key);
  };
  function openExam(name) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => {
        for (const [store,keyPath] of Object.entries({ attempts:'id', bookmarks:'key', examProgress:'year', qhistory:'key', settings:'key' })) {
          if (!req.result.objectStoreNames.contains(store)) req.result.createObjectStore(store, { keyPath });
        }
      };
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Close other study tabs to finish opening exam records.'));
    });
  }
  function readExam(name = examDbName()) {
    return openExam(name).then(handle => new Promise((resolve, reject) => {
      const out = {}; const tx = handle.transaction(['attempts','bookmarks','examProgress','qhistory','settings'], 'readonly');
      for (const name of Array.from(tx.objectStoreNames)) {
        const request = tx.objectStore(name).getAll(); request.onsuccess = () => { out[name] = request.result; };
      }
      tx.oncomplete = () => { handle.close(); resolve(out); };
      tx.onerror = () => { handle.close(); reject(tx.error); };
    }));
  }
  function writeExam(data, name = examDbName()) {
    return openExam(name).then(handle => new Promise((resolve, reject) => {
      const tx = handle.transaction(['attempts','bookmarks','examProgress','qhistory','settings'], 'readwrite');
      try {
        for (const name of Array.from(tx.objectStoreNames)) {
          const store = tx.objectStore(name); store.clear();
          for (const record of data[name] || []) store.put(record);
        }
      } catch (e) { tx.abort(); handle.close(); reject(e); return; }
      tx.oncomplete = () => { handle.close(); resolve(); };
      tx.onerror = tx.onabort = () => { handle.close(); reject(tx.error || new Error('Exam restore failed.')); };
    }));
  }
  function examDbName() { return 'bcs_prep_db__' + uid; }
  async function bindUser(id) {
    uid = id; prefix = 'study:' + uid + ':';
    const owner = rawGet('studyHub_legacyOwner');
    if (!owner || owner === id) {
      if (!owner) rawSet('studyHub_legacyOwner', id);
      if (!rawGet(prefix + '__legacyMigrated')) {
        // Retain the old unscoped records as a migration backup.
        const legacy = [];
        for (let i = 0; i < localStorage.length; i++) { const k = native.key.call(localStorage,i); if (managed(k)) legacy.push(k); }
        for (const k of legacy) if (rawGet(prefix + k) === null) rawSet(prefix + k, rawGet(k));
        if (typeof indexedDB.databases === 'function') {
          const databases = await indexedDB.databases();
          if (databases.some(d => d.name === 'bcs_prep_db')) await writeExam(await readExam('bcs_prep_db'));
        }
        rawSet(prefix + '__legacyMigrated', '1');
      }
    }
    notify();
  }
  async function gather(mod) { return mod.storage.type === 'indexeddb' ? readExam() : local(mod.storage); }
  async function apply(mod, data) {
    if (mod.storage.type === 'indexeddb') { await writeExam(data); return; }
    keys(mod.storage).forEach(k => native.remove.call(localStorage, prefix + k));
    for (const [key,value] of Object.entries(data || {})) if (matches(mod.storage, key) && typeof value === 'string') rawSet(prefix + key, value);
  }
  const stamp = doc => doc.updatedAt && typeof doc.updatedAt.toMillis === 'function' ? doc.updatedAt.toMillis() : 0;
  const deadline = promise => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Connection timed out. Your progress is saved on this device.')), 8000);
    promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
  });
  function collection() { return db.collection('users').doc(uid).collection('progress'); }
  let syncModules = [];
  async function hydrate() {
    const snapshots = activePage.id === 'index'
      ? await deadline(collection().get())
      : await deadline(Promise.all(syncModules.map(m => collection().doc(m.id).get())));
    const docs = activePage.id === 'index' ? snapshots.docs : snapshots;
    const found = new Set();
    for (const snap of docs) {
      if (!snap.exists) continue;
      const mod = all.find(m => m.id === snap.id); if (!mod || !syncModules.some(m => m.id === mod.id)) continue;
      found.add(mod.id);
      // An open module owns its in-memory state until it closes.
      if (hydrated && Number(rawGet(prefix + '__live:' + mod.id)) > Date.now()) continue;
      const cloud = snap.data(), meta = metadata()[mod.id] || {};
      if (cloud.data && (!meta.dirty || stamp(cloud) > (meta.savedAt || 0))) {
        await apply(mod, cloud.data); mark(mod.id, stamp(cloud), false);
      }
    }
    for (const mod of syncModules) {
      if (found.has(mod.id) || metadata()[mod.id]) continue;
      const data = await gather(mod);
      const hasData = mod.storage.type === 'indexeddb' ? Object.values(data).some(rows => rows.length) : Object.keys(data).length > 0;
      if (hasData) mark(mod.id);
    }
    hydrated = true; notify();
  }
  async function flush() {
    if (!uid || !db || busy) return;
    busy = true;
    try {
      if (!hydrated) await hydrate();
      const dirty = metadata();
      for (const mod of syncModules) {
        if (!dirty[mod.id] || !dirty[mod.id].dirty) continue;
        const before = dirty[mod.id].savedAt;
        const data = await gather(mod);
        await deadline(collection().doc(mod.id).set({ data, updatedAt:firebase.firestore.FieldValue.serverTimestamp() }));
        // Edits made during the request must stay dirty for the next pass.
        if ((metadata()[mod.id] || {}).savedAt === before) mark(mod.id, before, false);
      }
      lastSync = Date.now(); state('Cloud synced');
    } catch (e) { state('Saved on this device · sync pending', e.message); }
    finally { busy = false; }
  }
  async function connect(database, id, page) {
    if (uid === id && activePage) return;
    db = database; activePage = page;
    await bindUser(id);
    syncModules = page.id === 'index' ? all : [all.find(m => m.id === page.id), hub].filter(Boolean);
    state('Loading your progress…');
    try { await hydrate(); state('Cloud synced'); lastSync = Date.now(); }
    catch (e) { state('Saved on this device · sync pending', e.message); }
    timer = setInterval(flush, 25000);
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    startActivity(page);
  }
  function hubData() { return parse(localStorage.getItem('studyHub_v1'), { days:{}, recent:{}, goal:30, examDate:'' }); }
  function saveHub(data) { localStorage.setItem('studyHub_v1', JSON.stringify(data)); }
  function startActivity(page) {
    if (page.id === 'index') return;
    const liveKey = prefix + '__live:' + page.id;
    const live = () => rawSet(liveKey, String(Date.now() + 120000));
    live();
    window.addEventListener('pagehide', () => native.remove.call(localStorage, liveKey));
    const data = hubData(); data.recent ||= {}; data.recent[page.id] = Date.now(); saveHub(data);
    let last = Date.now(), interacted = Date.now();
    ['pointerdown','keydown','scroll'].forEach(type => window.addEventListener(type, () => { interacted = Date.now(); }, { passive:true }));
    setInterval(() => {
      live();
      const now = Date.now(), seconds = Math.min(20, (now-last)/1000); last = now;
      if (document.hidden || !document.hasFocus() || now-interacted > 120000) return;
      const data = hubData(), day = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Dhaka'}).format(new Date());
      data.days ||= {}; data.days[day] ||= {}; data.days[day][page.id] = (data.days[day][page.id] || 0) + seconds;
      data.recent ||= {}; data.recent[page.id] = now; saveHub(data);
    }, 15000);
  }
  async function summaries() {
    if (!uid) return [];
    const result = [];
    for (const mod of catalog) {
      let raw = {}; let error = '';
      if (mod.storage) try { raw = await gather(mod); } catch (e) { error = e.message; }
      try { result.push({ ...StudyProgress.summarize(mod,raw), error }); }
      catch (e) { result.push({ ...StudyProgress.summarize(mod,{}), error:'Could not read these records: ' + e.message }); }
    }
    return result;
  }
  async function exportBackup() {
    const modules = {};
    for (const mod of all) modules[mod.id] = await gather(mod);
    return { format:'myjobpreparation-backup', version:1, exportedAt:new Date().toISOString(), modules };
  }
  function validateBackup(data) {
    if (!data || data.format !== 'myjobpreparation-backup' || data.version !== 1 || !data.modules || typeof data.modules !== 'object') throw new Error('Choose a My Job Preparation backup file.');
    for (const [id,record] of Object.entries(data.modules)) {
      const mod = all.find(m => m.id === id);
      if (!mod || !record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid module in backup: ' + id);
      for (const [key,value] of Object.entries(record)) {
        if (mod.storage.type === 'indexeddb') {
          const keyPaths = { attempts:'id', bookmarks:'key', examProgress:'year', qhistory:'key', settings:'key' };
          if (!mod.storage.stores.includes(key) || !Array.isArray(value) || value.some(v => !v || v[keyPaths[key]] == null)) throw new Error('Invalid exam records in backup.');
        } else {
          if (!matches(mod.storage,key) || typeof value !== 'string') throw new Error('Invalid storage key in backup.');
          JSON.parse(value);
        }
      }
    }
    return data;
  }
  async function importBackup(data) {
    validateBackup(data);
    // Validate everything before the first write and roll back on a storage failure.
    const before = await exportBackup();
    try {
      for (const [id,record] of Object.entries(data.modules)) { const mod = all.find(m => m.id === id); await apply(mod,record); mark(id); }
    } catch (e) {
      for (const [id,record] of Object.entries(before.modules)) await apply(all.find(m => m.id === id), record);
      throw e;
    }
    notify(); await flush();
  }
  window.addEventListener('storage', e => { if (uid && e.key && e.key.startsWith(prefix)) notify(); });
  window.StudyStore = { connect, flush, summaries, hubData, saveHub, exportBackup, validateBackup, importBackup, examDbName,
    syncNow:async () => {
      await flush();
      if (activePage && activePage.id === 'index' && !busy) {
        try { await hydrate(); await flush(); } catch (e) { state('Saved on this device · sync pending', e.message); }
      }
    },
    changed:id => { mark(id); notify(); },
    onChange:fn => { listeners.add(fn); return () => listeners.delete(fn); },
    status:() => ({ label:cloudState, error:lastError, lastSync, uid }),
    // Module scripts run after account selection and cloud hydration, never before.
    activate:async function () {
      const pending = [];
      const patches = [document, window].map(target => {
        const original = target.addEventListener;
        target.addEventListener = function (type, listener, options) {
          if (type === 'DOMContentLoaded') pending.push(() => typeof listener === 'function' ? listener.call(target, new Event(type)) : listener.handleEvent(new Event(type)));
          else original.call(target,type,listener,options);
        };
        return () => { target.addEventListener = original; };
      });
      try {
        for (const source of document.querySelectorAll('script[type="text/x-study-script"]')) {
          const script = document.createElement('script'); script.textContent = source.textContent; source.replaceWith(script);
        }
      } finally { patches.forEach(fn => fn()); }
      pending.forEach(fn => fn());
    }
  };
})();
