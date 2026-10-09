import {NextResponse} from "next/server";
export const runtime="nodejs";
export const revalidate=15;
const base="https://eth.blockscout.com/api/v2";
async function get(path:string){try{const r=await fetch(base+path,{next:{revalidate:15},signal:AbortSignal.timeout(7000)});return r.ok?await r.json():null}catch{return null}}
export async function GET(_request:Request,{params}:{params:{hash:string}}){
 const hash=params.hash;
 if(!/^0x[a-f0-9]{64}$/i.test(hash))return NextResponse.json({error:"Invalid Ethereum transaction hash"},{status:400});
 const [tx,transfers]=await Promise.all([get("/transactions/"+hash),get("/transactions/"+hash+"/token-transfers")]);
 if(!tx)return NextResponse.json({available:false,tokenTransfers:[],note:"Additional transaction details are temporarily unavailable."},{status:200});
 const items=Array.isArray(transfers?.items)?transfers.items:[];
 const safeAddress=(v:any)=>typeof v==="string"?v:(typeof v?.hash==="string"?v.hash:null);
 return NextResponse.json({
  available:true,
  status:tx.status??null,
  method:typeof tx.method==="string"?tx.method:null,
  from:safeAddress(tx.from),
  to:safeAddress(tx.to),
  createdContract:safeAddress(tx.created_contract),
  blockNumber:tx.block??null,
  gasUsed:tx.gas_used??null,
  gasPrice:tx.gas_price??null,
  fee:tx.fee?.value??null,
  feeType:tx.fee?.type??null,
  nonce:tx.nonce??null,
  revertReason:typeof tx.revert_reason==="string"?tx.revert_reason:null,
  tokenTransfers:items.slice(0,50).map((t:any)=>({
   from:safeAddress(t.from),to:safeAddress(t.to),
   symbol:typeof t.token?.symbol==="string"?t.token.symbol:null,
   name:typeof t.token?.name==="string"?t.token.name:null,
   decimals:Number.isInteger(Number(t.token?.decimals))?Number(t.token.decimals):null,
   amount:t.total?.value??null,
   tokenId:t.total?.token_id??null,
   type:t.token?.type??null
  })),
  tokenTransfersHasMore:!!transfers?.next_page_params,
  tokenTransfersAvailable:!!transfers
 });
}
