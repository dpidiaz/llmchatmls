'use strict';
const fs=require('node:fs');
const path=require('node:path');

const SOURCE='MLS R32 OVERLAY/design system.css';
const TARGET='public/css/design-system.css';
const PUBLIC_DIR='public';
const LINK_HREF='/css/design-system.css';
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

function stylesheetLink(){
  return '<link rel="stylesheet" href="'+LINK_HREF+'">';
}

function patchHtml(html){
  html=String(html||'');
  if(html.includes('href="'+LINK_HREF+'"')||html.includes("href='"+LINK_HREF+"'"))return html;
  if(!/<\/head>/i.test(html))return html;
  return html.replace(/<\/head>/i,'  '+stylesheetLink()+'\n</head>');
}

function listHtmlFiles(root){
  if(!fs.existsSync(root))return [];
  const out=[];
  for(const item of fs.readdirSync(root,{withFileTypes:true})){
    const full=path.join(root,item.name);
    if(item.isDirectory())out.push(...listHtmlFiles(full));
    else if(item.isFile()&&/\.html?$/i.test(item.name))out.push(full);
  }
  return out;
}

function install(options={}){
  const source=options.source||SOURCE;
  const target=options.target||TARGET;
  const publicDir=options.publicDir||PUBLIC_DIR;
  if(!fs.existsSync(source))throw new Error('No existe la fuente del sistema visual.');
  const css=fs.readFileSync(source,'utf8');
  validateCss(css);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,css,'utf8');

  let linked=0;
  for(const file of listHtmlFiles(publicDir)){
    const before=fs.readFileSync(file,'utf8');
    const after=patchHtml(before);
    if(after!==before){
      fs.writeFileSync(file,after,'utf8');
      linked++;
    }
  }
  return {target,linked};
}

function main(){
  const result=install();
  console.log('MLS Visual Foundation v1 publicada en '+result.target+'; interfaces enlazadas: '+result.linked+'.');
}

module.exports={
  SOURCE,TARGET,PUBLIC_DIR,LINK_HREF,REQUIRED_TOKENS,
  validateCss,stylesheetLink,patchHtml,listHtmlFiles,install
};
if(require.main===module)main();
