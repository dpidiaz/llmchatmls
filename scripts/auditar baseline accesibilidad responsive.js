'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const STATUSES=Object.freeze([
  'PASS',
  'FAIL',
  'MANUAL QA REQUIRED',
  'BLOCKED',
  'N/A'
]);

function read(file){
  return fs.readFileSync(path.join(process.cwd(),file),'utf8');
}

function tarText(file){
  return execFileSync('tar',['-xOzf','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz',file],{encoding:'utf8'});
}

function has(text,pattern){
  return typeof pattern==='string'?text.includes(pattern):pattern.test(text);
}

function check(id,area,status,evidence,notes=''){
  if(!STATUSES.includes(status))throw new Error('Estado QA inválido: '+status);
  return {id,area,status,evidence,notes};
}

function buildBaseline(){
  const visual=read('MLS R32 OVERLAY/design system.css');
  const virtuoso=read('MLS R32 OVERLAY/virtuoso.html');
  const professor=read('MLS R32 OVERLAY/profesor ia ux.js');
  const professorStates=read('MLS R32 OVERLAY/profesor ia estados visuales.js');
  const reader=read('MLS R32 OVERLAY/reader.js');
  const ios=read('MLS R32 OVERLAY/ios.js');
  const home=tarText('public/index.html');
  const shellCss=tarText('public/assets/styles.css');

  const results=[];

  results.push(check(
    'G-VIS-001','Visual System',
    has(visual,/\.mls-focusable:focus-visible\s*\{/)?'PASS':'FAIL',
    'Shared focus-visible primitive',
    'Contrato base; no implica que todos los controles lo consuman todavía.'
  ));
  results.push(check(
    'G-VIS-002','Visual System',
    has(visual,/@media\s*\(prefers-reduced-motion:\s*reduce\)/)?'PASS':'FAIL',
    'Shared reduced-motion guard'
  ));
  results.push(check(
    'G-VIS-003','Visual System',
    has(visual,/font-size:\s*max\(11pt,/)?'PASS':'FAIL',
    'Shared readable type primitive >= 11pt'
  ));

  results.push(check(
    'G-HOME-001','Home',
    has(home,/name=["']viewport["']/i)?'PASS':'FAIL',
    'Viewport metadata present in real shell bundle'
  ));
  results.push(check(
    'G-HOME-002','Home',
    has(home,/<main\b/i)?'PASS':'FAIL',
    'Main landmark in real shell bundle'
  ));
  results.push(check(
    'G-HOME-003','Home',
    has(home,/<nav\b/i)?'PASS':'FAIL',
    'Navigation landmark in real shell bundle'
  ));
  results.push(check(
    'G-HOME-004','Home',
    has(home,/class=["'][^"']*(?:skip|sr-only)[^"']*["'][^>]*href=["']#(?:main|content)/i)||has(home,/href=["']#(?:main|content)["'][^>]*>\s*(?:Saltar|Skip)/i)?'PASS':'FAIL',
    'Keyboard skip-link discoverability',
    'Baseline only; FAIL is not corrected during Wave 2.'
  ));
  results.push(check(
    'G-HOME-005','Home',
    has(shellCss,/:focus-visible/)?'PASS':'MANUAL QA REQUIRED',
    'Global focus-visible styling in shell CSS',
    'Presence alone does not certify contrast or clipping.'
  ));
  results.push(check(
    'G-HOME-006','Home','MANUAL QA REQUIRED',
    'Touch targets at 320/375/390/430',
    'Requires rendered geometry.'
  ));

  results.push(check(
    'G-VIR-001','Virtuoso',
    has(virtuoso,/viewport-fit=cover/)?'PASS':'FAIL',
    'Safe-area capable viewport'
  ));
  results.push(check(
    'G-VIR-002','Virtuoso',
    has(virtuoso,/id=["']status["'][^>]*role=["']status["']/i)?'PASS':'FAIL',
    'Consultation status announced'
  ));
  results.push(check(
    'G-VIR-003','Virtuoso',
    has(virtuoso,/id=["']results["'][^>]*aria-live=["']polite["']/i)?'PASS':'FAIL',
    'Dynamic result region announced'
  ));
  results.push(check(
    'G-VIR-004','Virtuoso',
    has(virtuoso,/:focus-visible/)?'PASS':'FAIL',
    'Visible keyboard focus rule inside Virtuoso',
    'Shared stylesheet availability does not prove Virtuoso consumes it because this page has inline CSS.'
  ));
  results.push(check(
    'G-VIR-005','Virtuoso',
    has(virtuoso,/@media\(max-width:760px\)/)?'PASS':'FAIL',
    'Dedicated mobile breakpoint'
  ));
  results.push(check(
    'G-VIR-006','Virtuoso','MANUAL QA REQUIRED',
    'Result focus/order after async render',
    'Requires keyboard and assistive-technology interaction.'
  ));

  results.push(check(
    'G-PROF-001','Profesor IA',
    has(professor,/setAttribute\('aria-label'/)&&has(professor,/role','status'/)?'PASS':'FAIL',
    'Dialog/status accessible naming'
  ));
  results.push(check(
    'G-PROF-002','Profesor IA',
    has(professor,/role','log'/)&&has(professor,/aria-relevant','additions text'/)?'PASS':'FAIL',
    'Conversation log semantics'
  ));
  results.push(check(
    'G-PROF-003','Profesor IA',
    has(professor,/:focus-visible/)?'PASS':'FAIL',
    'Dialog focus-visible styles'
  ));
  results.push(check(
    'G-PROF-004','Profesor IA',
    has(professor,/@media\(prefers-reduced-motion:reduce\)/)?'PASS':'FAIL',
    'Reduced-motion handling'
  ));
  results.push(check(
    'G-PROF-005','Profesor IA',
    has(professor,/@media\(max-width:600px\)/)?'PASS':'FAIL',
    'Mobile bottom-sheet breakpoint'
  ));
  results.push(check(
    'G-PROF-006','Profesor IA',
    has(professorStates,/aria-busy/)?'PASS':'FAIL',
    'Busy state exposed semantically'
  ));
  results.push(check(
    'G-PROF-007','Profesor IA','MANUAL QA REQUIRED',
    'Initial focus, focus trap and focus restoration',
    'Requires rendered dialog interaction.'
  ));

  results.push(check(
    'G-READ-001','Reader',
    has(reader,/<main class=\\?"reader-center\\?"/)||has(reader,/reader-center/)?'PASS':'FAIL',
    'Primary reader region is structurally identifiable'
  ));
  const smooth=has(reader,/scrollIntoView\(\{behavior:'smooth'/);
  const readerReduced=has(reader,/prefers-reduced-motion/);
  results.push(check(
    'G-READ-002','Reader',
    smooth&&!readerReduced?'FAIL':'PASS',
    'Reader smooth-scroll honors reduced-motion locally',
    smooth&&!readerReduced?'Smooth scrolling is present with no local reduced-motion guard detected. No correction in Wave 2.':'No unguarded smooth scroll detected.'
  ));
  results.push(check(
    'G-READ-003','Reader','MANUAL QA REQUIRED',
    'Three-column readability at 1024/1280',
    'Requires rendered geometry and reading-width inspection.'
  ));
  results.push(check(
    'G-READ-004','Reader','MANUAL QA REQUIRED',
    '200%/400% zoom and reflow',
    'Requires browser rendering.'
  ));

  results.push(check(
    'G-OFF-001','Offline',
    has(ios,/data-offline-prepare/)?'PASS':'FAIL',
    'Offline preparation action exists'
  ));
  results.push(check(
    'G-OFF-002','Offline',
    has(ios,/offline-progress-card/)&&(has(ios,/role=["']progressbar["']/)||has(ios,/aria-live/))?'PASS':'FAIL',
    'Offline progress is programmatically announced',
    'Static baseline check of generated overlay markup.'
  ));
  results.push(check(
    'G-OFF-003','Offline',
    has(ios,/offlineOverlay/)&&(has(ios,/role=["']dialog["']/)||has(ios,/aria-modal/))?'PASS':'FAIL',
    'Offline overlay exposes dialog semantics',
    'Static baseline check; no correction during Wave 2.'
  ));
  results.push(check(
    'G-OFF-004','Offline','MANUAL QA REQUIRED',
    'Virtual keyboard / overlay / safe-area behavior',
    'Requires real mobile rendering.'
  ));

  results.push(check(
    'G-X-001','Cross-workstream','BLOCKED',
    'Corrective regression pass over A–F',
    'Blocked intentionally until Chat 0 confirms A–F integrated.'
  ));
  results.push(check(
    'G-X-002','Cross-workstream','N/A',
    'AI unavailable semantics on purely static Home content',
    'Not applicable to static Home content itself; evaluated in Virtuoso/Profesor IA instead.'
  ));

  return results;
}

function summarize(results){
  const counts=Object.fromEntries(STATUSES.map(status=>[status,0]));
  for(const item of results)counts[item.status]++;
  return counts;
}

function format(results){
  const widths={id:12,area:18,status:19};
  const line=item=>[
    item.id.padEnd(widths.id),
    item.area.padEnd(widths.area),
    item.status.padEnd(widths.status),
    item.evidence
  ].join(' | ');
  return [
    'MLS ACCESSIBILITY & RESPONSIVE BASELINE — WORKSTREAM G',
    '',
    'ID'.padEnd(widths.id)+' | '+'AREA'.padEnd(widths.area)+' | '+'STATUS'.padEnd(widths.status)+' | EVIDENCE',
    '-'.repeat(112),
    ...results.map(line),
    '',
    'SUMMARY '+JSON.stringify(summarize(results))
  ].join('\n');
}

if(require.main===module){
  const results=buildBaseline();
  process.stdout.write(format(results)+'\n');
}

module.exports={STATUSES,buildBaseline,summarize,format};
