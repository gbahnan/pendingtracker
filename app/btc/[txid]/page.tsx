"use client";
import ChainDashboard from "../../components/ChainDashboard";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {BtcMvpResult} from "@/lib/btc/types";
import {isLikelyTxid} from "@/lib/btc/validate";

type ProjectedBlock={position:number;transactionCount:number|null;feeRange:number[]|null};
type Overview={btc?:{projectedBlocks?:ProjectedBlock[];height?:number|null}};
const number=(n:number|null|undefined)=>n==null?"—":new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n);
const btc=(sats:number|null|undefined)=>sats==null?"—":(sats/100000000).toLocaleString("en-US",{maximumFractionDigits:8})+" BTC";
const short=(value:string)=>value.length>27?value.slice(0,14)+"…"+value.slice(-10):value;
const rate=(n:number|null|undefined)=>n==null?"—":number(n)+" sat/vB";
function Fact({label,value,help}:{label:string;value:string;help:string}){return <div className="pt-tx-fact"><span>{label}</span><strong>{value}</strong><small>{help}</small></div>}

export default function BtcTxPage({params}:{params:{txid:string}}){
 const txid=params.txid??"";
 const valid=useMemo(()=>isLikelyTxid(txid),[txid]);
 const [result,setResult]=useState<BtcMvpResult|null>(null);
 const [overview,setOverview]=useState<Overview|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [aiSummary,setAiSummary]=useState<string|null>(null);
 const [aiLoading,setAiLoading]=useState(false);
 const [copied,setCopied]=useState(false);
 const refresh=useCallback(async()=>{
  if(!valid)return;
  try{
   const [txRes,netRes]=await Promise.all([fetch("/api/btc/tx/"+txid,{cache:"no-store"}),fetch("/api/network",{cache:"no-store"})]);
   const tx=await txRes.json();
   if(!txRes.ok)throw new Error(tx?.error??"Unable to check this transaction right now.");
   setResult(tx as BtcMvpResult);
   if(netRes.ok)setOverview(await netRes.json());
   setError(null);
  }catch(e){setError(e instanceof Error?e.message:"Live network data is unavailable.");}
  finally{setLoading(false);}
 },[txid,valid]);
 useEffect(()=>{refresh();const id=setInterval(refresh,15000);return()=>clearInterval(id);},[refresh]);
 const tx=result?.tx as (NonNullable<BtcMvpResult["tx"]> & {vout?:Array<{value?:number;scriptpubkey_address?:string}>;vin?:Array<{txid?:string;sequence?:number;prevout?:{value?:number;scriptpubkey_address?:string}}> ;size?:number;version?:number;locktime?:number})|null|undefined;
 const confirmed=Boolean(result?.status?.confirmed??tx?.status?.confirmed);
 const observed=Boolean(tx||result?.status)&&result?.diagnosis?.code!=="NOT_SEEN";
 const feeRate=result?.feerateSatVb??null;
 const blocks=overview?.btc?.projectedBlocks?.slice(0,5)??[];
 const matching=feeRate==null?[]:blocks.filter(b=>b.feeRange&&feeRate>=b.feeRange[0]&&feeRate<=b.feeRange[1]);
 const firstMatch=matching[0]?.position;
 const selectedPosition=firstMatch??(feeRate!=null&&blocks[0]?.feeRange&&feeRate>blocks[0].feeRange[1]?1:null);
 const feeEstimate=!observed?"Not available":confirmed?"Already confirmed":selectedPosition?"Possible ~"+selectedPosition*10+" min*":"Not enough data";
 const blockHeight=result?.status?.block_height??tx?.status?.block_height;
 const confirmations=confirmed&&blockHeight!=null&&overview?.btc?.height!=null?Math.max(1,overview.btc.height-blockHeight+1):confirmed?1:0;
 const inputs: Array<{txid?:string;sequence?:number;prevout?:{value?:number;scriptpubkey_address?:string}}>=(tx?.vin??[]) as Array<{txid?:string;sequence?:number;prevout?:{value?:number;scriptpubkey_address?:string}}>;
 const outputs: Array<{value?:number;scriptpubkey_address?:string}>=(tx?.vout??[]) as Array<{value?:number;scriptpubkey_address?:string}>;
 const inputTotal=inputs.length>0&&inputs.every(i=>i.prevout?.value!=null)?inputs.reduce((sum,i)=>sum+(i.prevout?.value??0),0):null;
 const outputTotal=outputs.length>0&&outputs.every(o=>o.value!=null)?outputs.reduce((sum,o)=>sum+(o.value??0),0):null;
 const rbf=inputs.some(i=>i.sequence!=null&&i.sequence<0xfffffffe);
 const networkFee=result?.fees?.halfHourFee??null;
 const blockTime=tx?.status?.block_time??result?.status?.block_time;
 const explanation=[
 {title:"Where is my Bitcoin right now?",body:!observed?"We cannot currently see this transaction on the Bitcoin network. Verify that your wallet or exchange broadcast it.":confirmed?"Miners added it to block #"+number(blockHeight)+". It now has "+number(confirmations)+" confirmation(s).":"It has been broadcast and is waiting in Bitcoin's mempool, where unconfirmed payments wait to be selected by miners."},
 {title:"Is my transaction fee high enough?",body:feeRate==null?"We do not have a fee rate to compare.":"Your transaction offers "+rate(feeRate)+" and pays "+(tx?.fee==null?"an unavailable total fee":number(tx.fee)+" sats total")+". "+(networkFee==null?"The current network recommendation is unavailable.":feeRate>=networkFee?"That meets or exceeds the current roughly 30-minute fee guide of "+rate(networkFee)+".":"That is below the current roughly 30-minute fee guide of "+rate(networkFee)+", so other payments may get priority.")+" These are live comparisons, not guarantees."},
 {title:"When will it confirm?",body:confirmed?"It has confirmed. Some wallets and exchanges require additional confirmations before showing funds as available.":!observed?"There is no reliable estimate until the transaction appears on the network.":selectedPosition?"Its fee rate overlaps projected block "+selectedPosition+". At roughly 10 minutes per block, "+selectedPosition*10+" minutes is only a rough illustration, not a verified queue position or promise.":"Its fee rate does not clearly match the displayed projected blocks. We cannot offer a reliable countdown."},
 {title:"What do the inputs and outputs mean?",body:"This transaction uses "+number(inputs.length)+" earlier Bitcoin output(s) and creates "+number(outputs.length)+" new output(s). "+(outputTotal==null?"":"The new outputs total "+btc(outputTotal)+". ")+(outputs.length>=5?"This could be a batch payment, such as an exchange sending to several wallets. ":"One of the outputs may be change sent back to the sender. ")+"Addresses do not reveal who owns the wallets."},
 {title:"What should I do next?",body:confirmed?"No fee action is needed. If an exchange still shows pending, check its required confirmation count.":!observed?"Check the transaction ID and broadcast status in the sending wallet or exchange. Never share your seed phrase.":rbf?"This transaction signals RBF (replace-by-fee). If you control the sending wallet and it supports fee bumping, you may be able to replace it with a higher-fee version.":"It does not signal opt-in RBF. Some wallets support CPFP (child-pays-for-parent), where spending an output with a higher fee may help. Check your wallet before taking action."}
 ];
 const summary=!observed
  ?"We cannot see this transaction on the Bitcoin network right now. Check that the ID is correct and that your wallet has broadcast it. A missing transaction does not necessarily mean the funds were lost."
  :confirmed
  ?"This transaction is recorded in Bitcoin block "+(blockHeight==null?"on the blockchain":number(blockHeight))+" and currently has "+number(confirmations)+" confirmation"+(confirmations===1?"":"s")+". It paid "+(tx?.fee==null?"an unavailable network fee":number(tx.fee)+" sats in network fees")+" at "+rate(feeRate)+". It is confirmed, although some wallets and exchanges may wait for more confirmations."
  :selectedPosition
  ?"Your transaction is waiting in Bitcoin's mempool with a fee rate of "+rate(feeRate)+". Its fee overlaps the current range for projected block "+selectedPosition+", which suggests roughly "+selectedPosition*10+" minutes on average if conditions stay similar. This is a fee-based estimate, not a verified position or guaranteed arrival time."
  :"Your transaction is waiting in Bitcoin's mempool with a fee rate of "+rate(feeRate)+". Its fee does not clearly match the currently displayed projected blocks, so we cannot give a dependable confirmation estimate. Network traffic and miner selection can change how long it takes.";
 async function explain(){
  if(!result||aiLoading)return;
  setAiLoading(true);
  try{
   const response=await fetch("/api/ai/explain",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chain:"btc",status:confirmed?"confirmed":"pending",facts:{feeSats:tx?.fee??null,feeRateSatVb:feeRate,confirmed,blockHeight,confirmations,inputs:inputs.length,outputs:outputs.length,summary:result.diagnosis.summary}})});
   const body=await response.json();setAiSummary(response.ok&&typeof body.summary==="string"?body.summary:"Extra explanation is unavailable.");
  }catch{setAiSummary("Extra explanation is unavailable.");}finally{setAiLoading(false);}
 }
 function copy(){if(typeof navigator!=="undefined"&&navigator.clipboard){navigator.clipboard.writeText(txid).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1800);}).catch(()=>{});}}
 if(!valid)return <main className="pt-tx-page"><a href="/">← Back to explorer</a><h1>Check your Bitcoin transaction ID</h1><p>A Bitcoin transaction ID is 64 hexadecimal characters.</p></main>;
 return <main className="pt-tx-page pt-tx-detail-v2">
  <div className="pt-tx-back"><a href="/">← Track another transaction</a> · <a href="/explore">Explore blockchain →</a></div>
  <header className="pt-tx-top"><div><div className="pt-eyebrow">BITCOIN TRANSACTION TRACKER</div><h1>{!observed?"Transaction not found":confirmed?"Your transaction is confirmed":"Your transaction is pending"}</h1><p>Follow the live status, understand the numbers, and see what happens next.</p></div><button type="button" onClick={refresh} disabled={loading}>{loading?"Checking…":"↻ Refresh"}</button></header>
  <div className="pt-tx-idbar"><div><span>TRANSACTION ID (TXID)</span><code title={txid}>{txid}</code></div><button type="button" onClick={copy}>{copied?"✓ Copied":"Copy ID"}</button></div>
  {error&&<div className="pt-tx-error" role="alert">{error} {result?"Showing the last available data.":""}</div>}
  {loading&&!result&&<div className="pt-tx-loading">Checking the Bitcoin network…</div>}
  {result&&<>
   <section className="pt-tx-stage">
    <div className="pt-tx-stage-head"><div><div className="pt-eyebrow">LIVE TRANSACTION OUTLOOK</div><h2>{confirmed?"Confirmed in block #"+(blockHeight??"—"):observed?"Where could it confirm?":"Waiting for network data"}</h2></div><span className={confirmed?"pt-tx-state good":"pt-tx-state"}>{confirmed?"● Confirmed":observed?"● Pending":"● Not found"}</span></div>
    <div className="pt-tx-estimate"><span>YOUR TRANSACTION FEE RATE</span><strong>{rate(feeRate)}</strong><span>{confirmed?"CONFIRMATIONS":"POSSIBLE CONFIRMATION TIME"}</span><strong>{confirmed?number(confirmations):feeEstimate}</strong></div>
    {!confirmed&&observed&&<div className="pt-tx-position-guide">{selectedPosition?"The arrow beneath the matching projected block shows an estimated confirmation window, not an exact queue position.":"Your transaction is pending, but we cannot estimate a block yet."}</div>}
    <div className="pt-tx-block-track">
     {confirmed?<div className="pt-tx-confirmed-message">✓ Confirmed in Bitcoin block #{number(blockHeight)} · {number(confirmations)} confirmation(s). Your transaction is no longer waiting in the mempool.</div>:null}
     {!confirmed&&observed&&!selectedPosition?<p className="pt-tx-position-unknown">No reliable projected block match is available yet.</p>:null}
     <ChainDashboard chain="bitcoin" tracking trackedPosition={!confirmed&&observed?selectedPosition:null}/>
     <p className="pt-tx-block-caveat">{confirmed?"These are upcoming projected blocks, not the block that confirmed your transaction.":observed?"*The arrow indicates a fee-range match, not a confirmed place in line. Block times average around 10 minutes and can vary.":"Projected blocks describe network activity, not a transaction we can currently locate."}</p>
    </div>
   </section>
   <section className="pt-tx-clarity" aria-labelledby="btc-clarity-title">
    <div className="pt-eyebrow">THE SAME BLOCKCHAIN. A CLEARER PICTURE.</div>
    <h2 id="btc-clarity-title">Your Bitcoin transaction, in plain English</h2>
    <p className="pt-tx-details-intro">Every number below comes from this transaction or the latest available network data. Here's what it actually means for you.</p>
    <div className="pt-tx-clarity-head"><span>YOUR ACTUAL DATA</span><span>WHAT IT MEANS FOR YOU</span></div>
    <div className="pt-tx-clarity-rows">
     <div className="pt-tx-clarity-row"><div><span>Transaction status</span><strong>{confirmed?"Confirmed":observed?"Pending":"Not found"}</strong></div><p>{confirmed?"Your transaction is permanently recorded in a Bitcoin block. The receiving service may still require more confirmations before crediting funds.":observed?"The network has seen your transaction, but a miner has not yet included it in a block. Your funds are not necessarily lost.":"We cannot currently find this transaction on the network. Check that the sender broadcast it and that the ID is correct."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Confirmation progress</span><strong>{confirmed?number(confirmations)+" confirmation"+(confirmations===1?"":"s"):"0 confirmations"}</strong></div><p>{confirmed?"Each additional block adds another confirmation. Your exchange or wallet decides how many confirmations it requires.":"Zero confirmations means the transaction has not yet been included in a block. It does not, by itself, mean the payment failed."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Transaction fee rate</span><strong>{rate(feeRate)}</strong></div><p>{feeRate==null?"The fee rate is not available, so we cannot assess its priority.":networkFee==null?"This is the fee offered per virtual byte. Miners often prioritize higher-paying transactions, but there is no guaranteed order.":feeRate>=networkFee?"Your fee meets or exceeds the current approximately 30-minute network fee guide. This is encouraging, not a guarantee.":"Your fee is below the current approximately 30-minute network fee guide. Higher-fee transactions may be selected first."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Estimated confirmation</span><strong>{feeEstimate}</strong></div><p>{confirmed?"The transaction has already confirmed; no additional mining wait is needed.":selectedPosition?"This estimate is based on a fee-range match to projected block "+selectedPosition+". It is not your verified position in line, and the mempool can change.":"There is not enough reliable information to give you a countdown. Bitcoin blocks average around ten minutes, but individual waits vary."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Total network fee</span><strong>{tx?.fee==null?"Unavailable":number(tx.fee)+" sats"}</strong></div><p>This is the fee paid to Bitcoin miners, not the amount the recipient receives. Wallet or exchange withdrawal fees may be separate.</p></div>
     <div className="pt-tx-clarity-row"><div><span>Transaction outputs</span><strong>{number(outputs.length)} output{outputs.length===1?"":"s"}</strong></div><p>Outputs are the new destinations created by this transaction. Some may be payments, and others may be change returned to the sender. The blockchain alone cannot identify the owner of an address.</p></div>
     <div className="pt-tx-clarity-row"><div><span>Fee adjustment option</span><strong>{!observed?"Unknown":rbf?"RBF signaled":"RBF not signaled"}</strong></div><p>{!observed?"We need a visible transaction before evaluating fee-replacement options.":rbf?"The transaction signals replace-by-fee. If you control the sending wallet, it may offer a way to increase the fee.":"The transaction does not signal opt-in replace-by-fee. Some wallets may support other methods such as CPFP, but do not send a second payment just to try to speed it up."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>What should I do next?</span><strong>{confirmed?"Check recipient status":observed?"Usually, wait":"Check broadcast"}</strong></div><p>{confirmed?"Your transaction is confirmed. If a service still says pending, check its required confirmations and deposit processing.":!observed?"Verify the transaction ID and ask the sender whether it was broadcast. Never share private keys or recovery phrases.":rbf?"You can wait. If it is urgent and you control the sending wallet, check its fee-bump option. Avoid duplicate payments.":"You can wait. If delayed unusually long, check the sending wallet's acceleration options. Avoid duplicate payments."}</p></div>
    </div>
    <p className="pt-tx-clarity-note">Pending Tracker shows what the public Bitcoin network can verify. It cannot see whether an exchange has completed its own internal deposit or withdrawal processing.</p>
   </section>
   <div className="pt-tx-summary-actions"><button type="button" onClick={explain} disabled={aiLoading}>{aiLoading?"Explaining…":"✦ Explain further"}</button><a href={"https://mempool.space/tx/"+txid} target="_blank" rel="noopener noreferrer">Verify on mempool.space ↗</a></div>{aiSummary&&<p className="pt-tx-ai" role="status">{aiSummary}</p>}
   <section className="pt-tx-details pt-tx-money">
    <div className="pt-eyebrow">WHERE THE BITCOIN GOES</div><h2>Inputs & outputs</h2>
    <p className="pt-tx-details-intro">Inputs are Bitcoin from earlier transactions. Outputs are new destinations, including possible change returned to the sender. An exchange may send to several people in one batch. Blockchain addresses do not reveal who owns them.</p>
    <div className="pt-tx-money-totals"><div><span>Total inputs</span><strong>{btc(inputTotal)}</strong></div><div><span>Total outputs</span><strong>{btc(outputTotal)}</strong></div><div><span>Network fee</span><strong>{btc(tx?.fee)}</strong></div></div>
    <div className="pt-tx-io-grid">
     <div className="pt-tx-io-column"><h3>↘ Inputs <small>({inputs.length})</small></h3>{inputs.length?inputs.map((input,i)=><div className="pt-tx-io-row" key={i}><span title={input.prevout?.scriptpubkey_address??input.txid??""}>{input.prevout?.scriptpubkey_address?<a href={"/btc/address/"+input.prevout.scriptpubkey_address}>{short(input.prevout.scriptpubkey_address)}</a>:short(input.txid??"Unknown source")}</span><strong>{btc(input.prevout?.value)}</strong></div>):<p>Input details are unavailable.</p>}</div>
     <div className="pt-tx-io-column"><h3>↗ Outputs <small>({outputs.length})</small></h3>{outputs.length?outputs.map((output,i)=><div className="pt-tx-io-row" key={i}><span title={output.scriptpubkey_address??""}>{output.scriptpubkey_address?<a href={"/btc/address/"+output.scriptpubkey_address}>{short(output.scriptpubkey_address)}</a>:"Non-address output"}</span><strong>{btc(output.value)}</strong></div>):<p>Output details are unavailable.</p>}</div>
    </div>
    <details className="pt-tx-more"><summary>What do inputs, outputs, and change mean? <span>＋</span></summary><div>Bitcoin transactions spend earlier outputs as inputs and create new outputs. An output may pay someone or return change to the sender. You cannot reliably tell which output is change from addresses alone.</div></details>
   </section>
   <section className="pt-tx-details pt-tx-tech"><details className="pt-tx-more"><summary>More transaction details <span>＋</span></summary><div className="pt-tx-tech-grid"><p><b>Transaction ID:</b> <code>{txid}</code></p><p><b>Block height:</b> {blockHeight==null?"Not confirmed":number(blockHeight)}</p><p><b>Raw size:</b> {tx?.size==null?"Unavailable":number(tx.size)+" bytes"}</p><p><b>Weight:</b> {tx?.weight==null?"Unavailable":number(tx.weight)+" WU"}</p><p><b>Version:</b> {tx?.version??"—"}</p><p><b>Locktime:</b> {tx?.locktime??"—"}</p><p><b>Data source:</b> {result.provider}</p><details><summary>Raw blockchain data</summary><pre>{JSON.stringify(result,null,2)}</pre></details></div></details></section>
  </>}
  <p className="pt-tx-footnote">Live data refreshes every 15 seconds · No wallet connection needed · Fee estimates are not guarantees.</p>
 </main>;
}
