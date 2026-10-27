const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const C=require('../bank/gre-big-book/gre-core.js');
const codec=require('../cloud-records.js');
const {summarize}=require('../shared-progress.js');
const root=path.resolve(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'bank/gre-big-book/book-data.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.join(root,'study-catalog.js'),'utf8'),context);
const book=context.window.GRE_BOOK,mod=context.window.STUDY_CATALOG.find(m=>m.id==='gre-big-book');
const s=C.section(book,'t01-s3');

test('the complete supplied scan has 27 tests, 162 sections and 5020 keyed questions',()=>{
 assert.equal(book.tests.length,27);assert.equal(C.flat(book).length,162);assert.equal(book.questionCount,5020);
 for(const t of book.tests){
  assert.equal(t.sections.length,6);
  assert.deepEqual(['verbal','quantitative','analytical'].map(k=>t.sections.filter(s=>s.kind===k).length),[2,2,2]);
  for(const [i,s] of t.sections.entries()){
   assert.equal(s.answers.length,s.count);assert.match(s.answers,/^[ABCDE]+$/);
   assert.ok(s.startPage>=t.startPage&&s.endPage<t.keyPage&&s.startPage<=s.endPage);
   if(i<5)assert.equal(s.endPage+1,t.sections[i+1].startPage);
  }
 }
 assert.equal(C.flat(book).reduce((n,s)=>n+s.count,0),5020);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'bank/gre-big-book/gre-big-book.pdf'))).digest('hex'),book.sha256);
});

test('visually verified scan exceptions remain attached to the exact test and section',()=>{
 assert.equal(C.section(book,'t03-s3').count,37);
 assert.equal(C.section(book,'t21-s6').count,37);
 assert.ok(C.section(book,'t21-s6').sourceNote);
 assert.equal(C.section(book,'t06-s1').answers[13],'D');
 assert.equal(C.section(book,'t10-s1').answers[2],'C');
 assert.equal(C.section(book,'t21-s6').answers[1],'C');
 assert.equal(C.section(book,'t23-s2').answers[21],'D');
 assert.equal(C.section(book,'t24-s2').answers[22],'B');
});

test('all 5020 completed questions round-trip through bounded cloud records',()=>{
 const state=C.fresh();
 for(const s of C.flat(book)){const d=C.createDraft(s);for(let q=1;q<=s.count;q++)C.choose(d,q,s.answers[q-1],s.startPage);C.finish(state,d,s);}
 const original={[C.KEY]:JSON.stringify(state)},encoded=codec.encode(original);
 assert.ok(encoded.parts.length>1);assert.deepEqual(codec.decode(encoded.parts),original);
 assert.deepEqual([C.stats(state).seen,C.stats(state).attempted,C.stats(state).correct],[5020,5020,5020]);
});

test('checking and then submitting never counts the same answer twice, and blanks stay skipped',()=>{
 const state=C.fresh(),d=C.createDraft(s,{first:1,last:3},1000);state.drafts[s.id]=d;
 C.choose(d,1,'A',s.startPage);C.grade(state,d,s,1,1100);C.grade(state,d,s,1,1200);
 assert.equal(C.choose(d,1,'B',s.startPage),false);
 C.choose(d,2,'A',s.startPage);
 const result=C.finish(state,d,s,1300);
 assert.deepEqual([result.correct,result.wrong,result.skipped,result.attempted],[1,1,1,2]);
 C.finish(state,d,s,1400);assert.equal(state.history.length,1);
 assert.deepEqual([C.stats(state).attempted,C.stats(state).correct],[2,1]);
 assert.equal(state.questions[C.qid(s.id,3)],undefined);
});

test('quantitative comparison uses four choices, with five for later questions',()=>{
 const draft=C.createDraft(s);
 assert.equal(C.choices(s,1),'ABCD');assert.equal(C.choices(s,15),'ABCD');assert.equal(C.choices(s,16),'ABCDE');
 assert.equal(C.choose(draft,1,'E',43),false);assert.equal(C.choose(draft,16,'E',45),true);
});

test('timed drafts retain a wall-clock deadline through serialization and expire while away',()=>{
 const state=C.fresh(),d=C.createDraft(s,{mode:'timed',minutes:2},1000);state.drafts[s.id]=d;
 const restored=C.load(JSON.stringify(state)).drafts[s.id];
 assert.equal(C.remaining(restored,61000),60);assert.equal(C.expired(restored,121000),true);
 C.choose(restored,1,'A',s.startPage);const result=C.finish(state,restored,s,200000);
 assert.equal(result.seconds,120);assert.equal(result.skipped,29);
});

test('retakes retain cumulative accuracy; confidence changes only mastery and scheduling',()=>{
 const state=C.fresh();
 for(const answer of ['A','B','A']){const d=C.createDraft(s,{first:1,last:1});C.choose(d,1,answer,43);C.finish(state,d,s);}
 const r=state.questions[C.qid(s.id,1)];C.review(r,true,5000);
 assert.deepEqual([r.attempts,r.correctCount,r.wrongCount,r.nextReview],[3,2,1,5000+7*C.DAY]);
 assert.equal(C.stats(state).accuracy,67);assert.equal(C.stats(state).mastered,1);
});

test('shared dashboard, review counts and backups use the new module’s original schema',()=>{
 assert.equal(mod.category,'bank');assert.equal(mod.storage.keys[0],C.KEY);
 const state=C.fresh(),d=C.createDraft(s,{first:1,last:2},1000);C.choose(d,1,'A',43);C.choose(d,2,'B',43);C.finish(state,d,s,1000);
 state.questions[C.qid(s.id,2)].bookmarked=true;state.questions[C.qid(s.id,2)].note='Check the method';
 state.words.a={word:'reason',meaning:'test meaning',status:'mastered',nextReview:1};state.readPages[43]=true;
 const summary=summarize(mod,{[C.KEY]:JSON.stringify(state)},1000+4*C.DAY);
 assert.deepEqual([summary.attempted,summary.correct,summary.bookmarks,summary.notes,summary.mastered,summary.due],[2,1,1,1,1,3]);
 assert.equal(summary.hasData,true);
});
