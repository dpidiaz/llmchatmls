const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');

test('la numeración visible sigue el orden editorial sin mutar identificadores ni capítulos internos', () => {
  const root = path.resolve(__dirname, '..');
  const bundle = path.join(root, 'MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mls-chapters-'));
  try {
    execFileSync('tar', ['-xzf', bundle, '-C', temp, 'public/js', 'public/data/index.js', 'public/data/volumes/espanol-guatemala.js']);
    const publicDir = path.join(temp, 'public');
    const indexPath = path.join(publicDir, 'data/index.js');
    const volumePath = path.join(publicDir, 'data/volumes/espanol-guatemala.js');
    const indexBefore = fs.readFileSync(indexPath);
    const volumeBefore = fs.readFileSync(volumePath);
    execFileSync(process.execPath, [path.join(root, 'scripts/aplicar numeracion visible.js')], {
      env: {...process.env, MLS_PUBLIC_DIR: publicDir}
    });
    assert.deepEqual(fs.readFileSync(indexPath), indexBefore);
    assert.deepEqual(fs.readFileSync(volumePath), volumeBefore);

    const browser = {window: {}, document: {getElementById: () => ({}), body: {dataset: {}, classList: {toggle() {}}}}, localStorage: {getItem: () => null}};
    vm.runInNewContext(indexBefore.toString(), browser);
    browser.MLS_META = browser.window.MLS_META;
    browser.MLS_INDEX = browser.window.MLS_INDEX;
    vm.runInNewContext(fs.readFileSync(path.join(publicDir, 'js/core.js'), 'utf8'), browser);
    const MLS = browser.window.MLS;
    const expected = Array.from({length: 58}, (_, i) => i + 1);
    const identifiers = browser.MLS_INDEX.map(e => [e.code, e.n, e.chapterNum]);
    for (const meta of browser.MLS_META) {
      const entries = browser.MLS_INDEX.filter(e => e.language === meta.slug).sort((a, b) => a.n - b.n);
      const editorial = [...new Set(entries.map(e => Number(e.chapterNum)))];
      const displayed = editorial.map(n => Number(MLS.chapterDisplayNum(meta.slug, n)));
      assert.deepEqual(displayed, expected, meta.slug);
      assert.deepEqual(Array.from(MLS.structureFor(meta.slug).chapters, c => Number(MLS.chapterDisplayNum(meta.slug, c.num))), expected, meta.slug);
      if (meta.slug === 'espanol-guatemala') {
        assert.deepEqual(editorial.slice(0, 7), [1, 49, 50, 51, 52, 2, 3]);
        assert.equal(MLS.chapterDisplayNum(meta.slug, 48), 52);
        assert.equal(MLS.chapterDisplayNum(meta.slug, 53), 53);
      } else assert.deepEqual(editorial, expected, meta.slug);
    }
    assert.deepEqual(browser.MLS_INDEX.map(e => [e.code, e.n, e.chapterNum]), identifiers);

    const app = fs.readFileSync(path.join(publicDir, 'js/app.js'), 'utf8');
    const search = fs.readFileSync(path.join(publicDir, 'js/search.js'), 'utf8');
    const map = fs.readFileSync(path.join(publicDir, 'js/map.js'), 'utf8');
    const reader = fs.readFileSync(path.join(root, 'MLS R32 OVERLAY/reader.js'), 'utf8');
    for (const source of [app, search, map, reader]) assert.match(source, /MLS\.chapterDisplayNum\(/);
    assert.match(app, /chapter:c\.num/);
    assert.match(reader, /chapter=\$\{encodeURIComponent\(e\.chapterNum\)\}/);
    assert.match(search, /String\(x\.r\.chapterNum\)===String\(chapter\)/);
    assert.match(map, /data-chapter="\$\{escAttr\(e\.chapterNum\)\}"/);
    for (const file of ['core.js', 'app.js', 'search.js', 'map.js']) execFileSync(process.execPath, ['--check', path.join(publicDir, 'js', file)]);
    execFileSync(process.execPath, ['--check', path.join(root, 'MLS R32 OVERLAY/reader.js')]);
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
});
