(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GreTypedCore=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const eligible=(q,state)=>!!q?.stem&&!!(q.reviewed||state.questions[q.id]?.textConfirmed)&&Object.keys(q.options).length===(q.kind==='quantitative'&&q.number<=15?4:5);
 function select(bank,filters={}){const term=(filters.query||'').toLowerCase().trim();return bank.questions.filter(q=>(!filters.topic||filters.topic==='all'||(q.tags||[q.topic]).includes(filters.topic))&&(!filters.test||q.test===Number(filters.test))&&(!filters.quality||filters.quality==='all'||(filters.quality==='reviewed'?q.reviewed:q.status===filters.quality))&&(!term||`${q.stem} ${Object.values(q.options).join(' ')} ${bank.contexts[q.contextId]||''} test ${q.test} ${q.id}`.toLowerCase().includes(term)));}
 function session(ids,minutes=0,now=Date.now()){return {id:'typed-'+now+'-'+Math.random().toString(36).slice(2,7),ids:[...new Set(ids)],index:0,answers:{},graded:{},startedAt:now,deadline:minutes?now+Math.max(1,Math.min(180,minutes))*60000:null};}
 const expired=(s,now=Date.now())=>!!s?.deadline&&now>=s.deadline;
 function grade(C,book,bank,state,s,id,now=Date.now()){
  if(s.graded[id])return s.graded[id];const q=bank.questions.find(x=>x.id===id);
  if(!s.ids.includes(id)||!q||!eligible(q,state)||!s.answers[id])return null;
  const draft={questions:[q.number],answers:{[q.number]:s.answers[id]},graded:{},questionPages:{[q.number]:q.page},page:q.page};
  const result=C.grade(state,draft,C.section(book,q.sectionId),q.number,now);if(result)s.graded[id]=result;return result;
 }
 function finish(C,book,bank,state,s,now=Date.now()){
  const old=state.history.find(h=>h.id===s.id);if(old)return old;
  s.ids.forEach(id=>grade(C,book,bank,state,s,id,now));
  const rows=Object.values(s.graded),attempted=rows.length,correct=rows.filter(x=>x.correct).length;
  const first=bank.questions.find(q=>q.id===s.ids[0]);
  const result={id:s.id,kind:'typed',sectionId:first?.sectionId,ids:s.ids,mode:s.deadline?'timed':'study',at:now,total:s.ids.length,attempted,correct,wrong:attempted-correct,skipped:s.ids.length-attempted,seconds:Math.round((Math.min(now,s.deadline||now)-s.startedAt)/1000),responses:{...s.answers}};
  state.history.unshift(result);state.history=state.history.slice(0,500);state.typedSession=null;state.typedResult=result;return result;
 }
 return {eligible,select,session,expired,grade,finish};
});
