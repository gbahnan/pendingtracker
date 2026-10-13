import {NextResponse} from "next/server";
export const runtime="nodejs";
export const revalidate=15;
const base="https://eth.blockscout.com/api/v2";
async function get(path:string){try{const r=await fetch(base+path,{next:{revalidate:15},signal:AbortSignal.timeout(7000)});return r.ok?await r.json():null}catch{return null}}
export async function GET(_request:Request,{params}:{params:{hash:string}}){
 const hash=params.hash;
 if(!/^0x[a-f0-9]{64}$/i.test(hash))return NextResponse.json({error:"Invalid Ethereum transaction hash"},{status:400});
 const rpc=async(method:string,params:any[])=>{const key=process.env.ALCHEMY_API_KEY;if(!key)return null;try{const r=await fetch("https://eth-mainnet.g.alchemy.com/v2/"+encodeURIComponent(key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(6500),cache:"no-store"});if(!r.ok)return null;const j=await r.json();return j.error?null:j.result}catch{return null}};
 const [tx,transfers,rpcTx,receipt,latestBlock]=await Promise.all([get("/transactions/"+hash),get("/transactions/"+hash+"/token-transfers"),rpc("eth_getTransactionByHash",[hash]),rpc("eth_getTransactionReceipt",[hash]),rpc("eth_blockNumber",[])]);

 if(!tx&&!rpcTx)return NextResponse.json({available:false,tokenTransfers:[],note:"Additional transaction details are temporarily unavailable."},{status:200});
 const items=Array.isArray(transfers?.items)?transfers.items:[];
 const safeAddress=(v:any)=>typeof v==="string"?v:(typeof v?.hash==="string"?v.hash:null);
 return NextResponse.json({
  available:true,
  status:receipt?.status==="0x0"?"error":receipt?.status==="0x1"?"ok":tx?.status??null,
  method:typeof tx?.method==="string"?tx.method:null,
  from:rpcTx?.from??safeAddress(tx?.from),
  to:rpcTx?.to??safeAddress(tx?.to),
  createdContract:receipt?.contractAddress??safeAddress(tx?.created_contract),
  blockNumber:receipt?.blockNumber?Number(BigInt(receipt.blockNumber)):tx?.block??null,
  gasUsed:receipt?.gasUsed?BigInt(receipt.gasUsed).toString():tx?.gas_used??null,
  gasPrice:receipt?.effectiveGasPrice?BigInt(receipt.effectiveGasPrice).toString():tx?.gas_price??null,
  fee:receipt?.gasUsed&&receipt?.effectiveGasPrice?(BigInt(receipt.gasUsed)*BigInt(receipt.effectiveGasPrice)).toString():tx?.fee?.value??null,
  feeType:tx?.fee?.type??null,
  nonce:rpcTx?.nonce?Number(BigInt(rpcTx.nonce)):tx?.nonce??null,
  revertReason:typeof tx?.revert_reason==="string"?tx.revert_reason:null,
  rpcVerified:!!rpcTx,receiptVerified:!!receipt,networkConfirmations:receipt?.blockNumber&&latestBlock?Math.max(0,Number(BigInt(latestBlock)-BigInt(receipt.blockNumber)+1n)):null,
  transactionType:rpcTx?.type?Number(BigInt(rpcTx.type)):null,
  maxFeePerGas:rpcTx?.maxFeePerGas?BigInt(rpcTx.maxFeePerGas).toString():null,
  maxPriorityFeePerGas:rpcTx?.maxPriorityFeePerGas?BigInt(rpcTx.maxPriorityFeePerGas).toString():null,
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
