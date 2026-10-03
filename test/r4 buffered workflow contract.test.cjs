'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const yaml=name=>fs.readFileSync(path.join(root,'.github/workflows',name),'utf8');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('R4.1 Issue writer and allocator remain in the same serialized critical section',()=>{
  const sync=yaml('R4.1 Buffered Sync.yml'),scheduler=yaml('MLS Global Dispatcher Scheduler.yml');
  assert.match(sync,/mls-global-dispatcher/);
  assert.match(sync,/mls-global-dispatcher-skip-\{0\}/);
  assert.match(scheduler,/group: mls-global-dispatcher/);
  assert.doesNotMatch(scheduler,/mls-global-dispatcher-skip-\{0\}/);
  assert.match(scheduler,/workflow_dispatch:/);
  assert.match(sync,/types:\s*\[opened\]/);
  assert.match(sync,/github\.event\.issue\.author_association/);
  assert.match(scheduler,/github\.event\.issue\.author_association/);
  assert.match(sync,/ref:\s*main/);
  assert.doesNotMatch(sync,/pull_request:|\b(push|schedule):/);
  assert.match(sync,/workflow_dispatch:\s*\n\s*inputs:\s*\n\s*request_issue:/);
  assert.match(read('scripts/R4-1-buffered-remote.cjs'),/verify\.requestFromIssue\(await eventIssue\(event\)\)/);
});
test('R4.1 batch sync requires canonical R33 before a non-force grouped git push',()=>{
  const sync=yaml('R4.1 Buffered Sync.yml');
  const validate=sync.indexOf('Canonical R33 certification before grouped write');
  const push=sync.indexOf('git push origin');
  const mark=sync.indexOf('Confirm exact remote SHA and mark reservation STAGED');
  assert.ok(validate>0&&push>validate&&mark>push);
  assert.match(sync,/scripts\/R33\\ evidence\\ git\\ validate\.cjs/);
  assert.match(sync,/git push origin "HEAD:refs\/heads\/\$TARGET_BRANCH"/);
  assert.doesNotMatch(sync,/git push --force|git push -f|git push --force-with-lease/);
  assert.doesNotMatch(sync,/wrangler|CLOUDFLARE|OPENAI_API_KEY|D1_ANALYTICS|npm run deploy/);
});
test('ordinary MLS siguiente, main deployment and FREE ONLY retain separate existing contracts',()=>{
  const agents=read('AGENTS.md'),production=yaml('produccion.yml');
  assert.match(agents,/do not silently reinterpret ordinary \`MLS siguiente\`/);
  assert.match(agents,/FREE ONLY/);
  assert.match(production,/on:\s*\n\s*workflow_dispatch:/);
  assert.match(production,/github\.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(yaml('R4.1 Buffered Sync.yml'),/npm run predeploy|npm run deploy/);
});

test('R4.1 retries isolate staged Evidence from canonical pool',()=>{
  const sync=yaml('R4.1 Buffered Sync.yml');
  const remote=read('scripts/R4-1-buffered-remote.cjs');
  const verifier=read('MLS R32 EDITORIAL/r4 buffered verify.cjs');
  assert.match(sync,/git worktree add --detach "\$RUNNER_TEMP\/r41-canonical" main/);
  assert.match(sync,/MLS_R41_CANONICAL_ROOT=/);
  assert.match(remote,/canonicalRoot:process\.env\.MLS_R41_CANONICAL_ROOT/);
  assert.match(verifier,/snapshot=collect\(issues,canonicalRoot\)/);
});
