import {NextResponse} from "next/server";
import {mempoolBaseUrl} from "@/lib/btc/providers/mempool";
export const dynamic="force-dynamic";
const validAddress=/^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
type Tx={txid:string;fee?:number;status?:{confirmed?:boolean;block_time?:number};vin?:{prevout?:{scriptpubkey_address?:string;value?:number}}[];vout?:{scriptpubkey_address?:string;value?:number}[]};
export async function GET(request:Request,{params}:{params:{address:string}}){
 const address=params.address;
 if(!validAddress.test(address))return NextResponse.json({error:"Invalid Bitcoin address"},{status:400});
 const cursor=new URL(request.url).searchParams.get("cursor")||"";
 if(cursor&&!/^[a-f0-9]{64}$/i.test(cursor))return NextResponse.json({error:"Invalid pagination cursor"},{status:400});
 try{
  const url=mempoolBaseUrl()+"/api/address/"+encodeURIComponent(address)+"/txs/chain"+(cursor?"/"+cursor:"");
  const res=await fetch(url,{next:{revalidate:30},signal:AbortSignal.timeout(7000)});
  if(!res.ok)throw Error("Upstream history unavailable");
  const data:Tx[]=await res.json();
  if(!Array.isArray(data))throw Error("Invalid upstream history");
  const activity=data.filter(t=>typeof t.txid==="string"&&/^[a-f0-9]{64}$/i.test(t.txid)).map(t=>{
   const incoming=(t.vout??[]).reduce((n,v)=>n+(v.scriptpubkey_address===address?(v.value??0):0),0);
   const outgoing=(t.vin??[]).reduce((n,v)=>n+(v.prevout?.scriptpubkey_address===address?(v.prevout?.value??0):0),0);
   return {txid:t.txid,delta:incoming-outgoing,confirmed:!!t.status?.confirmed,time:t.status?.block_time??null,fee:t.fee??0};
  });
  const nextCursor=data.length===25?data[data.length-1]?.txid:null;
  return NextResponse.json({activity,nextCursor},{headers:{"Cache-Control":"public, s-maxage=30, stale-while-revalidate=30"}});
 }catch{return NextResponse.json({error:"Address history temporarily unavailable"},{status:503})}
}
