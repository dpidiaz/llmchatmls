// Presentación editorial de capítulos. Los valores de rutas y datos siguen siendo internos.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const publicDir = process.env.MLS_PUBLIC_DIR || path.join(root, 'public');
function patch(file, replacements) {
  const target = path.join(publicDir, 'js', file);
  let source = fs.readFileSync(target, 'utf8');
  for (const [before, after] of replacements) {
    if (!source.includes(before)) throw new Error(`No se encontró el punto de inserción en ${file}: ${before}`);
    source = source.replace(before, after);
  }
  fs.writeFileSync(target, source);
}

patch('core.js', [
  ["  MLS.structureFor=slug=>", "  MLS.chapterDisplayNum=(slug,num)=>{const n=Number(num);return slug==='espanol-guatemala'?(n>=49&&n<=52?n-47:n>=2&&n<=48?n+4:n):num};\n  MLS.structureFor=slug=>"],
  [".sort((a,b)=>Number(a.num)-Number(b.num));return{levels,parts,chapters}", ".sort((a,b)=>Number(MLS.chapterDisplayNum(slug,a.num))-Number(MLS.chapterDisplayNum(slug,b.num)));return{levels,parts,chapters}"]
]);

patch('app.js', [
  ["Capítulo ${esc(activeChapter.num)}", "Capítulo ${esc(MLS.chapterDisplayNum(slug,activeChapter.num))}"],
  ["${x.num} · ${esc(short(x.title))}", "${MLS.chapterDisplayNum(slug,x.num)} · ${esc(short(x.title))}"],
  ["Capítulo ${esc(c.num)}", "Capítulo ${esc(MLS.chapterDisplayNum(slug,c.num))}"],
  ["Capítulo ${esc(ch.num)}", "Capítulo ${esc(MLS.chapterDisplayNum(slug,ch.num))}"],
  ['${esc(short(c.title))}</a>', 'Capítulo ${esc(MLS.chapterDisplayNum(m.slug,c.num))} · ${esc(short(c.title))}</a>']
]);

patch('search.js', [
  [".sort((a,b)=>Number(a[0])-Number(b[0]));const cv=chapterEl.value", ".sort((a,b)=>Number(MLS.chapterDisplayNum(slug,a[0]))-Number(MLS.chapterDisplayNum(slug,b[0])));const cv=chapterEl.value"],
  ['${n} · ${esc(short(t))}</option>', '${MLS.chapterDisplayNum(slug,n)} · ${esc(short(t))}</option>']
]);

patch('map.js', [
  ["[...byChapter.entries()].sort((a,b)=>Number(a[0])-Number(b[0]))", "[...byChapter.entries()].sort((a,b)=>Number(MLS.chapterDisplayNum(m.slug,a[0]))-Number(MLS.chapterDisplayNum(m.slug,b[0])))"],
  ["Cap. ${esc(r.dataset.miniChapter)}", "Cap. ${esc(MLS.chapterDisplayNum(r.dataset.language,r.dataset.miniChapter))}"],
  ["Number(a.chapterNum)-Number(b.chapterNum)", "Number(MLS.chapterDisplayNum(slug,a.chapterNum))-Number(MLS.chapterDisplayNum(slug,b.chapterNum))"],
  ["Cap. ${block.chapterNum}</text>", "Cap. ${MLS.chapterDisplayNum(slug,block.chapterNum)}</text>"],
  ["Cap. ${esc(e.chapterNum)}</span>", "Cap. ${esc(MLS.chapterDisplayNum(slug,e.chapterNum))}</span>"]
]);
