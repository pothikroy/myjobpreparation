"""Build native-text GRE records from positioned text of the supplied PDF.

Input is the cached pdfplumber word list (t,x,r,y,b); never guesses missing text.
Question IDs and keys match book-data.js, preserving existing learning records.
Uncertain notation and figure-dependent items are explicitly held out of drills.
"""
from pathlib import Path
import json,re,collections

ROOT=Path(__file__).resolve().parents[1]
book=json.loads((ROOT/'bank/gre-big-book/book-data.js').read_text(encoding='utf8').split('window.GRE_BOOK = ',1)[1].rstrip(';\n'))
words=json.loads((ROOT/'.qa/gre-words.json').read_text(encoding='utf8'))
pages=(ROOT/'.qa/gre-big-book.txt').read_text(encoding='utf8').split('\f')
def clean(t):
 t=re.sub(r'(?<=\w)-\s*\n\s*(?=[a-z])','',t)
 t=re.sub(r'GO ON TO THE NEXT PAGE\.?|STOP\s+IF YOU FINISH.*','',t,flags=re.I)
 t=t.replace('ﬁ','fi').replace('ﬂ','fl')
 return re.sub(r'[ \t]+',' ',t).strip()
def rows(ws):
 out=[]
 for w in sorted(ws,key=lambda w:(round(w['y']/3),w['x'])):
  found=next((r for r in reversed(out[-4:]) if abs(r['y']-w['y'])<3),None)
  if found:found['w'].append(w)
  else:out.append({'y':w['y'],'w':[w]})
 for r in out:
  r['w'].sort(key=lambda w:w['x']);r['t']=' '.join(w['t'] for w in r['w']);r['x']=r['w'][0]['x']
 return sorted(out,key=lambda r:r['y'])
def topic(s,q,stem):
 t=stem.lower()
 if s['kind']=='verbal':
  if q<=7:return 'sentence-completion'
  if q>=28 or ('Directions' not in stem and re.match(r'^[A-Z][A-Z -]+\s*:',stem) and '::' not in stem and q>20):return 'antonyms'
  if q<=16:return 'analogies'
  return 'reading'
 if s['kind']=='analytical':return 'critical-reasoning' if re.search(r'argument|weaken|strengthen|premise|conclusion|assumption|explain|reasoning|inference|discrepancy',t) else 'logic-games'
 for k,p in [('data',r'\bgraph\b|\bchart\b|\btable\b|distribution|median|average|standard deviation'),('geometry','circle|triangle|angle|polygon|perimeter|area|volume|rectangle|square|radius|cylinder'),('percent','percent|percentage|interest|discount|profit'),('ratio','ratio|proportion|fraction'),('number','integer|prime|remainder|divis|digit|decimal'),('word-problems','speed|hour|miles|work|rate|cost|price|dollar')]:
  if re.search(p,t):return k
 return 'comparison' if q<=15 else 'algebra'

records=[];contexts={};typedpages={};report=[]
for test in book['tests']:
 for s in test['sections']:
  stream=[]
  for p in range(s['startPage'],s['endPage']+1):
   ws=[w for w in words[p-1] if 55<w['y']<735]
   for col in [0,1]:
    rr=rows([w for w in ws if ((w['x']+w['r'])/2<300)==(col==0)])
    stream.extend(dict(r,p=p,col=col) for r in rr)
   typedpages[str(p)]=pages[p-1].strip()
  candidates=[]
  for i,r in enumerate(stream):
   m=re.match(r'^([1-9]|[12][0-9]|3[0-8])\s*[.．]\s*(.*)',r['t'])
   if m and int(m[1])<=s['count'] and r['x']<(175 if r['col']==0 else 420):
    candidates.append((i,int(m[1])))
  chosen={};last=-1
  for q in range(1,s['count']+1):
   found=next(((i,n) for i,n in candidates if n==q and i>last),None)
   if found:chosen[q]=found[0];last=found[0]
  # Each shared stimulus is bounded by its printed question range, or by the
  # start of a reading passage. Never carry a subsequent game's rules backwards.
  stimulus={}
  for i,r in enumerate(stream):
   m=re.search(r'Questions?\s*[)(]?\s*([1-3]?[0-9])[\s-]+([1-3]?[0-9])\b',r['t'],re.I)
   if m:
    first,last=map(int,m.groups());end=chosen.get(first,i)
    if end>i:
     text=clean('\n'.join(x['t'] for x in stream[i+1:end]))
     if len(text)>60:
      cid=f"{s['id']}-rules-{first}";contexts[cid]=text
      for n in range(first,last+1):stimulus[n]=cid
  if s['kind']=='verbal':
   current=None
   for q,a in chosen.items():
    if not 17<=q<=27:continue
    p=stream[a]['p'];col=stream[a]['col']
    start=next(i for i,x in enumerate(stream) if x['p']==p and x['col']==0)
    prefix=stream[start:a]
    # A new passage has no earlier question marker in its left column.
    left=[x for x in prefix if x['col']==0 and not re.match(r'^\d+\s*[.]',x['t'])]
    earlier=any(start<=v<a for n,v in chosen.items() if n<q)
    if not earlier and len(' '.join(x['t'] for x in left))>250:
     left=[x for x in left if not re.search(r'Directions:|the best answer to each|that passage\.|the basis of',x['t'],re.I)]
     text=clean('\n'.join(x['t'] for x in left))
     text=re.sub(r'(?m)^\s*(?:Line|\([0-9]+\))\s*','',text)
     current=f"{s['id']}-passage-{q}";contexts[current]=text
    if current:stimulus[q]=current
  context='';context_id=None;previous_end=0
  for q in range(1,s['count']+1):
   id=f"{s['id']}-q{q:02}"
   if q not in chosen:
    records.append(dict(id=id,sectionId=s['id'],number=q,test=s['test'],kind=s['kind'],topic=topic(s,q,''),page=s['startPage'],stem='',options={},answer=s['answers'][q-1],issues=['Question boundary could not be recovered from the scan.'],status='source-check'))
    report.append(id+': missing boundary');continue
   a=chosen[q];b=min([v for n,v in chosen.items() if n>q]+[len(stream)])
   block=stream[a:b];page=stream[a]['p']
   if not (s['kind']=='quantitative' and q<=15):
    e_at=next((j for j,r in enumerate(block) if re.search(r'[(]\s*E\s*[)]',r['t'])),None)
    if e_at is not None:
     for j in range(e_at+1,len(block)):
      if (block[j]['p'],block[j]['col'])!=(block[j-1]['p'],block[j-1]['col']) or block[j]['y']-block[j-1]['y']>18 or re.match(r'Questions? |Directions:',block[j]['t']):block=block[:j];break
   # Prefixes on a new column/page contain shared passages and rule sets.
   same=[i for i in range(previous_end,a) if stream[i]['p']==page and stream[i]['col']==stream[a]['col']]
   if same:
    prefix=clean('\n'.join(stream[i]['t'] for i in same))
    if len(prefix)>130 and not re.search(r'Column A|Time.?30|Directions:',prefix,re.I):context=prefix;context_id=f"{s['id']}-context-{q}";contexts[context_id]=context
   # Split at each explicit option marker, including several options on one line.
   text='\n'.join(r['t'] for r in block if not (re.fullmatch(r'\d+',r['t']) and r['y']>700))
   text=re.sub(r'^\d+\s*[.．]\s*','',text)
   parts=re.split(r'[({]\s*([A-E])\s*[)}]',text)
   stem=clean(parts[0]);opts={}
   for j in range(1,len(parts)-1,2):
    letter=parts[j];value=parts[j+1]
    if letter in opts:break
    # After option E a new passage/rule set is separate content.
    if letter=='E':
     cuts=list(re.finditer(r'\n(?:Questions?\s*\d|Directions:)',value,re.I))
     if cuts:
      tail=clean(value[cuts[0].start():]);value=value[:cuts[0].start()]
      context=tail;context_id=f"{s['id']}-context-after-{q}";contexts[context_id]=tail
    opts[letter]=clean(value)
   issues=[]
   if s['kind']=='quantitative' and q<=15:
    issues.append('Comparison layout or mathematical notation needs source verification.');opts={a:b for a,b in zip('ABCD',['Column A is greater','Column B is greater','The quantities are equal','The relationship cannot be determined'])}
   elif set(opts)!=set('ABCDE'):issues.append('An option is missing or damaged in the scan.')
   if re.search(r'\ufffd|[~_]{2,}|\{[^A-E]|[A-Za-z][~{}][A-Za-z]',stem+' '.join(opts.values())):issues.append('The scan contains uncertain characters or notation.')
   if s['kind']=='quantitative' and re.search(r'graph|figure|diagram|shaded|shown|table above|table below',stem,re.I):issues.append('A figure or data table must be checked before scoring.')
   if len(stem)<5:issues.append('The question statement is incomplete.')
   if s['kind']=='quantitative':issues.append('Mathematical notation has not been proofread.')
   record=dict(id=id,sectionId=s['id'],number=q,test=s['test'],kind=s['kind'],topic=topic(s,q,stem),page=page,stem=stem,options=opts,answer=s['answers'][q-1],issues=issues,status='source-check' if issues else 'transcribed')
   if q in stimulus:record['contextId']=stimulus[q]
   if record['topic'] in ['reading','logic-games'] and 'contextId' not in record:record['issues'].append('The shared passage or rules need checking.');record['status']='source-check'
   # All automatic text is a transcription draft, never a proofread claim.
   record['reviewed']=False
   records.append(record);previous_end=b

from gre_reviewed import apply
apply(records,contexts)
for r in records:
 r['tags']=[r['topic']]
 if r['kind']=='quantitative' and r['number']<=15 and r['topic']!='comparison':r['tags'].append('comparison')
# Native text is intentionally available even where a damaged item is held out.
out=dict(version=2,source='User-supplied GRE Big Book scan',reviewedOn='2026-10-29',questions=records,contexts=contexts,pages=typedpages)
(ROOT/'bank/gre-big-book/typed-data.js').write_text('/* Generated native-text transcription; see TRANSCRIPTION.md. */\nwindow.GRE_TYPED='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
(ROOT/'.qa/gre-transcription-report.json').write_text(json.dumps({'counts':dict(collections.Counter(r['status'] for r in records)),'missing':report,'topics':dict(collections.Counter(r['topic'] for r in records))},indent=2),encoding='utf8')
print(len(records),'records;',collections.Counter(r['status'] for r in records),'contexts',len(contexts))
