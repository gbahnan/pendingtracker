import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export const revalidate=0;
const base="https://eth.blockscout.com/api/v2/addresses/";
async function get(url:string){const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(9000),headers:{"Accept":"application/json"}});if(!r.ok)throw Error("Blockchain data unavailable");return r.json()}
export async function GET(req:Request,{params}:{params:{address:string}}){
 const address=params.address;
 if(!/^0x[a-f0-9]{40}$/i.test(address))return NextResponse.json({error:"Invalid Ethereum address"},{status:400});
 const u=new URL(req.url),mode=u.searchParams.get("mode")||"live";
 try{
  if(mode==="history"){
   const days=Math.min(365,Math.max(1,Number(u.searchParams.get("days"))||30)),cutoff=Date.now()-days*86400000;
   let next:Record<string,string|number>|null=null;const items:any[]=[];let complete=false,coverageStart:number|null=null;
   for(let i=0;i<25;i++){
    const qs=new URLSearchParams();if(next)for(const [k,v] of Object.entries(next))qs.set(k,String(v));
    const d=await get(base+address+"/transactions"+(qs.size?"?"+qs:""));
    const batch=Array.isArray(d.items)?d.items:[];
    if(!batch.length){complete=true;break}
    for(const t of batch){const ts=Date.parse(t.timestamp||"");if(!Number.isFinite(ts))continue;coverageStart=ts;items.push({hash:t.hash,time:ts,delta:direction(t,address),status:t.status});if(ts<cutoff){complete=true;break}}
    if(complete)break;
    next=d.next_page_params;if(!next){complete=true;break}
   }
   return NextResponse.json({items:items.filter(x=>x.time>=cutoff).reverse(),complete,coverageStart,days},{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=120"}});
  }
  const [info,txs,tokens,price]=await Promise.allSettled([get(base+address),get(base+address+"/transactions"),get(base+address+"/token-balances"),get("https://eth.blockscout.com/api/v2/stats")]);
  if(info.status!=="fulfilled")throw Error("Address unavailable");
  const a=info.value,t=txs.status==="fulfilled"?txs.value:{},tok=tokens.status==="fulfilled"?tokens.value:[],stats=price.status==="fulfilled"?price.value:{};
  const list=Array.isArray(t.items)?t.items:[];
  const pending=list.filter((x:any)=>x.status==="pending"||x.block_number==null);
  const ethPrice=Number(a.exchange_rate??stats.coin_price??0);
  return NextResponse.json({address,balanceWei:String(a.coin_balance??"0"),ethPrice:Number.isFinite(ethPrice)&&ethPrice>0?ethPrice:null,txCount:a.transactions_count==null?null:Number(a.transactions_count),isContract:!!a.is_contract,tokens:Array.isArray(tok)?tok.slice(0,12).map((x:any)=>({symbol:x.token?.symbol??"Token",name:x.token?.name??"Token",value:String(x.value??"0"),decimals:Number(x.token?.decimals??18),type:x.token?.type??"",contract:x.token?.address_hash??x.token?.address??null,priceUsd:(()=>{const n=Number(x.token?.exchange_rate??x.token?.fiat_value??NaN);return Number.isFinite(n)&&n>0?n:null})(),verified:!!(x.token?.is_verified_via_admin_panel||x.token?.is_verified)})):[],transactions:list.slice(0,30).map((x:any)=>({hash:x.hash,time:x.timestamp?Date.parse(x.timestamp):null,delta:direction(x,address),status:x.status,method:x.method??null,from:x.from?.hash??null,to:x.to?.hash??null,fee:x.fee?.value??null,gasUsed:x.gas_used??null})),pendingCount:pending.length,updatedAt:Date.now(),source:"Blockscout"},{headers:{"Cache-Control":"no-store, max-age=0"}});
 }catch{return NextResponse.json({error:"Ethereum provider temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
function direction(t:any,address:string){const value=String(t.value??"0");if(t.from?.hash?.toLowerCase()===address.toLowerCase())return "-"+value;if(t.to?.hash?.toLowerCase()===address.toLowerCase())return value;return "0"}
