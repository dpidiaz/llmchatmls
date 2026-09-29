'use strict';
// Read-only audit of an authorized reservation and its already-fetched Git objects.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const gate=require('../MLS R32 EDITORIAL/r4 universal gate.cjs');
const allocation=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
async function run(root,issueFile,output){
 const issue=JSON.parse(fs.readFileSync(issueFile,'utf8'));issue.number??=issue.issue_number;
 const res=allocation.parseReservation(issue);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-readonly-gate-'));
 try{
  const {reviews}=await gate.materialize(root,res,dir);
  const report=await gate.assessBuffer(root,dir,{bufferSha:res.elastic.consolidatedSha,reviews});
  fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,passed:report.passed,entries:report.entries.length,reportHash:report.reportHash}));
  if(report.status!=='PASS')process.exitCode=2;
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
if(require.main===module){
 const [root,issue,output]=process.argv.slice(2);
 if(!root||!issue||!output){console.error('Usage: R4-2-bcr-gate.cjs <canonical checkout> <reservation issue JSON> <report JSON>');process.exitCode=2;}
 else run(path.resolve(root),issue,output).catch(e=>{console.error(e.code||e.message);process.exitCode=2;});
}
module.exports={run};
