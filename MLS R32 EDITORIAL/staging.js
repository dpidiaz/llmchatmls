// MLS GitHub Staging v1.
// Staging operations deliberately do not touch D1. Only snapshot creation and
// reconciliation are allowed to use env.WIKI_DB.
const MLS_STAGING_ROOT = 'mls-staging';
const MLS_STAGING_BRANCH_DEFAULT = 'mls-staging';
const MLS_STAGING_MAX_RUN = 400;
const MLS_STAGING_REFERENCE_LIMIT = 6;
const MLS_STAGING_REFERENCE_BANK = 96;
const MLS_STAGING_MAX_GITHUB_RETRIES = 6;
const MLS_STAGING_ACTIVE = new Set(['reserved','drafting','validated']);
const MLS_STAGING_TERMINAL = new Set(['staged','deferred','needs_review','integrated','deployed','cancelled','preservedExisting']);
const MLS_STAGING_APP_TOKEN_CACHE = { token: null, expiresAt: 0 };
const MLS_STAGING_SHARD_CACHE = new Map();

function mlsStagingNow() { return new Date().toISOString(); }
function mlsStagingAssertCode(code) {
  const value = String(code || '').trim().toUpperCase();
  if (!/^MLS-V\d{2}-\d{4}$/.test(value)) mlsChatError(400, 'Código MLS inválido.');
  return value;
}
function mlsStagingRepo(env) {
  const owner = String(env.MLS_STAGING_GITHUB_OWNER || 'dpidiaz').trim();
  const repo = String(env.MLS_STAGING_GITHUB_REPO || 'llmchatmls').trim();
  const branch = String(env.MLS_STAGING_GITHUB_BRANCH || MLS_STAGING_BRANCH_DEFAULT).trim();
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo) || !/^[A-Za-z0-9._\/-]{1,200}$/.test(branch))
    mlsChatError(503, 'Configuración GitHub staging inválida.');
  return { owner, repo, branch };
}
function mlsStagingB64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function mlsStagingDecodeBase64(text) {
  const binary = atob(String(text || '').replace(/\s+/g,''));
  const bytes = new Uint8Array(binary.length);
  for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  return bytes;
}
async function mlsStagingGitHubAppToken(env) {
  const appId = String(env.MLS_STAGING_GITHUB_APP_ID || '').trim();
  const installationId = String(env.MLS_STAGING_GITHUB_INSTALLATION_ID || '').trim();
  const privateKey = String(env.MLS_STAGING_GITHUB_APP_PRIVATE_KEY || '').replace(/\\n/g,'\n').trim();
  if (!appId || !installationId || !privateKey) return null;
  if (MLS_STAGING_APP_TOKEN_CACHE.token && MLS_STAGING_APP_TOKEN_CACHE.expiresAt > Date.now() + 120000)
    return MLS_STAGING_APP_TOKEN_CACHE.token;
  const pem = privateKey.replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\s+/g,'');
  let key;
  try {
    key = await crypto.subtle.importKey('pkcs8', mlsStagingDecodeBase64(pem), {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['sign']);
  } catch {
    mlsChatError(503, 'La clave privada de GitHub App staging no es PKCS8 válida.');
  }
  const now = Math.floor(Date.now()/1000);
  const header = mlsStagingB64url(new TextEncoder().encode(JSON.stringify({alg:'RS256',typ:'JWT'})));
  const payload = mlsStagingB64url(new TextEncoder().encode(JSON.stringify({iat:now-30,exp:now+540,iss:appId})));
  const unsigned = header+'.'+payload;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = unsigned+'.'+mlsStagingB64url(new Uint8Array(signature));
  const repo = mlsStagingRepo(env);
  const response = await fetch('https://api.github.com/app/installations/'+encodeURIComponent(installationId)+'/access_tokens', {
    method:'POST',
    headers:{authorization:'Bearer '+jwt,accept:'application/vnd.github+json','user-agent':'master-language-system-staging','x-github-api-version':'2022-11-28'}
  });
  if (!response.ok) mlsChatError(503, 'No fue posible obtener token de GitHub App para staging.');
  const data = await response.json();
  MLS_STAGING_APP_TOKEN_CACHE.token = data.token;
  MLS_STAGING_APP_TOKEN_CACHE.expiresAt = Date.parse(data.expires_at || '') || Date.now()+45*60*1000;
  return data.token;
}
async function mlsStagingGitHubToken(env) {
  const app = await mlsStagingGitHubAppToken(env);
  if (app) return app;
  const token = String(env.MLS_STAGING_GITHUB_TOKEN || '').trim();
  if (!token) mlsChatError(503, 'MLS Staging no tiene credenciales GitHub configuradas.');
  return token;
}
async function mlsStagingGitHub(env, path, init = {}) {
  const repo = mlsStagingRepo(env);
  const token = await mlsStagingGitHubToken(env);
  const response = await fetch('https://api.github.com/repos/'+encodeURIComponent(repo.owner)+'/'+encodeURIComponent(repo.repo)+path, {
    ...init,
    headers:{
      accept:'application/vnd.github+json',
      authorization:'Bearer '+token,
      'content-type':'application/json',
      'user-agent':'master-language-system-staging',
      'x-github-api-version':'2022-11-28',
      ...(init.headers || {})
    }
  });
  if (response.status === 404 && init.allow404) return null;
  let data = null;
  const text = await response.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = {message:text}; }
  if (!response.ok) {
    const error = new Error('GitHub '+response.status+': '+String(data?.message || 'error'));
    error.status = response.status === 409 || response.status === 422 ? 409 : 503;
    error.githubStatus = response.status;
    throw error;
  }
  return data;
}
async function mlsStagingEnsureBranch(env) {
  const repo = mlsStagingRepo(env);
  const branchPath = '/git/ref/heads/'+repo.branch.split('/').map(encodeURIComponent).join('/');
  const existing = await mlsStagingGitHub(env, branchPath, {method:'GET',allow404:true});
  if (existing?.object?.sha) return existing.object.sha;
  const main = await mlsStagingGitHub(env, '/git/ref/heads/main', {method:'GET'});
  try {
    await mlsStagingGitHub(env, '/git/refs', {method:'POST',body:JSON.stringify({ref:'refs/heads/'+repo.branch,sha:main.object.sha})});
  } catch (error) {
    if (error.status !== 409) throw error;
  }
  const created = await mlsStagingGitHub(env, branchPath, {method:'GET'});
  return created.object.sha;
}
async function mlsStagingHead(env) {
  const repo = mlsStagingRepo(env);
  await mlsStagingEnsureBranch(env);
  const ref = await mlsStagingGitHub(env, '/git/ref/heads/'+repo.branch.split('/').map(encodeURIComponent).join('/'), {method:'GET'});
  return ref.object.sha;
}
function mlsStagingPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}
async function mlsStagingReadText(env, path, ref, allowMissing = false) {
  const item = await mlsStagingGitHub(env, '/contents/'+mlsStagingPath(path)+'?ref='+encodeURIComponent(ref), {method:'GET',allow404:allowMissing});
  if (!item) return null;
  if (item.type !== 'file') mlsChatError(409, 'Ruta staging no es un archivo: '+path);
  if (item.encoding === 'base64' && item.content) return new TextDecoder().decode(mlsStagingDecodeBase64(item.content));
  const blob = await mlsStagingGitHub(env, '/git/blobs/'+encodeURIComponent(item.sha), {method:'GET'});
  if (blob.encoding !== 'base64') mlsChatError(503, 'GitHub devolvió un blob staging no soportado.');
  return new TextDecoder().decode(mlsStagingDecodeBase64(blob.content));
}
async function mlsStagingReadJson(env, path, ref, allowMissing = false, fallback = null) {
  const text = await mlsStagingReadText(env,path,ref,allowMissing);
  if (text === null) return fallback;
  try { return JSON.parse(text); } catch { mlsChatError(409, 'JSON staging corrupto: '+path); }
}
async function mlsStagingCommit(env, files, message, expectedHead) {
  const repo = mlsStagingRepo(env);
  const head = expectedHead || await mlsStagingHead(env);
  const baseCommit = await mlsStagingGitHub(env, '/git/commits/'+encodeURIComponent(head), {method:'GET'});
  const tree = [];
  for (const file of files) {
    const blob = await mlsStagingGitHub(env, '/git/blobs', {method:'POST',body:JSON.stringify({content:String(file.content),encoding:'utf-8'})});
    tree.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const nextTree = await mlsStagingGitHub(env, '/git/trees', {method:'POST',body:JSON.stringify({base_tree:baseCommit.tree.sha,tree})});
  const commit = await mlsStagingGitHub(env, '/git/commits', {method:'POST',body:JSON.stringify({message,tree:nextTree.sha,parents:[head]})});
  await mlsStagingGitHub(env, '/git/refs/heads/'+repo.branch.split('/').map(encodeURIComponent).join('/'), {
    method:'PATCH',body:JSON.stringify({sha:commit.sha,force:false})
  });
  return commit.sha;
}
function mlsStagingIndexPath(code) {
  const value = mlsStagingAssertCode(code);
  const match = /^(MLS-V\d{2})-(\d{4})$/.exec(value);
  const n = Number(match[2]);
  const start = Math.floor((n-1)/100)*100+1;
  const end = start+99;
  return MLS_STAGING_ROOT+'/index/'+match[1]+'/'+String(start).padStart(4,'0')+'-'+String(end).padStart(4,'0')+'.json';
}
function mlsStagingEmptyShard(path) { return {version:1,path,updatedAt:null,codes:{}}; }
async function mlsStagingReadShard(env, code, ref, strong = true) {
  const path = mlsStagingIndexPath(code);
  const cacheKey = ref+':'+path;
  const cached = MLS_STAGING_SHARD_CACHE.get(cacheKey);
  if (!strong && cached && cached.expiresAt > Date.now()) return structuredClone(cached.value);
  const value = await mlsStagingReadJson(env,path,ref,true,mlsStagingEmptyShard(path));
  if (!strong) MLS_STAGING_SHARD_CACHE.set(cacheKey,{expiresAt:Date.now()+60000,value});
  return value;
}
async function mlsStagingCodeState(env, code, options = {}) {
  try {
    const ref = options.ref || await mlsStagingHead(env);
    const shard = await mlsStagingReadShard(env,code,ref,options.strong !== false);
    return shard.codes?.[mlsStagingAssertCode(code)] || null;
  } catch (error) {
    if (options.failOpen) return null;
    throw error;
  }
}
function mlsStagingSummarize(run) {
  const entries = Array.isArray(run?.entries) ? run.entries : [];
  const count = status => entries.filter(x=>x.status===status).length;
  const pending = entries.filter(x=>MLS_STAGING_ACTIVE.has(x.status)).length;
  return {
    runId:run.runId, requestId:run.requestId, runType:'staging', storageMode:'github-staging',
    snapshotVersion:run.snapshotVersion, snapshotCommit:run.snapshotCommit,
    requested:run.requested, selected:entries.length, reserved:count('reserved'),
    validated:count('validated'), staged:count('staged'), integrated:count('integrated'),
    preservedExisting:count('preservedExisting'), deferred:count('deferred'),
    needsReview:count('needs_review'), pending, cancelled:count('cancelled'),
    status:run.status, codes:entries.map(x=>({position:x.position,code:x.code,status:x.status})),
    d1RowsRead:0,d1RowsWritten:0
  };
}
function mlsStagingRanges(entries) {
  const groups = [];
  for (const entry of entries || []) {
    const m=/^(MLS-V\d{2})-(\d{4})$/.exec(entry.code||'');
    if(!m){groups.push(entry.code);continue;}
    const n=Number(m[2]), last=groups[groups.length-1];
    if(last && typeof last==='object' && last.prefix===m[1] && last.end+1===n) last.end=n;
    else groups.push({prefix:m[1],start:n,end:n});
  }
  return groups.map(x=>typeof x==='string'?x:(x.start===x.end?x.prefix+'-'+String(x.start).padStart(4,'0'):x.prefix+'-'+String(x.start).padStart(4,'0')+'…'+x.prefix+'-'+String(x.end).padStart(4,'0')));
}
async function mlsStagingLoadRun(env, runId, ref) {
  if (!/^[0-9a-f-]{36}$/i.test(String(runId||''))) mlsChatError(400,'runId staging inválido.');
  return mlsStagingReadJson(env,MLS_STAGING_ROOT+'/runs/'+runId+'/manifest.json',ref,true,null);
}
async function mlsStagingLatestSnapshot(env, ref) {
  const pointer = await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/snapshots/latest.json',ref,true,null);
  if (!pointer?.snapshotVersion) mlsChatError(409,'No existe snapshot MLS Staging. Ejecuta un deploy normal que genere snapshot.');
  const manifest = await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/snapshots/'+pointer.snapshotVersion+'/manifest.json',ref,false);
  if (manifest.promptVersion !== '32.0') mlsChatError(409,'El snapshot no corresponde a MLS R32 / 32.0.');
  return {pointer,manifest};
}
async function mlsStagingSnapshotTargets(env, snapshotVersion, language, snapshotCommit) {
  return mlsStagingReadJson(env,MLS_STAGING_ROOT+'/snapshots/'+snapshotVersion+'/targets/'+language+'.json',snapshotCommit,false);
}
async function mlsStagingSnapshotReferences(env, snapshotVersion, language, snapshotCommit) {
  return mlsStagingReadJson(env,MLS_STAGING_ROOT+'/snapshots/'+snapshotVersion+'/references/'+language+'.json',snapshotCommit,true,[]);
}
async function mlsStagingContext(env, run, code) {
  const targetCode=mlsStagingAssertCode(code);
  const job=jobFromCode(targetCode);
  if(!job) mlsChatError(404,'Código fuera del corpus MLS.');
  const targets=await mlsStagingSnapshotTargets(env,run.snapshotVersion,job.language,run.snapshotCommit);
  const target=(targets||[]).find(x=>String(x.code).toUpperCase()===targetCode);
  if(!target) mlsChatError(409,'El target no existe en el snapshot del run.');
  let references=await mlsStagingSnapshotReferences(env,run.snapshotVersion,job.language,run.snapshotCommit);
  references=(references||[]).filter(x=>x.code!==targetCode).sort((a,b)=>
    (a.chapter===target.chapter?0:1)-(b.chapter===target.chapter?0:1) ||
    (a.level===target.level?0:1)-(b.level===target.level?0:1) ||
    Math.abs(Number(a.n||0)-Number(target.n||0))-Math.abs(Number(b.n||0)-Number(target.n||0))
  ).slice(0,MLS_STAGING_REFERENCE_LIMIT);
  if(!references.length) mlsChatError(409,'El snapshot no contiene referencias R32 suficientes para esta entrada.');
  const context={ok:true,standard:'MLS R32',promptVersion:'32.0',styleAuthority:'snapshot-published-corpus',
    fallbackCrossLanguage:false,target,referenceCount:references.length,profile:editorialProfileR32(references),references};
  const contextId=await mlsChatHash(run.snapshotVersion+'\n'+targetCode+'\n'+references.map(x=>x.code).join(','));
  let autoopt=null;
  try {
    const statsDoc=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/snapshots/'+run.snapshotVersion+'/autoopt.json',run.snapshotCommit,true,{stats:{}});
    autoopt=mlsAutooptProfileFromStats(context,statsDoc?.stats?.[mlsAutooptKey(context)]||{},MLS_CHAT_CONTRACT);
  } catch {}
  return {contextId,context,autoopt};
}
async function mlsStagingSelect(env, snapshot, snapshotCommit, count, ref) {
  const canonical=new Set(snapshot.canonicalCodes||[]);
  const selected=[];
  const shardCache=new Map();
  for(const language of snapshot.languageOrder||[]) {
    const targets=await mlsStagingSnapshotTargets(env,snapshot.snapshotVersion,language,snapshotCommit);
    for(const target of targets||[]) {
      if(selected.length>=count) return {selected,shardCache};
      const code=mlsStagingAssertCode(target.code);
      if(canonical.has(code)) continue;
      const path=mlsStagingIndexPath(code);
      let shard=shardCache.get(path);
      if(!shard){ shard=await mlsStagingReadJson(env,path,ref,true,mlsStagingEmptyShard(path)); shardCache.set(path,shard); }
      const state=shard.codes?.[code];
      if(state && ['reserved','drafting','validated','staged','integrated','deployed'].includes(state.status)) continue;
      selected.push(code);
    }
  }
  return {selected,shardCache};
}
async function mlsStagingStart(env,body) {
  const match=/^MLS\s+staging\s+siguientes\s+(\d{1,3})$/i.exec(String(body.command||'').trim());
  const count=match?Number(match[1]):0;
  if(!Number.isInteger(count)||count<1||count>MLS_STAGING_MAX_RUN) mlsChatError(400,'Usa MLS staging siguientes N, con N entre 1 y 400.');
  if(!/^[A-Za-z0-9_-]{16,80}$/.test(body.requestId||'')) mlsChatError(400,'requestId debe ser estable, 16–80 caracteres.');
  const requestKey=await mlsChatHash(body.requestId);
  const requestPath=MLS_STAGING_ROOT+'/requests/'+requestKey+'.json';
  let runId=crypto.randomUUID();
  let snapshotCommit=null,snapshotVersion=null;
  for(let attempt=0;attempt<MLS_STAGING_MAX_GITHUB_RETRIES;attempt++) {
    const head=await mlsStagingHead(env);
    const prior=await mlsStagingReadJson(env,requestPath,head,true,null);
    if(prior?.runId){
      const run=await mlsStagingLoadRun(env,prior.runId,head);
      return {ok:true,reused:true,run:{...mlsStagingSummarize(run),ranges:mlsStagingRanges(run.entries)}};
    }
    if(!snapshotCommit){
      const latest=await mlsStagingLatestSnapshot(env,head);
      snapshotCommit=head; snapshotVersion=latest.pointer.snapshotVersion;
    }
    const snapshot=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/snapshots/'+snapshotVersion+'/manifest.json',snapshotCommit,false);
    const {selected,shardCache}=await mlsStagingSelect(env,snapshot,snapshotCommit,count,head);
    const now=mlsStagingNow();
    const run={version:1,runId,requestId:body.requestId,runType:'staging',storageMode:'github-staging',
      snapshotVersion,snapshotCommit,createdAt:now,updatedAt:now,requested:count,status:selected.length?'active':'complete',
      entries:selected.map((code,position)=>({position,code,status:'reserved',validationAttempts:0,createdAt:now,updatedAt:now}))};
    const files=[
      {path:MLS_STAGING_ROOT+'/runs/'+runId+'/manifest.json',content:JSON.stringify(run,null,2)+'\n'},
      {path:requestPath,content:JSON.stringify({requestId:body.requestId,runId,createdAt:now},null,2)+'\n'}
    ];
    const indexManifest=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/index/manifest.json',head,true,{version:1,shards:[],updatedAt:null});
    for(const [path,shard] of shardCache) {
      let touched=false;
      for(const code of selected.filter(x=>mlsStagingIndexPath(x)===path)) {
        shard.codes[code]={code,runId,requestId:body.requestId,snapshotVersion,status:'reserved',createdAt:now,updatedAt:now};
        touched=true;
      }
      if(touched){
        shard.updatedAt=now; files.push({path,content:JSON.stringify(shard,null,2)+'\n'});
        if(!indexManifest.shards.includes(path)) indexManifest.shards.push(path);
      }
    }
    indexManifest.shards.sort(); indexManifest.updatedAt=now;
    files.push({path:MLS_STAGING_ROOT+'/index/manifest.json',content:JSON.stringify(indexManifest,null,2)+'\n'});
    try {
      await mlsStagingCommit(env,files,'MLS staging reserve '+runId,head);
      return {ok:true,reused:false,run:{...mlsStagingSummarize(run),ranges:mlsStagingRanges(run.entries)}};
    } catch(error) {
      if(error.status!==409||attempt===MLS_STAGING_MAX_GITHUB_RETRIES-1) throw error;
    }
  }
  mlsChatError(409,'No fue posible reservar staging sin conflicto.');
}
async function mlsStagingStatus(env,runId) {
  const head=await mlsStagingHead(env);
  const run=await mlsStagingLoadRun(env,runId,head);
  if(!run) mlsChatError(404,'No existe ese lote staging.');
  const autoopt=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/runs/'+run.runId+'/autoopt.json',head,true,null);
  return {ok:true,standard:'MLS R32',promptVersion:'32.0',run:{...mlsStagingSummarize(run),ranges:mlsStagingRanges(run.entries)},autoopt};
}
async function mlsStagingNext(env,runId) {
  const head=await mlsStagingHead(env);
  const run=await mlsStagingLoadRun(env,runId,head);
  if(!run) mlsChatError(404,'No existe ese lote staging.');
  const item=(run.entries||[]).find(x=>MLS_STAGING_ACTIVE.has(x.status));
  if(run.status!=='active'||!item) return {ok:true,run:{...mlsStagingSummarize(run),ranges:mlsStagingRanges(run.entries)},context:null};
  const built=await mlsStagingContext(env,run,item.code);
  return {ok:true,run:{...mlsStagingSummarize(run),ranges:mlsStagingRanges(run.entries)},contextId:built.contextId,context:built.context,
    autoopt:built.autoopt,editorialRules:{standard:'MLS R32',promptVersion:'32.0',systemPrompt:SYSTEM_PROMPT,
      languageModule:LANGUAGE_MODULES[built.context.target.language],contract:MLS_CHAT_CONTRACT},
    instruction:'Redactar solo context.target; revisar precisión y estilo; validar el borrador staging antes de stagear.',
    storageMode:'github-staging',d1RowsRead:0,d1RowsWritten:0};
}
async function mlsStagingReceipt(env,payload) {
  const secret=String(env.MLS_EDITORIAL_CHAT_KEY||'');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const encoded=mlsStagingB64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(encoded));
  return encoded+'.'+mlsStagingB64url(new Uint8Array(signature));
}
async function mlsStagingVerifyReceipt(env,receipt) {
  const parts=String(receipt||'').split('.');
  if(parts.length!==2) mlsChatError(409,'Recibo de validación staging inválido.');
  const secret=String(env.MLS_EDITORIAL_CHAT_KEY||'');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const sig=mlsStagingDecodeBase64(parts[1].replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(parts[1].length/4)*4,'='));
  const ok=await crypto.subtle.verify('HMAC',key,sig,new TextEncoder().encode(parts[0]));
  if(!ok) mlsChatError(409,'Recibo de validación staging no válido.');
  const raw=parts[0].replace(/-/g,'+').replace(/_/g,'/');
  const payload=JSON.parse(new TextDecoder().decode(mlsStagingDecodeBase64(raw.padEnd(Math.ceil(raw.length/4)*4,'='))));
  return payload;
}
function mlsStagingAutooptBase(runId) {
  return {version:1,runId,promptVersion:'32.0',validationAttempts:0,firstPassSuccess:0,published:0,staged:0,
    deferred:0,needsReview:0,lengthFailures:0,r32FalsePositiveLikeFailures:0,ruleFailures:0,markdownFailures:0,
    contractFailures:0,otherFailures:0,consecutiveFirstPassSuccesses:0,events:[]};
}
function mlsStagingAutooptApply(doc,event) {
  doc.validationAttempts++;
  if(event.valid){
    if(event.attempt===1) doc.firstPassSuccess++;
    doc.staged += event.staged?1:0;
    doc.consecutiveFirstPassSuccesses = event.attempt===1 ? doc.consecutiveFirstPassSuccesses+1 : 0;
  } else {
    doc.consecutiveFirstPassSuccesses=0;
    const map={length:'lengthFailures',r32_activity_like:'r32FalsePositiveLikeFailures',rule:'ruleFailures',markdown:'markdownFailures',contract:'contractFailures',other:'otherFailures'};
    doc[map[event.category]||'otherFailures']++;
    if(event.terminal==='deferred') doc.deferred++;
    if(event.terminal==='needs_review') doc.needsReview++;
  }
  doc.events.push(event);
  if(doc.events.length>200) doc.events=doc.events.slice(-200);
  doc.updatedAt=mlsStagingNow();
  return doc;
}
function mlsStagingNonRetryable(error) {
  return /snapshot|promptVersion|calibraci[oó]n|referencias R32 suficientes|target no existe/i.test(String(error?.message||''));
}
async function mlsStagingValidationFailure(env,run,head,item,error,body,context) {
  const now=mlsStagingNow();
  const next=structuredClone(run);
  const target=next.entries.find(x=>x.code===item.code);
  target.validationAttempts=Number(target.validationAttempts||0)+1;
  target.lastValidationError=String(error.message||error).slice(0,3000); target.updatedAt=now;
  const terminal=mlsStagingNonRetryable(error)?'needs_review':target.validationAttempts>=3?'deferred':null;
  if(terminal) target.status=terminal;
  if(!next.entries.some(x=>MLS_STAGING_ACTIVE.has(x.status))) next.status='complete';
  next.updatedAt=now;
  const autoopt=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/runs/'+run.runId+'/autoopt.json',head,true,mlsStagingAutooptBase(run.runId));
  const category=typeof mlsAutooptError==='function'?mlsAutooptError(error.message):'other';
  const features=typeof mlsAutooptFeatures==='function'?mlsAutooptFeatures(context,body.articleMarkdown,category):{};
  mlsStagingAutooptApply(autoopt,{at:now,code:item.code,attempt:target.validationAttempts,valid:false,category,terminal,...features});
  await mlsStagingCommit(env,[
    {path:MLS_STAGING_ROOT+'/runs/'+run.runId+'/manifest.json',content:JSON.stringify(next,null,2)+'\n'},
    {path:MLS_STAGING_ROOT+'/runs/'+run.runId+'/autoopt.json',content:JSON.stringify(autoopt,null,2)+'\n'}
  ],'MLS staging validation failure '+item.code,head);
  return next;
}
async function mlsStagingValidate(env,body) {
  const head=await mlsStagingHead(env);
  const run=await mlsStagingLoadRun(env,body.runId,head);
  if(!run||run.status!=='active') mlsChatError(409,'El lote staging no está activo.');
  const item=run.entries.find(x=>MLS_STAGING_ACTIVE.has(x.status));
  if(!item||item.code!==mlsStagingAssertCode(body.code)) mlsChatError(409,'El código no es la siguiente entrada staging.');
  const built=await mlsStagingContext(env,run,item.code);
  if(body.contextId!==built.contextId) mlsChatError(409,'contextId no pertenece al snapshot activo.');
  let article;
  try { article=mlsChatValidateText(built.context,body.articleMarkdown,body.referenceCodes,body.editorialReview); }
  catch(error) {
    await mlsStagingValidationFailure(env,run,head,item,error,body,built.context);
    mlsChatError(422,error.message);
  }
  const draftHash=await mlsChatHash(run.runId+'\n'+built.contextId+'\n'+article.articleMarkdown);
  const validatedAt=mlsStagingNow();
  const payload={v:1,runId:run.runId,contextId:built.contextId,code:item.code,draftHash,validatedAt,
    referenceCodes:[...body.referenceCodes].sort(),reviewHash:await mlsChatHash(body.editorialReview)};
  const validationReceipt=await mlsStagingReceipt(env,payload);
  return {ok:true,valid:true,status:'validated',draftId:draftHash,draftHash,code:item.code,validatedAt,validationReceipt,
    words:article.articleMarkdown.split(/\s+/u).length,standard:'MLS R32',promptVersion:'32.0',
    validation:'deterministic-r32',linguisticReview:'performed-by-chatgpt',published:false,staged:false,
    storageMode:'github-staging',d1RowsRead:0,d1RowsWritten:0};
}
async function mlsStagingStage(env,body) {
  const receipt=await mlsStagingVerifyReceipt(env,body.validationReceipt);
  for(let attempt=0;attempt<MLS_STAGING_MAX_GITHUB_RETRIES;attempt++) {
    const head=await mlsStagingHead(env);
    const run=await mlsStagingLoadRun(env,body.runId,head);
    if(!run) mlsChatError(404,'No existe el lote staging.');
    const code=mlsStagingAssertCode(body.code);
    const existing=run.entries.find(x=>x.code===code);
    const built=await mlsStagingContext(env,run,code);
    const article=mlsChatValidateText(built.context,body.articleMarkdown,body.referenceCodes,body.editorialReview);
    const draftHash=await mlsChatHash(run.runId+'\n'+built.contextId+'\n'+article.articleMarkdown);
    if(receipt.runId!==run.runId||receipt.contextId!==built.contextId||receipt.code!==code||receipt.draftHash!==draftHash)
      mlsChatError(409,'El recibo no corresponde al borrador staging.');
    if(receipt.reviewHash!==await mlsChatHash(body.editorialReview)) mlsChatError(409,'La revisión editorial cambió después de validar.');
    if(JSON.stringify([...body.referenceCodes].sort())!==JSON.stringify(receipt.referenceCodes)) mlsChatError(409,'Las referencias cambiaron después de validar.');
    if(existing?.status==='staged'){
      const metadata=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/pending/'+code+'/metadata.json',head,false);
      if(metadata.draftHash!==draftHash) mlsChatError(409,'El código ya está staged con otro borrador.');
      return {ok:true,reused:true,staged:true,published:false,code,run:{...mlsStagingSummarize(run),ranges:mlsStagingRanges(run.entries)}};
    }
    const current=run.entries.find(x=>MLS_STAGING_ACTIVE.has(x.status));
    if(run.status!=='active'||!current||current.code!==code) mlsChatError(409,'El lote no permite stagear ese código ahora.');
    const now=mlsStagingNow();
    const next=structuredClone(run);
    const item=next.entries.find(x=>x.code===code);
    item.status='staged'; item.contextId=built.contextId; item.draftHash=draftHash; item.validatedAt=receipt.validatedAt; item.stagedAt=now; item.updatedAt=now;
    if(!next.entries.some(x=>MLS_STAGING_ACTIVE.has(x.status))) next.status='complete';
    next.updatedAt=now;
    const shard=await mlsStagingReadShard(env,code,head,true);
    const state=shard.codes?.[code];
    if(state && state.runId!==run.runId && ['reserved','staged','integrated','deployed'].includes(state.status)) mlsChatError(409,'El código pertenece a otro run staging.');
    shard.codes[code]={...(state||{}),code,runId:run.runId,requestId:run.requestId,snapshotVersion:run.snapshotVersion,status:'staged',updatedAt:now,stagedAt:now,draftHash};
    shard.updatedAt=now;
    const attempts=Number(item.validationAttempts||0)+1;
    const autoopt=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/runs/'+run.runId+'/autoopt.json',head,true,mlsStagingAutooptBase(run.runId));
    const features=typeof mlsAutooptFeatures==='function'?mlsAutooptFeatures(built.context,article.articleMarkdown,''):{};
    mlsStagingAutooptApply(autoopt,{at:now,code,attempt:attempts,valid:true,staged:true,...features});
    const metadata={
      code,runId:run.runId,contextId:built.contextId,snapshotVersion:run.snapshotVersion,snapshotCommit:run.snapshotCommit,
      draftHash,promptVersion:'32.0',referenceCodes:[...body.referenceCodes],editorialReview:body.editorialReview,
      validatedAt:receipt.validatedAt,stagedAt:now,status:'staged',autoopt:{attempt:attempts,features},
      language:article.language,languageName:article.languageName,n:article.n,title:article.title,level:article.level,part:article.part,chapter:article.chapter,
      auditModel:'staging-'+draftHash
    };
    const files=[
      {path:MLS_STAGING_ROOT+'/pending/'+code+'/article.md',content:article.articleMarkdown+'\n'},
      {path:MLS_STAGING_ROOT+'/pending/'+code+'/metadata.json',content:JSON.stringify(metadata,null,2)+'\n'},
      {path:MLS_STAGING_ROOT+'/runs/'+run.runId+'/manifest.json',content:JSON.stringify(next,null,2)+'\n'},
      {path:MLS_STAGING_ROOT+'/runs/'+run.runId+'/autoopt.json',content:JSON.stringify(autoopt,null,2)+'\n'},
      {path:mlsStagingIndexPath(code),content:JSON.stringify(shard,null,2)+'\n'}
    ];
    try {
      const commit=await mlsStagingCommit(env,files,'MLS staging stage '+code,head);
      return {ok:true,reused:false,staged:true,published:false,code,commit,run:{...mlsStagingSummarize(next),ranges:mlsStagingRanges(next.entries)},
        storageMode:'github-staging',d1RowsRead:0,d1RowsWritten:0};
    } catch(error) {
      if(error.status!==409||attempt===MLS_STAGING_MAX_GITHUB_RETRIES-1) throw error;
    }
  }
  mlsChatError(409,'No fue posible stagear sin conflicto.');
}
async function mlsStagingCancel(env,body) {
  if(body.confirm!==true) mlsChatError(400,'Confirma explícitamente la cancelación staging.');
  for(let attempt=0;attempt<MLS_STAGING_MAX_GITHUB_RETRIES;attempt++){
    const head=await mlsStagingHead(env);
    const run=await mlsStagingLoadRun(env,body.runId,head);
    if(!run) mlsChatError(404,'No existe ese lote staging.');
    if(run.status==='cancelled') return {ok:true,reused:true,run:{...mlsStagingSummarize(run),ranges:mlsStagingRanges(run.entries)}};
    const next=structuredClone(run),now=mlsStagingNow(),files=[],shards=new Map();
    for(const item of next.entries){
      if(!MLS_STAGING_ACTIVE.has(item.status)) continue;
      item.status='cancelled'; item.updatedAt=now;
      const path=mlsStagingIndexPath(item.code);
      let shard=shards.get(path); if(!shard){shard=await mlsStagingReadJson(env,path,head,true,mlsStagingEmptyShard(path));shards.set(path,shard);}
      if(shard.codes?.[item.code]?.runId===run.runId) delete shard.codes[item.code];
    }
    next.status='cancelled';next.updatedAt=now;
    files.push({path:MLS_STAGING_ROOT+'/runs/'+run.runId+'/manifest.json',content:JSON.stringify(next,null,2)+'\n'});
    for(const [path,shard] of shards){shard.updatedAt=now;files.push({path,content:JSON.stringify(shard,null,2)+'\n'});}
    try{
      await mlsStagingCommit(env,files,'MLS staging cancel '+run.runId,head);
      return {ok:true,reused:false,run:{...mlsStagingSummarize(next),ranges:mlsStagingRanges(next.entries)}};
    }catch(error){if(error.status!==409||attempt===MLS_STAGING_MAX_GITHUB_RETRIES-1) throw error;}
  }
}
function mlsStagingSample(rows,max=MLS_STAGING_REFERENCE_BANK){
  if(rows.length<=max) return rows;
  const out=[],seen=new Set();
  for(let i=0;i<max;i++){
    const index=Math.round(i*(rows.length-1)/(max-1));
    if(!seen.has(index)){seen.add(index);out.push(rows[index]);}
  }
  return out;
}
function mlsStagingD1Add(metrics,result){
  if(Array.isArray(result)){for(const x of result)mlsStagingD1Add(metrics,x);return metrics;}
  metrics.d1RowsRead+=Number(result?.meta?.rows_read||0); metrics.d1RowsWritten+=Number(result?.meta?.rows_written||0); return metrics;
}
async function mlsStagingSnapshotAsset(env,request,path){
  const u=new URL(request.url);u.pathname='/mls-staging-targets/'+path;u.search='';
  const response=await env.ASSETS.fetch(new Request(u.toString(),{method:'GET'}));
  if(!response.ok) mlsChatError(503,'No existe el catálogo estático staging del deploy: '+path);
  return response.text();
}
async function mlsStagingCreateSnapshot(request,env,body){
  await ensureWikiDb(env); await mlsChatEnsureDb(env);
  if(mlsAutooptEnabled(env)) await mlsAutooptEnsure(env);
  const head=await mlsStagingHead(env);
  const seedManifest=JSON.parse(await mlsStagingSnapshotAsset(env,request,'manifest.json'));
  const metaResult=await env.WIKI_DB.prepare("SELECT code,language,n FROM wiki_articles ORDER BY "+WIKI_FIFO_ORDER_SQL).all();
  const canonicalRows=metaResult.results||[];
  const byLanguage=new Map();
  for(const row of canonicalRows){if(!byLanguage.has(row.language))byLanguage.set(row.language,[]);byLanguage.get(row.language).push(row);}
  const createdAt=mlsStagingNow();
  const sourceCommit=String(body.sourceCommit||'unknown').replace(/[^A-Za-z0-9._-]/g,'').slice(0,64)||'unknown';
  const snapshotVersion='32.0-'+sourceCommit.slice(0,12)+'-'+createdAt.replace(/[-:.TZ]/g,'').slice(0,14);
  const files=[],languages=Object.keys(seedManifest.languages||{});
  for(const language of languages){
    const targets=await mlsStagingSnapshotAsset(env,request,language+'.json');
    files.push({path:MLS_STAGING_ROOT+'/snapshots/'+snapshotVersion+'/targets/'+language+'.json',content:targets});
    const candidates=mlsStagingSample(byLanguage.get(language)||[]);
    let refs=[];
    if(candidates.length){
      const placeholders=candidates.map(()=>'?').join(',');
      const detail=await env.WIKI_DB.prepare("SELECT code,language,language_name AS languageName,n,title,level,part,chapter,article_markdown AS articleMarkdown,prompt_version AS promptVersion,generated_at AS generatedAt FROM wiki_articles WHERE code IN ("+placeholders+") ORDER BY n").bind(...candidates.map(x=>x.code)).all();
      refs=detail.results||[];
    }
    files.push({path:MLS_STAGING_ROOT+'/snapshots/'+snapshotVersion+'/references/'+language+'.json',content:JSON.stringify(refs)});
  }
  let autoopt={version:MLS_AUTOOPT_VERSION||'unknown',promptVersion:'32.0',stats:{}};
  try{
    const stats=await env.WIKI_DB.prepare("SELECT scope_id,stats FROM wiki_autoopt_stats WHERE version=? AND prompt=? AND scope='family'").bind(MLS_AUTOOPT_VERSION,'32.0').all();
    for(const row of stats.results||[]) autoopt.stats[row.scope_id]=JSON.parse(row.stats||'{}');
  }catch{}
  files.push({path:MLS_STAGING_ROOT+'/snapshots/'+snapshotVersion+'/autoopt.json',content:JSON.stringify(autoopt)});
  const manifest={version:1,standard:'MLS R32',promptVersion:'32.0',snapshotVersion,createdAt,sourceCommit,
    canonicalCodes:canonicalRows.map(x=>x.code),languageOrder:WIKI_LANGUAGE_ORDER.map(x=>x.slug),
    targetManifest:seedManifest,referenceBankPerLanguage:MLS_STAGING_REFERENCE_BANK,
    editorialRules:{systemPrompt:SYSTEM_PROMPT,languageModules:LANGUAGE_MODULES,contract:MLS_CHAT_CONTRACT}};
  files.push({path:MLS_STAGING_ROOT+'/snapshots/'+snapshotVersion+'/manifest.json',content:JSON.stringify(manifest)});
  files.push({path:MLS_STAGING_ROOT+'/snapshots/latest.json',content:JSON.stringify({snapshotVersion,createdAt,sourceCommit})});
  const commit=await mlsStagingCommit(env,files,'MLS staging snapshot '+snapshotVersion,head);
  return {ok:true,snapshotVersion,snapshotCommit:commit,createdAt,canonical:canonicalRows.length,languages:languages.length};
}
async function mlsStagingCollectStaged(env,head){
  const indexManifest=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/index/manifest.json',head,true,{shards:[]});
  const items=[];
  for(const path of indexManifest.shards||[]){
    const shard=await mlsStagingReadJson(env,path,head,true,null); if(!shard) continue;
    for(const state of Object.values(shard.codes||{})) if(state.status==='staged') items.push({...state,indexPath:path});
  }
  items.sort((a,b)=>a.code.localeCompare(b.code));
  return items;
}
async function mlsStagingIntegrate(env,body){
  await ensureWikiDb(env); await mlsChatEnsureDb(env);
  const metrics={d1RowsRead:0,d1RowsWritten:0};
  const head=await mlsStagingHead(env);
  const staged=await mlsStagingCollectStaged(env,head);
  if(!staged.length) return {ok:true,staged:0,integrated:0,preservedExisting:0,failed:0,pending:0,...metrics,status:'complete'};
  const existing=new Map();
  for(let i=0;i<staged.length;i+=100){
    const chunk=staged.slice(i,i+100);
    const q=await env.WIKI_DB.prepare("SELECT code,audit_model FROM wiki_articles WHERE code IN ("+chunk.map(()=>'?').join(',')+")").bind(...chunk.map(x=>x.code)).all();
    mlsStagingD1Add(metrics,q); for(const row of q.results||[])existing.set(row.code,row);
  }
  const outcomes=[],insertStatements=[],loaded=new Map();
  for(const state of staged){
    const metadata=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/pending/'+state.code+'/metadata.json',head,false);
    const articleMarkdown=await mlsStagingReadText(env,MLS_STAGING_ROOT+'/pending/'+state.code+'/article.md',head,false);
    loaded.set(state.code,{metadata,articleMarkdown});
    const row=existing.get(state.code);
    if(row){outcomes.push({code:state.code,status:row.audit_model===metadata.auditModel?'integrated':'preservedExisting'});continue;}
    insertStatements.push(env.WIKI_DB.prepare(`INSERT INTO wiki_articles(code,language,language_name,n,title,level,part,chapter,article_markdown,provider,model,audit_provider,audit_model,prompt_version,generated_at)
      VALUES (?,?,?,?,?,?,?,?,?,'mls-r32','editorial-standard-32','mls-r32-validator',?,'32.0',?) ON CONFLICT(code) DO NOTHING`)
      .bind(metadata.code,metadata.language,metadata.languageName,metadata.n,metadata.title,metadata.level,metadata.part,metadata.chapter,articleMarkdown.trim(),metadata.auditModel,metadata.stagedAt));
  }
  for(let i=0;i<insertStatements.length;i+=50){
    const result=await env.WIKI_DB.batch(insertStatements.slice(i,i+50));mlsStagingD1Add(metrics,result);
  }
  const verify=new Map();
  for(let i=0;i<staged.length;i+=100){
    const chunk=staged.slice(i,i+100);
    const q=await env.WIKI_DB.prepare("SELECT code,audit_model FROM wiki_articles WHERE code IN ("+chunk.map(()=>'?').join(',')+")").bind(...chunk.map(x=>x.code)).all();
    mlsStagingD1Add(metrics,q); for(const row of q.results||[])verify.set(row.code,row);
  }
  for(const state of staged){
    if(outcomes.some(x=>x.code===state.code)) continue;
    const metadata=loaded.get(state.code).metadata,row=verify.get(state.code);
    outcomes.push({code:state.code,status:row?.audit_model===metadata.auditModel?'integrated':'preservedExisting'});
  }
  const own=outcomes.filter(x=>x.status==='integrated');
  for(let i=0;i<own.length;i+=50){
    const result=await env.WIKI_DB.batch(own.slice(i,i+50).map(x=>{
      const metadata=loaded.get(x.code).metadata;
      return env.WIKI_DB.prepare("UPDATE wiki_jobs SET status='published',provider='mls-r32',model='editorial-standard-32',last_error=NULL,updated_at=? WHERE code=? AND EXISTS (SELECT 1 FROM wiki_articles WHERE code=? AND audit_model=?)")
        .bind(mlsStagingNow(),x.code,x.code,metadata.auditModel);
    }));mlsStagingD1Add(metrics,result);
  }
  for(let attempt=0;attempt<MLS_STAGING_MAX_GITHUB_RETRIES;attempt++){
    const currentHead=await mlsStagingHead(env),files=[],runs=new Map(),shards=new Map(),now=mlsStagingNow();
    for(const outcome of outcomes){
      const data=loaded.get(outcome.code),metadata={...data.metadata,status:outcome.status,integratedAt:now};
      files.push({path:MLS_STAGING_ROOT+'/pending/'+outcome.code+'/metadata.json',content:JSON.stringify(metadata,null,2)+'\n'});
      const indexPath=mlsStagingIndexPath(outcome.code);
      let shard=shards.get(indexPath);if(!shard){shard=await mlsStagingReadJson(env,indexPath,currentHead,true,mlsStagingEmptyShard(indexPath));shards.set(indexPath,shard);}
      if(shard.codes?.[outcome.code]){shard.codes[outcome.code].status=outcome.status;shard.codes[outcome.code].updatedAt=now;}
      const runId=data.metadata.runId;
      let run=runs.get(runId);if(!run){run=await mlsStagingLoadRun(env,runId,currentHead);if(run)runs.set(runId,run);}
      const item=run?.entries?.find(x=>x.code===outcome.code);if(item){item.status=outcome.status;item.integratedAt=now;item.updatedAt=now;run.updatedAt=now;}
    }
    for(const [path,shard] of shards){shard.updatedAt=now;files.push({path,content:JSON.stringify(shard,null,2)+'\n'});}
    for(const run of runs.values()) files.push({path:MLS_STAGING_ROOT+'/runs/'+run.runId+'/manifest.json',content:JSON.stringify(run,null,2)+'\n'});
    try{await mlsStagingCommit(env,files,'MLS staging reconcile '+outcomes.length+' entries',currentHead);break;}
    catch(error){if(error.status!==409||attempt===MLS_STAGING_MAX_GITHUB_RETRIES-1) throw error;}
  }
  return {ok:true,staged:staged.length,integrated:outcomes.filter(x=>x.status==='integrated').length,
    preservedExisting:outcomes.filter(x=>x.status==='preservedExisting').length,failed:0,pending:0,...metrics,status:'complete'};
}
async function mlsStagingServeArticle(env,code){
  const state=await mlsStagingCodeState(env,code,{strong:false,failOpen:true});
  if(!state||!['staged','integrated','deployed'].includes(state.status)) return null;
  const head=await mlsStagingHead(env);
  const metadata=await mlsStagingReadJson(env,MLS_STAGING_ROOT+'/pending/'+code+'/metadata.json',head,true,null);
  const articleMarkdown=await mlsStagingReadText(env,MLS_STAGING_ROOT+'/pending/'+code+'/article.md',head,true);
  if(!metadata||!articleMarkdown) return null;
  return {code:metadata.code,language:metadata.language,languageName:metadata.languageName,n:metadata.n,title:metadata.title,
    level:metadata.level||'',part:metadata.part||'',chapter:metadata.chapter||'',articleMarkdown:articleMarkdown.trim(),
    provider:'mls-r32-staging',model:'editorial-standard-32',auditProvider:'mls-r32-validator',auditModel:metadata.auditModel,
    promptVersion:'32.0',generatedAt:metadata.stagedAt,staged:true};
}
async function handleMlsStaging(request,env,url){
  const route=url.pathname.replace('/api/wiki/editorial/staging','')||'/';
  try{
    await mlsChatAuthenticate(request,env);
    if(route==='/status'&&request.method==='GET') return mlsChatJson(await mlsStagingStatus(env,url.searchParams.get('runId')));
    if(route==='/next'&&request.method==='GET') return mlsChatJson(await mlsStagingNext(env,url.searchParams.get('runId')));
    if(request.method!=='POST') return mlsChatJson({ok:false,error:'Método no permitido.'},405);
    const body=await mlsChatBody(request);
    if(route==='/start') return mlsChatJson(await mlsStagingStart(env,body));
    if(route==='/validate') return mlsChatJson(await mlsStagingValidate(env,body));
    if(route==='/stage') return mlsChatJson(await mlsStagingStage(env,body));
    if(route==='/cancel') return mlsChatJson(await mlsStagingCancel(env,body));
    if(route==='/integrate') return mlsChatJson(await mlsStagingIntegrate(env,body));
    if(route==='/snapshot') return mlsChatJson(await mlsStagingCreateSnapshot(request,env,body));
    mlsChatError(404,'Ruta staging no encontrada.');
  }catch(error){
    if(!error.status) console.error('mls-staging-failure',error.message);
    return mlsChatJson({ok:false,error:error.status?error.message:'Error temporal de MLS Staging. No se usó D1 como fallback.'},error.status||500);
  }
}
if(typeof module!=='undefined'&&module.exports) module.exports={
  mlsStagingIndexPath,mlsStagingSummarize,mlsStagingRanges,mlsStagingSample,mlsStagingAutooptBase,mlsStagingAutooptApply,
  mlsStagingD1Add,MLS_STAGING_ACTIVE,MLS_STAGING_TERMINAL
};
