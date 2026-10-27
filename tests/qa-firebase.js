// Test double served only by qa_server.py. It never contacts Firebase.
(function(){
  window.QA_ERRORS=[];
  const report = (kind,message) => { window.QA_ERRORS.push({kind,message}); fetch('/__qa/report',{method:'POST',body:JSON.stringify({page:location.pathname,kind,message})}); };
  window.addEventListener('error',e => { if(e.message) report('error',e.message); });
  window.addEventListener('unhandledrejection',e => report('rejection',String(e.reason?.message || e.reason)));
  const auth={onAuthStateChanged(fn){queueMicrotask(()=>fn({uid:new URL(location.href).searchParams.get('qa-user') || localStorage.getItem('__qa_uid') || 'qa-user',email:OWNER_EMAIL}));},signOut:async()=>{},signInWithPopup:async()=>{}};
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
    update:async()=>{},delete:async()=>{},onSnapshot(fn){fn({empty:true,forEach(){}});return ()=>{};}
  };}
  window.firebase={apps:[],initializeApp(){this.apps.push({});},auth:()=>auth,firestore:()=>ref('')};
  firebase.auth.GoogleAuthProvider=function(){};
  firebase.firestore.FieldValue={serverTimestamp:()=>Date.now(),increment:n=>n};
})();
