import {NextResponse} from "next/server";
export const revalidate=120;
async function read(url:string){const r=await fetch(url,{next:{revalidate:120},signal:AbortSignal.timeout(6500)});if(!r.ok)throw Error("Unavailable");return r.json()}
export async function GET(){
 const [hash,difficulty]=await Promise.allSettled([read("https://mempool.space/api/v1/mining/hashrate/1m"),read("https://mempool.space/api/v1/difficulty-adjustment")]);
 const h=hash.status==="fulfilled"?hash.value:null,d=difficulty.status==="fulfilled"?difficulty.value:null;
 const rate=Number(h?.currentHashrate),change=Number(d?.difficultyChange),remaining=Number(d?.remainingBlocks),time=Number(d?.estimatedRetargetDate);
 return NextResponse.json({hashrateEH:Number.isFinite(rate)&&rate>0?rate/1e18:null,difficultyChange:Number.isFinite(change)?change:null,remainingBlocks:Number.isFinite(remaining)?remaining:null,estimatedRetargetDate:Number.isFinite(time)&&time>0?new Date(time).toISOString():null,available:!!(h||d),source:"mempool.space"},{headers:{"Cache-Control":"public, s-maxage=120, stale-while-revalidate=120"}});
}
