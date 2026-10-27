/* Study state and grading. Kept independent of the DOM for regression tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GreCore=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const DAY=86400000,KEY='gre_big_book_v1';
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
 const fresh=()=>({version:1,target:'bbad',questions:{},drafts:{},history:[],words:{},planDone:{},readPages:{},reader:{page:31},activeSection:null});
 function load(raw){
  let input;try{input=typeof raw==='string'?JSON.parse(raw):raw;}catch(_){input={};}
  const s=Object.assign(fresh(),object(input));
  for(const key of ['questions','drafts','words','planDone','readPages','reader'])s[key]=object(s[key]);
  s.history=Array.isArray(s.history)?s.history:[];s.target=s.target==='iba'?'iba':'bbad';return s;
 }
 const qid=(section,q)=>`${section}-q${String(q).padStart(2,'0')}`;
 const choices=(s,q)=>s.kind==='quantitative'&&q<=15?'ABCD':'ABCDE';
 const flat=book=>book.tests.flatMap(t=>t.sections);
 const section=(book,id)=>flat(book).find(s=>s.id===id);
 function createDraft(s,options={},now=Date.now()){
  const first=Math.max(1,Math.min(s.count,Number(options.first)||1));
  const last=Math.max(first,Math.min(s.count,Number(options.last)||s.count));
  const timed=options.mode==='timed',minutes=Math.max(1,Math.min(180,Number(options.minutes)||30));
  return {id:s.id+'-'+now+'-'+Math.random().toString(36).slice(2,7),sectionId:s.id,kind:s.kind,questions:Array.from({length:last-first+1},(_,i)=>first+i),mode:timed?'timed':'study',startedAt:now,deadline:timed?now+minutes*60000:null,answers:{},graded:{},questionPages:{},current:first,page:s.startPage};
 }
 function choose(draft,q,choice,page){
  if(typeof choice!=='string'||choice.length!==1||!draft.questions.includes(q)||!choices(draft,q).includes(choice)||draft.graded[q])return false;
  draft.answers[q]=choice;draft.questionPages[q]=page;return true;
 }
 function grade(state,draft,s,q,now=Date.now()){
  if(draft.graded[q])return draft.graded[q];
  const choice=draft.answers[q];if(!choice||!draft.questions.includes(q))return null;
  const answer=s.answers[q-1];if(!'ABCDE'.includes(answer||'?'))throw new Error('This question has no indexed answer key.');
  const correct=choice===answer,id=qid(s.id,q),row=state.questions[id]||{attempts:0,correctCount:0,wrongCount:0,status:'new'};
  row.attempts++;row.correctCount+=Number(correct);row.wrongCount+=Number(!correct);
  row.lastAnswer=choice;row.correctAnswer=answer;row.lastCorrect=correct;row.lastAt=now;
  row.sectionId=s.id;row.number=q;row.page=draft.questionPages[q]||draft.page;
  row.streak=correct?(row.streak||0)+1:0;row.status=correct?'learning':'weak';
  row.nextReview=now+(correct?3:1)*DAY;
  state.questions[id]=row;draft.graded[q]={choice,answer,correct};return draft.graded[q];
 }
 function finish(state,draft,s,now=Date.now()){
  const existing=state.history.find(x=>x.id===draft.id);if(existing)return existing;
  for(const q of draft.questions)grade(state,draft,s,q,now);
  const attempted=draft.questions.filter(q=>!!draft.graded[q]).length;
  const correct=draft.questions.filter(q=>draft.graded[q]?.correct).length;
  const finished={id:draft.id,sectionId:s.id,mode:draft.mode,at:now,total:draft.questions.length,attempted,correct,wrong:attempted-correct,skipped:draft.questions.length-attempted,seconds:Math.max(0,Math.round(((draft.deadline?Math.min(now,draft.deadline):now)-draft.startedAt)/1000)),responses:{...draft.answers},questions:[...draft.questions]};
  state.history.unshift(finished);state.history=state.history.slice(0,500);
  delete state.drafts[s.id];return finished;
 }
 const remaining=(draft,now=Date.now())=>draft.deadline?Math.max(0,Math.ceil((draft.deadline-now)/1000)):null;
 const expired=(draft,now=Date.now())=>!!draft.deadline&&now>=draft.deadline;
 function review(row,known,now=Date.now()){
  row.status=known?'mastered':'weak';row.nextReview=now+(known?7:1)*DAY;row.lastReviewed=now;
 }
 function stats(state,now=Date.now()){
  const rows=Object.values(state.questions),words=Object.values(state.words);
  const attempted=rows.reduce((n,r)=>n+(Number(r.attempts)||0),0),correct=rows.reduce((n,r)=>n+(Number(r.correctCount)||0),0);
  return {attempted,correct,accuracy:attempted?Math.round(correct/attempted*100):null,seen:rows.filter(r=>r.attempts).length,due:rows.filter(r=>r.nextReview&&r.nextReview<=now).length,wordsDue:words.filter(w=>w.nextReview&&w.nextReview<=now).length,weak:rows.filter(r=>r.status==='weak').length,mastered:rows.filter(r=>r.status==='mastered').length,sessions:state.history.length};
 }
 return {KEY,DAY,fresh,load,qid,choices,flat,section,createDraft,choose,grade,finish,remaining,expired,review,stats};
});
