const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { summarize } = require('../shared-progress.js');
const root = path.resolve(__dirname,'..');
const context = { window:{} }; vm.runInNewContext(fs.readFileSync(path.join(root,'study-catalog.js'),'utf8'),context);
const catalog = context.window.STUDY_CATALOG;
function summary(id,data,now=Date.now()) {
  const mod = catalog.find(m => m.id === id);
  const key = mod.storage.keys?.[0] || (id === 'english-language' ? 'elsr_progress' : 'tvx_progress');
  return summarize(mod,{[key]:JSON.stringify(data)},now);
}
test('all catalogued modules have unique IDs, existing paths and safe empty summaries',() => {
  assert.equal(catalog.length,37); assert.equal(new Set(catalog.map(m=>m.id)).size,catalog.length);
  for (const mod of catalog) {
    assert.ok(fs.existsSync(path.join(root,mod.path)),mod.path);
    const empty = summarize(mod,{}); assert.equal(empty.hasData,false,mod.id); assert.equal(empty.attempted,0);
    const source=fs.readFileSync(path.join(root,mod.path),'utf8');
    assert.ok(source.includes('progress-store.js?v=17'),mod.id);
    assert.ok(source.includes('cloud-records.js?v=16') && source.indexOf('cloud-records.js')<source.indexOf('progress-store.js'),mod.id+' cloud transport must load before persistence');
    assert.ok(source.includes('study-ui.css?v=14') && source.includes('study-ui.js?v=14'),mod.id+' shared reading interface');
    assert.ok(source.includes('text/x-study-script'),mod.id);
    for(const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.ok(/src=|type=/.test(m[1]) || /window.AG_PAGE\s*=/.test(m[2]),'Executable script before hydration: '+mod.id);
    }
  }
});
test('question counters retain repeat attempts and do not include quiz history twice',() => {
  const s=summary('math',{questions:{a:{attempts:4,correctCount:3,wrongCount:1,status:'mastered',nextRevision:'2020-01-01'}},quizHistory:[{total:4,correct:3}]});
  assert.equal(s.attempted,4); assert.equal(s.correct,3); assert.equal(s.mastered,1); assert.equal(s.due,1);
});
test('attempt arrays and latest answer booleans have distinct denominators',() => {
  const s=summary('english-literature',{q:{a:{attempts:[{correct:true},{correct:false},{correct:true}]}}});
  assert.equal(s.attempted,3); assert.equal(s.correct,2);
  const latest=summary('bangladesh-affairs-study-app',{qState:{a:{attempts:10,correct:true},b:{attempts:4,correct:false}}});
  assert.equal(latest.attempted,2); assert.equal(latest.correct,1);
  const repeated=summary('math-mental-ability-study-system',{mcqAttempts:{a:{correct:true,wrongCount:5}}});
  assert.equal(repeated.attempted,1); assert.equal(repeated.correct,1);
});
test('nested exam-ready states and saved schedules are counted without phantom bookmarks',() => {
  const s=summary('bangla-sahitya-study-app',{bookmarks:{pages:[],mcqs:[],qas:[],pyq:[]},topicStatus:{a:'examready'},qaAttempts:{a:{srs:{due:1}}}});
  assert.equal(s.bookmarks,0); assert.equal(s.mastered,1); assert.equal(s.due,1);
});
test('review dates handle timestamps, date strings, future dates and nulls',() => {
  const s=summary('bangla-uttaran-app',{progress:{a:{status:'knew',dueAt:1},b:{dueAt:9999999999999},c:{dueAt:null}}});
  assert.equal(s.due,1); assert.equal(s.mastered,1);
});
test('exam history excludes unanswered questions and negative-marked score',() => {
  const mod=catalog.find(m=>m.id==='exam-simulator');
  const s=summarize(mod,{attempts:[{correct:8,wrong:2,total:20,score:7}],qhistory:[],bookmarks:[]});
  assert.equal(s.attempted,10); assert.equal(s.correct,8);
});
test('bad JSON does not prevent other modules from loading',() => {
  const mod=catalog.find(m=>m.id==='math'); assert.equal(summarize(mod,{bcsMathStudy_v1:'broken'}).hasData,false);
});
test('syllabus trackers retain their own question and practice counters',() => {
  const prelim=summary('prelim-master-tracker',{questions:[{attempts:[{correct:true},{correct:false}]}],topics:[{status:'Not Started'}]});
  assert.equal(prelim.attempted,2); assert.equal(prelim.correct,1);
  const written=summary('written-syllabus-intelligence',{topics:{a:{status:'mastered',practiceCorrect:3,practiceWrong:2}}});
  assert.equal(written.attempted,5); assert.equal(written.correct,3); assert.equal(written.mastered,1);
});
test('explicit totals and unique answer maps have correct denominators',() => {
  assert.equal(summary('budget-2026-27',{stats:{totalAnswered:12,totalCorrect:8}}).attempted,12);
  const s=summary('english-lang-lit-study-app',{mcqStats:{attempted:{a:true,b:true},correct:{a:true}}});
  assert.equal(s.attempted,2); assert.equal(s.correct,1);
});
