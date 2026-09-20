'use strict';
const fs=require('node:fs');
const path=require('node:path');

const SOURCE='MLS R32 OVERLAY/design system.css';
const TARGET='public/css/design-system.css';
const REQUIRED_TOKENS=[
  '--mls-space-1','--mls-space-6',
  '--mls-radius-sm','--mls-radius-xl',
  '--mls-control-height','--mls-control-height-large',
  '--mls-text-primary','--mls-surface-panel-light',
  '--mls-focus-color','--mls-focus-width','--mls-focus-offset'
];

function validateCss(css){
  css=String(css||'');
  if(!css.includes('Visual Foundation v1'))throw new Error('Design system source missing version marker.');
  for(const token of REQUIRED_TOKENS){
    if(!css.includes(token+':'))throw new Error('Missing required visual token: '+token);
  }
  if(/(^|[},\n])\s*(?:html|body|button|input|select|textarea|a|h[1-6]|p|article|main|aside)\s*\{/m.test(css)){
    throw new Error('Visual Foundation v1 must remain opt-in and must not add global element rules.');
  }
  return true;
}

function install(options={}){
  const source=options.source||SOURCE;
  const target=options.target||TARGET;
  if(!fs.existsSync(source))throw new Error('No existe la fuente del sistema visual.');
  const css=fs.readFileSync(source,'utf8');
  validateCss(css);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,css,'utf8');
  return target;
}

function main(){
  const target=install();
  console.log('MLS Visual Foundation v1 publicada en '+target+'.');
}

module.exports={SOURCE,TARGET,REQUIRED_TOKENS,validateCss,install};
if(require.main===module)main();
