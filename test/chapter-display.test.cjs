const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');

test('la numeración visible canónica no vuelve a remapear Español de Guatemala', () => {
  const root = path.resolve(__dirname, '..');
  const bundle = path.join(root, 'MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mls-chapters-canonical-'));
  try {
    execFileSync('tar', ['-xzf', bundle, '-C', temp, 'public/js']);
    const publicDir = path.join(temp, 'public');
    const dataDir = path.join(publicDir, 'data');
    fs.mkdirSync(dataDir, {recursive: true});

    execFileSync(process.execPath, [path.join(root, 'scripts/generar datos canonicos compatibles.js')], {
      env: {...process.env, MLS_PUBLIC_DATA_ROOT: dataDir},
      stdio: 'ignore'
    });

    execFileSync(process.execPath, [path.join(root, 'scripts/aplicar numeracion visible.js')], {
      env: {...process.env, MLS_PUBLIC_DIR: publicDir}
    });

    const browser = {
      window: {},
      document: {getElementById: () => ({}), body: {dataset: {}, classList: {toggle() {}}}},
      localStorage: {getItem: () => null}
    };
    vm.runInNewContext(fs.readFileSync(path.join(dataDir, 'index.js'), 'utf8'), browser);
    browser.MLS_META = browser.window.MLS_META;
    browser.MLS_INDEX = browser.window.MLS_INDEX;
    vm.runInNewContext(fs.readFileSync(path.join(publicDir, 'js/core.js'), 'utf8'), browser);

    const MLS = browser.window.MLS;
    const expected = Array.from({length: 58}, (_, i) => i + 1);

    for (const meta of browser.MLS_META) {
      const entries = browser.MLS_INDEX
        .filter(e => e.language === meta.slug)
        .sort((a, b) => a.n - b.n);
      const canonical = [...new Set(entries.map(e => Number(e.chapterNum)))];
      const displayed = canonical.map(n => Number(MLS.chapterDisplayNum(meta.slug, n)));
      assert.deepEqual(canonical, expected, meta.slug + ' debe tener chapterNum canónico 1..58');
      assert.deepEqual(displayed, expected, meta.slug + ' no debe sufrir una segunda renumeración');
    }

    assert.equal(MLS.chapterDisplayNum('espanol-guatemala', 1), 1);
    assert.equal(MLS.chapterDisplayNum('espanol-guatemala', 2), 2);
    assert.equal(MLS.chapterDisplayNum('espanol-guatemala', 5), 5);
    assert.equal(MLS.chapterDisplayNum('espanol-guatemala', 6), 6);
    assert.equal(MLS.chapterDisplayNum('espanol-guatemala', 49), 49);
    assert.equal(MLS.chapterDisplayNum('espanol-guatemala', 52), 52);

    const app = fs.readFileSync(path.join(publicDir, 'js/app.js'), 'utf8');
    const search = fs.readFileSync(path.join(publicDir, 'js/search.js'), 'utf8');
    const map = fs.readFileSync(path.join(publicDir, 'js/map.js'), 'utf8');
    const reader = fs.readFileSync(path.join(root, 'MLS R32 OVERLAY/reader.js'), 'utf8');
    for (const source of [app, search, map, reader]) assert.match(source, /MLS\.chapterDisplayNum\(/);

    for (const file of ['core.js', 'app.js', 'search.js', 'map.js']) {
      execFileSync(process.execPath, ['--check', path.join(publicDir, 'js', file)]);
    }
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
});
