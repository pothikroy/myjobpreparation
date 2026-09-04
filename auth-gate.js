/* ====================================================================
   auth-gate.js — shared login / approval / progress-sync logic.
   Loaded by every page. Each page sets window.AG_PAGE before this
   script runs (id, title, optional storage spec, optional admin flag).
   ==================================================================== */
(function(){

  var ICON_POWER = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v8"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/></svg>';
  var ICON_USER = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';
  var ICON_SHIELD = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  var ICON_CLOCK = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';

  function buildOverlay(){
    var css = document.createElement('style');
    css.textContent = [
      '#ag-overlay{position:fixed;inset:0;z-index:99999;background:#101820;',
      'display:flex;align-items:center;justify-content:center;font-family:',
      "'Noto Sans Bengali','Nirmala UI','Segoe UI',system-ui,sans-serif;color:#eee;}",
      '#ag-box{background:#182430;border:1px solid #2c3b48;border-radius:14px;',
      'padding:36px 32px;max-width:380px;width:90%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.4);}',
      '#ag-box h2{margin:0 0 8px;font-size:19px;}',
      '#ag-box p{color:#9fb0bd;font-size:14px;line-height:1.6;margin:0 0 20px;}',
      '#ag-box button{cursor:pointer;border:none;border-radius:9px;padding:12px 18px;',
      'font-size:14.5px;font-weight:700;width:100%;font-family:inherit;}',
      '.ag-primary{background:#a9702f;color:#fff;}',
      '.ag-ghost{background:transparent;color:#9fb0bd;border:1px solid #2c3b48 !important;margin-top:10px;}',
      '.ag-spin{width:26px;height:26px;border:3px solid #2c3b48;border-top-color:#a9702f;',
      'border-radius:50%;margin:0 auto 16px;animation:agspin 1s linear infinite;}',
      '@keyframes agspin{to{transform:rotate(360deg);}}',

      /* ---- edge tab + sidebar (replaces the old floating badge) ---- */
      '#ag-tab{position:fixed;top:50%;right:0;transform:translateY(-50%);z-index:99997;',
      'background:#182430;color:#cfe0ea;border:1px solid #2c3b48;border-right:none;',
      'border-radius:10px 0 0 10px;width:34px;height:52px;display:flex;align-items:center;',
      'justify-content:center;cursor:grab;box-shadow:-4px 0 14px rgba(0,0,0,.18);touch-action:none;',
      'user-select:none;}',
      '#ag-tab:active{cursor:grabbing;}',
      '#ag-tab svg{width:18px;height:18px;}',
      '#ag-sidebar{position:fixed;top:0;right:0;bottom:0;width:270px;max-width:82vw;z-index:99998;',
      'background:#182430;color:#cfe0ea;border-left:1px solid #2c3b48;box-shadow:-8px 0 30px rgba(0,0,0,.25);',
      "font-family:'Segoe UI',system-ui,sans-serif;transform:translateX(100%);transition:transform .2s ease;",
      'display:flex;flex-direction:column;}',
      '#ag-sidebar.open{transform:translateX(0);}',
      '#ag-sb-head{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 12px;',
      'border-bottom:1px solid #2c3b48;}',
      '#ag-sb-head b{font-size:13px;}',
      '#ag-sb-close{background:none;border:none;color:#9fb0bd;cursor:pointer;padding:4px;}',
      '#ag-sb-body{padding:16px;overflow-y:auto;flex:1;}',
      '.ag-acct{display:flex;align-items:center;gap:10px;padding:10px;background:#101820;border-radius:10px;margin-bottom:14px;}',
      '.ag-acct svg{flex-shrink:0;color:#a9702f;}',
      '.ag-acct .em{font-size:12px;word-break:break-all;line-height:1.4;}',
      '.ag-acct .role{font-size:10px;color:#a9702f;text-transform:uppercase;letter-spacing:.06em;}',
      '#ag-signout-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;',
      'background:#3a2420;color:#e8a37c;border:1px solid #5a332c;border-radius:9px;padding:10px;',
      'font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}',
      '#ag-admin-section{margin-top:20px;padding-top:16px;border-top:1px solid #2c3b48;}',
      '#ag-admin-section h4{display:flex;align-items:center;gap:6px;font-size:12.5px;margin:0 0 10px;color:#cfe0ea;}',
      '.ag-req-row{display:flex;flex-direction:column;gap:6px;padding:10px 0;border-bottom:1px solid #22303c;font-size:12px;}',
      '.ag-req-row .em{word-break:break-all;font-weight:600;}',
      '.ag-req-row .tm{font-size:10.5px;color:#9fb0bd;display:flex;align-items:center;gap:4px;}',
      '.ag-req-row .st{font-size:10px;text-transform:uppercase;letter-spacing:.05em;}',
      '.ag-req-actions{display:flex;gap:6px;flex-wrap:wrap;}',
      '.ag-req-actions button{flex:1;min-width:56px;border:none;border-radius:6px;padding:6px;font-size:11px;',
      'font-weight:700;color:#fff;cursor:pointer;}'
    ].join('');
    document.head.appendChild(css);
    var ov = document.getElementById('ag-overlay');
    if(!ov){ ov = document.createElement('div'); ov.id='ag-overlay'; document.body.insertBefore(ov, document.body.firstChild); }
    return ov;
  }

  function render(overlay, html){ overlay.innerHTML = '<div id="ag-box">'+html+'</div>'; }

  function showLoading(overlay, msg){
    render(overlay, '<div class="ag-spin"></div><p>'+(msg||'লোড হচ্ছে...')+'</p>');
  }

  function showLogin(overlay, auth, provider){
    render(overlay,
      '<h2>সাইন ইন করুন</h2>'+
      '<p>এগিয়ে যেতে আপনার Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন।</p>'+
      '<button class="ag-primary" id="ag-signin">Sign in with Google</button>');
    document.getElementById('ag-signin').onclick = function(){
      auth.signInWithPopup(provider).catch(function(e){ alert('Sign-in failed: '+e.message); });
    };
  }

  function showPending(overlay, auth){
    render(overlay,
      '<h2>অনুমোদনের অপেক্ষায়</h2>'+
      '<p>আপনার অ্যাক্সেস রিকোয়েস্ট পাঠানো হয়েছে। সাইট মালিকের অনুমোদনের পর আপনি প্রবেশ করতে পারবেন।</p>'+
      '<button class="ag-ghost" id="ag-signout">Sign out</button>');
    document.getElementById('ag-signout').onclick = function(){ auth.signOut(); };
  }

  function showDenied(overlay, auth){
    render(overlay,
      '<h2>অ্যাক্সেস প্রত্যাখ্যাত</h2>'+
      '<p>আপনার অ্যাক্সেস রিকোয়েস্টটি অনুমোদিত হয়নি।</p>'+
      '<button class="ag-ghost" id="ag-signout">Sign out</button>');
    document.getElementById('ag-signout').onclick = function(){ auth.signOut(); };
  }

  // ---------- sidebar: account + admin, tucked behind a small edge tab ----------
  function buildSidebar(user, role, auth, db, page){
    var oldTab = document.getElementById('ag-tab'); if(oldTab) oldTab.remove();
    var oldSb = document.getElementById('ag-sidebar'); if(oldSb) oldSb.remove();

    var tab = document.createElement('div');
    tab.id = 'ag-tab';
    tab.innerHTML = ICON_USER;
    document.body.appendChild(tab);

    var sb = document.createElement('div');
    sb.id = 'ag-sidebar';
    sb.innerHTML =
      '<div id="ag-sb-head"><b>অ্যাকাউন্ট</b><button id="ag-sb-close">'+ICON_CLOSE+'</button></div>'+
      '<div id="ag-sb-body">'+
        '<div class="ag-acct">'+ICON_USER+
          '<div><div class="em">'+(user.email||'')+'</div>'+
          '<div class="role">'+(role==='owner'?'Owner':'Guest')+'</div></div>'+
        '</div>'+
        '<button id="ag-signout-btn">'+ICON_POWER+' Sign out</button>'+
        (page.admin && role==='owner' ? '<div id="ag-admin-section"><h4>'+ICON_SHIELD+' Access Requests</h4><div id="ag-admin-list">Loading...</div></div>' : '')+
      '</div>';
    document.body.appendChild(sb);

    tab.onclick = function(){ if(!tabWasDragged()) sb.classList.add('open'); };
    document.getElementById('ag-sb-close').onclick = function(){ sb.classList.remove('open'); };
    document.getElementById('ag-signout-btn').onclick = function(){ auth.signOut(); location.reload(); };

    var tabWasDragged = makeTabDraggable(tab);

    if(page.admin && role==='owner') renderAdminList(db);
  }

  // ---------- drag the edge tab up/down, remember position per device ----------
  function makeTabDraggable(tab){
    var saved = localStorage.getItem('ag_tab_top');
    if(saved){ tab.style.top = saved; tab.style.transform = 'translateY(-50%)'; }

    var dragging = false, moved = false, startY = 0, startCenter = 0, justDragged = false;

    function pointY(e){ return e.touches ? e.touches[0].clientY : e.clientY; }

    function onDown(e){
      dragging = true; moved = false;
      startY = pointY(e);
      var rect = tab.getBoundingClientRect();
      startCenter = rect.top + rect.height/2;
    }
    function onMove(e){
      if(!dragging) return;
      var y = pointY(e);
      if(Math.abs(y - startY) > 6) moved = true;
      if(!moved) return;
      e.preventDefault();
      var newCenter = startCenter + (y - startY);
      var min = 36, max = window.innerHeight - 36;
      newCenter = Math.max(min, Math.min(max, newCenter));
      tab.style.top = newCenter + 'px';
    }
    function onUp(){
      if(dragging && moved){
        localStorage.setItem('ag_tab_top', tab.style.top);
        justDragged = true;
        setTimeout(function(){ justDragged = false; }, 50);
      }
      dragging = false;
    }

    tab.addEventListener('mousedown', onDown);
    tab.addEventListener('touchstart', onDown, {passive:true});
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    return function(){ return justDragged; };
  }

  function formatDuration(totalSeconds){
    var s = Math.max(0, Math.round(totalSeconds||0));
    var h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
    if(h>0) return h+'h '+m+'m';
    if(m>0) return m+'m';
    return s+'s';
  }

  function renderAdminList(db){
    var list = document.getElementById('ag-admin-list');
    if(!list) return;
    db.collection('accessRequests').onSnapshot(function(qs){
      if(!document.getElementById('ag-admin-list')) return; // sidebar rebuilt/closed
      if(qs.empty){ list.textContent = 'No requests yet.'; return; }
      list.innerHTML = '';
      qs.forEach(function(doc){
        var d = doc.data(), row = document.createElement('div');
        row.className = 'ag-req-row';
        var statusColor = d.status==='approved' ? '#7fbf9e' : d.status==='denied' ? '#e08a8a' : '#e0b27a';
        row.innerHTML = '<div class="em">'+(d.email||doc.id)+'</div>'+
          '<div class="tm">'+ICON_CLOCK+' '+formatDuration(d.totalTimeSpent)+' on site</div>'+
          '<div class="st" style="color:'+statusColor+';">'+d.status+'</div>'+
          '<div class="ag-req-actions"></div>';
        var actions = row.querySelector('.ag-req-actions');
        var mkBtn = function(label, status, bg){
          var b = document.createElement('button');
          b.textContent = label;
          b.style.background = bg;
          b.onclick = function(){ db.collection('accessRequests').doc(doc.id).update({status:status}); };
          return b;
        };
        if(d.status !== 'approved') actions.appendChild(mkBtn('Approve','approved','#3c6e52'));
        if(d.status !== 'denied') actions.appendChild(mkBtn('Deny','denied','#a33'));
        var rm = document.createElement('button');
        rm.textContent = 'Remove';
        rm.style.background = '#4a4a4a';
        rm.onclick = function(){
          if(!confirm('Remove '+(d.email||doc.id)+' from the list? They will need to request access again to come back.')) return;
          db.collection('accessRequests').doc(doc.id).delete();
        };
        actions.appendChild(rm);
        list.appendChild(row);
      });
    }, function(e){ list.textContent = 'Could not load requests: '+(e&&e.message); });
  }


  // ---------- time-on-site tracking (guests only, shown to owner in admin list) ----------
  function setupTimeTracking(db, uid){
    var reqRef = db.collection('accessRequests').doc(uid);
    var pending = 0, lastTick = Date.now(), visible = !document.hidden;

    function tick(){
      var now = Date.now();
      if(visible) pending += (now - lastTick)/1000;
      lastTick = now;
    }

    function flush(){
      tick();
      if(pending < 1) return;
      var secs = Math.round(pending);
      pending -= secs;
      reqRef.set({
        totalTimeSpent: firebase.firestore.FieldValue.increment(secs),
        lastActiveAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge:true}).catch(function(e){
        // Don't lose the time we failed to save — put it back so the next flush retries it.
        pending += secs;
        console.warn('[time-tracking] write failed, will retry:', e && e.message);
      });
    }

    document.addEventListener('visibilitychange', function(){
      tick();
      visible = !document.hidden;
      if(document.hidden) flush();
    });
    setInterval(tick, 3000);
    setInterval(flush, 10000);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
  }

  // ---------- progress sync ----------
  function gatherLocal(spec){
    var out = {};
    if(spec.type === 'keys'){
      spec.keys.forEach(function(k){ var v = localStorage.getItem(k); if(v!==null) out[k]=v; });
    } else if(spec.type === 'prefix'){
      for(var i=0;i<localStorage.length;i++){
        var k = localStorage.key(i);
        if(k && k.indexOf(spec.prefix)===0) out[k] = localStorage.getItem(k);
      }
    }
    return out;
  }
  function applyLocal(dataObj){
    Object.keys(dataObj||{}).forEach(function(k){ localStorage.setItem(k, dataObj[k]); });
  }

  function idbExportAll(dbName, version, stores){
    return new Promise(function(resolve, reject){
      var req = indexedDB.open(dbName, version);
      req.onerror = function(){ reject(req.error); };
      req.onsuccess = function(){
        var db = req.result, out = {}, remaining = stores.length;
        if(remaining===0) return resolve(out);
        var tx = db.transaction(stores, 'readonly');
        stores.forEach(function(s){
          var r = tx.objectStore(s).getAll();
          r.onsuccess = function(){ out[s]=r.result; if(--remaining===0) resolve(out); };
          r.onerror = function(){ reject(r.error); };
        });
      };
    });
  }
  function idbImportAll(dbName, version, dataObj){
    return new Promise(function(resolve, reject){
      var req = indexedDB.open(dbName, version);
      req.onerror = function(){ reject(req.error); };
      req.onsuccess = function(){
        var db = req.result, stores = Object.keys(dataObj||{});
        if(stores.length===0) return resolve();
        var tx = db.transaction(stores, 'readwrite');
        stores.forEach(function(s){
          var os = tx.objectStore(s);
          os.clear();
          (dataObj[s]||[]).forEach(function(rec){ try{ os.put(rec); }catch(e){} });
        });
        tx.oncomplete = function(){ resolve(); };
        tx.onerror = function(){ reject(tx.error); };
      };
    });
  }

  function setupSync(db, uid, page){
    var spec = page.storage;
    if(!spec) return;
    var docRef = db.collection('users').doc(uid).collection('progress').doc(page.id);

    function pushUp(){
      if(spec.type === 'indexeddb'){
        idbExportAll(spec.dbName, spec.version, spec.stores).then(function(data){
          docRef.set({ data: data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, {merge:true});
        }).catch(function(){});
      } else {
        docRef.set({ data: gatherLocal(spec), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, {merge:true});
      }
    }

    docRef.get().then(function(snap){
      if(snap.exists && snap.data().data){
        var cloud = snap.data().data;
        if(spec.type === 'indexeddb'){
          idbImportAll(spec.dbName, spec.version, cloud).catch(function(){});
        } else {
          applyLocal(cloud);
        }
      } else {
        pushUp();
      }
    }).catch(function(){});

    setInterval(pushUp, 25000);
    window.addEventListener('pagehide', pushUp);
    document.addEventListener('visibilitychange', function(){ if(document.hidden) pushUp(); });
  }

  // ---------- main ----------
  document.addEventListener('DOMContentLoaded', function(){
    var page = window.AG_PAGE || {id:'page'};
    var overlay = buildOverlay();
    showLoading(overlay);

    if(typeof firebase === 'undefined' || typeof FIREBASE_CONFIG === 'undefined'){
      render(overlay, '<h2>Setup incomplete</h2><p>firebase-config.js has not been filled in yet.</p>');
      return;
    }

    firebase.initializeApp(FIREBASE_CONFIG);
    var auth = firebase.auth();
    var db = firebase.firestore();
    var provider = new firebase.auth.GoogleAuthProvider();

    function grant(user, role){
      overlay.style.display = 'none';
      buildSidebar(user, role, auth, db, page);
      if(page.storage) setupSync(db, user.uid, page);
      if(role === 'guest') setupTimeTracking(db, user.uid);
      if(typeof window.AG_ON_GRANT === 'function') window.AG_ON_GRANT(db, user.uid);
    }

    auth.onAuthStateChanged(function(user){
      overlay.style.display = 'flex';

      if(!user){
        showLogin(overlay, auth, provider);
        return;
      }

      if(user.email === OWNER_EMAIL){
        grant(user, 'owner');
        return;
      }

      var reqRef = db.collection('accessRequests').doc(user.uid);
      reqRef.get().then(function(snap){
        if(!snap.exists){
          reqRef.set({
            email: user.email, name: user.displayName || '',
            status: 'pending', requestedAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function(){ showPending(overlay, auth); });
          return;
        }
        var status = snap.data().status;
        if(status === 'approved') grant(user, 'guest');
        else if(status === 'denied') showDenied(overlay, auth);
        else showPending(overlay, auth);
      });
    });
  });
})();
