/* Consistent navigation, reading preferences and accessibility for every study tool. */
(function () {
 'use strict';
 const rootURL = new URL('.',document.currentScript.src).href;
 const catalog = window.STUDY_CATALOG || [];
 const $ = id => document.getElementById(id);
 const esc = text => String(text ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const defaults = {theme:'light',fontSize:18,lineHeight:1.85,width:'comfortable'};
 const paths = {
  book:'M3 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H3z M12 7a3 3 0 0 1 3-3h6v14h-5a4 4 0 0 0-4 3',
  home:'m3 10 9-7 9 7 M5 9v12h14V9 M9 21v-7h6v7',
  chevron:'m8 10 4 4 4-4', arrow:'M4 12h16 M14 6l6 6-6 6', close:'m6 6 12 12 M18 6 6 18',
  appearance:'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  focus:'M8 3H3v5 M16 3h5v5 M3 16v5h5 M16 21h5v-5',
  user:'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 21v-2a8 8 0 0 1 16 0v2',
  help:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4 M12 17h.01',
  dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  repeat:'M20 7a8 8 0 0 0-14-2L3 8 M3 3v5h5 M4 17a8 8 0 0 0 14 2l3-3 M16 16h5v5',
  quiz:'M8 3h10l3 3v15H3V3h2 M7 9h10 M7 13h10 M7 17h6',
  star:'m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z',
  notes:'M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5',
  chart:'M4 3v17h17 M8 15v-4 M13 15V7 M18 15v-6',
  alert:'m12 3 10 18H2z M12 9v5 M12 17h.01', search:'m21 21-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'
 };
 const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.book}"/></svg>`;
 let initialized=false, prefs={...defaults}, surface, mod, isDashboard=false, focus=false, observer, enhanceTimer, signature='', nativeThemeClick=false;
 const link = hash => rootURL+'index.html#'+hash;
 const target = () => window.self === window.top ? '_self' : '_top';
 function readPreferences() {
  const data=window.StudyStore?.hubData().reader || {};
  return {theme:['light','dark','sepia','system'].includes(data.theme)?data.theme:defaults.theme,
   fontSize:Math.max(16,Math.min(24,Number(data.fontSize)||18)),lineHeight:[1.6,1.85,2.1].includes(Number(data.lineHeight))?Number(data.lineHeight):1.85,
   width:['comfortable','wide'].includes(data.width)?data.width:'comfortable'};
 }
 function applyPreferences() {
  const doc=document.documentElement;
  const theme=prefs.theme==='system' ? (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light') : prefs.theme;
  doc.dataset.studyTheme=theme;
  const native=theme==='dark'?'dark':'light';
  if(doc.dataset.theme!==native)doc.dataset.theme=native;
  if(document.body.dataset.theme!==native)document.body.dataset.theme=native;
  doc.style.setProperty('--ui-reader-size',prefs.fontSize+'px');
  doc.style.setProperty('--ui-reading-scale',String(prefs.fontSize/18));
  doc.style.setProperty('--ui-reader-line',String(prefs.lineHeight));
  doc.style.setProperty('--ui-reading-width',prefs.width==='wide'?'112ch':'78ch');
  document.querySelectorAll('[data-ui-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.uiTheme===prefs.theme)));
  if($('ui-font-size')){$('ui-font-size').value=prefs.fontSize;$('ui-font-output').value=prefs.fontSize+'px';$('ui-line-height').value=prefs.lineHeight;$('ui-reading-width').value=prefs.width;}
 }
 function savePreferences() {
  const data=StudyStore.hubData();data.reader={...prefs};signature=JSON.stringify(prefs);StudyStore.saveHub(data);applyPreferences();
 }
 function dialog(id,label,body,extraClass='') {
  const node=document.createElement('dialog');node.id=id;node.className='ui-dialog '+extraClass;
  node.lang='en';
  node.setAttribute('aria-labelledby',id+'-title');
  node.innerHTML=`<div class="ui-dialog-head"><h2 id="${id}-title">${label}</h2><button type="button" class="ui-icon-button" data-ui-close aria-label="Close ${label.toLowerCase()}">${icon('close')}</button></div>${body}`;
  document.body.append(node);
  node.querySelectorAll('[data-ui-close]').forEach(b=>b.onclick=()=>node.close());
  node.addEventListener('click',e=>{if(e.target!==node)return;const r=node.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)node.close();});
  return node;
 }
 function createDialogs() {
  dialog('ui-appearance','Reading appearance',`<p>A comfortable reading setup, remembered across your study tools.</p><h3>Colour theme</h3><div class="ui-theme-options" role="group" aria-label="Colour theme">${[['light','Light','#fff'],['dark','Dark','#192631'],['sepia','Sepia','#f3eddf'],['system','System','linear-gradient(90deg,#fff 50%,#192631 50%)']].map(([key,label,swatch])=>`<button type="button" data-ui-theme="${key}" aria-pressed="false"><span class="ui-swatch" style="--swatch:${swatch}"></span>${label}</button>`).join('')}</div><h3><label for="ui-font-size">Reading text size</label></h3><div class="ui-range-row"><input type="range" id="ui-font-size" min="16" max="24" step="1" aria-describedby="ui-font-output"><output id="ui-font-output" for="ui-font-size">18px</output></div><h3><label for="ui-line-height">Line spacing</label></h3><select id="ui-line-height"><option value="1.6">Compact</option><option value="1.85">Comfortable</option><option value="2.1">Relaxed</option></select><h3><label for="ui-reading-width">Reading width</label></h3><select id="ui-reading-width"><option value="comfortable">Comfortable · shorter lines</option><option value="wide">Wide · more content</option></select><div class="ui-reading-preview">পড়ুন, অনুশীলন করুন, এগিয়ে যান।<small>Read at your own pace. Your next chapter is waiting.</small></div><div class="ui-dialog-foot"><button type="button" class="ui-text-button" id="ui-reset-reading">Reset appearance</button><button type="button" class="ui-primary-button" data-ui-close>Done</button></div>`);
  $('ui-appearance').querySelectorAll('[data-ui-theme]').forEach(b=>b.onclick=()=>{prefs.theme=b.dataset.uiTheme;savePreferences();});
  $('ui-font-size').oninput=()=>{prefs.fontSize=Number($('ui-font-size').value);savePreferences();};
  $('ui-line-height').onchange=()=>{prefs.lineHeight=Number($('ui-line-height').value);savePreferences();};
  $('ui-reading-width').onchange=()=>{prefs.width=$('ui-reading-width').value;savePreferences();};
  $('ui-reset-reading').onclick=()=>{prefs={...defaults};savePreferences();};
  dialog('ui-tool-picker','Your study library',`<p>Switch subjects without losing your place.</p><input type="search" class="ui-module-search" id="ui-tool-search" aria-label="Find a study tool" placeholder="Search subjects, books and tools…"><div class="ui-tool-list" id="ui-tool-list"></div><div class="ui-dialog-foot"><a class="ui-text-button" href="${link('library')}" target="${target()}">Browse full library ${icon('arrow')}</a><button class="ui-text-button" type="button" id="ui-picker-account">My account</button></div>`,'ui-module-dialog');
  $('ui-tool-search').oninput=renderTools;
  $('ui-picker-account').onclick=()=>{$('ui-tool-picker').close();window.AG_OPEN_ACCOUNT?.();};
  dialog('ui-study-help','A calmer way to study',`<p>Use the module’s subject navigation for topics, practice and revision. Your shared progress is available from the main dashboard.</p><div class="ui-help-link"><span>Find a study tool</span><kbd>Ctrl / ⌘ + K</kbd></div><div class="ui-help-link"><span>Toggle focus mode</span><kbd>Alt + Shift + F</kbd></div><div class="ui-help-link"><span>Close a panel</span><kbd>Esc</kbd></div><div class="ui-help-link"><span>Move through controls</span><kbd>Tab / Shift + Tab</kbd></div><p>Your progress is saved on this device and synced to your signed-in account. Use Progress record → Export all progress for a full backup.</p><div class="ui-dialog-foot"><a class="ui-text-button" href="${link('progress')}" target="${target()}">Open progress record ${icon('arrow')}</a><button type="button" class="ui-primary-button" data-ui-close>Got it</button></div>`);
 }
 function renderTools() {
  const q=$('ui-tool-search').value.trim().toLowerCase();
  const result=catalog.filter(m=>[m.id,m.bn,m.en,m.subject,m.categoryName].join(' ').toLowerCase().includes(q));
  let category='';
  $('ui-tool-list').innerHTML=result.map(m=>{let heading='';if(m.category!==category){category=m.category;heading=`<div class="ui-tool-group">${esc(m.categoryName)}</div>`;}return `${heading}<a class="ui-tool-link" href="${link('study/'+m.id)}" target="${target()}" ${m.id===mod?.id?'aria-current="page"':''}>${icon('book')}<span><b>${esc(m.bn)}</b><small>${esc(m.en)}</small></span>${icon('arrow')}</a>`;}).join('')||'<p class="ui-empty">No study tools match. Try another subject or title.</p>';
 }
 function openTools() {renderTools();$('ui-tool-picker').showModal();$('ui-tool-search').focus();}
 function toggleFocus() {
  if(isDashboard)return;
  focus=!focus;document.documentElement.dataset.studyFocus=String(focus);
  const button=$('ui-focus');button.setAttribute('aria-pressed',String(focus));button.setAttribute('aria-label',focus?'Exit focus mode':'Enter focus mode');button.title=focus?'Exit focus mode':'Focus mode · Alt + Shift + F';
  window.dispatchEvent(new Event('resize'));
 }
 function createBar() {
  const skip=document.createElement('a');skip.className='ui-skip';skip.href='#ui-study-surface';skip.textContent='Skip to study content';document.body.prepend(skip);
  const bar=document.createElement('header');bar.id='ui-studybar';bar.lang='en';bar.setAttribute('aria-label','Study workspace');
  bar.innerHTML=`<a class="ui-brand" href="${link('overview')}" target="${target()}" aria-label="পথিক — main dashboard"><span class="ui-brand-mark">${icon('book')}</span>পথিক</a><button type="button" class="ui-module-button" id="ui-pick-tool" aria-haspopup="dialog" aria-label="Switch study tool: ${esc(mod?.bn||AG_PAGE.title)}"><span>${esc(mod?.bn||AG_PAGE.title)}<small>${esc(mod?.categoryName||'Study workspace')} · ${esc(mod?.en||'')}</small></span>${icon('chevron')}</button><div class="ui-bar-actions"><span class="ui-save-state" id="ui-save-state" role="status">Progress saved</span><button type="button" class="ui-icon-button" id="ui-focus" aria-label="Enter focus mode" title="Focus mode · Alt + Shift + F" aria-pressed="false">${icon('focus')}</button><button type="button" class="ui-icon-button" id="ui-open-appearance" aria-label="Reading appearance" title="Reading appearance">${icon('appearance')}</button><button type="button" class="ui-icon-button ui-help-button" id="ui-open-help" aria-label="Study help and keyboard shortcuts" title="Study help">${icon('help')}</button><button type="button" class="ui-icon-button ui-account-button" id="ui-open-account" aria-label="My account" title="My account">${icon('user')}</button></div>`;
  document.body.prepend(bar);$('ui-pick-tool').onclick=openTools;$('ui-focus').onclick=toggleFocus;
  $('ui-open-appearance').onclick=()=>$('ui-appearance').showModal();$('ui-open-help').onclick=()=>$('ui-study-help').showModal();$('ui-open-account').onclick=()=>window.AG_OPEN_ACCOUNT?.();
 }
 function wrapApp() {
  surface=document.createElement('div');surface.id='ui-study-surface';surface.tabIndex=-1;surface.setAttribute('aria-label',AG_PAGE.title+' study content');
  const excluded=new Set(['ag-overlay','ag-sidebar','ag-tab']);
  const nodes=Array.from(document.body.childNodes).filter(n=>n.nodeType!==1||(!excluded.has(n.id)&&!n.matches('script,style,link')));
  document.body.append(surface);nodes.forEach(n=>surface.append(n));
  surface.querySelectorAll(':scope > #app,:scope > #appRoot,:scope > #appwrap,:scope > #shell,:scope > .app-shell,:scope > .app-layout').forEach(n=>n.dataset.uiAppRoot='true');
 }
 function navIcon(label) {
  if(/dashboard|overview|home|ড্যাশবোর্ড|হোম/.test(label))return 'dashboard';
  if(/revision|review|রিভিশন/.test(label))return 'repeat';
  if(/mistake|wrong|ভুল|দুর্বল/.test(label))return 'alert';
  if(/bookmark|favorite|বুকমার্ক|জানতেই/.test(label))return 'star';
  if(/quiz|mock|exam|practice|কুইজ|পরীক্ষা|অনুশীলন/.test(label))return 'quiz';
  if(/notes|নোট/.test(label))return 'notes';
  if(/progress|stat|analytics|অগ্রগতি/.test(label))return 'chart';
  if(/setting|সেটিং/.test(label))return 'appearance';
  if(/search|সার্চ/.test(label))return 'search';
  if(/help|about|সহায়তা/.test(label))return 'help';
  return 'book';
 }
 function controlName(el) {
  const context=[el.getAttribute('onclick'),el.id,el.className,el.dataset.action,el.dataset.nav,el.dataset.go].filter(Boolean).join(' ');
  const text=el.textContent.trim();
  if(/theme/i.test(context)||/[🌙☀🌗]/u.test(text))return 'Toggle colour theme';
  if(/close|dismiss|cancel/i.test(context)||/^[✕✖×xX]$/.test(text))return 'Close panel';
  if(/search/i.test(context)||/^[🔍⌕]$/u.test(text))return 'Search this module';
  if(/menu|hamburger|sidebar/i.test(context)||/^[☰≡]$/.test(text))return 'Open subject navigation';
  if(/prev|back/i.test(context)||/^[←‹«◀]$/.test(text))return 'Previous item';
  if(/next|forward/i.test(context)||/^[→›»▶]$/.test(text))return 'Next item';
  if(/bookmark|favorite/i.test(context)||/^[☆★⭐]$/u.test(text))return 'Toggle bookmark';
  if(/help/i.test(context)||text==='?')return 'Help';
  if(/settings|preference/i.test(context)||/^⚙\uFE0F?$/.test(text))return 'Module settings';
  if(/topicdetail/i.test(context))return 'Open topic details · '+text;
  if(/dashboard|home/i.test(context)||text==='🏠')return 'Module dashboard';
  if(/speak|pronounce|audio/i.test(context)||text==='🔊')return 'Pronounce word';
  if(/focus|zen|fullscreen/i.test(context))return 'Toggle focus mode';
  if(/font/i.test(context))return /minus|decrease|smaller/i.test(context)?'Decrease text size':'Increase text size';
  if(el.matches('input[type=file]'))return 'Choose a progress backup file';
  if(el.matches('input[type=checkbox],input[type=radio]'))return el.closest('label')?.textContent.trim()||el.parentElement.textContent.trim().slice(0,80)||'Study preference';
  return el.placeholder||el.id.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').trim()||'';
 }
 function enhance() {
  if(!surface)return;
  const controls=surface.querySelectorAll('button,input:not([type=hidden]),select,textarea');
  controls.forEach(el=>{
   if(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||el.labels?.length)return;
   if(el.title){el.setAttribute('aria-label',el.title);return;}
   if(el.matches('button')&&/[\p{L}]/u.test(el.textContent))return;
   const name=controlName(el);if(name)el.setAttribute('aria-label',name);
  });
  surface.querySelectorAll('div[onclick],span[onclick],li[onclick],div[data-action],div[data-go],li[data-go],div.topic-card,div.chapter-card,div.topic-row,div.chapter-row,div.nav-item,div.navitem,div.side-link,div.side-sublink').forEach(el=>{
   if(el.getAttribute('role')||el.querySelector('button,a[href],input,select,textarea')||(!el.hasAttribute('onclick')&&typeof el.onclick!=='function'&&getComputedStyle(el).cursor!=='pointer'))return;
   el.setAttribute('role','button');el.tabIndex=0;
   el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();el.click();}});
  });
  surface.querySelectorAll('table').forEach(table=>{
   if(table.parentElement.classList.contains('ui-table-scroll')||['auto','scroll'].includes(getComputedStyle(table.parentElement).overflowX)){table.parentElement.dataset.uiHorizontal='true';return;}
   const wrap=document.createElement('div');wrap.className='ui-table-scroll';wrap.dataset.uiHorizontal='true';wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Scrollable study table');table.before(wrap);wrap.append(table);
  });
  surface.querySelectorAll('.ui-table-scroll').forEach(el=>{if(el.scrollWidth>el.clientWidth)el.tabIndex=0;else el.removeAttribute('tabindex');});
  surface.querySelectorAll('.topnav,.activity-bars,#mobilebar .mrow').forEach(el=>{if(['auto','scroll'].includes(getComputedStyle(el).overflowX))el.dataset.uiHorizontal='true';});
  surface.querySelectorAll('.sidebar .nav-item,#sidebar .nav-item,.sidebar .navitem,#sidebar .navitem,.sidebar .nav-btn,.sidebar .nav-link,.sidebar .side-link,.sidebar .side-sublink,#sidenav button,.side-nav button,.sidebar .nav-list button,#nav-fixed .nav-item').forEach(el=>{
   if(el.classList.contains('active'))el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
   if(el.dataset.uiNav)return;el.dataset.uiNav='true';
   const name=navIcon(el.textContent.toLowerCase()),existing=el.querySelector(':scope > .ic,:scope > .nav-ic,:scope > .nav-icon');
   if(existing&&!existing.querySelector('input,button')){existing.classList.add('ui-nav-icon');existing.innerHTML=icon(name);existing.setAttribute('aria-hidden','true');}
   else if(!el.querySelector(':scope > svg,:scope > .ui-nav-icon')){
    const first=Array.from(el.childNodes).find(n=>n.nodeType===3&&n.textContent.trim());
    if(first)first.textContent=first.textContent.replace(/^[^\p{L}\p{N}]+/u,'');
    const span=document.createElement('span');span.className='ui-nav-icon';span.innerHTML=icon(name);span.setAttribute('aria-hidden','true');el.prepend(span);
   }
  });
  const leaves=surface.querySelectorAll('span,small,p,div,label,th,td,a,button,h2,h3,h4,li,b,kbd,footer');
  for(const el of leaves){if(el.hasAttribute('data-ui-small')||!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim())||!el.getClientRects().length)continue;if(parseFloat(getComputedStyle(el).fontSize)<13)el.dataset.uiSmall='true';}
  surface.querySelectorAll('main,.main,#main,.content,#content').forEach(el=>{if(['auto','scroll'].includes(getComputedStyle(el).overflowY))el.dataset.uiScroll='true';});
  surface.querySelectorAll('.sidebar,#sidebar,.side-nav,#sidenav').forEach(el=>{
   const r=el.getBoundingClientRect(),hidden=getComputedStyle(el).display==='none'||r.right<=1||r.left>=window.innerWidth;
   el.inert=hidden;el.setAttribute('aria-hidden',String(hidden));el.setAttribute('aria-label','Subject navigation');
  });
 }
 function updateStatus() {
  const state=StudyStore.status(),label=$('ui-save-state');
  if(label){label.textContent=state.error?'Saved on this device':state.label==='Cloud synced'?'Cloud synced':'Saving progress…';label.title=state.error?'Your local progress is safe. Cloud sync will retry.':state.label;label.classList.toggle('pending',!!state.error);}
  const incoming=readPreferences(),next=JSON.stringify(incoming);if(next!==signature){prefs=incoming;signature=next;applyPreferences();}
 }
 function init() {
  if(initialized||!window.StudyStore?.status().uid)return;initialized=true;
  isDashboard=window.AG_PAGE?.id==='index';mod=catalog.find(m=>m.id===window.AG_PAGE?.id);
  document.documentElement.dataset.studyUi='true';if(!isDashboard)document.documentElement.dataset.studyModule=AG_PAGE.id;
  prefs=readPreferences();signature=JSON.stringify(prefs);
  if(!isDashboard)wrapApp();createDialogs();
  if(isDashboard){
   const actions=document.querySelector('.topbar-right');
   if(actions){const b=document.createElement('button');b.type='button';b.id='ui-open-appearance';b.className='icon-button';b.setAttribute('aria-label','Reading appearance');b.title='Reading appearance';b.innerHTML=icon('appearance');actions.insertBefore(b,$('settings-button'));b.onclick=()=>$('ui-appearance').showModal();}
  }else createBar();
  applyPreferences();updateStatus();StudyStore.onChange(updateStatus);
  if(surface){
   enhance();observer=new MutationObserver(()=>{clearTimeout(enhanceTimer);enhanceTimer=setTimeout(enhance,70);});observer.observe(surface,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
   window.addEventListener('resize',()=>{clearTimeout(enhanceTimer);enhanceTimer=setTimeout(enhance,100);});
  }
  const guard=new MutationObserver(()=>{if(nativeThemeClick)return;const native=document.documentElement.dataset.studyTheme==='dark'?'dark':'light';if(document.documentElement.dataset.theme!==native||document.body.dataset.theme!==native)applyPreferences();});
  guard.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});guard.observe(document.body,{attributes:true,attributeFilter:['data-theme']});
  document.addEventListener('click',e=>{
   const theme=e.target.closest('#themeToggle,#themeBtn,#theme-btn,.theme-btn,.themebtns,[data-theme-toggle],[onclick*="Theme"],[onclick*="theme"]');
   if(!theme||theme.closest('.ui-dialog,#ui-studybar'))return;
   nativeThemeClick=true;
   setTimeout(()=>{const expected=document.documentElement.dataset.studyTheme==='dark'?'dark':'light';const next=document.documentElement.dataset.theme!==expected?document.documentElement.dataset.theme:document.body.dataset.theme;prefs.theme=next==='dark'?'dark':'light';savePreferences();nativeThemeClick=false;},0);
  },true);
  document.addEventListener('keydown',e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopImmediatePropagation();if(!$('ui-tool-picker').open)openTools();}
   if(e.altKey&&e.shiftKey&&e.code==='KeyF'){e.preventDefault();e.stopImmediatePropagation();toggleFocus();}
  },true);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(prefs.theme==='system')applyPreferences();});
 }
 window.StudyUI={init,openTools,openAppearance:()=>$('ui-appearance')?.showModal(),toggleFocus};
 window.addEventListener('study-ready',init,{once:true});
 if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('ag-overlay')?.style.display==='none')init();},{once:true});
})();
