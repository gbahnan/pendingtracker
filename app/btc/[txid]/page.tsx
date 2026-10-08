"use client";
import {useEffect,useMemo,useState} from "react";
import type {BtcMvpResult} from "@/lib/btc/types";
import {isLikelyTxid} from "@/lib/btc/validate";

type ProjectedBlock={position:number;transactionCount:number|null;feeRange:number[]|null};
type NetworkOverview={btc?:{projectedBlocks?:ProjectedBlock[];height?:number|null}};
const fmt=(n:number|null|undefined)=>n==null?"—":new Intl.NumberFormat().format(n);

export default function BtcTxPage({params}:{params:{txid:string}}){
 const txid=params.txid??"";
 const valid=useMemo(()=>isLikelyTxid(txid),[txid]);
 const [result,setResult]=useState<BtcMvpResult|null>(null);
 const [overview,setOverview]=useState<NetworkOverview|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [aiSummary,setAiSummary]=useState<string|null>(null);
 const [aiLoading,setAiLoading]=useState(false);
 async function refresh(){
  if(!valid)return;
  try{
   const [txRes,netRes]=await Promise.all([fetch("/api/btc/tx/"+txid,{cache:"no-store"}),fetch("/api/network",{cache:"no-store"})]);
   const tx=await txRes.json();
   if(!txRes.ok)throw new Error(tx?.error??"Could not load this transaction.");
   setResult(tx as BtcMvpResult);
   if(netRes.ok)setOverview(await netRes.json());
   setError(null);
  }catch(e){setError(e instanceof Error?e.message:"Network data unavailable.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{refresh();const id=setInterval(refresh,15000);return()=>clearInterval(id);},[txid,valid]);
 const confirmed=Boolean(result?.status?.confirmed??result?.tx?.status?.confirmed);
 const observed=Boolean(result?.tx||result?.status);
 const feeRate=result?.feerateSatVb;
 const blocks=overview?.btc?.projectedBlocks?.slice(0,5)??[];
 const matching=feeRate==null?[]:blocks.filter(b=>b.feeRange&&feeRate>=b.feeRange[0]&&feeRate<=b.feeRange[1]);
 const firstMatch=matching[0]?.position;
 const highPriority=feeRate!=null&&blocks[0]?.feeRange&&feeRate>blocks[0].feeRange[1];
 const statusTitle=!observed?"Not found on the network":confirmed?"Your Bitcoin transaction is confirmed":"Your Bitcoin transaction is waiting";
 const summary=!observed?"We haven't found this transaction on the Bitcoin network yet. Double-check the transaction ID and try again.":confirmed?"Your transaction has been included in a Bitcoin block. It has at least one confirmation, and newer blocks add more. Some wallets or exchanges may wait for additional confirmations.":`Your transaction is waiting to be included in a Bitcoin block. It offers ${feeRate==null?"an unavailable fee rate":feeRate+" sat/vB"}.`+(firstMatch?` That fee overlaps the range currently shown in projected block ${firstMatch}, but its exact position cannot be determined from fee alone.`:highPriority?" Its fee is above the first projected block's displayed range, which may help it get picked sooner.":" Confirmation time depends on network demand and miner selection.")+" These estimates can change at any moment.";
 async function explain(){
  if(!result||aiLoading)return;
  setAiLoading(true);
  try{const r=await fetch("/api/ai/explain",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chain:"btc",status:confirmed?"confirmed":"pending",facts:{feeSats:result.tx?.fee??null,feeRateSatVb:feeRate??null,confirmed,summary:result.diagnosis.summary}})});const j=await r.json();setAiSummary(r.ok&&typeof j.summary==="string"?j.summary:"Extra explanation is unavailable right now.");}
  catch{setAiSummary("Extra explanation is unavailable right now.");}finally{setAiLoading(false);}
 }
 if(!valid)return <main className="pt-tx-page"><h1>Check your Bitcoin transaction ID</h1><p>A Bitcoin transaction ID has 64 letters and numbers.</p><a href="/">← Search again</a></main>;
 return <main className="pt-tx-page">
  <div className="pt-tx-top"><div><div className="pt-eyebrow">BITCOIN TRANSACTION TRACKER</div><h1>{statusTitle}</h1><p>See where your transaction stands, without the technical overload.</p></div><button onClick={refresh} disabled={loading}>{loading?"Checking…":"↻ Refresh"}</button></div>
  {error&&<div className="pt-tx-error" role="alert">{error}</div>}
  {loading&&!result?<div className="pt-tx-loading">Checking the Bitcoin network and building your live view…</div>:null}
  {result&&<>
   <section className="pt-tx-stage">
    <div className="pt-tx-stage-head"><div><span className="pt-eyebrow">WHERE IS MY TRANSACTION?</span><h2>{confirmed?"Included in a block":observed?"Waiting for a block":"Not seen yet"}</h2></div><span className={confirmed?"pt-tx-state good":"pt-tx-state"}>{confirmed?"● Confirmed":observed?"● Pending":"● Not found"}</span></div>
    <div className="pt-tx-block-track">
     {!confirmed&&observed&&<div className="pt-tx-position"><span className="pt-tx-pointer">↓</span><strong>Your transaction</strong><small>{firstMatch?"Fee overlaps projected block "+firstMatch:highPriority?"Fee above first displayed range":"Position not yet known"}</small></div>}
     <div className="pt-tx-block-grid">
      {(blocks.length?blocks:[1,2,3,4,5].map(position=>({position,transactionCount:null,feeRange:null}))).map((block,index)=>{
       const highlighted=!confirmed&&observed&&firstMatch===block.position;
       return <div className={"pt-tx-block"+(highlighted?" highlighted":"")} key={block.position}>
        <div className="pt-tx-block-label">{confirmed?"Projected":"BLOCK "+block.position}</div>
        <div className="pt-tx-block-time">~{block.position*10} <span>min</span></div>
        <div className="pt-tx-block-tiles" aria-hidden="true">{Array.from({length:15},(_,i)=><i key={i} style={{opacity:block.transactionCount==null?.25:i<Math.max(1,Math.min(15,Math.round(block.transactionCount/220)))?1:.16}}/>)}</div>
        <strong>{block.feeRange?" "+block.feeRange[0].toFixed(1)+"–"+block.feeRange[1].toFixed(1):"—"} <span>sat/vB</span></strong>
        <small>{block.transactionCount==null?"Live data loading":fmt(block.transactionCount)+" transactions"}</small>
       </div>
      })}
     </div>
     {confirmed?<div className="pt-tx-confirmed-banner">✓ Your transaction is already confirmed. The blocks above show the current network outlook, not the block containing your transaction.</div>:<p className="pt-tx-block-caveat">{firstMatch?"Highlighted block = matching fee range, not a verified queue position.":"A precise position cannot be calculated from the fee rate alone."} Times are approximate, not countdowns or guarantees.</p>}
    </div>
   </section>
   <section className="pt-tx-summary"><div className="pt-eyebrow">THE SHORT ANSWER</div><h2>{confirmed?"Good news—it's confirmed.":observed?"Here's what's happening.":"Here's what we know."}</h2><p>{summary}</p><div className="pt-tx-summary-actions"><button onClick={explain} disabled={aiLoading}>{aiLoading?"Explaining…":"✦ Explain more with AI"}</button><a href={"https://mempool.space/tx/"+txid} target="_blank" rel="noopener noreferrer">Verify on mempool.space ↗</a></div>{aiSummary&&<p className="pt-tx-ai" role="status">{aiSummary}</p>}</section>
   <section className="pt-tx-details"><div className="pt-eyebrow">IF YOU WANT THE DETAILS</div><h2>Your transaction at a glance</h2><div className="pt-tx-facts">
    <div><span>Current status</span><strong>{confirmed?"Confirmed":observed?"Pending":"Not observed"}</strong><small>Whether the network has included it in a block</small></div>
    <div><span>Your fee rate</span><strong>{feeRate==null?"Unavailable":feeRate+" sat/vB"}</strong><small>Higher rates are generally more competitive</small></div>
    <div><span>Total transaction fee</span><strong>{result.tx?.fee==null?"Unavailable":fmt(result.tx.fee)+" sats"}</strong><small>The fee offered for processing this transaction</small></div>
   </div><details className="pt-tx-more"><summary>More technical information <span>＋</span></summary><div><p><b>Transaction ID:</b> <code>{txid}</code></p><p><b>Virtual size:</b> {fmt(result.tx?.vsize)} vB</p><p><b>Data source:</b> {result.provider}</p><p><b>What can I do?</b> {result.diagnosis.actions.map(x=>x.label+": "+x.detail).join(" ")}</p><button onClick={()=>navigator.clipboard?.writeText(txid)}>Copy transaction ID</button><details><summary>Raw blockchain data</summary><pre>{JSON.stringify(result,null,2)}</pre></details></div></details></section>
  </>}
  <p className="pt-tx-footnote">Updates every 15 seconds · Public blockchain data · No wallet connection required · Estimates are not guarantees.</p>
 </main>;
