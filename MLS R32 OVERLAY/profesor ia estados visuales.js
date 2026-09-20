(function(root,factory){const api=factory(root);if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root){root.MLSProfessorVisualStates=api;if(root.MLS)api.install(root.MLS);}})(typeof window!=='undefined'?window:null,function(root){'use strict';
const VERSION='1.0',STYLE_ID='mlsProfessorVisualStatesStyles';
const LABELS={ready:'Listo',thinking:'Pensando',responding:'Respondiendo',offline:'Sin conexión',quota:'Límite temporal',retry:'Listo para reintentar','temporary-error':'Error temporal'};
const STYLE_TEXT=`
#aiTutorModal[data-ai-state="thinking"] .ai-status,#aiTutorModal[data-ai-state="responding"] .ai-status{background:var(--mls-teaching-accent-bg,#eef5f8);color:#244555}
#aiTutorModal[data-ai-state="offline"] .ai-status{background:var(--mls-surface-warm-light,#f5f1e8);color:#55472d}
#aiTutorModal[data-ai-state="quota"] .ai-status{background:var(--mls-surface-muted-light,#f7f0e5);color:#5b4521}
#aiTutorModal[data-ai-state="retry"] .ai-status,#aiTutorModal[data-ai-state="temporary-error"] .ai-status{background:#fff1ed;color:#64281f}
#aiTutorModal[data-ai-state="thinking"] [data-ai-send],#aiTutorModal[data-ai-state="responding"] [data-ai-send]{opacity:.72}
#aiTutorModal [data-ai-retry]{min-height:var(--mls-control-height,44px);margin-left:10px}
`;
function normalize(value){return String(value||'').replace(/\s+/g,' ').trim();}
function stateFromSnapshot(snapshot={}){
  const busy=String(snapshot.busy||'')==='1'||snapshot.busy===true;
  const statusClass=normalize(snapshot.statusClass).toLowerCase();
  const statusText=normalize(snapshot.statusText);
  const streamingText=normalize(snapshot.streamingText);
  const hasRetry=!!snapshot.hasRetry;
  if(/cuota|l[ií]mite disponible|quota|rate limit|too many|neuron/i.test(statusText))return 'quota';
  if(/sin conexi[oó]n|necesitas conexi[oó]n|revisa tu conexi[oó]n|failed to fetch|network/i.test(statusText))return 'offline';
  if(busy)return streamingText?'responding':'thinking';
  if(statusClass.includes('loading'))return 'thinking';
  if(statusClass.includes('error')&&hasRetry)return 'retry';
  if(statusClass.includes('error'))return 'temporary-error';
  return 'ready';
}
function snapshotFromModal(modal){
  if(!modal||typeof modal.querySelector!=='function')return{};
  const status=modal.querySelector('[data-ai-status]'),streaming=modal.querySelector('.ai-streaming .ai-text')||modal.querySelector('.ai-streaming');
  return{busy:modal.dataset&&modal.dataset.aiBusy,statusClass:status&&status.className,statusText:status&&status.textContent,streamingText:streaming&&streaming.textContent,hasRetry:!!(status&&status.querySelector&&status.querySelector('[data-ai-retry]'))};
}
function applyState(modal){
  if(!modal)return 'ready';const state=stateFromSnapshot(snapshotFromModal(modal));
  if(modal.dataset){modal.dataset.aiState=state;modal.dataset.aiStateLabel=LABELS[state]||state;}
  modal.setAttribute&&modal.setAttribute('aria-busy',state==='thinking'||state==='responding'?'true':'false');
  const status=modal.querySelector&&modal.querySelector('[data-ai-status]');if(status&&status.dataset)status.dataset.aiState=state;
  return state;
}
function ensureStyles(){if(!root||!root.document)return false;if(root.document.getElementById(STYLE_ID))return false;const style=root.document.createElement('style');style.id=STYLE_ID;style.textContent=STYLE_TEXT;root.document.head.appendChild(style);return true;}
function observeDialog(modal){
  if(!modal||modal.__mlsProfessorVisualStatesObserved)return false;applyState(modal);
  const Observer=root&&root.MutationObserver;if(typeof Observer!=='function'){modal.__mlsProfessorVisualStatesObserved=true;return true;}
  const observer=new Observer(()=>applyState(modal));observer.observe(modal,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','data-ai-busy','hidden']});
  modal.__mlsProfessorVisualStatesObserved=true;modal.__mlsProfessorVisualStatesObserver=observer;return true;
}
function enhanceCurrentDialog(){if(!root||!root.document)return false;const modal=root.document.getElementById('aiTutorModal');return modal?observeDialog(modal):false;}
function install(MLS){
  if(!MLS||!MLS.aiTutor||typeof MLS.aiTutor.open!=='function'||MLS.aiTutor.__mlsProfessorVisualStatesInstalled)return false;ensureStyles();const original=MLS.aiTutor.open;
  MLS.aiTutor.open=function(...args){const result=original.apply(this,args);if(root&&typeof root.queueMicrotask==='function')root.queueMicrotask(enhanceCurrentDialog);else if(root&&typeof root.setTimeout==='function')root.setTimeout(enhanceCurrentDialog,0);else enhanceCurrentDialog();return result;};
  MLS.aiTutor.__mlsProfessorVisualStatesInstalled=true;MLS.aiTutor.professorVisualStatesVersion=VERSION;return true;
}
return{VERSION,LABELS,STYLE_ID,STYLE_TEXT,normalize,stateFromSnapshot,snapshotFromModal,applyState,ensureStyles,observeDialog,enhanceCurrentDialog,install};});
