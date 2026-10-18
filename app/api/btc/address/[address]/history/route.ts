import {mempoolBaseUrl} from "@/lib/btc/providers/mempool";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export const maxDuration=60;
type Tx={txid:string;status?:{block_time?:number;confirmed?:boolean};vin?:{prevout?:{scriptpubkey_address?:string;value?:number}}[];vout?:{scriptpubkey_address?:string;value?:number}[]};
export async function GET(request:Request,{params}:{params:{address:string}}){
 const address=params.address;
 if(!/^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address))return NextResponse.json({error:"Invalid address"},{status:400});
 const u=new URL(request.url),days=Math.min(365,Math.max(1,Number(u.searchParams.get("days"))||30));
 const cutoff=Math.floor(Date.now()/1000)-days*86400;
 const base=mempoolBaseUrl()+"/api/address/"+encodeURIComponent(address);
 try{
  const statsRes=await fetch(base,{next:{revalidate:20},signal:AbortSignal.timeout(7000)});
  if(!statsRes.ok)throw Error("Stats unavailable");
  const stats=await statsRes.json(),chain=stats.chain_stats??{};
  let balance=(chain.funded_txo_sum??0)-(chain.spent_txo_sum??0);
  let cursor="",reachedCutoff=false,complete=false;
  const reverse:{time:number;balance:number;txid:string}[]=[];
  const started=Date.now();
  // The upstream API exposes 25 transactions per page; stop before serverless limits.
  for(let page=0;page<110;page++){
   if(Date.now()-started>21000)break;
   const url=base+"/txs/chain"+(cursor?"/"+cursor:"");
   const r=await fetch(url,{next:{revalidate:90},signal:AbortSignal.timeout(5500)});
   if(!r.ok)throw Error("History pagination unavailable");
   const batch:Tx[]=await r.json();
   if(!Array.isArray(batch))throw Error("Invalid history response");
   if(batch.length===0){complete=true;break}
   for(const tx of batch){
    const time=tx.status?.block_time??0;
    if(!time)continue;
    if(time<cutoff){reachedCutoff=true;break}
    reverse.push({time,balance,txid:tx.txid});
    const incoming=(tx.vout??[]).reduce((n,v)=>n+(v.scriptpubkey_address===address?(v.value??0):0),0);
    const outgoing=(tx.vin??[]).reduce((n,v)=>n+(v.prevout?.scriptpubkey_address===address?(v.prevout?.value??0):0),0);
    balance-=incoming-outgoing;
    }
   if(reachedCutoff)break;
   cursor=batch[batch.length-1].txid;
   if(batch.length<25){complete=true;break}
  }
  const ordered=reverse.filter(x=>x.time>=cutoff).reverse();
  // Starting balance at the oldest observed transaction's preceding state.
  const points=[...(ordered.length?[{time:ordered[0].time-1,balance:balance}]:[]),...ordered];
  // Compress dense transaction histories to <= 500 chart points, retaining end.
  const step=Math.max(1,Math.ceil(points.length/499));
  const sampled=points.filter((_,i)=>i%step===0||i===points.length-1);
  return NextResponse.json({points:sampled,days,complete:reachedCutoff||complete,coverageStart:reverse.length?reverse[reverse.length-1].time:null,coverageEnd:reverse.length?reverse[0].time:null,transactionsScanned:reverse.length,updatedAt:Date.now()},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=120"}});
 }catch{return NextResponse.json({error:"History unavailable"},{status:503})}
}
