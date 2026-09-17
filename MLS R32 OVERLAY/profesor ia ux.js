(function(root,factory){const api=factory(root);if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root){root.MLSProfessorUX=api;if(root.MLS)api.install(root.MLS);}})(typeof window!=='undefined'?window:null,function(root){'use strict';
const VERSION='1.0',STYLE_ID='mlsProfessorUXStyles';
const STYLE_TEXT=`
#aiTutorModal{width:min(760px,96vw);max-width:760px;max-height:min(88vh,820px);border:1px solid rgba(24,32,38,.16);border-radius:20px;background:#fbfaf7;color:#182026;box-shadow:0 24px 72px rgba(0,0,0,.24);padding:0;overflow:hidden}
#aiTutorModal::backdrop{background:rgba(20,26,32,.42)}
#aiTutorModal,#aiTutorModal button,#aiTutorModal textarea,#aiTutorModal input,#aiTutorModal select{font-size:max(11pt,1rem)}
#aiTutorModal .ai-shell,#aiTutorModal [data-ai-shell]{background:#fbfaf7;color:#182026}
#aiTutorModal .ai-header,#aiTutorModal .ai-context{background:#f3efe8;color:#182026}
#aiTutorModal .ai-context{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 14px}
#aiTutorModal .ai-context strong{min-width:0;overflow-wrap:anywhere}
#aiTutorModal [data-ai-messages]{padding:16px;scroll-padding-bottom:92px;background:#fffdf9}
#aiTutorModal .ai-message{margin:0 0 12px}
#aiTutorModal .ai-bubble{max-width:min(92%,680px);border:1px solid #ddd6cc;border-radius:14px;padding:12px 14px;background:#f7f3ed;color:#182026;line-height:1.55}
#aiTutorModal .ai-message.user .ai-bubble{margin-left:auto;background:#eef3f6;border-color:#d6e0e6;color:#182026}
#aiTutorModal .ai-role{font-size:max(11pt,.9rem);font-weight:700;color:#47515a;margin-bottom:5px}
#aiTutorModal .ai-text{font-size:max(11pt,1rem);line-height:1.6;overflow-wrap:anywhere;white-space:pre-wrap}
#aiTutorModal .ai-text a.ai-internal-link{color:#173d5b;text-decoration:underline;text-underline-offset:2px;font-weight:650}
#aiTutorModal .ai-status{margin:0;padding:10px 14px;min-height:20px;background:#f7f3ed;color:#38434c;font-size:max(11pt,.95rem)}
#aiTutorModal .ai-status.error{background:#fff1ed;color:#64281f}
#aiTutorModal .ai-status.loading{background:#eef5f8;color:#244555}
#aiTutorModal .ai-compose{position:sticky;bottom:0;display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:end;padding:12px 14px;background:#fbfaf7;border-top:1px solid #ddd6cc}
#aiTutorModal [data-ai-input]{width:100%;min-height:50px;max-height:150px;resize:vertical;border:1px solid #b9b2a8;border-radius:12px;padding:10px 12px;background:#fff;color:#182026;line-height:1.45}
#aiTutorModal .btn,#aiTutorModal button{min-height:44px;border-radius:10px;color:#182026;background:#f3efe8;border:1px solid #cfc7bc;padding:8px 12px}
#aiTutorModal .btn.primary,#aiTutorModal button.primary{background:#dcecf3;color:#142c38;border-color:#bfd6e0;font-weight:700}
#aiTutorModal button[hidden]{display:none!important}
#aiTutorModal button:focus-visible,#aiTutorModal textarea:focus-visible,#aiTutorModal a:focus-visible{outline:3px solid #7da5bb;outline-offset:2px}
#aiTutorModal [data-ai-clear]{margin-left:auto}
@media(max-width:600px){#aiTutorModal{width:100vw;max-width:100vw;height:min(92dvh,860px);max-height:92dvh;margin:auto 0 0;border-radius:20px 20px 0 0}#aiTutorModal [data-ai-messages]{padding:14px 12px}#aiTutorModal .ai-bubble{max-width:96%;padding:11px 12px}#aiTutorModal .ai-compose{grid-template-columns:1fr 1fr;padding:10px 12px}#aiTutorModal [data-ai-input]{grid-column:1/-1;min-height:56px}#aiTutorModal [data-ai-send],#aiTutorModal [data-ai-cancel]{width:100%}}
@media(prefers-reduced-motion:reduce){#aiTutorModal *,#aiTutorModal *::before,#aiTutorModal *::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;
function ensureStyles(){if(!root||!root.document)return false;if(root.document.getElementById(STYLE_ID))return false;const style=root.document.createElement('style');style.id=STYLE_ID;style.textContent=STYLE_TEXT;root.document.head.appendChild(style);return true;}
function label(node,value){if(node&&!node.getAttribute('aria-label'))node.setAttribute('aria-label',value);}
function enhanceDialog(modal){if(!modal||typeof modal.querySelector!=='function')return false;modal.setAttribute('aria-label',modal.getAttribute('aria-label')||'Profesor IA');const status=modal.querySelector('[data-ai-status]');if(status){status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');}label(modal.querySelector('[data-ai-input]'),'Escribe una pregunta sobre esta entrada');label(modal.querySelector('[data-ai-send]'),'Enviar pregunta al Profesor IA');label(modal.querySelector('[data-ai-cancel]'),'Cancelar respuesta actual');label(modal.querySelector('[data-ai-close]'),'Cerrar Profesor IA');label(modal.querySelector('[data-ai-clear]'),'Limpiar conversación de esta entrada');const messages=modal.querySelector('[data-ai-messages]');if(messages){messages.setAttribute('role','log');messages.setAttribute('aria-live','polite');messages.setAttribute('aria-relevant','additions text');}modal.dataset.professorUxVersion=VERSION;return true;}
function enhanceCurrentDialog(){if(!root||!root.document)return false;return enhanceDialog(root.document.getElementById('aiTutorModal'));}
function install(MLS){if(!MLS||!MLS.aiTutor||typeof MLS.aiTutor.open!=='function'||MLS.aiTutor.__mlsProfessorUXInstalled)return false;ensureStyles();const original=MLS.aiTutor.open;MLS.aiTutor.open=function(...args){const result=original.apply(this,args);if(root&&typeof root.queueMicrotask==='function')root.queueMicrotask(enhanceCurrentDialog);else if(root&&typeof root.setTimeout==='function')root.setTimeout(enhanceCurrentDialog,0);else enhanceCurrentDialog();return result;};MLS.aiTutor.__mlsProfessorUXInstalled=true;MLS.aiTutor.professorUXVersion=VERSION;return true;}
return{VERSION,STYLE_ID,STYLE_TEXT,ensureStyles,enhanceDialog,enhanceCurrentDialog,install};});
