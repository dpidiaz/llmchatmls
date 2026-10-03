/* Direct HTTP client: one durable binding and outbox, no ephemeral workflows. */
class R44Client {
  constructor({storage,fetch:transport=globalThis.fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms)),random=Math.random,timeoutMs=15000}) {
    this.storage=storage;this.fetch=transport;this.sleep=sleep;this.random=random;this.timeoutMs=timeoutMs;
    this.state=JSON.parse(storage.getItem('mls-r44-binding-v2')||'null')||{workerId:storage.getItem('mls-r44-worker')||'r44-'+crypto.randomUUID()};
    this.save();
  }
  save(){this.storage.setItem('mls-r44-binding-v2',JSON.stringify(this.state));}
  async request(path,body) {
    let last;
    for(let attempt=0;attempt<5;attempt++) {
      let retryAfter=0;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
      try {
        const response=await this.fetch(path,{method:body?'POST':'GET',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store'});
        const result=await response.json();
        if(response.ok)return result;
        const error=Object.assign(new Error(result.error||result.status||'REQUEST_FAILED'),{result,status:response.status});
        if(response.status!==429 && response.status<500)throw error;
        const header=response.headers.get('retry-after');
        retryAfter=header?(Number.isFinite(Number(header))?Number(header)*1000:Math.max(0,Date.parse(header)-Date.now())):0;
        last=error;
      } catch(error) {
        if(error.status && error.status!==429 && error.status<500)throw error;
        last=error;
      } finally {clearTimeout(timer);}
      if(attempt<4)await this.sleep(Math.max(retryAfter||0,Math.min(8000,250*2**attempt)*(0.5+this.random()/2)));
    }
    throw Object.assign(last||new Error('EXECUTION_UNCONFIRMED'),{unconfirmed:true});
  }
  async claim() {
    if(this.state.ticketId)return this.recover();
    this.state.claimKey ||= crypto.randomUUID();this.save();
    const result=await this.request('/api/r44/claim?worker='+encodeURIComponent(this.state.workerId)+'&idempotencyKey='+encodeURIComponent(this.state.claimKey),{});
    if(result.ticket){this.state.ticketId=result.ticket.ticket_id;this.state.leaseToken=result.ticket.lease_token;this.state.leaseGeneration=result.ticket.leaseGeneration;this.save();}
    return result;
  }
  async recover() {
    // A pending claim may only be replayed by explicit claim(), with its saved key.
    if(!this.state.ticketId)return {status:'EXECUTION_UNCONFIRMED',claimKey:this.state.claimKey};
    const result=await this.request('/api/r44/rebind',{workerId:this.state.workerId,ticketId:this.state.ticketId,leaseToken:this.state.leaseToken});
    for(const entry of result.entries||[]) if(entry.receipt)await this.verify({receipt:entry.receipt,receiptSha256:entry.receiptSha256});
    this.state.lastConfirmed=result;this.save();return result;
  }
  async verify(result) {
    if(!result.receipt || !result.receiptSha256)throw new Error('EXECUTION_UNCONFIRMED');
    const stable=value=>Array.isArray(value)?'['+value.map(stable).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}':JSON.stringify(value);
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(result.receipt))))).map(b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==result.receiptSha256)throw new Error('RECEIPT_HASH_MISMATCH');
    if(result.receipt.ticketId!==this.state.ticketId)throw new Error('RECEIPT_SCOPE_MISMATCH');
    return result;
  }
  async verifyPacket(result,packet) {
    await this.verify(result);
    const stable=value=>Array.isArray(value)?'['+value.map(stable).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}':JSON.stringify(value);
    const normalized={...packet.entry,code:packet.entry.code.toUpperCase()};
    const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(normalized))))).map(b=>b.toString(16).padStart(2,'0')).join('');
    if(result.receipt.code!==normalized.code || result.receipt.payloadSha256!==sha)throw new Error('RECEIPT_PAYLOAD_MISMATCH');
    return result;
  }
  async checkpoint(entry) {
    if(this.state.outbox && JSON.stringify(this.state.outbox.entry)!==JSON.stringify(entry))throw new Error('RECONCILE_PENDING_CHECKPOINT_FIRST');
    this.state.outbox ||= {ticketId:this.state.ticketId,workerId:this.state.workerId,leaseToken:this.state.leaseToken,leaseGeneration:this.state.leaseGeneration,idempotencyKey:crypto.randomUUID(),entry};
    this.save();return this.flush();
  }
  async flush() {
    if(!this.state.outbox)return this.recover();
    const packet=this.state.outbox;
    try {
      const result=await this.verifyPacket(await this.request('/api/r44/checkpoint',packet),packet);
      delete this.state.outbox;this.save();return result;
    } catch(error) {
      const state=await this.recover();
      const entry=(state.entries||[]).find(e=>e.code===packet.entry.code.toUpperCase());
      // Keep outbox on every ambiguous failure; the next flush replays identical data.
      if(entry&&entry.receipt&&entry.receipt.idempotencyKey===packet.idempotencyKey){const confirmed=await this.verifyPacket({status:'ALREADY_DURABLE',receipt:entry.receipt,receiptSha256:entry.receiptSha256},packet);delete this.state.outbox;this.save();return confirmed;}
      throw error;
    }
  }
  async renew(){return this.request('/api/r44/renew?lease='+encodeURIComponent(this.state.leaseToken)+'&leaseGeneration='+this.state.leaseGeneration,{});}
  async next(){const state=await this.recover();if(state.state!=='COMPLETE')throw new Error('CURRENT_TICKET_NOT_COMPLETE');this.state={workerId:this.state.workerId};this.save();return this.claim();}
  async fastLane({maxTickets=10,processTicket,shouldContinue=()=>true}={}) {
    if(!Number.isInteger(maxTickets)||maxTickets<1||maxTickets>10)throw new Error('FAST_LANE_LIMIT_INVALID');
    if(typeof processTicket!=='function')throw new Error('FAST_LANE_PROCESSOR_REQUIRED');
    const completed=[];
    let reason='LIMIT_REACHED';
    while(completed.length<maxTickets) {
      let allocation;
      if(this.state.ticketId) {
        const current=await this.recover();
        if(current.state==='COMPLETE') allocation=await this.next();
        else {
          const stop=current.status||current.state;
          if(['LEASE_LOST','QUARANTINED','NO_BINDING'].includes(stop)){reason=stop;break;}
          allocation=current;
        }
      } else allocation=await this.claim();
      if(!this.state.ticketId){reason=allocation?.status||'NO_WORK';break;}
      const ticketId=this.state.ticketId;
      const remaining=allocation?.ticket?.entries?.map(e=>e.code)||
        allocation?.remaining||
        allocation?.entries?.filter(e=>!e.receipt).map(e=>e.code)||
        [];
      await processTicket({client:this,allocation,ticketId,remaining,index:completed.length});
      const confirmed=await this.recover();
      if(confirmed.state!=='COMPLETE') {
        return {status:'FAST_LANE_STOPPED',reason:confirmed.status||confirmed.state||'CURRENT_TICKET_NOT_COMPLETE',completed,count:completed.length,workerId:this.state.workerId,ticketId,state:confirmed};
      }
      completed.push(ticketId);
      if(completed.length>=maxTickets){reason='LIMIT_REACHED';break;}
      if(!(await shouldContinue({client:this,completed:[...completed],last:confirmed}))){reason='CALLER_STOP';break;}
    }
    return {status:'FAST_LANE_STOPPED',reason,completed,count:completed.length,workerId:this.state.workerId};
  }
}
if(typeof module!=='undefined')module.exports={R44Client};
