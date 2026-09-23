'use strict';
const store=require('../MLS R32 EDITORIAL/evidence git.js');
(async()=>{const report=await store.validateStore('.');console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;})().catch(error=>{console.error(error);process.exitCode=1;});
