(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root){root.MLSProfessorPreferences=api;if(root.MLS)api.install(root.MLS);}
})(typeof window!=='undefined'?window:null,function(root){
  'use strict';
  const VERSION='1.0';
  const STORAGE_KEY='mlsProfessorPreferencesV1';
  const MARKER='[MLS_PROFESSOR_PREFERENCES '+VERSION+']';
  const DEFAULTS=Object.freeze({explanationLanguage:'spanish',depth:'normal'});
  const LANGUAGES=new Set(['spanish','target']);
  const DEPTHS=new Set(['simple','normal','technical']);

  function normalize(value){
    const p=value&&typeof value==='object'?value:{};
    return {
      explanationLanguage:LANGUAGES.has(p.explanationLanguage)?p.explanationLanguage:DEFAULTS.explanationLanguage,
      depth:DEPTHS.has(p.depth)?p.depth:DEFAULTS.depth
    };
  }
  function load(){
    try{
      if(!root||!root.localStorage)return {...DEFAULTS};
      return normalize(JSON.parse(root.localStorage.getItem(STORAGE_KEY)||'{}'));
    }catch{return {...DEFAULTS}}
  }
  function save(value){
    const prefs=normalize(value);
    try{if(root&&root.localStorage)root.localStorage.setItem(STORAGE_KEY,JSON.stringify(prefs))}catch{}
    return prefs;
  }
  function reset(){
    try{if(root&&root.localStorage)root.localStorage.removeItem(STORAGE_KEY)}catch{}
    return {...DEFAULTS};
  }
  function targetLabel(meta){return String((meta&&meta.name)||(meta&&meta.professorProfileLabel)||'idioma objetivo').trim()||'idioma objetivo';}
  function directiveFor(value,meta){
    const prefs=normalize(value),target=targetLabel(meta);
    const language=prefs.explanationLanguage==='target'
      ?'Explica principalmente en el idioma objetivo ('+target+'). Mantén claridad y no traduzcas innecesariamente al español.'
      :'Explica principalmente en español claro. Conserva ejemplos, formas y escritura canónica en el idioma objetivo ('+target+').';
    const depth=prefs.depth==='simple'
      ?'Profundidad simple: prioriza claridad, frases directas y pocos tecnicismos, sin omitir excepciones esenciales.'
      :prefs.depth==='technical'
        ?'Profundidad técnica: usa terminología lingüística precisa y explica estructura, morfología, sintaxis, fonología o pragmática cuando sean pertinentes.'
        :'Profundidad normal: equilibrio entre claridad y precisión; introduce terminología solo cuando ayude.';
    return [MARKER,'Preferencias de explicación del usuario:',language,depth,'Estas preferencias no alteran la variante canónica ni las reglas del perfil lingüístico.','[/MLS_PROFESSOR_PREFERENCES]'].join('\n');
  }
  function appendDirective(value,directive){const text=String(value||'');if(text.includes(MARKER))return text;return (text?text+'\n\n':'')+directive;}
  function augmentEntry(entry,meta,prefs){
    if(!entry||typeof entry!=='object')return entry;
    const normalized=normalize(prefs),directive=directiveFor(normalized,meta),out={...entry};
    out.professorPreferencesVersion=VERSION;
    out.professorPreferences={...normalized};
    out.professorPreferencesPrompt=directive;
    for(const key of ['articleMarkdown','auditedBody','body','definition'])if(typeof out[key]==='string')out[key]=appendDirective(out[key],directive);
    if(out.plain&&typeof out.plain==='object')out.plain={...out.plain,lead:appendDirective(out.plain.lead||'',directive)};
    return out;
  }
  function ensureStyles(){
    if(!root||root.document.getElementById('mlsProfessorPreferencesStyles'))return;
    const style=root.document.createElement('style');style.id='mlsProfessorPreferencesStyles';style.textContent=`
      .mls-prof-prefs{width:min(560px,92vw);max-width:none;border:1px solid rgba(20,28,36,.16);border-radius:18px;padding:0;background:#faf8f3;color:#182026;box-shadow:0 24px 70px rgba(0,0,0,.24)}
      .mls-prof-prefs::backdrop{background:rgba(13,20,26,.48)}
      .mls-prof-prefs-shell{padding:22px}.mls-prof-prefs h2{margin:0 0 6px;font-size:1.45rem}.mls-prof-prefs p{margin:0 0 18px;color:#5d6670}
      .mls-prof-prefs-grid{display:grid;gap:14px}.mls-prof-prefs label{display:grid;gap:6px;font-weight:700}.mls-prof-prefs select{min-height:44px;border:1px solid #c9c1b6;border-radius:10px;background:#fff;color:#182026;padding:8px 10px;font:inherit}
      .mls-prof-prefs-note{margin-top:14px;padding:12px;border-radius:10px;background:#f0ebe3;color:#534b44;font-size:.9rem}.mls-prof-prefs-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:18px}
      @media(max-width:600px){.mls-prof-prefs{width:100vw;max-width:100vw;margin:auto 0 0;border-radius:18px 18px 0 0}.mls-prof-prefs-shell{padding:18px 16px}.mls-prof-prefs-actions{justify-content:stretch}.mls-prof-prefs-actions .btn{flex:1}}
    `;root.document.head.appendChild(style);
  }
  function ensureDialog(){
    if(!root)return null;
    let dialog=root.document.getElementById('mlsProfessorPreferencesDialog');if(dialog)return dialog;
    ensureStyles();
    dialog=root.document.createElement('dialog');dialog.id='mlsProfessorPreferencesDialog';dialog.className='mls-prof-prefs';
    dialog.innerHTML=`<form method="dialog" class="mls-prof-prefs-shell"><h2>Preferencias del Profesor IA</h2><p>Estas opciones cambian cómo explica, no qué variante lingüística enseña.</p><div class="mls-prof-prefs-grid"><label>Idioma de explicación<select id="mlsProfessorLanguage"><option value="spanish">Español</option><option value="target">Idioma objetivo</option></select></label><label>Profundidad<select id="mlsProfessorDepth"><option value="simple">Simple</option><option value="normal">Normal</option><option value="technical">Técnica</option></select></label></div><div class="mls-prof-prefs-note" id="mlsProfessorPrefsNote"></div><div class="mls-prof-prefs-actions"><button type="button" class="btn" id="mlsProfessorPrefsReset">Restablecer</button><button type="button" class="btn" id="mlsProfessorPrefsClose">Cerrar</button><button type="button" class="btn primary" id="mlsProfessorPrefsSave">Guardar</button></div></form>`;
    root.document.body.appendChild(dialog);return dialog;
  }
  function openSettingsDialog(meta){
    const dialog=ensureDialog();if(!dialog)return;
    const language=dialog.querySelector('#mlsProfessorLanguage'),depth=dialog.querySelector('#mlsProfessorDepth'),note=dialog.querySelector('#mlsProfessorPrefsNote');
    const apply=p=>{language.value=p.explanationLanguage;depth.value=p.depth;note.textContent='Perfil activo: '+targetLabel(meta)+'. La variante canónica y la escritura principal permanecen protegidas.'};
    apply(load());
    dialog.querySelector('#mlsProfessorPrefsSave').onclick=()=>{save({explanationLanguage:language.value,depth:depth.value});if(typeof dialog.close==='function')dialog.close();};
    dialog.querySelector('#mlsProfessorPrefsReset').onclick=()=>apply(reset());
    dialog.querySelector('#mlsProfessorPrefsClose').onclick=()=>{if(typeof dialog.close==='function')dialog.close();};
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  }
  function install(MLS){
    if(!MLS||!MLS.aiTutor||typeof MLS.aiTutor.open!=='function'||MLS.aiTutor.__mlsProfessorPreferencesInstalled)return false;
    const original=MLS.aiTutor.open;
    MLS.aiTutor.open=function(entry,meta,...rest){const prefs=load();return original.call(this,augmentEntry(entry,meta,prefs),{...(meta||{}),professorPreferencesVersion:VERSION,professorPreferences:prefs},...rest)};
    MLS.aiTutor.__mlsProfessorPreferencesInstalled=true;
    MLS.aiTutor.professorPreferencesVersion=VERSION;
    return true;
  }
  return {VERSION,STORAGE_KEY,DEFAULTS,normalize,load,save,reset,directiveFor,appendDirective,augmentEntry,openSettingsDialog,install};
});
