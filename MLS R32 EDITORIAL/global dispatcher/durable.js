'use strict';

// Git refs provide the serialization point. Issue bodies are repairable projections.
const core=require('./core.js');
const STATE_BRANCH='mls-dispatch-state';
const STATE_FILE='dispatcher.json';
const clone=x=>structuredClone(x);

function rateDelay(response,message,attempt,now=Date.now(),random=Math.random){
  const h=response.headers;
  if(![403,429].includes(response.status)||!(response.status===429||h.get('retry-after')||h.get('x-ratelimit-remaining')==='0'||/secondary rate|rate limit|abuse/i.test(message)))return null;
  const retry=h.get('retry-after');
  const retryMs=retry?(Number.isFinite(Number(retry))?Number(retry)*1000:Date.parse(retry)-now):0;
  const reset=h.get('x-ratelimit-remaining')==='0'?Number(h.get('x-ratelimit-reset'))*1000-now:0;
  return Math.max(60000*2**attempt,retryMs||0,reset||0)+Math.floor(random()*1000);
}
function githubClient({token,repository,fetchImpl=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now,random=Math.random,maxRetries=3}){
  const prefix='/repos/'+repository;
  const api=async(method,endpoint,body)=>{
    for(let attempt=0;;attempt++){
      const response=await fetchImpl('https://api.github.com'+endpoint,{method,headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'mls-lease-001'},body:body===undefined?undefined:JSON.stringify(body)});
      const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
      if(response.ok)return data;
      const error=Object.assign(new Error('GitHub '+response.status+': '+(data?.message||raw)),{status:response.status});
      const delay=rateDelay(response,error.message,attempt,now(),random);
      if(delay===null)throw error;
      error.code='GITHUB_BACKOFF';error.retryAt=core.iso(now()+delay);
      if(attempt>=maxRetries)throw error; // Durable input remains pending for the next invocation.
      await sleep(delay);
    }
  };
  api.prefix=prefix;
  return api;
}
async function pages(api,endpoint){
  const rows=[];
  for(let page=1;;page++){
    const part=await api('GET',endpoint+(endpoint.includes('?')?'&':'?')+'per_page=100&page='+page);
    if(!Array.isArray(part))throw new Error('Expected complete paginated response');
    rows.push(...part);if(part.length<100)return rows;
  }
}
class GitStore{
  constructor(api,repository){this.api=api;this.prefix='/repos/'+repository;}
  async read(){
    let ref;
    try{ref=await this.api('GET',this.prefix+'/git/ref/heads/'+STATE_BRANCH);}catch(e){if(e.status===404)return {sha:null,value:{version:1,issues:{}}};throw e;}
    const commit=await this.api('GET',this.prefix+'/git/commits/'+ref.object.sha);
    const tree=await this.api('GET',this.prefix+'/git/trees/'+commit.tree.sha);
    const file=tree.tree.find(x=>x.path===STATE_FILE);
    if(!file)throw new Error('State branch missing dispatcher.json; refusing reset');
    const blob=await this.api('GET',this.prefix+'/git/blobs/'+file.sha);
    const value=JSON.parse(Buffer.from(blob.content,'base64').toString('utf8'));
    if(value.version!==1||!value.issues)throw new Error('Unsupported dispatcher state');
    return {sha:ref.object.sha,value};
  }
  async cas(expected,value){
    const blob=await this.api('POST',this.prefix+'/git/blobs',{content:JSON.stringify(value),encoding:'utf-8'});
    const tree=await this.api('POST',this.prefix+'/git/trees',{tree:[{path:STATE_FILE,mode:'100644',type:'blob',sha:blob.sha}]});
    const commit=await this.api('POST',this.prefix+'/git/commits',{message:'MLS-LEASE-001 durable transition',tree:tree.sha,parents:expected?[expected]:[]});
    try{
      if(expected)await this.api('PATCH',this.prefix+'/git/refs/heads/'+STATE_BRANCH,{sha:commit.sha,force:false});
      else await this.api('POST',this.prefix+'/git/refs',{ref:'refs/heads/'+STATE_BRANCH,sha:commit.sha});
      return true;
    }catch(e){if([409,422].includes(e.status))return false;throw e;}
  }
}
function tracked(issue){return /^\[MLS Dispatcher(?:\]| Ledger\])/.test(String(issue?.title||''));}
class IssueTransaction{
  constructor(api,value){this.api=api;this.value=value;}
  async call(method,endpoint,body){
    const one=/\/issues\/(\d+)$/.exec(endpoint);
    if(one&&method==='PATCH'){
      const id=one[1],prior=this.value.issues[id]||await this.api('GET',endpoint);
      if(!tracked(prior)&&!tracked(body))throw new Error('Dispatcher transaction cannot mutate unrelated issue');
      const next={...prior,...clone(body)};
      if(JSON.stringify(next)!==JSON.stringify(prior)){
        this.value.dirty||={};this.value.dirty[id]=true;
      }
      return this.value.issues[id]=next;
    }
    if(one&&method==='GET'&&this.value.issues[one[1]])return clone(this.value.issues[one[1]]);
    return this.api(method,endpoint,body);
  }
  async issues(repository){
    const remote=(await pages(this.api,'/repos/'+repository+'/issues?state=open&sort=created&direction=asc')).filter(x=>!x.pull_request);
    const combined=new Map(remote.map(x=>[String(x.number),x]));
    for(const issue of remote)if(tracked(issue)&&!this.value.issues[issue.number])this.value.issues[issue.number]=clone(issue);
    for(const issue of Object.values(this.value.issues))combined.set(String(issue.number),clone(issue));
    return [...combined.values()].filter(x=>x.state!=='closed');
  }
}
async function transact(store,api,operation,{attempts=20}={}){
  for(let attempt=0;attempt<attempts;attempt++){
    const snapshot=await store.read(),next=clone(snapshot.value),tx=new IssueTransaction(api,next);
    const result=await operation(tx);
    if(JSON.stringify(next)===JSON.stringify(snapshot.value))return result;
    if(await store.cas(snapshot.sha,next))return result;
  }
  throw new Error('CAS contention; durable input retained for scheduled retry');
}
async function project(store,api,repository){
  const {value}=await store.read();
  for(const id of Object.keys(value.dirty||{})){
    const issue=value.issues[id];
    const assignment=core.parseAssignmentState(issue.body||'');
    if(assignment?.publicationPending){
      // Start ACK TTL only once publication can be attempted, with a durable reservation
      // throughout a crash/403. Retrying this preparation preserves the epoch and token.
      await transact(store,api,async tx=>{
        const current=core.parseAssignmentState(tx.value.issues[id]?.body||'');
        if(!current?.publicationPending||current.leaseToken!==assignment.leaseToken)return;
        current.claimedAt=core.iso();current.ackDeadlineAt=core.plusMs(current.claimedAt,core.ACK_TTL_MS);
        current.expiresAt=current.ackDeadlineAt;
        tx.value.issues[id].body=core.renderAssignmentBody(current);
      });
      const fresh=await store.read();
      issue.body=fresh.value.issues[id].body;
    }
    const endpoint='/repos/'+repository+'/issues/'+issue.number;
    const remote=await api('GET',endpoint);
    let body=issue.body;
    const published=core.parseAssignmentState(body||'');
    if(published?.publicationPending){published.publicationPending=false;body=core.renderAssignmentBody(published);}
    if(core.parseLedger(body)&&body.length>60000)body='## MLS Global Dispatcher ledger\n\nAuthoritative ledger: `'+STATE_BRANCH+'/'+STATE_FILE+'`. Issue projection exceeds GitHub body limit.';
    const patch={title:issue.title,body,state:issue.state||'open'};
    if(patch.state==='closed')patch.state_reason=issue.state_reason||'completed';
    if(Object.entries(patch).some(([k,v])=>remote[k]!==v))await api('PATCH',endpoint,patch);
    await transact(store,api,async tx=>{
      if(JSON.stringify(tx.value.issues[id])===JSON.stringify(issue)){
        const current=core.parseAssignmentState(issue.body||'');
        if(current?.publicationPending){
          current.publicationPending=false;
          // Metadata remains authoritative in Git; next event refreshes the Issue body.
          tx.value.issues[id].body=core.renderAssignmentBody(current);
        }
        delete tx.value.dirty[id];
      }
    });
  }
}
module.exports={STATE_BRANCH,rateDelay,githubClient,pages,GitStore,IssueTransaction,transact,project};
