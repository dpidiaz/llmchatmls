'use strict';
// This entrypoint is invoked only by the repository-owned, serialized GitHub Actions workflow.
// A 403/429 fails closed; it never retries or bypasses platform limits.
const fs=require('node:fs');
const cp=require('node:child_process');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const verify=require('../MLS R32 EDITORIAL/r4 buffered verify.cjs');
const transport=require('../MLS R32 EDITORIAL/r4 buffered transport.cjs');
const remote=require('../MLS R32 EDITORIAL/r4 buffered remote.cjs');
const api=()=>verify.api(process.env.GITHUB_REPOSITORY,process.env.GITHUB_TOKEN);
async function eventIssue(event){
  if(process.env.GITHUB_EVENT_NAME!=='workflow_dispatch')return event.issue;
  const id=String(event.inputs?.request_issue||'');
  if(!/^[1-9][0-9]{0,9}$/.test(id))core.error('SYNC_DISPATCH_ISSUE_INVALID');
  const issue=await api().get('/issues/'+id);
  if(issue.state!=='open')core.error('SYNC_DISPATCH_ISSUE_CLOSED');
  return issue;
}
async function run([mode,...args]){
  if(mode==='request'){
    const event=JSON.parse(fs.readFileSync(args[0]||process.env.GITHUB_EVENT_PATH,'utf8'));
    const request=verify.requestFromIssue(await eventIssue(event));
    return 'issueNumber='+request.issueNumber+'\ninboxBranch='+request.inboxBranch+'\n';
  }
  if(mode==='unpack')return transport.importFrom(args[0],args[1]);
  if(mode==='prepare')return remote.prepare(args[0],args[1],Number(args[2]),api(),{canonicalRoot:process.env.MLS_R41_CANONICAL_ROOT||args[1]});
  if(mode==='stage-local'){
    const m=core.manifest(args[0]),base=args[1],paths=m.allocation.units.map(u=>u.evidenceArtifactPath);
    for(const p of paths){
      const e=core.read(core.ef(args[0],p.match(/MLS-V\d{2}-\d{4}/)[0]));
      const actual=core.read(require('node:path').join(base,p));
      if(core.hash(actual)!==core.hash(e))core.error('STAGED_FILE_MISMATCH',p);
    }
    cp.execFileSync('git',['add','--',...paths],{cwd:base,stdio:'pipe'});
    const actual=cp.execFileSync('git',['diff','--cached','--name-only','-z'],{cwd:base,encoding:'utf8'})
      .split('\0').filter(Boolean);
    if(actual.some(p=>!paths.includes(p)))core.error('UNEXPECTED_STAGED_FILE');
    return {stagedFiles:actual.length,assignmentId:m.allocation.assignmentId};
  }
  if(mode==='mark'){
    const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
    const request=verify.requestFromIssue(await eventIssue(event));
    if(request.issueNumber!==Number(args[2]))core.error('SYNC_REQUEST_RESERVATION_MISMATCH');
    return remote.markStaged(args[0],args[1],Number(args[2]),args[3],args[4],api(),Number(process.env.GITHUB_RUN_ID),request.requestIssueNumber,{canonicalRoot:process.env.MLS_R41_CANONICAL_ROOT||args[1]});
  }
  core.error('REMOTE_USAGE','Usage: request <event.json> | unpack <buffer> <bundle.json> | prepare <buffer> <checkout> <issue> | stage-local <buffer> <checkout> | mark <buffer> <checkout> <issue> <branch> <commitSHA>');
}
run(process.argv.slice(2)).then(x=>process.stdout.write(typeof x==='string'?x:JSON.stringify(x,null,2)+'\n'))
  .catch(e=>{console.error(e.code||'R41_SYNC_FAILED',e.message);process.exitCode=2;});
