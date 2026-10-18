#!/usr/bin/env node
/** Read-only, bounded live catalog audit. Run: node scripts/probe-bitcoin-catalog.mjs */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
const run = promisify(execFile);
const base = process.env.BITCOIN_PROBE_BASE || 'https://mempool.space';
const output = process.env.BITCOIN_PROBE_OUTPUT || 'docs/mempool-live-validation.json';
const source = await readFile(new URL('../lib/btc/providers/datasets.ts', import.meta.url), 'utf8');
let entries = [...source.matchAll(/^\s*(\w+): \{ path: "([^"]+)", input: "([^"]*)" \}/gm)].map(([,name,path,input])=>({name,path,input}));
const catalogCount=entries.length;
if(process.env.BITCOIN_PROBE_ONLY){const names=new Set(process.env.BITCOIN_PROBE_ONLY.split(','));entries=entries.filter(entry=>names.has(entry.name));}
async function probe(path) {
 const started=Date.now();
 try {
  const {stdout}=await run('curl',['--silent','--show-error','--location','--max-time','18','--max-filesize','2000000','--write-out','\n%{http_code}\n%{content_type}',base+path],{maxBuffer:2100000});
  const match=stdout.match(/\n(\d{3})\n([^\n]*)$/); const body=stdout.slice(0,match?.index); const status=Number(match?.[1]||0);
  let data; try{data=JSON.parse(body);}catch{}
  const kind=Array.isArray(data)?'array':data!==undefined?typeof data:/^\s*</.test(body)?'html':'text';
  return {status,ms:Date.now()-started,bytes:Buffer.byteLength(body),contentType:match?.[2],kind,shape:Array.isArray(data)?{length:data.length,firstKeys:data[0]&&typeof data[0]==='object'?Object.keys(data[0]).slice(0,16):undefined}:data&&typeof data==='object'?{keys:Object.keys(data).slice(0,24)}:undefined,classification:status===204?'empty-response':status>=200&&status<300&&kind!=='html'?'http-success':status===404?'not-found':status===429?'rate-limited':status>=200&&status<300?'unexpected-html':'http-error',error:status>=400?body.slice(0,240):undefined,data};
 }catch(e){return{status:0,ms:Date.now()-started,classification:/maximum file size|larger than maximum/i.test(e.message)?'size-limit':'transport-error',error:e.message.slice(0,300)};}
}
const blockResponse=await probe('/api/v1/blocks');
if(!blockResponse.data?.[0]?.id) throw new Error('Cannot obtain a live block fixture: '+JSON.stringify(blockResponse));
const block=blockResponse.data[2]||blockResponse.data[0];
const txResponse=await probe(`/api/block/${block.id}/txs`);
const tx=txResponse.data?.find(t=>!t.vin?.[0]?.is_coinbase)||txResponse.data?.[0];
if(!tx?.txid) throw new Error('Cannot obtain live transaction fixture');
const recipient=tx.vout.find(v=>v.scriptpubkey_address);
const rankings=await probe('/api/v1/lightning/nodes/rankings/connectivity');
const node=rankings.data?.[0];
const channels=node?.public_key?await probe(`/api/v1/lightning/channels?public_key=${node.public_key}&index=0&status=active`):{};
const channel=(Array.isArray(channels.data)?channels.data:channels.data?.channels)?.[0];
const treasuryResponse=await probe('/api/v1/treasuries');
const fixtures={hash:block.id,height:String(block.height),txid:tx.txid,address:recipient.scriptpubkey_address,scripthash:createHash('sha256').update(Buffer.from(recipient.scriptpubkey,'hex')).digest('hex'),from:String(block.height),to:String(block.height),index:'0',timestamp:String(block.timestamp),blockCount:'1',interval:'1m',period:'1m',slug:'foundryusa',country:'US',isp:'13335',group:'mempool',prefix:recipient.scriptpubkey_address.slice(0,8),walletId:treasuryResponse.data?.[0]?.wallet||'ONBTC',search:'ACINQ',shortId:channel?.id||'892785849701564416',pubkey:node?.public_key||'03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f'};
const results=[];let cursor=0;
async function worker(){while(cursor<entries.length){const entry=entries[cursor++];const params={...fixtures};if(entry.name==='lightningChannelSearch')params.search=fixtures.shortId.split('x')[0];const path=entry.path.replace(/\{(\w+)\}/g,(_,key)=>encodeURIComponent(params[key]));const result=await probe(path);delete result.data;results.push({...entry,resolvedPath:path,...result});console.log(`${results.length}/${entries.length} ${entry.name}: ${result.status} ${result.classification}`);await new Promise(r=>setTimeout(r,250));}}
await Promise.all([worker(),worker()]);
results.sort((a,b)=>entries.findIndex(e=>e.name===a.name)-entries.findIndex(e=>e.name===b.name));
await mkdir(new URL('../docs/',import.meta.url),{recursive:true});
const report={checkedAt:new Date().toISOString(),base,catalogCount,probedCount:entries.length,limits:{concurrency:2,timeoutSeconds:18,maxResponseBytes:2000000},fixtures,limitations:['HTTP and observed schema checks only; successful responses do not prove semantic correctness or UI integration.','404 may mean missing fixture data, disabled upstream feature, or unsupported route; consult backend source.','No transaction broadcast, acceleration purchase, credentials, or other write requests.'],summary:results.reduce((a,r)=>(a[r.classification]=(a[r.classification]||0)+1,a),{}),results};
await writeFile(new URL('../'+output,import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
