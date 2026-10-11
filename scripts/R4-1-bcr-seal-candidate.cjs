'use strict';
// One-off read-only-remote canonical seal candidate for MLS-BUFFER-001872.
// sync.seal runs against a TEMPORARY extraction of the immutable approved
// commit. This code does not push, change the reservation or invoke SYNC.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const gate=require('./R4-1-bcr-canonical-gate.cjs');
const sync=require('../MLS R32 EDITORIAL/r4 buffered sync.cjs');
const transport=require('../MLS R32 EDITORIAL/r4 buffered transport.cjs');
const PIN='8c612b789d117c8cfecfd5e835b1227543cda546';
function assert(v,msg){if(!v)core.error('SEAL_1872_'+msg);}
async function main(root,dir){
 root=path.resolve(root);dir=path.resolve(dir);
 assert(fs.existsSync(path.join(dir,'manifest.json')),'ARCHIVE_MISSING');
 assert(!fs.existsSync(path.join(dir,'package.json')),'PREMATURE_PACKAGE');
 const actual=cp.execFileSync('git',['rev-parse','refs/remotes/origin/r41-bcr-1872'],{
  cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 assert(actual===PIN,'BUFFER_HEAD_MOVED');
 const inspected=gate.validateState(root,dir,PIN);
 assert(inspected.rows.length===25,'PREFLIGHT_NOT_25');
 // This is the ACTUAL existing canonical function, not a replica.
 const pkg=await sync.seal(dir,root);
 const status=core.inspect(dir),bundle=transport.assemble(dir);
 assert(status.sealed&&status.completed.length===25&&!status.invalid.length&&
  !status.missing.length&&!status.orphans.length,'POST_SEAL_INSPECT');
 assert(pkg.schema===core.SCHEMA&&pkg.allocationHash===gate.ALLOCATION&&
  pkg.integration==='PENDING_REMOTE_RECONCILIATION'&&pkg.checkpointSizeMax===1&&
  pkg.entries.length===25&&pkg.entries.every(x=>x.derivedStatus==='VERIFIED'&&
   x.claimsVerified===3&&x.sourcesTotal===1),'PACKAGE_STATUS');
 assert(bundle.package.packageHash===pkg.packageHash&&
  core.hash({allocationHash:pkg.allocationHash,entries:pkg.entries.map(
   ({code,entrySha,derivedStatus,articleHash})=>({code,entrySha,derivedStatus,articleHash}))})===pkg.packageHash,
  'PACKAGE_HASH');
 assert(pkg.entries.every((row,i)=>row.code===inspected.manifest.allocation.units[i].code),
  'ORDER_CONFLICT');
 const candidate={schema:'MLS-R4.1-1872-SEAL-CANDIDATE-1',bufferSha:PIN,
  allocationHash:gate.ALLOCATION,gateRunId:36574234464,
  sealMethod:'r4 buffered sync.cjs :: seal',isTemporaryRunnerOutput:true,
  sourceBranchMutated:false,synced:false,cloudflareDeployed:false,
  package:pkg,bundleHash:bundle.bundleHash};
 console.log('MLS_R41_1872_SEAL_CANDIDATE '+JSON.stringify(candidate));
 if(process.env.MLS_SEAL_CANDIDATE_OUTPUT)
  fs.writeFileSync(process.env.MLS_SEAL_CANDIDATE_OUTPUT,
   JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});
 return candidate;
}
if(require.main===module){
 const [root,dir]=process.argv.slice(2);
 if(!root||!dir){console.error('Usage: node scripts/R4-1-bcr-seal-candidate.cjs <checkout> <temp-buffer>');process.exitCode=2;}
 else main(root,dir).catch(e=>{console.error(e.code||'SEAL_FAIL',e.message);process.exitCode=2;});
}
module.exports={main};
