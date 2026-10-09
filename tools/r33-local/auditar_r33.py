import sqlite3,json,hashlib,collections,csv,re,pathlib
import argparse
_parser=argparse.ArgumentParser()
_parser.add_argument('--database',type=pathlib.Path,default=pathlib.Path('tools/r33-local/workspace/mls.sqlite'))
_parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('tools/r33-local/workspace/output/r33'))
_args=_parser.parse_args()
R=pathlib.Path.cwd();O=_args.output.resolve();O.mkdir(parents=True,exist_ok=True)
c=sqlite3.connect('file:'+str(_args.database.resolve())+'?mode=ro',uri=True);c.row_factory=sqlite3.Row
load=lambda t:[dict(x) for x in c.execute('select * from '+t)]
arts=load('wiki_articles');by={a['code']:a for a in arts};hashes={a['code']:hashlib.sha256(a['article_markdown'].encode()).hexdigest() for a in arts}
locked=lambda row:row['code'] in by and row.get('article_hash')==hashes[row['code']] and row.get('article_generated_at')==by[row['code']]['generated_at']
claims=load('wiki_evidence_claims');sources={s['source_id']:s for s in load('wiki_sources')};links=load('wiki_evidence_links');states={s['code']:s for s in load('wiki_evidence_entry_state')};reviews=load('wiki_evidence_reviews');conflicts=load('wiki_evidence_conflicts');queues={s['code']:s for s in load('mls_canonical_queue')}
clby=collections.defaultdict(list);lnby=collections.defaultdict(list);revby=collections.defaultdict(list)
for q in claims:clby[q['code']].append(q)
for l in links:lnby[l['claim_id']].append(l)
for r in reviews:revby[r['code']].append(r)
caches={};badcache=[]
for row in load('r44_entry_cache'):
 try:p=json.loads(row['content_json']);md=p.get('articleMarkdown') or p.get('article_markdown');caches[row['code']]={'same_article':bool(md and hashlib.sha256(md.encode()).hexdigest()==hashes.get(row['code'])),'stored_sha':row['sha256'],'bytes_sha':hashlib.sha256(row['content_json'].encode()).hexdigest()}
 except Exception:badcache.append(row['code'])
candidates=collections.defaultdict(list);raw=[]
for table,field in [('r44_receipts','payload_json'),('r44_preview_articles','payload_json')]:
 for row in load(table):
  p=json.loads(row[field]);code=row['code'];ss=p.get('sources',p.get('references',[]));ss=ss if isinstance(ss,list) else [ss]
  integrity=hashlib.sha256(row[field].encode()).hexdigest()==row.get('payload_sha256',row.get('result_sha256'))
  current=caches.get(code,{}).get('same_article',False) if table=='r44_receipts' else False
  correction=p.get('correctedContent') or p.get('articleMarkdown') or p.get('correctedArticleMarkdown')
  for s in ss:
   item={'code':code,'origin':table,'source':s,'payload_integrity':integrity,'cache_article_matches_current':current,'status':'CANDIDATE_REQUIRES_CLAIM_AND_LOCATOR_REVIEW'};candidates[code].append(item)
  raw.append({'code':code,'origin':table,'payload_integrity':integrity,'cache_article_matches_current':current,'outcome':p.get('outcome'),'claims':p.get('claims',p.get('evidence')),'sources':ss,'corrected_content':correction,'notes':p.get('notes')})
repair={r['source_id']:r for r in load('mls_r33_repair_sources')}
for l in load('mls_r33_repair_source_links'):
 s=repair.get(l['source_id']);
 if s:candidates[l['code']].append({'code':l['code'],'origin':'repair','source':json.loads(s['source_json']),'provenance':json.loads(s['provenance_json']),'status':'CANDIDATE_REQUIRES_CLAIM_AND_LOCATOR_REVIEW'})
rows=[]
for a in arts:
 code=a['code'];qs=clby[code];cur=[q for q in qs if locked(q)];st=states.get(code);stmatch=bool(st and locked(st));sids={l['source_id'] for q in cur for l in lnby[q['claim_id']] if l['source_id'] in sources};active={sid for sid in sids if sources[sid]['status']=='active' and sources[sid]['authority_tier']!='X'};verified=[q for q in cur if q['status']=='verified'];unresolved=[x for x in conflicts if x['code']==code and x['article_generated_at']==a['generated_at'] and x['status']=='unresolved'];reviewmatch=[r for r in revby[code] if locked(r)]
 inconsistency=bool(stmatch and st['status'] in ['VERIFIED','REVIEWED'] and (len(verified)!=st['claims_verified'] or len(cur)!=st['claims_total']))
 cat='CURRENT_LINKED_EVIDENCE' if active else 'STALE_EVIDENCE' if qs or st else 'RECOVERABLE_CANDIDATES' if candidates[code] else 'NO_IDENTIFIED_REFERENCES'
 rows.append({'code':code,'language':a['language'],'title':a['title'],'article_sha256':hashes[code],'generated_at':a['generated_at'],'category':cat,'current_claims':len(cur),'verified_claim_rows':len(verified),'current_active_sources':len(active),'state_record':st['status'] if st else '', 'state_matches':stmatch,'state_claim_inconsistency':inconsistency,'matching_reviews':len(reviewmatch),'unresolved_conflicts':len(unresolved),'candidate_sources':len(candidates[code]),'r44_candidate':any(x['origin']=='r44_receipts' for x in candidates[code]),'canonical_queue_state':queues.get(code,{}).get('state',''),'source_heading_present':bool(re.search(r'^#{1,6}[^\n]*(?:fuentes|referencias|bibliograf)',a['article_markdown'],re.I|re.M)),'next_action':'RESOLVE_CONFLICT' if unresolved else 'RECONCILE_EVIDENCE_RECORDS' if inconsistency else 'REVIEW_CURRENT_CLAIMS_AND_RENDER' if active else 'VALIDATE_RECOVERED_CANDIDATES' if candidates[code] else 'RESEARCH_CLAIMS'})
with (O/'MLS-R33-auditoria-entradas.csv').open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
with (O/'MLS-R33-evidencia-recuperada.jsonl').open('w') as f:
 for x in raw:f.write(json.dumps(x,ensure_ascii=False)+'\n')
with (O/'MLS-R33-fuentes-candidatas.jsonl').open('w') as f:
 for code in sorted(candidates):
  for x in candidates[code]:f.write(json.dumps(x,ensure_ascii=False)+'\n')
report={'total':len(arts),'categories':dict(collections.Counter(x['category'] for x in rows)),'by_language':{},'source_registry':len(sources),'claim_rows':len(claims),'link_rows':len(links),'states':dict(collections.Counter(x['status'] for x in states.values())),'matching_state_rows':sum(x['state_matches'] for x in rows),'current_linked_entries':sum(x['current_active_sources']>0 for x in rows),'state_claim_inconsistencies':sum(x['state_claim_inconsistency'] for x in rows),'unresolved_current_conflicts':sum(x['unresolved_conflicts'] for x in rows),'entries_with_candidates':sum(x['candidate_sources']>0 for x in rows),'entries_with_source_heading':sum(x['source_heading_present'] for x in rows),'r44_recovered_records':sum(x['origin']=='r44_receipts' for x in raw),'preview_records':sum(x['origin']=='r44_preview_articles' for x in raw),'raw_hash_match_by_origin':{t:sum(x['payload_integrity'] for x in raw if x['origin']==t) for t in ['r44_receipts','r44_preview_articles']},'raw_hash_unconfirmed_by_origin':{t:sum(not x['payload_integrity'] for x in raw if x['origin']==t) for t in ['r44_receipts','r44_preview_articles']},'hash_scope_note':'Receipt payload hashes match raw JSON; preview result hashes may identify another representation and require documented producer serialization. A mismatch is not proof of corruption.','policy':'Candidate evidence is not proof of R33 completion; retain exact article hash, claim support and locators; never infer verified from queue state.'}
for lang in sorted({a['language'] for a in arts}):
 rr=[x for x in rows if x['language']==lang];report['by_language'][lang]={'entries':len(rr),'categories':dict(collections.Counter(x['category'] for x in rr)),'candidate_entries':sum(x['candidate_sources']>0 for x in rr),'current_linked_entries':sum(x['current_active_sources']>0 for x in rr),'inconsistencies':sum(x['state_claim_inconsistency'] for x in rr)}
(O/'MLS-R33-diagnostico.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
assert len(rows)==10133 and len({x['code'] for x in rows})==10133
