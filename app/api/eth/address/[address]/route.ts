import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export const revalidate=0;
const base="https://eth.blockscout.com/api/v2/addresses/";
async function alchemy(method:string,params:unknown[]){const key=process.env.ALCHEMY_API_KEY;if(!key)return null;const r=await fetch("https://eth-mainnet.g.alchemy.com/v2/"+encodeURIComponent(key),{method:"POST",cache:"no-store",signal:AbortSignal.timeout(8000),headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});if(!r.ok)throw Error("Alchemy unavailable");const x=await r.json();if(x.error)throw Error("Alchemy RPC error");return x.result}
async function get(url:string){const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(9000),headers:{"Accept":"application/json"}});if(!r.ok)throw Error("Blockchain data unavailable");return r.json()}
export async function GET(req:Request,{params}:{params:{address:string}}){
 const address=params.address;
 if(!/^0x[a-f0-9]{40}$/i.test(address))return NextResponse.json({error:"Invalid Ethereum address"},{status:400});
 const u=new URL(req.url),mode=u.searchParams.get("mode")||"live";
 try{
  if(mode==="balance-history"){
   if(!process.env.ALCHEMY_API_KEY)return NextResponse.json({error:"History provider unavailable"},{status:503});
   const days=Math.min(365,Math.max(1,Number(u.searchParams.get("days"))||30));
   try{
    const head=await alchemy("eth_blockNumber",[]);
    if(typeof head!=="string")throw Error("No head");
    const latest=BigInt(head);
    const samples=await Promise.all(Array.from({length:9},async(_,i)=>{
      const offset=BigInt(days*86400)*BigInt(8-i)/96n;
      const block=latest>offset?latest-offset:0n;
      const tag="0x"+block.toString(16);
      const [header,value]=await Promise.all([alchemy("eth_getBlockByNumber",[tag,false]),alchemy("eth_getBalance",[address,tag])]);
      if(!header?.timestamp||typeof value!=="string")throw Error("Missing archive data");
      return {time:Number(BigInt(header.timestamp))*1000,balanceWei:BigInt(value).toString(),block:Number(block)};
    }));
    return NextResponse.json({samples,days,source:"Alchemy",note:"Exact ETH balances at sampled blocks; sample dates approximate. Excludes tokens."},{headers:{"Cache-Control":"public, s-maxage=300"}});
   }catch{return NextResponse.json({error:"Historical state not available"},{status:503})}
  }
  if(mode==="history"){
   const days=Math.min(365,Math.max(1,Number(u.searchParams.get("days"))||30)),cutoff=Date.now()-days*86400000;
   let next:Record<string,string|number>|null=null;const items:any[]=[];let complete=false,coverageStart:number|null=null,reason="Page limit reached";
   for(let i=0;i<25;i++){
    const qs=new URLSearchParams();if(next)for(const [k,v] of Object.entries(next))qs.set(k,String(v));
    const d=await get(base+address+"/transactions"+(qs.size?"?"+qs:""));
    const batch=Array.isArray(d.items)?d.items:[];
    if(!batch.length){complete=true;reason="End of provider history";break}
    for(const t of batch){const ts=Date.parse(t.timestamp||"");if(!Number.isFinite(ts))continue;coverageStart=ts;items.push({hash:t.hash,time:ts,delta:direction(t,address),status:t.status});if(ts<cutoff){complete=true;reason="Requested date range covered";break}}
    if(complete)break;
    next=d.next_page_params;if(!next){complete=true;reason="End of provider history";break}
   }
   return NextResponse.json({items:items.filter(x=>x.time>=cutoff).reverse(),complete,coverageStart,days,coverageNote:reason,chartType:"Transaction ETH movement, not historical balance"},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=120"}});
  }
  if(mode==="pending"){
   const [pendingResult,regularResult]=await Promise.allSettled([get(base+address+"/transactions?filter=pending"),get(base+address+"/transactions")]);
   const first=pendingResult.status==="fulfilled"&&Array.isArray(pendingResult.value.items)?pendingResult.value.items:[];
   const second=regularResult.status==="fulfilled"&&Array.isArray(regularResult.value.items)?regularResult.value.items:[];
   if(regularResult.status!=="fulfilled")throw Error("Pending provider unavailable");
   const unique=new Map<string,any>();
   for(const x of [...first,...second])if(x.hash&&(x.status==="pending"||x.block_number==null))unique.set(x.hash,x);
   return NextResponse.json({pendingTransactions:[...unique.values()].slice(0,30).map(x=>({hash:x.hash,time:x.timestamp?Date.parse(x.timestamp):null,delta:direction(x,address),status:"pending",method:x.method??null,from:x.from?.hash??null,to:x.to?.hash??null,fee:x.fee?.value??null,gasUsed:x.gas_used??null})),updatedAt:Date.now(),coverage:"Provider-observed pending transactions only",pendingFilterSupported:pendingResult.status==="fulfilled"},{headers:{"Cache-Control":"no-store"}});
  }
  const [alchemyBalance,alchemyCount]=await Promise.allSettled([alchemy("eth_getBalance",[address,"latest"]),alchemy("eth_getTransactionCount",[address,"latest"])]);
  const [info,txs,tokens,price,transfers]=await Promise.allSettled([get(base+address),get(base+address+"/transactions"),get(base+address+"/token-balances"),get("https://eth.blockscout.com/api/v2/stats"),get(base+address+"/token-transfers")]);
  if(info.status!=="fulfilled"&&!(alchemyBalance.status==="fulfilled"&&alchemyBalance.value))throw Error("Address unavailable");
  const a=info.status==="fulfilled"?info.value:{},t=txs.status==="fulfilled"?txs.value:{},tok=tokens.status==="fulfilled"?tokens.value:[],stats=price.status==="fulfilled"?price.value:{};
  const list=Array.isArray(t.items)?t.items:[];const transferList=transfers.status==="fulfilled"&&Array.isArray(transfers.value.items)?transfers.value.items:[];
  const pending=list.filter((x:any)=>x.status==="pending"||x.block_number==null);
  const ethPrice=Number(a.exchange_rate??stats.coin_price??0);
  return NextResponse.json({address,balanceWei:alchemyBalance.status==="fulfilled"&&typeof alchemyBalance.value==="string"?BigInt(alchemyBalance.value).toString():String(a.coin_balance??"0"),ethPrice:Number.isFinite(ethPrice)&&ethPrice>0?ethPrice:null,txCount:a.transactions_count==null?null:Number(a.transactions_count),outgoingNonce:alchemyCount.status==="fulfilled"&&typeof alchemyCount.value==="string"?Number(BigInt(alchemyCount.value)):null,isContract:!!a.is_contract,tokens:Array.isArray(tok)?tok.slice(0,12).map((x:any)=>({symbol:x.token?.symbol??"Token",name:x.token?.name??"Token",value:String(x.value??"0"),decimals:Number(x.token?.decimals??18),type:x.token?.type??"",contract:x.token?.address_hash??x.token?.address??null,priceUsd:(()=>{const n=Number(x.token?.exchange_rate??x.token?.fiat_value??NaN);return Number.isFinite(n)&&n>0?n:null})(),verified:!!(x.token?.is_verified_via_admin_panel||x.token?.is_verified)})):[],transactions:list.slice(0,30).map((x:any)=>({hash:x.hash,time:x.timestamp?Date.parse(x.timestamp):null,delta:direction(x,address),status:x.status,method:x.method??null,from:x.from?.hash??null,to:x.to?.hash??null,fee:x.fee?.value??null,gasUsed:x.gas_used??null})),pendingCount:pending.length,tokenTransfers:transferList.slice(0,25).map((x:any)=>({hash:x.tx_hash??x.transaction_hash??"",time:x.timestamp?Date.parse(x.timestamp):null,from:x.from?.hash??"",to:x.to?.hash??"",symbol:x.token?.symbol??"Token",name:x.token?.name??"Token",contract:x.token?.address_hash??null,amount:String(x.total?.value??x.value??"0"),decimals:Number(x.total?.decimals??x.token?.decimals??18),type:x.token?.type??""})),updatedAt:Date.now(),balanceSource:alchemyBalance.status==="fulfilled"&&alchemyBalance.value?"Alchemy":"Blockscout",source:"Alchemy + Blockscout"},{headers:{"Cache-Control":"no-store, max-age=0"}});
 }catch{return NextResponse.json({error:"Ethereum provider temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
function direction(t:any,address:string){const value=String(t.value??"0");if(t.from?.hash?.toLowerCase()===address.toLowerCase())return "-"+value;if(t.to?.hash?.toLowerCase()===address.toLowerCase())return value;return "0"}
