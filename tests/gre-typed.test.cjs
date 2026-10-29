const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../bank/gre-big-book/gre-core.js'),T=require('../bank/gre-big-book/typed-core.js');
const context={window:{}};for(const name of ['book-data','typed-data','curriculum'])vm.runInNewContext(fs.readFileSync(`bank/gre-big-book/${name}.js`,'utf8'),context);
const B=context.window.GRE_TYPED,book=context.window.GRE_BOOK,P=context.window.GRE_CURRICULUM;
test('typed index preserves every source ID/key and explicitly distinguishes unreviewed text',()=>{
 assert.equal(B.questions.length,5020);assert.equal(new Set(B.questions.map(q=>q.id)).size,5020);
 const state=C.fresh();for(const q of B.questions){const s=C.section(book,q.sectionId);assert.equal(q.answer,s.answers[q.number-1]);assert.ok(P.topics.some(t=>t.id===q.topic));if(q.reviewed){assert.ok(q.stem&&q.explanation.startsWith(q.answer+':'));assert.equal(Object.keys(q.options).length,C.choices(s,q.number).length);assert.equal(T.eligible(q,state),true);assert.ok(!/[�~]/.test(q.stem+Object.values(q.options).join('')));}else assert.equal(T.eligible(q,state),false);}
 assert.equal(B.questions.filter(q=>q.reviewed).length,69);
});
test('search includes shared passages, test references and secondary comparison tags',()=>{
 assert.ok(T.select(B,{query:'sunspots',quality:'reviewed'}).some(q=>q.id==='t01-s1-q23'));
 assert.ok(T.select(B,{topic:'comparison',quality:'reviewed'}).some(q=>q.id==='t01-s3-q15'));
 assert.equal(T.select(B,{test:'1',quality:'reviewed'}).length,69);
});
test('mixed practice grades original IDs once, retains notes and summaries, and preserves blanks',()=>{
 const state=C.fresh(),ids=['t01-s1-q01','t01-s2-q01','t01-s3-q01'];state.questions[ids[0]]={note:'বাংলা <script> is plain text',bookmarked:true,attempts:0,correctCount:0,wrongCount:0};
 const s=T.session(ids,0,1000);s.answers[ids[0]]='A';s.answers[ids[1]]='A';T.grade(C,book,B,state,s,ids[0],1100);T.grade(C,book,B,state,s,ids[0],1200);
 const r=T.finish(C,book,B,state,s,2000);assert.deepEqual([r.attempted,r.correct,r.wrong,r.skipped],[2,1,1,1]);assert.equal(state.questions[ids[0]].attempts,1);assert.ok(state.questions[ids[0]].bookmarked);assert.match(state.questions[ids[0]].note,/বাংলা/);
 T.finish(C,book,B,state,s,3000);assert.equal(state.history.length,1);assert.equal(C.stats(state).attempted,2);
});
test('unreviewed items cannot be scored until their text is personally confirmed',()=>{
 const state=C.fresh(),q=B.questions.find(q=>q.status==='transcribed'),s=T.session([q.id]);s.answers[q.id]=q.answer;
 assert.equal(T.grade(C,book,B,state,s,q.id),null);assert.equal(state.questions[q.id],undefined);
 state.questions[q.id]={textConfirmed:true,attempts:0,correctCount:0,wrongCount:0};assert.equal(T.grade(C,book,B,state,s,q.id).correct,true);
});
test('timed session deadlines survive serialization and uncertain items stay out of a set',()=>{
 const state=C.fresh(),s=T.session(['t01-s1-q01'],1,1000);state.typedSession=s;
 assert.equal(T.expired(C.load(JSON.stringify(state)).typedSession,61000),true);
 const incomplete=B.questions.find(q=>!q.stem);assert.equal(T.eligible(incomplete,state),false);
 assert.equal(T.eligible({...incomplete,reviewed:true},state),false);
});
