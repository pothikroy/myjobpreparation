(function(){
 'use strict';
 const C=window.GreCore,book=window.GRE_BOOK,sections=C.flat(book),$=id=>document.getElementById(id);
 const base=new URL('.',document.currentScript.src),esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const names={verbal:'Verbal',quantitative:'Quantitative',analytical:'Analytical'};
 const format=n=>Number(n||0).toLocaleString('en-US'),date=n=>new Date(n).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
 let state,ready=false,noteTimer,pdfPromise,pdfTask,pdfGeneration=0,resizeObserver,lastWidth=0,resizeTimer;
 const ui={view:'overview',query:'',kind:'all',review:'due',limit:50,freeReading:false,result:null,zoom:'fit',mobilePane:'read'};
 const currentSection=()=>C.section(book,state.activeSection),currentDraft=()=>state.drafts[state.activeSection];
 const sectionLabel=s=>`Test ${s.test} · ${names[s.kind]} · Section ${s.number}`;
 function save(){localStorage.setItem(C.KEY,JSON.stringify(state));updateBadge();}
 function delayedSave(){clearTimeout(noteTimer);noteTimer=setTimeout(save,250);}
 function toast(message){$('gre-toast').textContent=message;$('gre-toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('gre-toast').classList.remove('visible'),3600);}
 function button(label,action,extra='',style=''){return `<button type="button" class="gre-button ${style}" data-action="${action}" ${extra}>${label}</button>`;}
 function targetButtons(){return `<div class="gre-target" role="group" aria-label="Preparation goal"><button type="button" data-target="bbad" aria-pressed="${state.target==='bbad'}">Bangladesh Bank AD</button><button type="button" data-target="iba" aria-pressed="${state.target==='iba'}">IBA MBA</button></div>`;}
 function pageHead(title,description,withTarget=false){return `<div class="gre-page-head"><div><div class="gre-eyebrow">BANK PREPARATION · GRE BIG BOOK LAB</div><h1>${title}</h1><p>${description}</p></div>${withTarget?targetButtons():''}</div>`;}
 function empty(title,copy,action='tests',label='Explore the tests'){return `<div class="gre-empty"><h2>${title}</h2><p>${copy}</p>${button(label,'navigate',`data-to="${action}"`)}</div>`;}
 function navigate(view){if(!['overview','tests','practice','revision','vocabulary','plan'].includes(view))view='overview';location.hash=view;if(ui.view===view){render();scrollStart();}}
 function scrollStart(){const surface=$('gre-main').closest('#ui-study-surface');if(surface)surface.scrollTop=0;}
 function updateBadge(){if(state){const stats=C.stats(state);$('due-badge').textContent=stats.due;$('words-due-badge').textContent=stats.wordsDue;}}
 function historyTable(history){return history.length?`<div class="gre-table-scroll" data-ui-horizontal="true"><table class="gre-history"><thead><tr><th>Session</th><th>Answered</th><th>Correct</th><th>Skipped</th><th>Date</th></tr></thead><tbody>${history.slice(0,12).map(h=>{const s=C.section(book,h.sectionId);return `<tr><td>${s?esc(sectionLabel(s)):'Practice'}<br><small>${h.mode==='timed'?'Timed':'Study'} · ${Math.floor(h.seconds/60)} min</small></td><td>${h.attempted}/${h.total}</td><td>${h.correct}/${h.attempted}</td><td>${h.skipped}</td><td>${date(h.at)}</td></tr>`;}).join('')}</tbody></table></div>`:'<p>No submitted sessions yet. Begin with one section; your results will appear here.</p>';}
 function overview(){
  const stats=C.stats(state),iba=state.target==='iba',next=sections.find(s=>s.test===1&&s.kind===(iba?'analytical':'quantitative'));
  const drafts=Object.values(state.drafts),coverage=Object.values(state.questions).filter(r=>r.attempts).length;
  return pageHead('A big book. A clear way forward.','পড়ুন, সময় ধরে অনুশীলন করুন, ভুলগুলো আবার শিখুন।',true)+
  `<section class="gre-hero"><div><div class="gre-eyebrow">27 TESTS · 162 SECTIONS · YOUR OWN PACE</div><h2>${iba?'Build balance across all three abilities.':'Build the skills behind a stronger bank exam.'}</h2><p>${iba?'Practise verbal reasoning, mathematics and analytical problems in one place. Keep an error log and return to the questions that need another try.':'Use the quantitative and verbal sections for maths, data interpretation, vocabulary and comprehension. Turn each mistake into a short revision task.'}</p><div class="gre-actions">${button('Start a focused session','setup',`data-section="${next.id}"`)}${button('Explore all 27 tests','navigate','data-to="tests"','secondary')}</div></div><img src="cover.jpg" alt="Cover of the supplied GRE Big Book" width="155" height="201"></section>`+
  `<div class="gre-stats" aria-label="Your GRE practice record">${[
   ['Questions practised',format(coverage),'of '+format(book.questionCount)+' in the book'],['Answer accuracy',stats.accuracy===null?'—':stats.accuracy+'%',format(stats.attempted)+' recorded answers'],['Reviews due',format(stats.due+stats.wordsDue),format(stats.due)+' questions · '+format(stats.wordsDue)+' vocabulary cards'],['Sessions completed',format(stats.sessions),drafts.length+' saved drafts']
  ].map(([a,b,c])=>`<div class="gre-stat"><span>${a}</span><b>${b}</b><small>${c}</small></div>`).join('')}</div>`+
  `<div class="gre-grid"><section class="gre-panel"><h2>${drafts.length?'Pick up where you paused':'Your first study loop'}</h2>${drafts.length?drafts.slice(0,5).map(d=>{const s=C.section(book,d.sectionId);return `<div class="gre-list-row"><div><b>${esc(sectionLabel(s))}</b><small>${Object.keys(d.answers).length}/${d.questions.length} answered · ${d.mode==='timed'?'timer continues while away':'untimed'}</small></div>${button('Resume','resume',`data-section="${s.id}"`,'small')}</div>`;}).join(''):'<ol><li>Read the original page, including the diagram or passage.</li><li>Choose your answer in the answer panel.</li><li>Check the key and write why your method worked or failed.</li><li>Retry weak questions after a gap.</li></ol>'}</section><section class="gre-panel"><h2>A useful 90-minute routine</h2>${iba?'<ul><li>25 min: verbal reasoning and comprehension</li><li>25 min: quantitative problems</li><li>25 min: analytical reasoning</li><li>15 min: mistakes, vocabulary and communication</li></ul>':'<ul><li>30 min: quantitative problem solving</li><li>20 min: reading comprehension</li><li>10 min: vocabulary in context</li><li>20 min: writing or translation practice</li><li>10 min: yesterday’s mistakes</li></ul>'}<p>A suggested routine, adjustable to your schedule.</p>${button('See your study plan','navigate','data-to="plan"','secondary small')}</section></div>`+
  `<section class="gre-panel"><h2>Recent practice</h2><p>Raw results from this book. Blank answers are recorded as skipped, never silently counted as wrong.</p>${historyTable(state.history)}</section>`+
  `<div class="gre-note">This is a skills-practice book from 1996, not a current BB AD or IBA question paper. Pair it with the current notice and exam-specific preparation. ${button('How to use it well','navigate','data-to="plan"','secondary small')}</div>`;
 }
 function testCards(){
  const query=ui.query.trim().toLowerCase(),tests=book.tests.filter(t=>!query||`test ${t.number} ${String(t.number).padStart(2,'0')}`.includes(query));
  return tests.map(t=>{
   const rows=t.sections.filter(s=>ui.kind==='all'||s.kind===ui.kind);
   const submitted=state.history.filter(h=>h.sectionId.startsWith(`t${String(t.number).padStart(2,'0')}-`)).length;
   return `<article class="gre-test"><div class="gre-test-top"><div><span class="gre-test-number">PRACTICE TEST ${String(t.number).padStart(2,'0')}</span><h2>Test ${t.number}</h2></div><small>${submitted} sessions<br>PDF ${t.startPage}–${t.endPage}</small></div>${rows.map(s=>`<div class="gre-section-row"><div><span>${names[s.kind]} <small>Section ${s.number} · ${s.count} questions</small></span></div>${button(state.drafts[s.id]?'Resume':'Start',state.drafts[s.id]?'resume':'setup',`data-section="${s.id}"`,'small secondary')}</div>`).join('')}</article>`;
  }).join('')||empty('No matching test','Search for a test number from 1 to 27.');
 }
 function tests(){return pageHead('Choose a small, useful session.','Every section links to the original pages and the answer key for that exact test.')+`<div class="gre-toolbar"><label>Find a test<input id="test-query" type="search" placeholder="Test number, e.g. 12" value="${esc(ui.query)}"></label><label>Ability<select id="ability-filter">${[['all','All abilities'],['quantitative','Quantitative'],['verbal','Verbal'],['analytical','Analytical']].map(([v,l])=>`<option value="${v}" ${ui.kind===v?'selected':''}>${l}</option>`).join('')}</select></label>${button('Read the full book','read-book','','secondary')}</div><div id="test-cards" class="gre-tests">${testCards()}</div>`;}
 function reader(page){return `<section class="gre-reader" aria-label="Original book reader"><div class="gre-reader-toolbar"><div class="gre-reader-buttons"><button type="button" data-action="page" data-step="-1" aria-label="Previous PDF page">←</button><label for="pdf-page">PDF page</label><input id="pdf-page" type="number" min="1" max="${book.pageCount}" value="${page}" aria-label="PDF page number"><button type="button" data-action="go-page">Go</button><button type="button" data-action="page" data-step="1" aria-label="Next PDF page">→</button></div><div class="gre-reader-buttons"><label for="pdf-zoom">Zoom</label><select id="pdf-zoom">${[['fit','Fit width'],['1','100%'],['1.25','125%'],['1.5','150%'],['2','200%']].map(([v,l])=>`<option value="${v}" ${ui.zoom===v?'selected':''}>${l}</option>`).join('')}</select></div><span class="gre-small" id="page-reference">PDF ${page} of ${book.pageCount} · printed ${Math.max(1,page-2)}</span></div><div class="gre-page-stage" id="pdf-stage" data-ui-horizontal="true"><div class="gre-reader-message" id="pdf-message">Loading the original page…</div><canvas id="pdf-canvas" role="img" aria-label="Original book page ${page}" hidden></canvas></div><div class="gre-reader-caption"><div class="gre-actions"><a id="open-original" href="gre-big-book.pdf#page=${page}" target="_blank" rel="noopener">Open original PDF in a new tab</a><button type="button" class="gre-link-button" data-action="mark-read">${state.readPages[page]?'Page marked read':'Mark this page read'}</button></div><span>PDF page numbers include the two extra cover pages. Original scan, formulas and diagrams are preserved.</span></div><details class="gre-transcript"><summary>Text from this scanned page · may contain OCR errors</summary><pre id="pdf-transcript">Loading text…</pre></details></section>`;}
 function questionRow(s,q){const id=C.qid(s.id,q);return state.questions[id]||(state.questions[id]={sectionId:s.id,number:q,page:currentDraft()?.page||s.startPage,attempts:0,correctCount:0,wrongCount:0,status:'new'});}
 function answerPanel(s,d){
  const q=d.current,id=C.qid(s.id,q),row=state.questions[id]||{},checked=d.graded[q],chosen=d.answers[q];
  return `<aside class="gre-answer-panel" aria-label="Question answer panel"><div class="gre-question-picker"><button type="button" data-action="question-step" data-step="-1" aria-label="Previous question">←</button><div><h2>Question ${q}</h2><span class="gre-small">${d.questions.indexOf(q)+1} of ${d.questions.length} in this session</span></div><button type="button" data-action="question-step" data-step="1" aria-label="Next question">→</button></div><p>Read the question on the original page, then record its answer here. Move the PDF page separately as you read.</p>${s.kind==='quantitative'&&q<=15?'<p>A: Column A greater · B: Column B greater · C: Equal · D: Cannot determine.</p>':''}<div class="gre-choices" role="group" aria-label="Choose an answer">${C.choices(s,q).split('').map(a=>`<button type="button" data-answer="${a}" aria-label="Answer ${a}" aria-pressed="${chosen===a}" ${checked?'disabled':''} class="${checked?.answer===a?'correct':''}">${a}</button>`).join('')}</div>${checked?`<div class="gre-feedback ${checked.correct?'good':'bad'}" role="status">${checked.correct?'Correct.':'Not quite.'} The book’s answer is <b>${checked.answer}</b>. ${checked.correct?'Keep the reasoning, not just the letter.':'Write the reason for the mistake below.'}</div>`:d.mode==='study'?button('Check this answer','check','','small'):'<div class="gre-feedback">Timed practice: the key stays hidden until you submit.</div>'}${d.mode==='study'&&checked?button('View source answer key','source-key',`data-section="${s.id}"`,'secondary small'):''}<details class="gre-answer-details" ${innerWidth>800?'open':''}><summary>Question navigator & notes</summary><div class="gre-question-grid" role="group" aria-label="Question navigator">${d.questions.map(n=>`<button type="button" data-question="${n}" aria-label="Question ${n}${d.answers[n]?', answered':''}" aria-current="${n===q}" class="${d.answers[n]?'answered':''}">${n}</button>`).join('')}</div><div class="gre-question-notes"><button type="button" class="gre-bookmark" data-action="bookmark" aria-pressed="${!!row.bookmarked}">${row.bookmarked?'★ Saved question':'☆ Save question'}</button><label for="mistake-reason">What needs work?</label><select id="mistake-reason">${[['','Choose a reason'],['concept','Concept or method'],['vocabulary','Vocabulary'],['reading','Misread the question'],['calculation','Calculation or careless error'],['time','Time pressure'],['guess','Guessing']].map(([v,l])=>`<option value="${v}" ${row.reason===v?'selected':''}>${l}</option>`).join('')}</select><label for="question-note">My reasoning / বাংলা নোট</label><textarea id="question-note" placeholder="Write the rule, the trap, and what you will do next time.">${esc(row.note||'')}</textarea><span class="gre-small">Notes, answers and bookmarks save with your account.</span></div></details></aside>`;
 }
 function practice(){
  const s=currentSection(),d=currentDraft();
  if(ui.freeReading)return pageHead('Read the original book.','Jump to any PDF page. Start a section from the test library to record and check answers.')+`<div class="gre-actions" style="margin-bottom:18px">${button('Choose a practice section','navigate','data-to="tests"','secondary')}${d?button('Resume saved session','resume',`data-section="${s.id}"`):''}</div>${reader(state.reader.page||31)}`;
  if(d&&s){
   if(C.expired(d)){finishSession(true);return resultView(ui.result);}
   return `<div class="gre-study-top"><div><div class="gre-eyebrow">${d.mode==='timed'?'TIMED PRACTICE':'STUDY AT YOUR OWN PACE'}</div><h1>${esc(sectionLabel(s))}</h1><p>PDF pages ${s.startPage}–${s.endPage} · ${d.questions.length} questions in this session${s.sourceNote?' · '+esc(s.sourceNote):''}</p></div><div class="gre-actions"><b id="session-clock" class="gre-timer ${d.mode==='timed'?'running':''}">${d.mode==='timed'?'30:00':'Untimed'}</b>${button('Submit session','finish','','small')}${button('Test library','navigate','data-to="tests"','secondary small')}</div></div><div class="gre-mobile-study-switch" role="group" aria-label="Study room pane"><button type="button" data-action="room-pane" data-pane="read" aria-pressed="${ui.mobilePane==='read'}">Book page</button><button type="button" data-action="room-pane" data-pane="answer" aria-pressed="${ui.mobilePane==='answer'}">Answer & notes</button></div><div class="gre-room" data-pane="${ui.mobilePane}">${reader(d.page)}${answerPanel(s,d)}</div>`;
  }
  if(ui.result)return resultView(ui.result);
  return pageHead('Your study room is ready.','Choose a section or resume a saved draft. Each section has its own draft, so switching never discards unsubmitted answers.')+empty('One section is a good start.','Choose study mode for learning, or timed mode to practise pacing. You can also use the reader without starting a test.')+`<div class="gre-actions">${button('Read the full book','read-book','','secondary')}</div>`;
 }
 function resultView(result){
  const s=C.section(book,result.sectionId);
  return pageHead('A result you can learn from.',esc(sectionLabel(s)))+`<div class="gre-stats">${[['Correct',result.correct,'out of '+result.attempted+' answered'],['Wrong',result.wrong,'return to the method'],['Skipped',result.skipped,'not counted as wrong'],['Accuracy',result.attempted?Math.round(result.correct/result.attempted*100)+'%':'—','raw practice accuracy']].map(([a,b,c])=>`<div class="gre-stat"><span>${a}</span><b>${b}</b><small>${c}</small></div>`).join('')}</div><div class="gre-actions">${button('Retry this section','setup',`data-section="${s.id}"`)}${button('Review my mistakes','navigate','data-to="revision"','secondary')}${button('Open source answer key','source-key',`data-section="${s.id}"`,'secondary')}</div><div class="gre-note">No GRE scaled score or admission cut-off is inferred. Use raw accuracy, time and your error reasons to decide what to practise next.</div><section class="gre-panel"><h2>Question-by-question review</h2>${result.questions.map(q=>{const choice=result.responses[q],answer=s.answers[q-1];return `<div class="gre-list-row"><div><b>Question ${q} · ${choice?choice===answer?'Correct':'Wrong':'Skipped'}</b><small>Your answer: ${choice||'—'} · Book answer: ${answer}</small></div>${button('Read question','read-question',`data-section="${s.id}" data-q="${q}"`,'secondary small')}</div>`;}).join('')}</section>`;
 }
 function revision(){
  let entries=Object.entries(state.questions).filter(([,r])=>r.attempts||r.bookmarked||r.note);
  entries=entries.filter(([,r])=>ui.review==='all'||ui.review==='due'&&r.nextReview<=Date.now()||ui.review==='weak'&&r.status==='weak'||ui.review==='saved'&&r.bookmarked||ui.review==='notes'&&r.note||ui.review==='mastered'&&r.status==='mastered').sort((a,b)=>(a[1].nextReview||Infinity)-(b[1].nextReview||Infinity));
  return pageHead('Keep the lesson from each mistake.','Retry before you mark a question mastered. Confidence ratings change the review schedule, not your answer accuracy.')+`<div class="gre-toolbar"><label>Show questions<select id="review-filter">${[['due','Due now'],['weak','Weak questions'],['saved','Saved questions'],['notes','My notes'],['mastered','Mastered'],['all','All recorded questions']].map(([v,l])=>`<option value="${v}" ${ui.review===v?'selected':''}>${l}</option>`).join('')}</select></label><p>${entries.length} matching questions</p></div>`+(entries.length?entries.slice(0,ui.limit).map(([id,r])=>{const s=C.section(book,r.sectionId);return `<article class="gre-review-card"><div class="gre-actions"><h3>${esc(sectionLabel(s))} · Q${r.number}</h3><span class="gre-status">${esc(r.status)}</span>${r.bookmarked?'<span class="gre-status">Saved</span>':''}</div><p>${r.attempts?`${r.correctCount}/${r.attempts} correct attempts · Last choice ${esc(r.lastAnswer)} · Book answer ${esc(r.correctAnswer)}`:'Not checked yet'}${r.reason?' · '+esc(r.reason):''}</p>${r.note?`<div class="gre-review-note">${esc(r.note)}</div>`:''}<p>${r.nextReview?'Next review: '+date(r.nextReview):'No review date yet'}</p><div class="gre-actions">${button('Retry question','retry-question',`data-section="${s.id}" data-q="${r.number}"`,'small')}${button('Read my source page','read-question',`data-section="${s.id}" data-q="${r.number}"`,'secondary small')}${button('Review tomorrow','rate-question',`data-id="${id}" data-known="false"`,'secondary small')}${button('Mark mastered · 7 days','rate-question',`data-id="${id}" data-known="true"`,'secondary small')}</div></article>`;}).join('')+(entries.length>ui.limit?button('Show more questions','more-review','','secondary'):''):empty('Nothing in this view yet.','After a checked answer, questions are scheduled for revision. Use Saved questions or My notes to find your own annotations.'));
 }
 function vocabulary(){
  const words=Object.entries(state.words).sort((a,b)=>(a[1].nextReview||0)-(b[1].nextReview||0));
  return pageHead('Vocabulary with a context.','Collect unfamiliar words from the passages, sentence completions and analogies. Add the meaning in your own words, then recall it before revealing.')+`<div class="gre-grid"><section class="gre-panel"><h2>Add a word you actually met</h2><form id="word-form" class="gre-form"><label>Word or phrase<input name="word" required maxlength="100" autocomplete="off"></label><label>Meaning / বাংলা অর্থ<textarea name="meaning" required maxlength="1500"></textarea></label><label>Your example sentence<input name="example" maxlength="500"></label><button type="submit" class="gre-button">Save vocabulary card</button></form></section><section class="gre-panel"><h2>Learn the distinction, not a list.</h2><ol><li>Guess the meaning from the passage first.</li><li>Check a reliable dictionary and add the sense used here.</li><li>Write one original example or contrast.</li><li>Use Again for tomorrow or Know it for a seven-day review.</li></ol><p>Your cards are personal notes. The app does not invent definitions or translations.</p><b>${C.stats(state).wordsDue} vocabulary cards due now</b></section></div><div class="gre-word-grid">${words.map(([id,w])=>`<article class="gre-word"><span class="gre-status">${w.nextReview<=Date.now()?'Due now':'Review '+date(w.nextReview)}</span><h3>${esc(w.word)}</h3><details><summary>Reveal meaning & example</summary><p>${esc(w.meaning)}</p>${w.example?`<p><i>${esc(w.example)}</i></p>`:''}</details><div class="gre-actions">${button('Again · tomorrow','rate-word',`data-id="${id}" data-known="false"`,'secondary small')}${button('Know it · 7 days','rate-word',`data-id="${id}" data-known="true"`,'small')}</div></article>`).join('')}</div>`;
 }
 function plan(){
  const iba=state.target==='iba',phases=[['diagnostic','1 · Diagnose with Test 1','Try one section from each ability. Separate a knowledge gap from a timing or reading error.'],['foundation','2 · Build with Tests 2–8','Work untimed first. Explain every wrong answer, keep a small word bank, and write your own maths steps.'],['pacing','3 · Add pacing with Tests 9–18','Use timed sections, then spend at least as long reviewing the difficult questions. Keep each ability in the rotation.'],['mixed','4 · Consolidate with Tests 19–24','Alternate abilities, return to weak methods, and practise communicating a clear solution.'],['final','5 · Check yourself with Tests 25–27','Use unseen sections to check progress. Revisit your mistake journal and add current exam-specific practice.']];
  return pageHead('Use the book with a purpose.','A self-paced route. Tick a phase when you have reviewed its work, not simply reached the last page.',true)+`<div class="gre-grid"><section class="gre-panel"><h2>${iba?'Your IBA MBA emphasis':'Your Bangladesh Bank AD emphasis'}</h2>${iba?'<p>Rotate all three abilities. Use the quantitative sections for fluency, analytical sections for conditional reasoning, and verbal passages for careful reading.</p><ul><li>English: sentence logic, inference and vocabulary in context.</li><li>Maths: write a short method before trying to improve speed.</li><li>Analytical: diagram the conditions and test a conclusion.</li><li>Communication: summarise a passage, then explain your position clearly.</li></ul>':'<p>Start with quantitative problem solving, data interpretation and careful reading. Use old verbal word questions as vocabulary practice rather than a prediction of the exam.</p><ul><li>Maths: revise arithmetic, algebra and geometry alongside the book.</li><li>Reading: identify the main claim, evidence and inference.</li><li>Writing: summarise a passage in your own words; practise a balanced argument.</li><li>Add separate Bangla, general knowledge, banking, ICT and writing preparation as required by the current notice.</li></ul>'}<p>Suggested skill mapping; exact formats and marks depend on the current admission or recruitment notice.</p></section><section class="gre-panel"><h2>Your five-phase path</h2>${phases.map(([id,title,copy])=>`<label class="gre-plan-step"><input type="checkbox" data-plan="${id}" ${state.planDone[id]?'checked':''}><span><b>${title}</b><small>${copy}</small></span></label>`).join('')}</section></div><div class="gre-grid"><section class="gre-panel"><h2>Make your review do the work</h2><ol><li>Attempt without peeking, then check the exact test’s key.</li><li>Classify the error: method, vocabulary, reading, calculation or time.</li><li>Write a one-sentence fix in the question’s note.</li><li>Retry tomorrow; mark mastered only after you can explain it.</li><li>For writing practice, summarise a passage in 100–150 words, then rewrite two sentences more precisely. Treat this as a drill, not an official word limit.</li></ol></section><section class="gre-panel"><h2>Book & preparation sources</h2><p><b>${book.title}</b> · ${book.edition}. The supplied ${format(book.pageCount)}-page scan is preserved, including its original diagrams and tables. The library indexes ${book.questionCount.toLocaleString()} answer-key entries across 162 sections.</p><div class="gre-actions">${button('Open the book reader','read-book','','secondary')}<a href="gre-big-book.pdf" target="_blank" rel="noopener">Original PDF</a></div><ul><li><a href="https://iba-du.edu/upload_images/MBA68thBatch.pdf" target="_blank" rel="noopener">IBA DU MBA 2025–26 admission notice</a>: lists English/communication, mathematics and analytical ability, with a qualifying score required in each area. Check the current notice for your intake.</li><li><a href="https://erecruitment.bb.org.bd/" target="_blank" rel="noopener">Bangladesh Bank recruitment portal</a>: use the notice for your post and year to confirm the requirements.</li></ul><p>The book’s historical GRE conversion tables and examinee percentages are not BB AD or IBA cut-offs. The app reports raw practice results.</p><p>Scan note: Test 3, Section 3 has 37 questions. Test 21, Section 6 also ends at question 37 and has 37 key entries, although its heading says 38. The index follows the actual questions and key.</p><p><a href="SOURCE.md" target="_blank" rel="noopener">Source and extraction notes</a> · PDF reader: Mozilla PDF.js, Apache-2.0.</p></section></div>`;
 }
 function render(){
  if(!ready)return;clearTimeout(noteTimer);if(noteTimer){save();noteTimer=null;}
  resizeObserver?.disconnect();pdfGeneration++;if(pdfTask)pdfTask.cancel();
  document.querySelectorAll('.gre-tabs [data-view]').forEach(b=>b.setAttribute('aria-current',b.dataset.view===ui.view?'page':'false'));
  $('gre-content').innerHTML=({overview,tests,practice,revision,vocabulary,plan}[ui.view]||overview)();updateBadge();
  if($('pdf-canvas')){loadPage(currentDraft()&&!ui.freeReading?currentDraft().page:state.reader.page||31);resizeObserver=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width>0&&Math.abs(width-lastWidth)>2){lastWidth=width;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if($('pdf-canvas'))loadPage(Number($('pdf-page').value));},120);}});resizeObserver.observe($('pdf-stage'));}
  tick();
 }
 async function documentPDF(){
  if(!pdfPromise)pdfPromise=(async()=>{const lib=await import(new URL('vendor/pdfjs/build/pdf.mjs',base).href);lib.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/build/pdf.worker.mjs',base).href;return lib.getDocument({url:new URL('gre-big-book.pdf',base).href,standardFontDataUrl:new URL('vendor/pdfjs/standard_fonts/',base).href,wasmUrl:new URL('vendor/pdfjs/wasm/',base).href,isEvalSupported:false}).promise;})().catch(e=>{pdfPromise=null;throw e;});
  return pdfPromise;
 }
 async function loadPage(pageNumber){
  const generation=++pdfGeneration,canvas=$('pdf-canvas'),stage=$('pdf-stage'),message=$('pdf-message');if(!canvas)return;
  if(pdfTask)pdfTask.cancel();canvas.hidden=true;message.hidden=false;message.textContent='Loading the original page…';
  try{
   const pdf=await documentPDF(),page=await pdf.getPage(pageNumber);if(generation!==pdfGeneration||!canvas.isConnected)return;
   const original=page.getViewport({scale:1}),scale=ui.zoom==='fit'?Math.max(.2,(stage.clientWidth-34)/original.width):Number(ui.zoom),viewport=page.getViewport({scale}),ratio=Math.min(window.devicePixelRatio||1,2);
   canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';canvas.setAttribute('aria-label',`Original GRE Big Book PDF page ${pageNumber}`);canvas.hidden=false;
   pdfTask=page.render({canvas,canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});await pdfTask.promise;
   if(generation!==pdfGeneration)return;message.hidden=true;canvas.dataset.renderedPage=pageNumber;
   const text=await page.getTextContent();if(generation===pdfGeneration&&$('pdf-transcript'))$('pdf-transcript').textContent=text.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('');
  }catch(e){if(generation!==pdfGeneration||e.name==='RenderingCancelledException')return;message.textContent='The page could not load. Use “Open original PDF in a new tab” below, or try another page.';canvas.hidden=true;console.warn('GRE reader:',e.message);}
 }
 function setPage(page){
  page=Math.max(1,Math.min(book.pageCount,Math.floor(Number(page)||1)));
  state.reader.page=page;if(currentDraft()&&!ui.freeReading)currentDraft().page=page;save();
  if($('pdf-page')){$('pdf-page').value=page;$('page-reference').textContent=`PDF ${page} of ${book.pageCount} · printed ${Math.max(1,page-2)}`;$('open-original').href='gre-big-book.pdf#page='+page;loadPage(page);}
 }
 function setup(id){
  const s=C.section(book,id);if(!s)return;if(state.drafts[id]){resume(id);return;}
  $('setup-section').value=id;$('setup-description').textContent=sectionLabel(s)+` · ${s.count} questions · original PDF ${s.startPage}–${s.endPage}`;
  $('setup-first').value=1;$('setup-last').value=s.count;$('setup-first').max=s.count;$('setup-last').max=s.count;$('setup-mode').value='study';$('setup-minutes').value=30;$('setup-minutes').disabled=true;$('setup-dialog').showModal();
 }
 function start(id,options){
  const s=C.section(book,id);if(state.drafts[id]){resume(id);return;}
  state.drafts[id]=C.createDraft(s,options);state.activeSection=id;ui.freeReading=false;ui.result=null;save();navigate('practice');
 }
 function resume(id){state.activeSection=id;ui.freeReading=false;ui.result=null;save();navigate('practice');}
 function finishSession(expired=false){
  const d=currentDraft(),s=currentSection();if(!d||!s)return;
  ui.result=C.finish(state,d,s);state.activeSection=null;save();if(expired)toast('Time is up. Your saved answers have been submitted.');
  if($('finish-dialog').open)$('finish-dialog').close();
 }
 function tick(){
  if(!ready||ui.view!=='practice'||ui.freeReading)return;
  const d=currentDraft();if(!d)return;if(C.expired(d)){finishSession(true);render();return;}
  const clock=$('session-clock');if(clock&&d.deadline){const remaining=C.remaining(d);clock.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');clock.classList.toggle('urgent',remaining<=120);}
 }
 function chooseQuestion(q){
  const d=currentDraft();if(!d?.questions.includes(q))return;const page=d.page;d.current=q;if(d.questionPages[q])d.page=d.questionPages[q];save();paintAnswerPanel();if(page!==d.page)setPage(d.page);
 }
 function paintAnswerPanel(){const panel=document.querySelector('.gre-answer-panel');if(panel)panel.outerHTML=answerPanel(currentSection(),currentDraft());updateBadge();tick();}
 function sourcePage(s,q){return state.questions[C.qid(s.id,q)]?.page||s.startPage;}
 function handleAction(el){
  const action=el.dataset.action,s=C.section(book,el.dataset.section),d=currentDraft();
  if(action==='room-pane'){ui.mobilePane=el.dataset.pane;document.querySelector('.gre-room').dataset.pane=ui.mobilePane;document.querySelectorAll('[data-action=room-pane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pane===ui.mobilePane)));return;}
  if(action==='navigate'){navigate(el.dataset.to);return;}
  if(action==='setup'){setup(el.dataset.section);return;}
  if(action==='resume'){resume(el.dataset.section);return;}
  if(action==='read-book'){ui.freeReading=true;ui.result=null;navigate('practice');return;}
  if(action==='read-question'||action==='source-key'){ui.freeReading=true;state.reader.page=action==='source-key'?s.keyPage:sourcePage(s,Number(el.dataset.q));save();navigate('practice');return;}
  if(action==='retry-question'){
   const q=Number(el.dataset.q);if(state.drafts[s.id]){resume(s.id);toast('Resumed your existing section draft. Finish it before starting a separate retry.');return;}
   start(s.id,{first:q,last:q,mode:'study'});currentDraft().page=sourcePage(s,q);save();render();return;
  }
  if(action==='page'){setPage(Number($('pdf-page').value)+Number(el.dataset.step));return;}
  if(action==='go-page'){setPage($('pdf-page').value);return;}
  if(action==='mark-read'){state.readPages[Number($('pdf-page').value)]=true;save();el.textContent='Page marked read';toast('Page marked read.');return;}
  if(action==='question-step'&&d){const at=d.questions.indexOf(d.current);chooseQuestion(d.questions[Math.max(0,Math.min(d.questions.length-1,at+Number(el.dataset.step)))]);return;}
  if(action==='check'&&d){if(!d.answers[d.current]){toast('Choose an answer first.');return;}C.grade(state,d,currentSection(),d.current);save();paintAnswerPanel();return;}
  if(action==='finish'&&d){$('finish-description').textContent=`${Object.keys(d.answers).length} of ${d.questions.length} questions answered. Remaining blanks will be recorded as skipped. Your answers will be checked against this section’s key.`;$('finish-dialog').showModal();return;}
  if(action==='bookmark'&&d){const r=questionRow(currentSection(),d.current);r.bookmarked=!r.bookmarked;save();el.setAttribute('aria-pressed',String(r.bookmarked));el.textContent=r.bookmarked?'★ Saved question':'☆ Save question';return;}
  if(action==='rate-question'){C.review(state.questions[el.dataset.id],el.dataset.known==='true');save();render();return;}
  if(action==='rate-word'){C.review(state.words[el.dataset.id],el.dataset.known==='true');save();render();return;}
  if(action==='more-review'){ui.limit+=50;render();}
 }
 function init(){
  if(ready)return;ready=true;state=C.load(localStorage.getItem(C.KEY));
  document.addEventListener('click',e=>{
   const el=e.target.closest('button,a');if(!el)return;
   if(el.hasAttribute('data-close')){el.closest('dialog').close();return;}
   if(el.dataset.view){ui.freeReading=false;navigate(el.dataset.view);return;}
   if(el.dataset.target){state.target=el.dataset.target;save();render();return;}
   if(el.dataset.question){chooseQuestion(Number(el.dataset.question));return;}
   if(el.dataset.answer){const d=currentDraft();if(d&&C.expired(d)){finishSession(true);render();return;}if(d&&C.choose(d,d.current,el.dataset.answer,d.page)){save();paintAnswerPanel();document.querySelector(`[data-answer="${el.dataset.answer}"]`)?.focus({preventScroll:true});}return;}
   if(el.dataset.action)handleAction(el);
  });
  document.addEventListener('input',e=>{
   if(e.target.id==='test-query'){ui.query=e.target.value;$('test-cards').innerHTML=testCards();return;}
   if(e.target.id==='question-note'&&currentDraft()){const d=currentDraft();questionRow(currentSection(),d.current).note=e.target.value;delayedSave();}
  });
  document.addEventListener('change',e=>{
   if(e.target.id==='ability-filter'){ui.kind=e.target.value;$('test-cards').innerHTML=testCards();}
   if(e.target.id==='review-filter'){ui.review=e.target.value;ui.limit=50;render();}
   if(e.target.id==='mistake-reason'&&currentDraft()){questionRow(currentSection(),currentDraft().current).reason=e.target.value;save();}
   if(e.target.id==='setup-mode')$('setup-minutes').disabled=e.target.value!=='timed';
   if(e.target.id==='pdf-zoom'){ui.zoom=e.target.value;loadPage(Number($('pdf-page').value));}
   if(e.target.dataset.plan){state.planDone[e.target.dataset.plan]=e.target.checked;save();}
  });
  document.addEventListener('submit',e=>{
   if(e.target.id==='setup-form'){
    e.preventDefault();if(Number($('setup-first').value)>Number($('setup-last').value)){toast('First question must come before last question.');return;}
    const id=$('setup-section').value,options={first:$('setup-first').value,last:$('setup-last').value,mode:$('setup-mode').value,minutes:$('setup-minutes').value};$('setup-dialog').close();start(id,options);
   }
   if(e.target.id==='word-form'){
    e.preventDefault();const form=new FormData(e.target),word=String(form.get('word')).trim(),meaning=String(form.get('meaning')).trim();if(!word||!meaning)return;
    const id='word-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,5);state.words[id]={word,meaning,example:String(form.get('example')||'').trim(),status:'learning',nextReview:Date.now(),createdAt:Date.now()};save();render();toast('Vocabulary card saved.');
   }
  });
  $('confirm-finish').onclick=()=>{finishSession();render();};
  document.addEventListener('keydown',e=>{
   if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select,dialog'))return;
   if(ui.view==='practice'&&!ui.freeReading&&currentDraft()&&/^[1-5]$/.test(e.key)){e.preventDefault();const d=currentDraft();if(C.expired(d)){finishSession(true);render();return;}if(C.choose(d,d.current,'ABCDE'[Number(e.key)-1],d.page)){save();paintAnswerPanel();}}
  });
  document.addEventListener('visibilitychange',tick);window.addEventListener('pagehide',()=>{clearTimeout(noteTimer);save();});
  window.addEventListener('hashchange',()=>{ui.view=['overview','tests','practice','revision','vocabulary','plan'].includes(location.hash.slice(1))?location.hash.slice(1):'overview';render();scrollStart();$('gre-main').focus({preventScroll:true});});
  ui.view=['overview','tests','practice','revision','vocabulary','plan'].includes(location.hash.slice(1))?location.hash.slice(1):'overview';render();setInterval(tick,1000);
 }
 window.GreApp={init};
})();
