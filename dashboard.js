(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const modules = window.STUDY_CATALOG;
  const paths = {
    book:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z M13 7a3 3 0 0 1 3-3h5v14h-4a4 4 0 0 0-4 3',
    dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    library:'M4 4v16 M9 4v16 M14 4v16 M18 4l4 16',
    repeat:'M20 7a8 8 0 0 0-14-2L3 8 M3 3v5h5 M4 17a8 8 0 0 0 14 2l3-3 M16 16h5v5',
    chart:'M4 3v17h17 M8 15v-4 M13 15V7 M18 15v-6',
    layers:'m3 7 9-4 9 4-9 4z M3 12l9 4 9-4 M3 17l9 4 9-4',
    chevron:'m9 5 7 7-7 7', arrow:'M4 12h16 M14 6l6 6-6 6', back:'M20 12H4 M10 6l-6 6 6 6',
    check:'m5 12 4 4 10-10 M21 12a9 9 0 1 1-9-9', target:'M12 3a9 9 0 1 0 9 9 M12 7a5 5 0 1 0 5 5 M12 12l9-9 M16 3h5v5',
    search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
    menu:'M3 6h18 M3 12h18 M3 18h18', external:'M14 3h7v7 M21 3l-9 9 M10 3H4v17h17v-6',
    close:'M6 6l12 12 M18 6 6 18', star:'m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z',
    download:'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5', upload:'M12 16V4 m-5 5 5-5 5 5 M4 16v5h16v-5'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.book}"/></svg>`;
  function icons() { document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); el.removeAttribute('data-icon'); }); }
  const esc = text => String(text ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format = n => Math.round(n).toLocaleString('en-US');
  const accuracy = s => s.attempted ? Math.round(s.correct/s.attempted*100) + '%' : '—';
  const day = d => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka'}).format(d);
  const shortDate = ts => ts ? new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : 'Not opened yet';
  let summaries = [], category = 'all', view = 'overview', currentModule = null, refreshTimer, pendingBackup;
  function metric(id) { return summaries.find(s => s.id === id) || { attempted:0,correct:0,due:0,mastered:0,hasData:false }; }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').classList.remove('visible'),4500); }
  function card(mod) {
    const s = metric(mod.id), data = StudyStore.hubData(), saved = !!(data.saved || {})[mod.id];
    return `<article class="module-card"><div class="card-top"><span class="card-tag">${esc(mod.categoryName)}</span><button class="save-module ${saved ? 'saved' : ''}" data-save="${mod.id}" aria-pressed="${saved}" aria-label="${saved?'Unsave':'Save'} ${esc(mod.bn)}">${icon('star')}</button></div><h2><a href="#study/${mod.id}">${esc(mod.bn)}</a></h2><p class="module-en">${esc(mod.en)}</p><p class="module-category">${esc(mod.subject)}</p><div class="module-metrics">${s.error ? '<span class="error">Records temporarily unavailable</span>' : s.hasData ? `<span>${format(s.attempted)} answers</span><span>${format(s.mastered)} mastered</span>${s.due ? `<span class="due">${format(s.due)} due</span>` : ''}` : '<span>Ready when you are</span>'}</div><div class="card-bottom"><small>${esc(shortDate((data.recent || {})[mod.id]))}</small><a href="#study/${mod.id}">${s.hasData ? 'Continue' : 'Start studying'} ${icon('arrow')}</a></div></article>`;
  }
  function empty(title,text,link = false) { return `<div class="empty-state"><h2>${esc(title)}</h2><p>${esc(text)}</p>${link ? '<a class="button" href="#library">Explore study library '+icon('arrow')+'</a>' : ''}</div>`; }
  function renderLibrary() {
    const query = $('module-search').value.trim().toLowerCase(), type = $('section-filter').value;
    const data = StudyStore.hubData(), recent = data.recent || {};
    let result = modules.filter(m => (category === 'all' || category === m.category) && (type === 'all' || type === m.section)
      && (!$('saved-only').checked || (data.saved || {})[m.id])
      && [m.id,m.path,m.bn,m.en,m.subject,m.categoryName,m.sectionName].join(' ').toLowerCase().includes(query));
    if ($('sort-modules').value === 'recent') result.sort((a,b) => (recent[b.id] || 0) - (recent[a.id] || 0));
    if ($('sort-modules').value === 'due') result.sort((a,b) => metric(b.id).due - metric(a.id).due);
    if ($('sort-modules').value === 'name') result.sort((a,b) => a.bn.localeCompare(b.bn));
    $('module-grid').innerHTML = result.map(card).join('') || empty('No matching study tools','Try another search, module type, or preparation category.');
    $('results-caption').textContent = result.length + ' of ' + modules.length + ' study tools';
    document.querySelectorAll('[data-category]').forEach(el => { const active = el.dataset.category === category; el.classList.toggle('active',active); el.setAttribute('aria-pressed',String(active)); });
  }
  function renderOverview() {
    const data = StudyStore.hubData(), recent = data.recent || {}, days = data.days || {};
    const total = summaries.reduce((a,s) => ({attempted:a.attempted+s.attempted,correct:a.correct+s.correct,due:a.due+s.due}),{attempted:0,correct:0,due:0});
    $('stat-active').innerHTML = `${summaries.filter(s => s.hasData || recent[s.id]).length} <small>/ ${modules.length}</small>`;
    $('stat-answers').textContent = format(total.attempted); $('stat-accuracy').textContent = accuracy(total);
    $('accuracy-detail').textContent = total.attempted ? `${format(total.correct)} correct of ${format(total.attempted)} recorded` : 'Answer questions to begin';
    $('stat-due').textContent = format(total.due); $('review-count').textContent = format(total.due);
    const last = [...modules].sort((a,b) => (recent[b.id] || 0)-(recent[a.id] || 0)).filter(m => recent[m.id]);
    $('continue-button').href = last.length ? '#study/' + last[0].id : '#library';
    $('continue-button').innerHTML = (last.length ? 'Continue studying ' : 'Explore study library ') + icon('arrow');
    $('continue-detail').textContent = last.length ? last[0].bn + ' · ' + shortDate(recent[last[0].id]) : 'BCS · Bank preparation · TFP';
    $('recent-description').textContent = last.length ? 'Pick up where you left off.' : 'Choose a starting point for today.';
    const starting = [modules[1], modules.find(m => m.id === 'word-smart-vocabulary'), modules.find(m => m.id === 'prelim-master-tracker')];
    $('recent-modules').innerHTML = (last.length ? last.slice(0,3) : starting).map(m => `<a href="#study/${m.id}" class="recent-card"><span class="module-symbol ${m.category}">${icon('book')}</span><div><h3>${esc(m.bn)}</h3><small>${esc(m.en)}</small></div>${icon('arrow')}</a>`).join('');
    const due = [...summaries].filter(s => s.due).sort((a,b) => b.due-a.due);
    $('review-preview').innerHTML = due.length ? due.slice(0,3).map(s => `<a class="review-item" href="#study/${s.id}"><span>${esc(modules.find(m => m.id === s.id).bn)}</span><strong>${format(s.due)} due</strong></a>`).join('') : '<p class="review-empty">No scheduled reviews due right now. Your question and flashcard schedules will appear here as you study.</p>';
    $('review-grid').innerHTML = due.length ? due.map(s => card(modules.find(m => m.id === s.id))).join('') : empty('A clear review queue.','No saved review schedules are due. Study a subject to build your revision routine.',true);
    const now = new Date(), chart = [];
    for (let i=6;i>=0;i--) { const date = new Date(now.getTime()-i*86400000), key = day(date); chart.push({date,key,seconds:Object.values(days[key] || {}).reduce((a,b) => a+Number(b || 0),0)}); }
    const seconds = chart.reduce((a,b) => a+b.seconds,0), todayMinutes = Math.floor(chart[6].seconds/60), goal = data.goal || 30;
    $('today-minutes').innerHTML = format(todayMinutes) + '<span>min</span>';
    $('daily-goal-label').textContent = 'of your '+goal+' min goal';
    $('goal-circle').style.strokeDashoffset = String(371*(1-Math.min(1,todayMinutes/goal)));
    $('week-time').textContent = format(seconds/60)+' min'; $('week-days').textContent = chart.filter(d => d.seconds>0).length+' active days';
    const max = Math.max(goal*60,...chart.map(d => d.seconds));
    $('activity-chart').innerHTML = chart.map(d => `<div class="chart-col" title="${d.key}: ${Math.round(d.seconds/60)} min" aria-label="${d.key}: ${Math.round(d.seconds/60)} minutes"><div class="chart-bar" style="--bar:${Math.max(0,d.seconds/max*95)}%"></div><small>${d.date.toLocaleDateString('en-GB',{weekday:'short',timeZone:'Asia/Dhaka'})}</small></div>`).join('');
    $('progress-table').innerHTML = modules.map(m => { const s = metric(m.id); return `<tr><td><a href="#study/${m.id}">${esc(m.bn)}</a><small>${esc(m.en)} · ${esc(m.categoryName)}</small></td><td>${s.error ? 'Unavailable' : format(s.attempted)}</td><td>${accuracy(s)}</td><td>${format(s.mastered)}</td><td>${format(s.due)}</td><td>${esc(shortDate(recent[m.id]))}</td></tr>`; }).join('');
  }
  async function refresh() {
    clearTimeout(refreshTimer);
    const state = StudyStore.status();
    $('sync-status').innerHTML = '<i></i>'+esc(state.label); $('sync-status').title = state.error;
    $('sync-status').classList.toggle('pending',!!state.error);
    $('footer-sync').textContent = state.lastSync ? 'Last cloud sync '+new Date(state.lastSync).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : state.label;
    if (!state.uid) return;
    summaries = await StudyStore.summaries();
    renderOverview(); if (view === 'library') renderLibrary();
  }
  async function route() {
    const [next,id] = location.hash.slice(1).split('/');
    const target = ['overview','library','review','progress','study'].includes(next) ? next : 'overview';
    if (currentModule && (target !== 'study' || id !== currentModule)) {
      // Allow the original tools' 120ms save debounces to commit before removing the frame.
      await new Promise(resolve => setTimeout(resolve,200));
      $('study-frame-host').replaceChildren(); currentModule = null;
    }
    view = target;
    $('sidebar').classList.remove('open'); $('mobile-menu').setAttribute('aria-expanded','false');
    document.querySelectorAll('[data-route]').forEach(a => a.classList.toggle('active',a.dataset.route === view || (view === 'study' && a.dataset.route === 'library')));
    const studying = target === 'study', mod = studying && modules.find(m => m.id === id);
    if (studying && !mod) { location.hash = '#library'; toast('That study tool was not found.'); return; }
    document.documentElement.classList.toggle('studying',studying);
    $('dashboard-view').hidden = studying; $('study-view').hidden = !studying;
    $('breadcrumb').textContent = studying ? mod.categoryName : {overview:'Overview',library:'Study library',review:'Review queue',progress:'Progress record'}[target];
    for (const v of ['overview','library','review','progress']) $(v+'-content').hidden = v !== target;
    const copy = {overview:['Preparation, all together.','এক জায়গায় সব বিষয়, প্রতিদিনের অগ্রগতি।'],library:['A place for every subject.','বই, প্রশ্নব্যাংক, আর আপনার সব প্রস্তুতির টুল।'],review:['Keep your knowledge close.','নিয়মিত রিভিশনে শেখা হোক আরও স্থায়ী।'],progress:['See how far you’ve come.','সব বিষয়ের অগ্রগতির একত্রিত রেকর্ড।']};
    if (!studying) { $('page-title').textContent=copy[target][0]; $('page-description').textContent=copy[target][1]; }
    if (target === 'library') { category = ['bcs','bank','tfp'].includes(id) ? id : 'all'; renderLibrary(); }
    if (studying && currentModule !== id) {
      currentModule = id; $('study-title').textContent = mod.bn; $('study-subtitle').textContent = mod.en;
      $('standalone-link').href = mod.path;
      const frame = document.createElement('iframe'); frame.title = mod.bn+' — '+mod.en; frame.src = mod.path;
      $('study-frame-host').append(frame);
    }
    window.scrollTo(0,0); refresh();
  }
  function download(data,name) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  async function backup() { download(await StudyStore.exportBackup(),'myjobpreparation-'+day(new Date())+'.json'); }
  function countdown() {
    const value=$('exam-input').value;
    const days=value ? Math.ceil((new Date(value+'T23:59:59+06:00')-Date.now())/86400000) : null;
    $('exam-countdown').textContent = days === null ? '' : days < 0 ? 'Your selected exam date has passed.' : days+' days to your selected exam date.';
  }
  $('mobile-menu').onclick=() => { const open=$('sidebar').classList.toggle('open'); $('mobile-menu').setAttribute('aria-expanded',String(open)); };
  $('account-button').onclick=() => { if (window.AG_OPEN_ACCOUNT) window.AG_OPEN_ACCOUNT(); };
  $('settings-button').onclick=() => { const data=StudyStore.hubData(); $('goal-input').value=data.goal || 30; $('exam-input').value=data.examDate || ''; countdown(); $('settings-dialog').showModal(); };
  document.querySelectorAll('[data-close-dialog]').forEach(b => b.onclick=() => b.closest('dialog').close());
  $('exam-input').oninput=countdown;
  $('settings-form').onsubmit=e => { e.preventDefault(); const data=StudyStore.hubData(); data.goal=Number($('goal-input').value); data.examDate=$('exam-input').value; StudyStore.saveHub(data); $('settings-dialog').close(); toast('Study settings saved.'); StudyStore.flush(); };
  $('category-filters').onclick=e => { const button=e.target.closest('[data-category]'); if (button) { category=button.dataset.category; renderLibrary(); } };
  ['module-search','section-filter','sort-modules','saved-only'].forEach(id => $(id).addEventListener(id === 'module-search' ? 'input' : 'change',renderLibrary));
  document.addEventListener('click',e => { const button=e.target.closest('[data-save]'); if (!button) return; const data=StudyStore.hubData(); data.saved ||= {}; data.saved[button.dataset.save]=!data.saved[button.dataset.save]; StudyStore.saveHub(data); renderLibrary(); });
  document.addEventListener('keydown',e => { if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); if (view !== 'library') location.hash='#library'; setTimeout(() => $('module-search').focus(),0); } if (e.key === 'Escape') { $('sidebar').classList.remove('open'); $('mobile-menu').setAttribute('aria-expanded','false'); } });
  $('export-button').onclick=async () => { try { await backup(); toast('Backup downloaded for every study tool.'); } catch(e) { toast('Backup failed: '+e.message); } };
  $('import-button').onclick=() => $('import-file').click();
  $('import-file').onchange=async e => { const file=e.target.files[0]; if (!file) return; try { if (file.size>20*1024*1024) throw new Error('Backup is too large (maximum 20 MB).'); pendingBackup=StudyStore.validateBackup(JSON.parse(await file.text())); $('restore-description').textContent=Object.keys(pendingBackup.modules).length+' module records · exported '+new Date(pendingBackup.exportedAt).toLocaleString(); $('restore-dialog').showModal(); } catch(e) { toast(e.message); } finally { $('import-file').value=''; } };
  $('confirm-restore').onclick=async () => { const button=$('confirm-restore'); button.disabled=true; try { await backup(); await StudyStore.importBackup(pendingBackup); $('restore-dialog').close(); toast('Progress restored.'); await refresh(); } catch(e) { toast('Restore failed: '+e.message); } finally { button.disabled=false; } };
  $('sync-button').onclick=async () => { $('sync-button').disabled=true; await StudyStore.syncNow(); $('sync-button').disabled=false; toast(StudyStore.status().label); };
  StudyStore.onChange(() => { clearTimeout(refreshTimer); refreshTimer=setTimeout(refresh,250); });
  window.addEventListener('study-ready',refresh); window.addEventListener('hashchange',route);
  $('today').textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Dhaka'});
  icons(); route();
})();
