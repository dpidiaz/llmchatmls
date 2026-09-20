'use strict';

const fs=require('node:fs');

const HOME='public/index.html';
const STYLES='public/assets/styles.css';
const APP='public/js/app.js';
const MARKER='MLS Accessibility Responsive R1';

const PATCH_CSS=`
/* MLS Accessibility Responsive R1 */
.mls-skip-link{
  position:fixed;
  top:8px;
  left:8px;
  z-index:10000;
  transform:translateY(-160%);
  padding:10px 14px;
  min-height:44px;
  display:flex;
  align-items:center;
  border-radius:10px;
  background:#fff;
  color:#182026;
  border:2px solid #527a91;
  font-weight:700;
  text-decoration:none;
}
.mls-skip-link:focus{transform:none}
body :is(a,button,input,select,textarea,summary):focus-visible{
  outline:var(--mls-focus-width,3px) solid var(--mls-focus-color,#527a91)!important;
  outline-offset:var(--mls-focus-offset,2px)!important;
}
.sidebar a,.sidebar button,.mobile-nav a,.mobile-nav button{
  min-height:var(--mls-control-height,44px);
}
@media (max-width:1100px){
  .reader-layout{grid-template-columns:minmax(0,1fr)!important}
  .reader-left,.reader-right{display:none!important}
}
@media (min-width:1101px) and (max-width:1350px){
  .reader-layout{grid-template-columns:220px minmax(0,1fr)!important}
  .reader-right{display:none!important}
}
`;

function patchHome(html){
  html=String(html||'');
  if(!/<main\b/i.test(html))throw new Error('Accessibility R1: no se encontró <main> en Home.');

  let target='mainContent';
  const main=html.match(/<main\b[^>]*>/i);
  const existingId=main&&main[0].match(/\bid=(["'])([^"']+)\1/i);
  if(existingId)target=existingId[2];
  else html=html.replace(/<main\b/i,'<main id="mainContent"');

  if(!html.includes('class="mls-skip-link"')&&!html.includes("class='mls-skip-link'")){
    const link='<a class="mls-skip-link" href="#'+target+'">Saltar al contenido principal</a>';
    if(!/<body\b[^>]*>/i.test(html))throw new Error('Accessibility R1: no se encontró <body>.');
    html=html.replace(/(<body\b[^>]*>)/i,'$1'+link);
  }
  return html;
}

function patchStyles(css){
  css=String(css||'');
  if(css.includes(MARKER))return css;
  return css.trimEnd()+'\n\n'+PATCH_CSS.trim()+'\n';
}

function patchApp(source){
  source=String(source||'');
  const patched="if(window.__mlsRouteHasRun)MLS.app.focus();else window.__mlsRouteHasRun=true;";
  if(source.includes(patched))return source;
  if(!source.includes('MLS.app.focus();'))throw new Error('Accessibility R1: no se encontró focus del router.');
  return source.replace('MLS.app.focus();',patched);
}

function install(){
  if(!fs.existsSync(HOME)||!fs.existsSync(STYLES)||!fs.existsSync(APP))throw new Error('Accessibility R1 requiere el build generado.');
  fs.writeFileSync(HOME,patchHome(fs.readFileSync(HOME,'utf8')),'utf8');
  fs.writeFileSync(STYLES,patchStyles(fs.readFileSync(STYLES,'utf8')),'utf8');
  fs.writeFileSync(APP,patchApp(fs.readFileSync(APP,'utf8')),'utf8');
  console.log('MLS Accessibility + Responsive R1 aplicado.');
}

module.exports={HOME,STYLES,APP,MARKER,PATCH_CSS,patchHome,patchStyles,patchApp,install};
if(require.main===module)install();
