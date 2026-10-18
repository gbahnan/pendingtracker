const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
// Execute the actual TypeScript provider with controlled upstream responses.
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, filename);
const {getTxFirstSeen} = require('../lib/btc/providers/mempool.ts');
const {fetchBitcoinDataset} = require('../lib/btc/providers/datasets.ts');
let calls=[];
global.fetch=async (url)=>{calls.push(String(url));return new Response('[1720000000]',{headers:{'content-type':'application/json'}})};
(async()=>{
 const txid='a'.repeat(64);
 assert.equal(await getTxFirstSeen(txid),1720000000);
 assert.match(calls[0],/\/api\/v1\/transaction-times\?txId%5B%5D=/);
 for(const body of ['[0]','[]','{}','["1720000000"]']) {
  global.fetch=async()=>new Response(body);
  assert.equal(await getTxFirstSeen(txid),null);
 }
 global.fetch=async()=>{throw Error('offline')};
 assert.equal(await getTxFirstSeen(txid),null);
 let contacted=false;
 global.fetch=async()=>{contacted=true;return new Response('{}')};
 for(const [key,args] of [['blockBulkRange',{from:'10',to:'20'}],['blockBulkRange',{from:'10',to:'9'}],['blockTransactions',{hash:txid,index:'1'}],['miningRewardStats',{blockCount:'0'}],['transaction',{txid:'../private'}]]) {
  await assert.rejects(fetchBitcoinDataset(key,args),e=>e.status===400);
 }
 assert.equal(contacted,false,'invalid parameters must not contact provider');
 await fetchBitcoinDataset('blockBulkRange',{from:'10',to:'19'});
 assert.equal(contacted,true);
 console.log('PASS: first-seen parsing/fallback and catalog input bounds');
})().catch(e=>{console.error(e);process.exitCode=1});
