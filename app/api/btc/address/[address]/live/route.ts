import {mempoolBaseUrl,validateBtcAddress} from "@/lib/btc/providers/mempool";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export const revalidate=0;
export async function GET(_request:Request,{params}:{params:{address:string}}){
 const address=params.address;
 if(!/^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address))return NextResponse.json({error:"Invalid Bitcoin address"},{status:400});
 try{
  // Mempool can check the Bitcoin address checksum, beyond our basic format check.
  // If validation is unavailable, retain the existing address lookup fallback.
  const validation=await validateBtcAddress(address);
  if(validation&&(validation.isvalid===false||validation.isValid===false)){
   return NextResponse.json({error:"Invalid Bitcoin address checksum"},{status:400});
  }
  const base=mempoolBaseUrl()+"/api/address/"+encodeURIComponent(address);
  const [statsRes,txRes]=await Promise.all([fetch(base,{cache:"no-store",signal:AbortSignal.timeout(7000)}),fetch(base+"/txs/mempool",{cache:"no-store",signal:AbortSignal.timeout(7000)})]);
  if(!statsRes.ok||!txRes.ok)throw Error("Upstream unavailable");
  const stats=await statsRes.json(),txs=await txRes.json();
  const chain=stats.chain_stats??{},mem=stats.mempool_stats??{};
  const pending=(mem.funded_txo_sum??0)-(mem.spent_txo_sum??0);
  return NextResponse.json({balance:(chain.funded_txo_sum??0)-(chain.spent_txo_sum??0),pending,txCount:(chain.tx_count??0)+(mem.tx_count??0),pendingTxCount:mem.tx_count??0,pendingTransactions:Array.isArray(txs)?txs.slice(0,15).map((t:any)=>({txid:t.txid,delta:(t.vout??[]).reduce((n:number,v:any)=>n+(v.scriptpubkey_address===address?(v.value??0):0),0)-(t.vin??[]).reduce((n:number,v:any)=>n+(v.prevout?.scriptpubkey_address===address?(v.prevout?.value??0):0),0),confirmed:false,time:null,fee:t.fee??0})):[],updatedAt:Date.now()},{headers:{"Cache-Control":"no-store, max-age=0"}});
 }catch{return NextResponse.json({error:"Live data temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
