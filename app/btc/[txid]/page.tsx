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
 useEffect(()=>{refresh();const id=setInterval(refresh,1000);return()=>clearInterval(id);},[refresh]);
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
    <section className={styles.summary} aria-label="Bitcoin transaction status and confirmation details">
     <div className={styles.summarySectionHeading}><span className={styles.summarySectionNumber}>1</span><h2>WHERE IS MY TRANSACTION?</h2></div>
     <div className={styles.summaryGrid}>
      <div className={styles.fact}>
       <div className={styles.factTop}><span className={styles.factIcon}>⌛</span><div><div className={styles.factLabel}>STATUS</div><div className={styles.factValue}><strong>{confirmed?"Confirmed":observed?"Pending":"Not found"}</strong></div></div></div>
       <p>{confirmed?"Your transaction has been included in a Bitcoin block.":observed?"Your transaction has been seen on the Bitcoin network but is not yet included in a block.":"We could not find this transaction on the network. Check its ID."}</p>
      </div>
      <div className={styles.fact}>
       <div className={styles.factTop}><span className={styles.factIcon+" "+styles.factIconTeal}>✓</span><div><div className={styles.factLabel}>CONFIRMATIONS</div><div className={styles.factValue}><strong>{confirmed?number(confirmations):"0"} / 6</strong></div></div></div>
       <p>{confirmed?"Each new block adds another confirmation. Some recipients may require six.":"Zero confirmations means it has not yet been included in a block. Each new block adds a confirmation."}</p>
      </div>
      <div className={styles.fact}>
       <div className={styles.factTop}><span className={styles.factIcon}>◷</span><div><div className={styles.factLabel}>ESTIMATED CONFIRMATION</div><div className={styles.factValue}><strong>{confirmed?"Confirmed":selectedPosition?"~"+selectedPosition*10+" minutes":"Unavailable"}</strong></div></div></div>
       <p>{confirmed?"Already recorded on the blockchain.":selectedPosition?"Based on current network activity. This is an estimate, not a guarantee.":"There is not enough information for a reliable estimate."}</p>
      </div>
      <div className={styles.fact}>
       <div className={styles.factTop}><span className={styles.factIcon}>≋</span><div><div className={styles.factLabel}>FEE RATE</div><div className={styles.factValue}><strong>{rate(feeRate)}</strong></div></div></div>
       <p>{feeRate==null?"Fee-rate data is unavailable.":"This is your fee per unit of transaction size. Higher fees typically confirm faster."}</p>
      </div>
      <div className={styles.fact}>
       <div className={styles.factTop}><span className={styles.factIcon}>▥</span><div><div className={styles.factLabel}>COMPETITIVENESS</div><div className={styles.factValue}><strong>{!observed?"Unknown":confirmed?"Confirmed":networkFee==null||feeRate==null?"Unavailable":feeRate>=networkFee?"At or above":"Below"}{observed&&!confirmed&&networkFee!=null&&feeRate!=null?<small>{feeRate>=networkFee?"network fee guide":"network fee guide"}</small>:null}</strong></div></div></div>
       <p>{!observed?"We need to find the transaction before comparing its fee.":confirmed?"The transaction has already confirmed.":networkFee==null||feeRate==null?"A current network fee comparison is unavailable.":feeRate>=networkFee?"Your fee meets or exceeds the current network fee guide for new transactions.":"Your fee is below the current network guide and may take longer to confirm."}</p>
      </div>
     </div>
     <div className={styles.summaryFooter}><div>Transaction ID <code title={txid}>{short(txid)}</code> <button type="button" onClick={copy}>{copied?"✓ Copied":"▢ Copy"}</button></div><a href={"https://mempool.space/tx/"+encodeURIComponent(txid)} target="_blank" rel="noopener noreferrer">View on Mempool.space ↗</a></div>
    </section>
   <section className={styles["pt-story"]}>
    <div className={styles["pt-story-eyebrow"]}>THE SAME BLOCKCHAIN. A CLEARER PICTURE.</div>
    <h2>Your Bitcoin transaction, <em>in plain English.</em></h2>
    <p className={styles["pt-story-sub"]}>Real blockchain data. Clear explanations.</p>
    <div className={styles["pt-story-intro"]}>
     <div className={styles["pt-story-introicon"]} aria-hidden="true">✦</div>
     <div><h3>Your transaction, explained</h3>
      <p>{!observed?"We cannot currently find this transaction on the public Bitcoin network. This does not by itself mean your Bitcoin is lost. Check the transaction ID and ask the sending wallet or exchange whether it was broadcast.":confirmed?"Good news: this transaction has been included in Bitcoin block #"+number(blockHeight)+" and now has "+confirmations+" confirmation"+(confirmations===1?"":"s")+". The Bitcoin network has recorded it. If your wallet or exchange still shows pending, it may be waiting for additional confirmations or its own processing.":"Your transaction has been seen on the Bitcoin network and is waiting for a miner to include it in a block. This is a normal part of sending Bitcoin. "+(selectedPosition?"Based on the current fee ranges, it may be included in approximately "+selectedPosition*10+" minutes, although that estimate can change.":"We cannot give a dependable confirmation time from the current network data.")}</p>
      {observed&&<p>{inputTotal!=null&&outputTotal!=null?"The transaction spends "+btc(inputTotal)+" from "+inputs.length+" earlier Bitcoin output"+(inputs.length===1?"":"s")+" and creates "+outputs.length+" new output"+(outputs.length===1?"":"s")+" totaling "+btc(outputTotal)+".":"The transaction uses "+inputs.length+" input"+(inputs.length===1?"":"s")+" and creates "+outputs.length+" new output"+(outputs.length===1?"":"s")+"."} {tx?.fee!=null?"The difference includes a Bitcoin network fee of "+number(tx.fee)+" sats paid to miners.":""} Some outputs may be payments while others may return change to the sender; public blockchain data cannot reliably identify their owners.</p>}
      <p className={styles["pt-story-takeaway"]}>{!observed?"What to do: verify the ID and broadcast status with the sender. Never share your recovery phrase.":confirmed?"What to do: no fee action is needed. If the recipient has not credited the deposit, check its confirmation requirements.":rbf?"What to do: you can usually wait. If the payment is urgent and you control the sending wallet, check whether it supports increasing the fee. Avoid sending a duplicate payment.":"What to do: you can usually wait. If it is delayed, ask your sending wallet about available acceleration options; avoid sending a duplicate payment."}</p>
     </div>
    </div>
    <div className={styles["pt-story-data"]}><h3>UNDERSTANDING YOUR TRANSACTION</h3>
     {[
      ["Network fee",tx?.fee==null?"Unavailable":number(tx.fee)+" sats","The amount this transaction pays to Bitcoin miners. It is not an exchange withdrawal fee, which may be charged separately."],
      ["Fee rate",rate(feeRate),"The fee paid per virtual byte of transaction data. Miners often prioritize transactions paying higher rates, but the rate alone cannot guarantee a confirmation time."],
      ["Total Bitcoin in outputs",btc(outputTotal),"The combined value of all new outputs. This is not necessarily what one person receives, because an output may return change to the sender."],
      ["Transaction size",tx?.size==null?"Unavailable":number(tx.size)+" bytes","How much raw data this transaction occupies. Its fee-paying virtual size may be different, because Bitcoin discounts some witness data."]
     ].map(([label,value,help])=><div className={styles["pt-story-row"]} key={label}><div><small>{label}</small><strong>{value}</strong></div><div><b>What this means</b><p>{help}</p></div></div>)}
    </div>
    <details className={styles["pt-story-advanced"]}><summary><b>Explore additional blockchain data</b><span>Inputs and outputs, virtual size, weight, version, locktime, fee replacement, transaction ID and raw data — each explained. ↓</span></summary>
     {[
      ["Inputs & outputs",inputs.length+" inputs · "+outputs.length+" outputs","Inputs spend earlier Bitcoin outputs and new outputs may represent payments or change. The complete addresses and amounts are shown below."],
      ["Virtual size",tx?.vsize!=null?number(tx.vsize)+" vB":tx?.weight==null?"Unavailable":number(Math.ceil(tx.weight/4))+" vB","The fee-paying size of this transaction, calculated from its weight. The fee rate uses virtual bytes, not raw bytes."],
      ["Weight",tx?.weight==null?"Unavailable":number(tx.weight)+" WU","Bitcoin's measure of the transaction's use of block capacity."],
      ["Version",String(tx?.version??"Unavailable"),"The version field used by Bitcoin's transaction validation rules."],
      ["Locktime",String(tx?.locktime??"Unavailable"),"A value that can restrict when a transaction becomes eligible for inclusion, depending on input sequence settings. Zero means no locktime restriction."],
      ["Fee replacement",!observed?"Unknown":rbf?"RBF signaled":"Opt-in RBF not signaled","A transaction signaling replace-by-fee may be eligible for a higher-fee replacement from the sending wallet. Wallet and miner policies vary."],
      ["Transaction ID",txid,"The unique transaction identifier used to look up and verify this payment on Bitcoin."]
     ].map(([label,value,help])=><div className={styles["pt-story-row"]} key={label}><div><small>{label}</small><strong className={styles["pt-story-wrap"]}>{value}</strong></div><div><b>What this means</b><p>{help}</p></div></div>)}
     <details className={styles["pt-story-raw"]}><summary>View raw blockchain data</summary><pre>{JSON.stringify(result,null,2)}</pre></details>
    </details>
    <section className={styles["pt-story-flow"]} aria-label="Bitcoin transaction inputs and outputs">
     <h3>WHERE DID THE BITCOIN GO?</h3>
     <p className={styles["pt-story-flowlead"]}>Follow the Bitcoin from earlier outputs into the new outputs created by this transaction. These are blockchain movements, not verified identities of senders or recipients.</p>
     <div className={styles["pt-story-flowgrid"]}>
      <div className={styles["pt-story-flowendpoint"]}><small>FROM · {inputs.length} INPUT{inputs.length===1?"":"S"}</small><strong>{btc(inputTotal)}</strong><small>Earlier Bitcoin outputs spent</small></div>
      <div className={styles["pt-story-path"]} aria-hidden="true"><span className={styles["pt-story-linegold"]}/><div className={styles["pt-story-coin"]}>₿</div><span className={styles["pt-story-lineteal"]}/></div>
      <div className={styles["pt-story-flowendpoint"]}><small>TO · {outputs.length} OUTPUT{outputs.length===1?"":"S"}</small><strong>{btc(outputTotal)}</strong><small>New Bitcoin outputs created</small></div>
     </div>
     <div className={styles["pt-story-flowfooter"]}><span>Network fee: <b>{tx?.fee==null?"Unavailable":number(tx.fee)+" sats"}</b></span><span>Outputs can include payments and change returned to the sender.</span></div>
     <div className={styles["pt-story-addressgrid"]}>
      <div><h4>Inputs <span>({inputs.length})</span></h4><p className={styles["pt-story-addresshelp"]}>Where the Bitcoin came from</p>{inputs.slice(0,8).map((x,i)=><div className={styles["pt-story-addressrow"]} key={i}><span>Input {i+1}{x.prevout?.scriptpubkey_address?<a href={"/btc/address/"+x.prevout.scriptpubkey_address} title={x.prevout.scriptpubkey_address}>{short(x.prevout.scriptpubkey_address)} ↗</a>:<small>{short(x.txid??"Source unavailable")}</small>}</span><strong>{btc(x.prevout?.value)}</strong></div>)}{inputs.length>8&&<details className={styles["pt-story-showall"]}><summary>Show all {inputs.length} inputs ↓</summary>{inputs.slice(8).map((x,i)=><div className={styles["pt-story-addressrow"]} key={i+8}><span>Input {i+9}{x.prevout?.scriptpubkey_address?<a href={"/btc/address/"+x.prevout.scriptpubkey_address}>{short(x.prevout.scriptpubkey_address)} ↗</a>:<small>{short(x.txid??"Source unavailable")}</small>}</span><strong>{btc(x.prevout?.value)}</strong></div>)}</details>}{inputs.length===0&&<p>Input details unavailable.</p>}</div>
      <div><h4>Outputs <span>({outputs.length})</span></h4><p className={styles["pt-story-addresshelp"]}>Where the Bitcoin was directed</p>{outputs.slice(0,8).map((x,i)=><div className={styles["pt-story-addressrow"]} key={i}><span>Output {i+1}{x.scriptpubkey_address?<a href={"/btc/address/"+x.scriptpubkey_address} title={x.scriptpubkey_address}>{short(x.scriptpubkey_address)} ↗</a>:<small>Non-address output</small>}</span><strong>{btc(x.value)}</strong></div>)}{outputs.length>8&&<details className={styles["pt-story-showall"]}><summary>Show all {outputs.length} outputs ↓</summary>{outputs.slice(8).map((x,i)=><div className={styles["pt-story-addressrow"]} key={i+8}><span>Output {i+9}{x.scriptpubkey_address?<a href={"/btc/address/"+x.scriptpubkey_address}>{short(x.scriptpubkey_address)} ↗</a>:<small>Non-address output</small>}</span><strong>{btc(x.value)}</strong></div>)}</details>}{outputs.length===0&&<p>Output details unavailable.</p>}</div>
     </div>
    </section>
    <p className={styles["pt-story-source"]}>Live Bitcoin blockchain data · <a href={"https://mempool.space/tx/"+txid} target="_blank" rel="noopener noreferrer">Verify on Mempool.space ↗</a></p>
   </section>
  </>}
  </div>
  <p className="pt-tx-footnote">Live data checks for updates every second · No wallet connection needed · Fee estimates are not guarantees.</p>
 </main>;
}
