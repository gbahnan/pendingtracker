"use client";
import {Honeycomb} from "../../components/ChainDashboard";
import HexArtwork from "../../components/SharedHexArtwork";
import styles from "./BitcoinTracker.module.css";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {BtcMvpResult} from "@/lib/btc/types";
import {isLikelyTxid} from "@/lib/btc/validate";

type ProjectedBlock={position:number;transactionCount:number|null;feeRange:number[]|null};
type Overview={btc?:{projectedBlocks?:ProjectedBlock[];height?:number|null}};
const number=(n:number|null|undefined)=>n==null?"—":new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n);
const btc=(sats:number|null|undefined)=>sats==null?"—":(sats/100000000).toLocaleString("en-US",{maximumFractionDigits:8})+" BTC";
const short=(value:string)=>value.length>27?value.slice(0,14)+"…"+value.slice(-10):value;
const rate=(n:number|null|undefined)=>n==null?"—":number(n)+" sat/vB";
function EdgeLights({right=false}:{right?:boolean}){
 // Coordinates deliberately cluster around the block baseline, like the reference artwork.
 const points=right?[
 [185,24,21,0],[134,63,13,0],[175,112,17,1],[116,137,13,0],
 [198,173,25,1],[146,202,15,0],[108,225,12,0],[168,250,19,1],
 [121,291,16,0],[190,315,25,1],[151,356,15,0],[112,380,18,1],
 [175,420,15,0],[133,455,11,0],[206,477,20,1]
 ]:[
 [19,24,21,0],[72,61,14,0],[24,113,21,1],[92,144,13,0],
 [51,177,23,1],[8,214,16,0],[107,237,17,1],[68,267,14,0],
 [26,294,25,1],[112,315,16,0],[74,350,18,1],[16,388,19,0],
 [100,417,16,1],[46,454,12,0],[5,481,20,1]
 ];
 const hex=(x:number,y:number,r:number)=>Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return `${x+Math.cos(a)*r},${y+Math.sin(a)*r}`}).join(" ");
 const prefix=right?"edge-r":"edge-l";
 return <svg className={right?styles.edgeRight:styles.edgeLeft} viewBox="0 0 220 510" aria-hidden="true">
  <defs>
   <filter id={prefix+"-glow"} x="-220%" y="-220%" width="540%" height="540%"><feGaussianBlur stdDeviation="10"/></filter>
   <linearGradient id={prefix+"-metal"} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff6bb"/><stop offset=".42" stopColor="#ffc857"/><stop offset="1" stopColor="#9a5618"/></linearGradient>
  </defs>
  {points.map(([x,y,r,lit],i)=><g key={i}>
   {lit===1&&<polygon points={hex(x,y,r*1.65)} fill="#e69c28" opacity=".64" filter={`url(#${prefix}-glow)`}/>}
   <polygon points={hex(x,y,r)} fill={lit===1?`url(#${prefix}-metal)`:"#a5742c"} fillOpacity={lit===1?.93:.035} stroke={lit===1?"#ffe09a":"#a87532"} strokeOpacity={lit===1?.98:.32} strokeWidth={lit===1?1.6:1.05}/>
   {lit===1&&<polygon points={hex(x,y,r*.76)} fill="none" stroke="#fff0af" strokeOpacity=".3" strokeWidth=".7"/>}
  </g>)}
 </svg>;
}
function AmbientHoneycomb(){
 const tiles=[] as Array<{x:number;y:number;r:number;bright:boolean}>;
 for(let row=0;row<5;row++)for(let col=0;col<27;col++){
  const x=col*46+(row%2?23:0)-12,y=row*27+9;
  const center=Math.abs(x-590)/590;
  const bright=(row===2&&col%6===1)||(row===3&&col%5===2)||(row===4&&col%4===0);
  tiles.push({x,y,r:23,bright:bright&&center>.16});
 }
 const polygon=(x:number,y:number,r:number)=>Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return `${x+Math.cos(a)*r},${y+Math.sin(a)*r}`}).join(" ");
 return <div className={styles.ambientFloor} aria-hidden="true">
  <svg viewBox="0 0 1180 160" preserveAspectRatio="xMidYMax slice">
   <defs><linearGradient id="pt-floor-fade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d18a26" stopOpacity=".32"/><stop offset="1" stopColor="#c07d22" stopOpacity="0"/></linearGradient><filter id="pt-floor-blur"><feGaussianBlur stdDeviation="8"/></filter></defs>
   {tiles.map((t,i)=><polygon key={i} points={polygon(t.x,t.y,t.r)} fill={t.bright?"#d58a26":"#5d411c"} fillOpacity={t.bright?.24:.10} stroke="#c18a39" strokeOpacity={t.bright?.5:.13} strokeWidth=".8"/>)}
   <ellipse cx="590" cy="53" rx="530" ry="21" fill="url(#pt-floor-fade)" filter="url(#pt-floor-blur)"/>
  </svg>
 </div>;
}
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
 const [lookup,setLookup]=useState("");
 const [showLookup,setShowLookup]=useState(false);
 const [lookupError,setLookupError]=useState("");
 const [lastChecked,setLastChecked]=useState<string|null>(null);
 const [changeNotice,setChangeNotice]=useState<string|null>(null);
 const [question,setQuestion]=useState<string|null>(null);
 const refresh=useCallback(async()=>{
  if(!valid)return;
  try{
   const [txRes,netRes]=await Promise.all([fetch("/api/btc/tx/"+txid,{cache:"no-store"}),fetch("/api/network",{cache:"no-store"})]);
   const tx=await txRes.json();
   if(!txRes.ok)throw new Error(tx?.error??"Unable to check this transaction right now.");
   setResult(previous=>{if(previous){const wasConfirmed=Boolean(previous.status?.confirmed??previous.tx?.status?.confirmed);const nowConfirmed=Boolean(tx.status?.confirmed??tx.tx?.status?.confirmed);if(!wasConfirmed&&nowConfirmed)setChangeNotice("New update: your transaction has received its first confirmation.");}return tx as BtcMvpResult;});
   setLastChecked(new Date().toLocaleTimeString());
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
 const feeAssessment=!observed?"Cannot assess yet":confirmed?"Already confirmed":feeRate==null||networkFee==null?"Not enough fee data":feeRate>=networkFee?"At or above the 30-minute fee guide":"Below the 30-minute fee guide";
 const blockTime=tx?.status?.block_time??result?.status?.block_time;
 const explanation=[
 {title:"Where is my Bitcoin right now?",body:!observed?"We cannot currently see this transaction on the Bitcoin network. Verify that your wallet or exchange broadcast it.":confirmed?"Miners added it to block #"+number(blockHeight)+". It now has "+number(confirmations)+" confirmation(s).":"It has been broadcast and is waiting in Bitcoin's mempool, where unconfirmed payments wait to be selected by miners."},
 {title:"Is my transaction fee high enough?",body:feeRate==null?"We do not have a fee rate to compare.":"Your transaction offers "+rate(feeRate)+" and pays "+(tx?.fee==null?"an unavailable total fee":number(tx.fee)+" sats total")+". "+(networkFee==null?"The current network recommendation is unavailable.":feeRate>=networkFee?"That meets or exceeds the current roughly 30-minute fee guide of "+rate(networkFee)+".":"That is below the current roughly 30-minute fee guide of "+rate(networkFee)+", so other payments may get priority.")+" These are live comparisons, not guarantees."},
 {title:"When will it confirm?",body:confirmed?"It has confirmed. Some wallets and exchanges require additional confirmations before showing funds as available.":!observed?"There is no reliable estimate until the transaction appears on the network.":selectedPosition?"Its fee rate overlaps projected block "+selectedPosition+". At roughly 10 minutes per block, "+selectedPosition*10+" minutes is only a rough illustration, not a verified queue position or promise.":"Its fee rate does not clearly match the displayed projected blocks. We cannot offer a reliable countdown."},
 {title:"What do the inputs and outputs mean?",body:"This transaction uses "+number(inputs.length)+" earlier Bitcoin output(s) and creates "+number(outputs.length)+" new output(s). "+(outputTotal==null?"":"The new outputs total "+btc(outputTotal)+". ")+(outputs.length>=5?"This could be a batch payment, such as an exchange sending to several wallets. ":"One of the outputs may be change sent back to the sender. ")+"Addresses do not reveal who owns the wallets."},
 {title:"What should I do next?",body:confirmed?"No fee action is needed. If an exchange still shows pending, check its required confirmation count.":!observed?"Check the transaction ID and broadcast status in the sending wallet or exchange. Never share your seed phrase.":rbf?"This transaction signals RBF (replace-by-fee). If you control the sending wallet and it supports fee bumping, you may be able to replace it with a higher-fee version.":"It does not signal opt-in RBF. Some wallets support CPFP (child-pays-for-parent), where spending an output with a higher fee may help. Check your wallet before taking action."}
 ];
 const summary=!observed
  ?"We can't currently find this transaction on the Bitcoin network. Double-check the transaction ID and ask the sending wallet or exchange whether it has been broadcast. This does not necessarily mean your Bitcoin is lost."
  :confirmed
  ?"Your transaction has been included in a Bitcoin block and now has "+number(confirmations)+" confirmation"+(confirmations===1?"":"s")+". The Bitcoin network has recorded it, so you do not need to take any fee-related action. If you are waiting for a deposit, your exchange or wallet may require additional confirmations before making the funds available."
  :selectedPosition
  ?"Your transaction has reached the Bitcoin network and is waiting to be included in a block. Based on its fee and current network activity, it may confirm in around "+selectedPosition*10+" minutes, but this is an estimate and can change. "+(networkFee!=null&&feeRate!=null&&feeRate<networkFee?"Your fee is below the current network guide, so it may take longer; you can wait or check whether your sending wallet offers a fee increase.":"You usually don't need to do anything right now—just wait for confirmation.")
  :"Your transaction has reached the Bitcoin network and is waiting to be included in a block. Current network data does not provide a dependable confirmation time, and the wait may change as new transactions arrive. You can usually wait; if it takes unusually long, check your sending wallet's fee adjustment options.";
 const feeHint=!observed?"Fee information unavailable":confirmed?"Already confirmed":feeRate==null||networkFee==null?"Network comparison unavailable":feeRate>=networkFee?"Competitive at current rates":"Below the current network guide";
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
 return <main className={"pt-tx-page "+styles.page}>

  <div className={styles.shell}>
   <EdgeLights/><EdgeLights right/>
   <a className={styles.back} href="/bitcoin">← &nbsp; Bitcoin Explorer</a>
   {error&&<p role="alert" className={styles.error}>{error}{result?" Showing the last available data.":""}</p>}
   {loading&&!result&&<p className={styles.loading}>Checking the Bitcoin network…</p>}
   {result&&<>
    <header className={styles.hero}>
     <div className={styles.coin} aria-hidden="true">₿</div>
     <div className={styles.heroText}>
      <div className={styles.eyebrow}>YOUR BITCOIN TRANSACTION</div>
      <h1>{!observed?"Transaction not found":confirmed?"Your transaction is confirmed":<>Waiting for <span>confirmation</span></>}</h1>
      <p>{!observed?"We couldn't locate this transaction on the Bitcoin network. Check its ID and confirm the sender has broadcast it.":confirmed?"Your transaction has been recorded in Bitcoin block #"+number(blockHeight)+". Your wallet or exchange may require more confirmations before crediting it.":selectedPosition?"Your transaction has reached the Bitcoin network and is waiting to be included in a block. Based on current activity, it may confirm in about "+selectedPosition*10+" minutes.":"Your transaction is on the Bitcoin network and is waiting for confirmation. A reliable estimated confirmation time is not available yet."}</p>
     </div>
     <div className={confirmed?styles.confirmedPill:styles.pendingPill}><i/>{confirmed?"Confirmed":observed?"Pending":"Not found"}</div>
    </header>
    <section className={styles.network} aria-label="Your transaction's projected position in the live Bitcoin network">
     <AmbientHoneycomb/><div className={styles.blockRow}>
      <div className={styles.blockUnit}>
       <div className={styles.confirmedHex}><HexArtwork confirmed/><div className={styles.check}>✓</div><b>CONFIRMED</b><strong>#{number(overview?.btc?.height)}</strong><small>{number(blocks[0]?.transactionCount)} transactions</small><small>Latest confirmed block</small></div>
       <div className={styles.confirmedCaption}>Latest block<br/><span>Just confirmed</span></div>
      </div>
      {Array.from({length:4},(_,i)=>{const block=blocks[i];const isMatch=!confirmed&&observed&&selectedPosition===i+1;return <div className={styles.blockUnit} key={i}>
       <div className={isMatch?styles.selectedHex:styles.pendingHex}>
        <HexArtwork active={isMatch}/><Honeycomb/>
        <div className={styles.hexContent}>
         {i===0&&<b>NEXT</b>}
         <strong>#{overview?.btc?.height!=null?number(overview.btc.height+i+1):"—"}</strong>
         <em>~{(i+1)*10} min</em>
         <small>{block?.feeRange?.length===2?number(block.feeRange[0])+"–"+number(block.feeRange[1])+" sat/vB":block?.feeRange?.length===1?number(block.feeRange[0])+" sat/vB":"Fee range unavailable"}</small>
        </div>
       </div>
       {isMatch?<div className={styles.matchLabel}><span>YOUR TRANSACTION</span><small>May confirm here</small></div>:<div className={styles.blankLabel}/>}
      </div>})}
     </div>
     <p className={styles.projectionNote}>{confirmed?"Your transaction is already confirmed. The gold blocks show upcoming network projections.":observed?"Your highlighted block is a fee-based estimate, not a guaranteed place in line. Bitcoin block times vary.":"The blocks show network estimates; we haven't located your transaction yet."}</p>
    </section>
    <section className={styles.summary} aria-label="Where is my Bitcoin? Transaction summary">
     <div className={styles.summaryIntro}>
      <div><span className={styles.summaryEyebrow}>YOUR TRANSACTION AT A GLANCE</span><h2>Where is my Bitcoin?</h2>
      <p>{confirmed?"Your transaction has been included in a Bitcoin block. It is confirmed on the network, although your wallet or exchange may wait for additional confirmations.":observed?"Your transaction has reached the Bitcoin network and is waiting to be included in a block. "+(selectedPosition?"Based on current network activity, it may confirm in around "+selectedPosition*10+" minutes. This is an estimate, not a guarantee.":"We cannot reliably estimate when it will confirm yet."):"We could not find this transaction on the Bitcoin network. Check the transaction ID or ask the sender whether it was broadcast."}</p></div>
      <span className={styles.summaryStatus+(confirmed?" "+styles.summaryStatusConfirmed:"")}>{confirmed?"● Confirmed":observed?"● Pending":"● Not found"}</span>
     </div>
     <div className={styles.summaryGrid}>
      <div className={styles.fact}><div className={styles.factLabel}>ESTIMATED WAIT</div><div className={styles.factValue}><span className={styles.factIcon}>◷</span><strong>{confirmed?"Confirmed":selectedPosition?"~"+selectedPosition*10+" min":"Unavailable"}</strong></div><p>{confirmed?"Already recorded in a block.":"An estimate based on live network activity."}</p></div>
      <div className={styles.fact}><div className={styles.factLabel}>CONFIRMATIONS</div><div className={styles.factValue}><span className={styles.factIcon}>✓</span><strong>{confirmed?number(confirmations):"0"}</strong></div><p>{confirmed?"Each new block adds another confirmation.":"Waiting for its first Bitcoin block."}</p></div>
      <div className={styles.fact}><div className={styles.factLabel}>NETWORK FEE</div><div className={styles.factValue}><span className={styles.factIcon}>≋</span><strong>{tx?.fee==null?"—":number(tx.fee)+" sats"}</strong></div><p>The fee paid to process this transaction.</p></div>
     </div>
     <div className={styles.summaryAction}>
      <span className={styles.summaryActionIcon}>{!observed?"!":networkFee!=null&&feeRate!=null&&feeRate<networkFee&&!confirmed?"!":"✓"}</span>
      <div><span className={styles.summaryActionLabel}>DO I NEED TO DO ANYTHING?</span><strong>{!observed?"Check the transaction ID":confirmed?"No action needed":networkFee!=null&&feeRate!=null&&feeRate<networkFee?"Your fee may be low":"No action needed right now"}</strong><p>{!observed?"Confirm the ID and ask the sender if the transaction was broadcast.":confirmed?"Your transaction is confirmed. The recipient may still require more confirmations.":networkFee!=null&&feeRate!=null&&feeRate<networkFee?"Your fee is below the current network guide. The sender may have options to increase it.":"Your fee appears competitive based on current network conditions."}</p></div>
     </div>
     <div className={styles.summaryFooter}><div>Transaction ID <code title={txid}>{short(txid)}</code> <button type="button" onClick={copy}>{copied?"✓ Copied":"▢ Copy"}</button></div><a href={"https://mempool.space/tx/"+encodeURIComponent(txid)} target="_blank" rel="noopener noreferrer">View on Mempool.space ↗</a></div>
    </section>
   <section className="pt-tx-clarity" aria-labelledby="btc-clarity-title">
    <div className="pt-eyebrow">THE SAME BLOCKCHAIN. A CLEARER PICTURE.</div>
    <h2 id="btc-clarity-title">Your Bitcoin transaction, in plain English</h2>
    <div className="pt-tx-clarity-hash"><div><span>TRANSACTION ID (TXID)</span><code title={txid}>{txid}</code></div><button type="button" onClick={copy}> {copied?"✓ Copied":"Copy hash"}</button></div>
    <p className="pt-tx-details-intro">Every number below comes from this transaction or the latest available network data. Here's what it actually means for you.</p>
    <div className="pt-tx-clarity-head"><span>YOUR ACTUAL DATA</span><span>WHAT IT MEANS FOR YOU</span></div>
    <div className="pt-tx-clarity-rows">
     <div className="pt-tx-clarity-row"><div><span>Transaction status</span><strong>{confirmed?"Confirmed":observed?"Pending":"Not found"}</strong></div><p>{confirmed?"Your transaction is permanently recorded in a Bitcoin block. The receiving service may still require more confirmations before crediting funds.":observed?"The network has seen your transaction, but a miner has not yet included it in a block. Your funds are not necessarily lost.":"We cannot currently find this transaction on the network. Check that the sender broadcast it and that the ID is correct."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Confirmation progress</span><strong>{confirmed?number(confirmations)+" confirmation"+(confirmations===1?"":"s"):"0 confirmations"}</strong></div><p>{confirmed?"Each additional block adds another confirmation. Your exchange or wallet decides how many confirmations it requires.":"Zero confirmations means the transaction has not yet been included in a block. It does not, by itself, mean the payment failed."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Transaction fee rate</span><strong>{rate(feeRate)}</strong></div><p>{feeRate==null?"The fee rate is not available, so we cannot assess its priority.":networkFee==null?"This is the fee offered per virtual byte. Miners often prioritize higher-paying transactions, but there is no guaranteed order.":feeRate>=networkFee?"Your fee meets or exceeds the current approximately 30-minute network fee guide. This is encouraging, not a guarantee.":"Your fee is below the current approximately 30-minute network fee guide. Higher-fee transactions may be selected first."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Is my fee competitive?</span><strong>{feeAssessment}</strong></div><p>{!observed?"The transaction must be visible before we can assess its fee.":confirmed?"Your transaction is already confirmed, so fee priority no longer affects it.":feeRate==null||networkFee==null?"Current network fee comparison is unavailable; we cannot judge whether your fee is competitive.":feeRate>=networkFee?"Your fee is at least as high as the current roughly 30-minute recommendation for new transactions. This is a helpful comparison, not a guarantee; parent transactions can affect effective priority.":"Your fee is below the current roughly 30-minute recommendation. This can increase the wait, especially during busy periods. Parent transactions can also affect effective priority."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Estimated confirmation</span><strong>{feeEstimate}</strong></div><p>{confirmed?"The transaction has already confirmed; no additional mining wait is needed.":selectedPosition?"This estimate is based on a fee-range match to projected block "+selectedPosition+". It is not your verified position in line, and the mempool can change.":"There is not enough reliable information to give you a countdown. Bitcoin blocks average around ten minutes, but individual waits vary."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Total network fee</span><strong>{tx?.fee==null?"Unavailable":number(tx.fee)+" sats"}</strong></div><p>This is the fee paid to Bitcoin miners, not the amount the recipient receives. Wallet or exchange withdrawal fees may be separate.</p></div>
     <div className="pt-tx-clarity-row"><div><span>Transaction outputs</span><strong>{number(outputs.length)} output{outputs.length===1?"":"s"}</strong></div><p>Outputs are the new destinations created by this transaction. Some may be payments, and others may be change returned to the sender. The blockchain alone cannot identify the owner of an address.</p></div>
     <div className="pt-tx-clarity-row"><div><span>Fee adjustment option</span><strong>{!observed?"Unknown":rbf?"RBF signaled":"RBF not signaled"}</strong></div><p>{!observed?"We need a visible transaction before evaluating fee-replacement options.":rbf?"The transaction signals replace-by-fee. If you control the sending wallet, it may offer a way to increase the fee.":"The transaction does not signal opt-in replace-by-fee. Some wallets may support other methods such as CPFP, but do not send a second payment just to try to speed it up."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>What should I do next?</span><strong>{confirmed?"Check recipient status":observed?"Usually, wait":"Check broadcast"}</strong></div><p>{confirmed?"Your transaction is confirmed. If a service still says pending, check its required confirmations and deposit processing.":!observed?"Verify the transaction ID and ask the sender whether it was broadcast. Never share private keys or recovery phrases.":rbf?"You can wait. If it is urgent and you control the sending wallet, check its fee-bump option. Avoid duplicate payments.":"You can wait. If delayed unusually long, check the sending wallet's acceleration options. Avoid duplicate payments."}</p></div>
     <div className="pt-tx-clarity-row"><div><span>Bitcoin moved</span><strong>{btc(outputTotal)}</strong></div><p>This is the combined value of all outputs, not necessarily the amount received by one person. A payment may also return change to the sender. See the addresses and amounts below.</p></div>
     <div className="pt-tx-clarity-row"><div><span>Receiving your funds</span><strong>{confirmed?"On-chain confirmed":observed?"Awaiting confirmation":"Not yet visible"}</strong></div><p>{confirmed?"The Bitcoin network has recorded the transaction. An exchange or wallet may require more confirmations or additional internal processing.":observed?"The transaction is visible but not yet in a block. Some recipients will show a pending deposit until enough confirmations arrive.":"Check with the sender to confirm that the transaction was broadcast. A block explorer cannot access an exchange’s internal payment status."}</p></div>
    </div>
    <p className="pt-tx-clarity-note">Pending Tracker shows what the public Bitcoin network can verify. It cannot see whether an exchange has completed its own internal deposit or withdrawal processing.</p>
   </section>
   <div className="pt-tx-summary-actions"><button type="button" onClick={explain} disabled={aiLoading}>{aiLoading?"Explaining…":"✦ Explain further"}</button><a href={"https://mempool.space/tx/"+txid} target="_blank" rel="noopener noreferrer">Verify on mempool.space ↗</a></div>{aiSummary&&<p className="pt-tx-ai" role="status">{aiSummary}</p>}
   <section className="pt-tx-questions" aria-label="Common questions about this transaction"><h2>Still have a question?</h2><p>Quick answers based on the transaction you're viewing.</p><div className="pt-tx-question-buttons">{["Why is it taking so long?","Can I speed it up?","Why hasn't my exchange credited me?","Is my Bitcoin safe?"].map(q=><button type="button" key={q} aria-pressed={question===q} onClick={()=>setQuestion(question===q?null:q)}>{q}</button>)}</div>{question&&<div className="pt-tx-question-answer" role="status"><strong>{question}</strong><p>{question==="Why is it taking so long?"?explanation[2].body:question==="Can I speed it up?"?explanation[4].body:question==="Why hasn't my exchange credited me?"?(confirmed?"Your transaction is confirmed on-chain. The exchange may require more confirmations or additional internal processing. Contact the exchange with your transaction ID if it remains missing.":"Your transaction is not yet confirmed. Many exchanges wait for confirmations before crediting a deposit. Their internal processing is not visible on the blockchain."):confirmed?"Your transaction is confirmed on Bitcoin. Confirmations make reversal increasingly difficult, but the explorer cannot verify who controls the receiving address.":observed?"The network has seen this unconfirmed transaction. Unconfirmed transactions can still be replaced or dropped, so wait for confirmations before treating the payment as final.":"We cannot currently locate the transaction. Verify its ID and broadcast status with the sending wallet or exchange."}</p></div>}</section>
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
  </div>
  <p className="pt-tx-footnote">Live data refreshes every 15 seconds · No wallet connection needed · Fee estimates are not guarantees.</p>
 </main>;
}
