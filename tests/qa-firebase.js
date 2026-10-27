// Test double served only by qa_server.py. It never contacts Firebase.
(function(){
  window.QA_ERRORS=[];
  const report = (kind,message) => { window.QA_ERRORS.push({kind,message}); fetch('/__qa/report',{method:'POST',body:JSON.stringify({page:location.pathname,kind,message})}); };
  window.addEventListener('error',e => { if(e.message) report('error',e.message); });
  window.addEventListener('unhandledrejection',e => report('rejection',String(e.reason?.message || e.reason)));
  const params=new URL(location.href).searchParams;
  const uid=()=>params.get('qa-user') || localStorage.getItem('__qa_uid') || 'qa-user';
  const auth={onAuthStateChanged(fn){queueMicrotask(()=>fn(sessionStorage.getItem('__qaSignedOut_'+uid()) ? null : {uid:uid(),email:params.get('qa-role')==='guest' ? 'qa.guest@example.test' : OWNER_EMAIL}));},signOut:async()=>{sessionStorage.setItem('__qaSignedOut_'+uid(),'true');},signInWithPopup:async()=>{sessionStorage.removeItem('__qaSignedOut_'+uid());location.reload();}};
  function snapshot(id,data){return {id,exists:!!data,data:()=>({...data,updatedAt:{toMillis:()=>data?.__time || 0}})};}
  function ref(path){return {
    collection:name=>ref(path+'/'+name), doc:id=>ref(path+'/'+id),
    get:async()=>{
      if(localStorage.getItem('__qaOffline')) throw new Error('Simulated offline connection');
      const memory=JSON.parse(localStorage.getItem('__qaCloud') || '{}');
      const entries=Object.entries(memory).filter(([k])=>k.startsWith(path+'/') && k.slice(path.length+1).indexOf('/')===-1).map(([k,v])=>snapshot(k.split('/').pop(),v));
      return {...snapshot(path.split('/').pop(),memory[path]),docs:entries};
    },
    set:async data=>{if(localStorage.getItem('__qaOffline'))throw new Error('Simulated offline connection');const memory=JSON.parse(localStorage.getItem('__qaCloud') || '{}');memory[path]={...data,__time:Date.now()};localStorage.setItem('__qaCloud',JSON.stringify(memory));},
    update:async data=>{const memory=JSON.parse(localStorage.getItem('__qaCloud') || '{}');memory[path]={...memory[path],...data};localStorage.setItem('__qaCloud',JSON.stringify(memory));},delete:async()=>{},onSnapshot(fn){const memory=JSON.parse(localStorage.getItem('__qaCloud') || '{}');const docs=Object.entries(memory).filter(([k])=>k.startsWith(path+'/') && !k.slice(path.length+1).includes('/')).map(([k,v])=>snapshot(k.split('/').pop(),v));fn({empty:!docs.length,forEach:cb=>docs.forEach(cb)});return ()=>{};}
  };}
  window.firebase={apps:[],initializeApp(){this.apps.push({});},auth:()=>auth,firestore:()=>ref('')};
  firebase.auth.GoogleAuthProvider=function(){};
  firebase.firestore.FieldValue={serverTimestamp:()=>Date.now(),increment:n=>n};
})();
