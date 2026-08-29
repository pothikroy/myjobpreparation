/* ====================================================================
   auth-gate.js — shared login / approval / progress-sync logic.
   Loaded by every page. Each page sets window.AG_PAGE before this
   script runs (id, title, optional storage spec, optional admin flag).
   ==================================================================== */
(function(){

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
      '#ag-badge{position:fixed;top:10px;right:10px;z-index:99998;background:#182430;color:#cfe0ea;',
      'border:1px solid #2c3b48;border-radius:999px;padding:6px 8px 6px 12px;font-size:11.5px;',
      "font-family:'Segoe UI',system-ui,sans-serif;display:flex;gap:6px;align-items:center;}",
      '#ag-badge .ag-email{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '#ag-badge button{background:none;border:none;color:#a9702f;font-size:15px;cursor:pointer;',
      'line-height:1;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;',
      'justify-content:center;font-family:inherit;}',
      '#ag-badge button:hover{background:rgba(169,112,47,0.18);}'
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

  function showBadge(user, role, auth){
    var old = document.getElementById('ag-badge'); if(old) old.remove();
    var b = document.createElement('div'); b.id='ag-badge';
    b.innerHTML = '<span class="ag-email" id="ag-email" title="'+(user.email||'')+'" style="display:none;">'+
      (role==='owner'?'\u2605 ':'')+ (user.email||'') +'</span>'+
      '<button id="ag-out-btn" title="Click to show account, click again to sign out">\u23FB</button>';
    document.body.appendChild(b);
    var emailShown = false;
    document.getElementById('ag-out-btn').onclick = function(){
      var emailEl = document.getElementById('ag-email');
      if(!emailShown){
        emailEl.style.display = 'inline';
        emailShown = true;
      } else {
        auth.signOut(); location.reload();
      }
    };
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

  // ---------- admin panel (index page only) ----------
  function buildAdminButton(db){
    var btn = document.createElement('button');
    btn.textContent = 'Admin: Access Requests';
    btn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99997;background:#a9702f;color:#fff;'+
      'border:none;border-radius:999px;padding:12px 18px;font-weight:700;font-size:13px;cursor:pointer;'+
      'box-shadow:0 8px 20px rgba(0,0,0,.25);font-family:system-ui,sans-serif;';
    btn.onclick = function(){ openAdminModal(db); };
    document.body.appendChild(btn);
  }

  function openAdminModal(db){
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.5);display:flex;'+
      'align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    wrap.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:480px;width:92%;max-height:80vh;'+
      'overflow:auto;padding:22px;"><h3 style="margin:0 0 14px;">Access Requests</h3>'+
      '<div id="ag-admin-list">Loading...</div>'+
      '<button id="ag-admin-close" style="margin-top:16px;width:100%;padding:10px;border:1px solid #ddd;'+
      'border-radius:8px;background:#f6f4ef;cursor:pointer;">Close</button></div>';
    document.body.appendChild(wrap);
    document.getElementById('ag-admin-close').onclick = function(){ wrap.remove(); };

    db.collection('accessRequests').get().then(function(qs){
      var list = document.getElementById('ag-admin-list');
      if(qs.empty){ list.textContent = 'No requests yet.'; return; }
      list.innerHTML = '';
      qs.forEach(function(doc){
        var d = doc.data(), row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #eee;';
        var statusColor = d.status==='approved' ? '#3c6e52' : d.status==='denied' ? '#a33' : '#a9702f';
        row.innerHTML = '<div style="flex:1;"><div style="font-weight:600;font-size:13.5px;">'+(d.email||doc.id)+'</div>'+
          '<div style="font-size:11.5px;color:'+statusColor+';text-transform:uppercase;">'+d.status+'</div></div>';
        var mkBtn = function(label, status, bg){
          var b = document.createElement('button');
          b.textContent = label;
          b.style.cssText = 'padding:6px 10px;border:none;border-radius:6px;background:'+bg+';color:#fff;font-size:12px;cursor:pointer;';
          b.onclick = function(){ db.collection('accessRequests').doc(doc.id).update({status:status}).then(function(){ wrap.remove(); openAdminModal(db); }); };
          return b;
        };
        if(d.status !== 'approved') row.appendChild(mkBtn('Approve','approved','#3c6e52'));
        if(d.status !== 'denied') row.appendChild(mkBtn('Deny','denied','#a33'));
        list.appendChild(row);
      });
    });
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
      showBadge(user, role, auth);
      if(page.storage) setupSync(db, user.uid, page);
      if(page.admin && role==='owner') buildAdminButton(db);
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
