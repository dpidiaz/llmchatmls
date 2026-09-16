(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MLSProfessorQuickActions=api;
})(typeof window!=='undefined'?window:null,function(root){
  'use strict';
  const VERSION='1.0';
  const MARKER='[MLS_PROFESSOR_QUICK_ACTION '+VERSION+']';
  const COMMON=[
    {id:'simplify',label:'Explícamelo más simple',instruction:'Reexplica el punto de forma más simple, directa y clara, sin perder precisión ni omitir excepciones esenciales.'},
    {id:'deepen',label:'Profundiza',instruction:'Profundiza en el punto actual con más detalle útil, matices y estructura, sin convertir la explicación en un curso.'},
    {id:'examples',label:'Dame más ejemplos',instruction:'Da varios ejemplos naturales y pertinentes del mismo fenómeno. Mantén la variante y la escritura canónicas del idioma objetivo.'},
    {id:'when',label:'¿Cuándo se usa?',instruction:'Explica cuándo se usa este fenómeno, en qué contextos, registros o situaciones, y cuándo no corresponde usarlo.'},
    {id:'compare',label:'Compáralo con…',instruction:'Compara el tema actual con el concepto indicado por el usuario. Define ambos, destaca diferencias relevantes y usa ejemplos paralelos. Si falta el segundo concepto, pide solo ese dato antes de comparar.',needsDetail:true,detailLabel:'Concepto con el que quieres compararlo'},
    {id:'difference',label:'Explícame la diferencia',instruction:'Explica la diferencia central entre las formas o conceptos relevantes de esta entrada, con contraste claro y ejemplos.'},
    {id:'mistakes',label:'Errores comunes',instruction:'Explica errores comunes o confusiones frecuentes relacionados con este tema, sin tratar variantes legítimas como errores.'},
    {id:'summary',label:'Resume este punto',instruction:'Resume el punto principal con máxima claridad y precisión, conservando lo esencial y evitando contenido accesorio.'},
    {id:'alternative',label:'Otra forma de decirlo',instruction:'Muestra otras formas naturales de expresar la misma idea cuando existan, indicando diferencias de registro, matiz o contexto.'},
    {id:'pronunciation',label:'Explícame la pronunciación',instruction:'Explica la pronunciación relevante del tema usando las convenciones propias del idioma. No reemplaces la escritura canónica por romanización o transliteración.'}
  ];
  const SPECIFIC={
    'espanol-guatemala':[
      {id:'gt-voseo',label:'Explícame el voseo',instruction:'Explica el voseo guatemalteco relacionado con esta entrada, distinguiendo vos, tú y usted según contexto y registro. No impongas voseo donde no corresponda.'},
      {id:'gt-register',label:'¿Qué registro tiene?',instruction:'Explica el registro de las formas de esta entrada en español de Guatemala: formalidad, cercanía, contexto y naturalidad.'},
      {id:'gt-use',label:'¿Cómo se usa en Guatemala?',instruction:'Explica cómo se usa este fenómeno específicamente en Guatemala, contrastando otras variedades solo cuando aporte valor.'}
    ],
    ingles:[
      {id:'en-variants',label:'¿Cómo cambia entre US y UK?',instruction:'Explica diferencias relevantes entre inglés estadounidense y británico para este tema, sin presentar una variante legítima como error.'},
      {id:'en-pronunciation',label:'Pronunciación en inglés',instruction:'Explica la pronunciación con IPA cuando sea útil e indica diferencias regionales solo si son materialmente relevantes.'},
      {id:'en-register',label:'¿Qué registro tiene?',instruction:'Explica el registro, formalidad y naturalidad de las formas de esta entrada en inglés contemporáneo.'}
    ],
    portugues:[
      {id:'pt-br-use',label:'¿Cómo se usa en Brasil?',instruction:'Explica cómo se usa este fenómeno en portugués de Brasil como norma principal. No sustituyas formas brasileñas por portugués europeo.'},
      {id:'pt-spoken',label:'¿Cómo cambia en conversación?',instruction:'Explica diferencias relevantes entre uso hablado y escrito en portugués brasileño para este tema.'},
      {id:'pt-pronunciation',label:'Pronunciación brasileña',instruction:'Explica la pronunciación brasileña relevante, incluyendo nasalización, reducción o ritmo cuando corresponda.'}
    ],
    italiano:[
      {id:'it-spoken',label:'¿Cómo cambia al hablar?',instruction:'Explica diferencias pertinentes entre italiano hablado y escrito para este tema sin generalizar regionalismos como norma nacional.'},
      {id:'it-clitics',label:'Explícame los clíticos',instruction:'Si el tema involucra clíticos, explícalos desde la estructura propia del italiano con ejemplos naturales.'},
      {id:'it-pronunciation',label:'Pronunciación italiana',instruction:'Explica la pronunciación italiana estándar relevante, incluyendo consonantes dobles, vocales o acento cuando corresponda.'}
    ],
    frances:[
      {id:'fr-liaison',label:'Explícame la liaison',instruction:'Explica la liaison relacionada con esta entrada y cuándo ocurre, es opcional o no corresponde.'},
      {id:'fr-pronunciation',label:'¿Cómo se pronuncia?',instruction:'Explica la pronunciación francesa relevante, incluyendo liaison, enchaînement, schwa o vocales cuando corresponda.'},
      {id:'fr-spoken',label:'¿Cómo cambia al hablar?',instruction:'Explica diferencias relevantes entre francés hablado y escrito para este fenómeno.'}
    ],
    aleman:[
      {id:'de-case',label:'Explícame el caso',instruction:'Explica el caso gramatical relevante desde la lógica del alemán, con función y ejemplos.'},
      {id:'de-order',label:'Explícame el orden verbal',instruction:'Explica el orden verbal relevante de esta entrada en Standarddeutsch con ejemplos claros.'},
      {id:'de-pronunciation',label:'Pronunciación alemana',instruction:'Explica la pronunciación estándar relevante, incluyendo vocales, consonantes o acento cuando corresponda.'}
    ],
    japones:[
      {id:'ja-reading',label:'¿Cómo se lee?',instruction:'Explica la lectura de las formas relevantes usando kanji y kana como escritura principal. Rōmaji solo como apoyo limitado si realmente ayuda.'},
      {id:'ja-pronunciation',label:'Pronunciación japonesa',instruction:'Explica mora, longitud vocálica, geminación y pitch accent solo cuando sean pertinentes. Mantén kanji y kana como escritura principal.'},
      {id:'ja-politeness',label:'Nivel de cortesía',instruction:'Explica el nivel de cortesía, registro y naturalidad de las formas de esta entrada en japonés.'},
      {id:'ja-conversation',label:'¿Cómo se usa al hablar?',instruction:'Explica cómo se usa este fenómeno en conversación japonesa natural, distinguiendo registro cuando sea necesario.'}
    ],
    'chino-taiwan':[
      {id:'zh-tones',label:'Explícame los tonos',instruction:'Explica los tonos relevantes del mandarín de Taiwán y cualquier sandhi pertinente, manteniendo caracteres tradicionales como escritura principal.'},
      {id:'zh-zhuyin',label:'Muéstrame zhuyin',instruction:'Añade zhuyin como apoyo de pronunciación para las formas relevantes, sin sustituir los caracteres tradicionales.'},
      {id:'zh-pinyin',label:'Muéstrame pinyin',instruction:'Añade pinyin como apoyo de pronunciación para las formas relevantes, sin sustituir los caracteres tradicionales.'},
      {id:'zh-taiwan',label:'¿Cómo se usa en Taiwán?',instruction:'Explica el uso de este fenómeno en mandarín de Taiwán como norma principal y señala contrastes con China continental solo si aportan valor.'}
    ],
    coreano:[
      {id:'ko-batchim',label:'Explícame el batchim',instruction:'Explica el batchim relacionado con esta entrada y las reglas fonológicas pertinentes, manteniendo Hangul como escritura principal.'},
      {id:'ko-speech-level',label:'¿Qué nivel de habla es?',instruction:'Explica el nivel de habla, formalidad y naturalidad de las formas de esta entrada en coreano.'},
      {id:'ko-honorifics',label:'Explícame los honoríficos',instruction:'Explica los honoríficos relacionados con este tema desde la estructura propia del coreano.'}
    ],
    ruso:[
      {id:'ru-stress',label:'¿Dónde va el acento?',instruction:'Marca y explica el acento léxico relevante y su efecto en la pronunciación, manteniendo cirílico como escritura principal.'},
      {id:'ru-case',label:'Explícame el caso',instruction:'Explica el caso gramatical relevante, su función y las formas de esta entrada en ruso.'},
      {id:'ru-aspect',label:'Explícame el aspecto verbal',instruction:'Explica el aspecto verbal relacionado con esta entrada y contrasta imperfectivo y perfectivo cuando corresponda.'}
    ]
  };
  const FALLBACK=[];
  function slugOf(entry,meta){return String((entry&&entry.language)||(meta&&meta.slug)||'').trim();}
  function actionsFor(slug){return [...COMMON,...(SPECIFIC[slug]||FALLBACK)].map(x=>({...x}));}
  function findAction(id,slug){return actionsFor(slug).find(x=>x.id===id)||null;}
  function directiveFor(action,slug,detail){
    if(!action)return '';
    const extra=String(detail||'').trim();
    return [MARKER,'Acción rápida: '+action.label,action.instruction,extra?'Dato adicional del usuario: '+extra:'','Respeta el perfil lingüístico activo, la variante canónica, el sistema de escritura y las preferencias actuales de idioma y profundidad.','No modifiques el artículo publicado ni conviertas esta consulta en un curso, ejercicio o examen.','[/MLS_PROFESSOR_QUICK_ACTION]'].filter(Boolean).join('\n');
  }
  function appendDirective(value,directive){const text=String(value||'');if(!directive||text.includes(MARKER))return text;return (text?text+'\n\n':'')+directive;}
  function augmentEntry(entry,meta,actionId,detail){
    if(!entry||typeof entry!=='object')return entry;
    const slug=slugOf(entry,meta),action=findAction(actionId,slug);if(!action)return {...entry};
    const directive=directiveFor(action,slug,detail),out={...entry};
    out.professorQuickActionsVersion=VERSION;
    out.professorQuickAction={id:action.id,label:action.label,slug,detail:String(detail||'').trim()};
    out.professorQuickActionPrompt=directive;
    for(const key of ['articleMarkdown','auditedBody','body','definition'])if(typeof out[key]==='string')out[key]=appendDirective(out[key],directive);
    if(out.plain&&typeof out.plain==='object')out.plain={...out.plain,lead:appendDirective(out.plain.lead||'',directive)};
    return out;
  }
  function run(actionId,entry,meta,detail){
    if(!root||!root.MLS||!root.MLS.aiTutor||typeof root.MLS.aiTutor.open!=='function')return false;
    const slug=slugOf(entry,meta),action=findAction(actionId,slug);if(!action)return false;
    const enriched=augmentEntry(entry,meta,actionId,detail);
    root.MLS.aiTutor.open(enriched,{...(meta||{}),professorQuickActionsVersion:VERSION,professorQuickActionId:action.id,professorQuickActionLabel:action.label});
    return true;
  }
  function ensureStyles(){
    if(!root||root.document.getElementById('mlsProfessorQuickActionsStyles'))return;
    const style=root.document.createElement('style');style.id='mlsProfessorQuickActionsStyles';style.textContent=`
      .mls-prof-quick{width:min(680px,94vw);max-width:none;border:1px solid rgba(20,28,36,.16);border-radius:18px;padding:0;background:#fbfaf7;color:#182026;box-shadow:0 24px 70px rgba(0,0,0,.24)}
      .mls-prof-quick::backdrop{background:rgba(13,20,26,.48)}
      .mls-prof-quick-shell{padding:22px}.mls-prof-quick h2{margin:0 0 6px;font-size:1.45rem}.mls-prof-quick p{margin:0 0 16px;color:#5d6670}
      .mls-prof-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mls-prof-quick-grid button{min-height:44px;text-align:left;white-space:normal;font-size:max(11pt,.94rem)}
      .mls-prof-quick-detail{display:none;margin-top:14px;padding:12px;border-radius:12px;background:#f1ece5}.mls-prof-quick-detail.open{display:grid;gap:8px}.mls-prof-quick-detail label{font-weight:700}.mls-prof-quick-detail input{min-height:44px;border:1px solid #c9c1b6;border-radius:10px;background:#fff;color:#182026;padding:8px 10px;font:inherit}
      .mls-prof-quick-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
      @media(max-width:600px){.mls-prof-quick{width:100vw;max-width:100vw;margin:auto 0 0;border-radius:18px 18px 0 0}.mls-prof-quick-shell{padding:18px 16px}.mls-prof-quick-grid{grid-template-columns:1fr}.mls-prof-quick-actions .btn{flex:1}}
    `;root.document.head.appendChild(style);
  }
  function ensureDialog(){
    if(!root)return null;
    let dialog=root.document.getElementById('mlsProfessorQuickActionsDialog');if(dialog)return dialog;
    ensureStyles();
    dialog=root.document.createElement('dialog');dialog.id='mlsProfessorQuickActionsDialog';dialog.className='mls-prof-quick';
    dialog.innerHTML='<div class="mls-prof-quick-shell"><h2>Acciones del Profesor IA</h2><p>Elige cómo quieres continuar con esta entrada.</p><div class="mls-prof-quick-grid" id="mlsProfessorQuickGrid"></div><div class="mls-prof-quick-detail" id="mlsProfessorQuickDetail"><label for="mlsProfessorQuickDetailInput">Concepto para comparar</label><input id="mlsProfessorQuickDetailInput" type="text" autocomplete="off"><div class="mls-prof-quick-actions"><button class="btn" type="button" id="mlsProfessorQuickCancelDetail">Cancelar</button><button class="btn primary" type="button" id="mlsProfessorQuickRunDetail">Comparar</button></div></div><div class="mls-prof-quick-actions"><button class="btn" type="button" id="mlsProfessorQuickClose">Cerrar</button></div></div>';
    root.document.body.appendChild(dialog);return dialog;
  }
  function openDialog(entry,meta){
    const dialog=ensureDialog();if(!dialog)return false;
    const slug=slugOf(entry,meta),grid=dialog.querySelector('#mlsProfessorQuickGrid'),detailBox=dialog.querySelector('#mlsProfessorQuickDetail'),detailInput=dialog.querySelector('#mlsProfessorQuickDetailInput');
    let pending=null;grid.innerHTML='';detailBox.classList.remove('open');detailInput.value='';
    for(const action of actionsFor(slug)){
      const button=root.document.createElement('button');button.type='button';button.className='btn';button.textContent=action.label;button.dataset.action=action.id;
      button.onclick=()=>{
        if(action.needsDetail){pending=action;detailBox.classList.add('open');detailInput.focus();return;}
        if(typeof dialog.close==='function')dialog.close();run(action.id,entry,meta,'');
      };
      grid.appendChild(button);
    }
    dialog.querySelector('#mlsProfessorQuickRunDetail').onclick=()=>{if(!pending)return;const value=detailInput.value.trim();if(!value){detailInput.focus();return;}if(typeof dialog.close==='function')dialog.close();run(pending.id,entry,meta,value);};
    dialog.querySelector('#mlsProfessorQuickCancelDetail').onclick=()=>{pending=null;detailBox.classList.remove('open');detailInput.value='';};
    dialog.querySelector('#mlsProfessorQuickClose').onclick=()=>{if(typeof dialog.close==='function')dialog.close();};
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    return true;
  }
  return {VERSION,MARKER,COMMON,SPECIFIC,FALLBACK,slugOf,actionsFor,findAction,directiveFor,appendDirective,augmentEntry,run,openDialog};
});
