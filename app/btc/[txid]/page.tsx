"use client";
import {Honeycomb} from "../../components/ChainDashboard";
import HexArtwork from "../../components/SharedHexArtwork";
import styles from "./BitcoinTracker.module.css";
import "./transaction-refresh.css";
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
 const [understandingExpanded,setUnderstandingExpanded]=useState(false);
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

 if(!valid)return <main className="pt-tx-page"><a href="/bitcoin">← Bitcoin Explorer</a><h1>Enter a valid Bitcoin transaction ID</h1><p>A Bitcoin transaction ID contains 64 hexadecimal characters.</p></main>;
 const keyDetails=[
  {icon:"≋",title:"Fee Rate",value:rate(feeRate),help:feeRate==null?"Fee data is unavailable.":confirmed?"The fee rate paid for this confirmed transaction.":feeHint+". This affects how transactions compete for block space."},
  {icon:"◷",title:"Transaction Size",value:tx?.vsize!=null?number(tx.vsize)+" vB":tx?.weight!=null?number(Math.ceil(tx.weight/4))+" vB":"—",help:"The virtual size used to calculate transaction fees."},
  {icon:"⬡",title:confirmed?"Confirmations":"Estimated Wait",value:confirmed?number(confirmations):feeEstimate,help:confirmed?"Each additional block adds a confirmation.":"A fee-based estimate, not a guaranteed time."},
  {icon:"▤",title:"Status",value:confirmed?"Confirmed":observed?"Pending":"Not found",help:confirmed?"Included in a Bitcoin block.":observed?"Waiting for a miner to include it in a block.":"Check whether the transaction was broadcast."},
  ...(understandingExpanded?[
   {icon:"₿",title:"Network Fee",value:tx?.fee==null?"—":number(tx.fee)+" sats",help:"The amount paid to miners, separate from an exchange withdrawal fee."},
   {icon:"⇄",title:"Inputs & Outputs",value:inputs.length+" in · "+outputs.length+" out",help:"Earlier Bitcoin outputs are spent to create new outputs, including possible change."},
   {icon:"◈",title:"Transaction Weight",value:tx?.weight==null?"—":number(tx.weight)+" WU",help:"How much Bitcoin block capacity this transaction consumes."},
   {icon:"↻",title:"Fee Replacement",value:!observed?"Unknown":rbf?"RBF signaled":"Opt-in RBF not signaled",help:"Replace-by-fee signaling may allow supported wallets to increase a pending fee."}
  ]:[])
 ];
 return <main className="pt-tx-page txr">
  <div className="txr-shell">
   <div className="txr-breadcrumb"><a href="/bitcoin">Bitcoin Explorer</a><span>›</span>Transaction</div><header className="txr-page-title"><h1>Bitcoin <em>Transaction</em></h1><div className="txr-id"><code title={txid}>{txid}</code><button type="button" onClick={copy} aria-label="Copy transaction ID">{copied?"✓ Copied":"▢"}</button></div></header>
   {error&&<p className="txr-error" role="alert">{error}{result?" Showing the last available data.":""}</p>}
   {loading&&!result&&<div className="txr-loading">Checking your Bitcoin transaction against the live network…</div>}
   {result&&<>
    <section className="txr-top">
     
     <div className="txr-livehead"><div><h2>{confirmed?"Transaction Confirmed":observed?"Your Transaction Is Pending":"Transaction Not Found"}</h2><p>{confirmed?"Your payment is included in a block. The hexagons show the live Bitcoin network.":observed?"Your transaction is waiting for confirmation. The highlighted hexagon is a fee-based estimate.":"This transaction has not been located. The hexagons show general network activity."}</p></div><span className="txr-live"><i/> Live network data {lastChecked&&<small>Updated {lastChecked}</small>}</span></div>
     <div className="txr-hexrow">
      <div className="txr-hexunit"><div className="txr-hex confirmed"><span>✓</span></div><strong>Latest Block</strong><small>#{number(overview?.btc?.height)}</small><small>Confirmed on network</small></div>
      {Array.from({length:4},(_,i)=>{const b=blocks[i];const active=!confirmed&&observed&&selectedPosition===i+1;return <div className="txr-hexunit" key={i}><div className={"txr-hex"+(active?" active":"")}><span>⬡</span></div><strong>~{(i+1)*10} min</strong><small>{b?.feeRange?.length===2?number(b.feeRange[0])+"–"+number(b.feeRange[1])+" sat/vB":"Fee range unavailable"}</small><small>{number(b?.transactionCount)} waiting txs</small>{active&&<b className="txr-marker">↑ Your transaction</b>}</div>})}
     </div>
     <p className="txr-timeline-note">{confirmed?"Your transaction is already confirmed. The gold hexagons show projected future blocks.":!observed?"Your transaction has not been located on the network yet.":"The highlighted hexagon is a fee-based estimate, not a guaranteed queue position."}</p>
     <div className="txr-overview"><div className="txr-overview-grid">
      {[
       {icon:"₿",label:"Amount in Outputs",value:btc(outputTotal),help:"Total sent to new outputs; may include change."},
       {icon:"≋",label:"Network Fee",value:tx?.fee==null?"—":btc(tx.fee),help:"The fee paid to miners for this transaction."},
       {icon:"◷",label:confirmed?"Confirmations":"Estimated Wait",value:confirmed?number(confirmations):feeEstimate,help:confirmed?"Each new block adds a confirmation.":"Fee-based estimate, not a guarantee."},
       {icon:"⬡",label:confirmed?"Block Height":"Status",value:confirmed?"#"+number(blockHeight):observed?"Pending":"Not found",help:confirmed?"The block that confirmed this transaction.":observed?"Waiting to be included in a block.":"Verify the transaction ID."}
      ].map(x=><div className="txr-overview-item" key={x.label}><span className="txr-metric-icon">{x.icon}</span><div><small>{x.label}</small><strong>{x.value}</strong><p>{x.help}</p></div></div>)}
     </div></div>
    </section>
    <section className="txr-summary"><div className="txr-summary-copy"><div><span className="txr-summary-eyebrow">YOUR TRANSACTION</span><h2>{confirmed?<>This transaction has been <em>confirmed.</em></>:observed?<>Your transaction is <em>waiting for confirmation.</em></>:<>This transaction <em>was not found.</em></>}</h2><p>{summary}</p><p className="txr-next">{confirmed?"Next step: if your deposit still shows pending, check your wallet or exchange's required confirmations.":!observed?"Next step: verify the transaction ID and whether the sender broadcast it.":rbf?"Next step: you can wait, or check whether your sending wallet supports increasing the fee.":"Next step: you can usually wait; contact your sending wallet if it remains delayed."}</p></div></div><div className="txr-summary-status"><span className={confirmed?"is-confirmed":""}>{confirmed?"✓":observed?"◷":"?"}</span><strong>{confirmed?"Confirmed":observed?"Pending":"Not found"}</strong><small>{confirmed?"Recorded in block #"+number(blockHeight):observed?"Waiting for confirmation":"Check broadcast status"}</small></div></section>
    <section className="txr-details"><div className="txr-sectionhead"><div><h2>Key Transaction Details</h2><p>Four useful details, explained in plain English.</p></div><button type="button" className="txr-more" aria-expanded={understandingExpanded} onClick={()=>setUnderstandingExpanded(v=>!v)}>{understandingExpanded?"Show Fewer Details":"Show 4 More Details"} <span aria-hidden="true">{understandingExpanded?"⌃":"⌄"}</span></button></div>
     <div className="txr-cards">{keyDetails.map(x=><article className="txr-card" key={x.title}><div className="txr-card-icon">{x.icon}</div><h3>{x.title}</h3><strong>{x.value}</strong><p>{x.help}</p></article>)}</div>
     {understandingExpanded&&<details className="txr-technical"><summary>View technical transaction details and raw data</summary><div><span>Transaction ID</span><code>{txid}</code></div><div><span>Version</span><strong>{String(tx?.version??"Unavailable")}</strong></div><div><span>Locktime</span><strong>{String(tx?.locktime??"Unavailable")}</strong></div><details><summary>Raw blockchain data</summary><pre>{JSON.stringify(result,null,2)}</pre></details></details>}
    </section>
    <section className="txr-io"><div className="txr-sectionhead"><div><h2>Inputs &amp; Outputs</h2><p>Where the Bitcoin came from and where the new outputs go. Addresses do not identify their owners.</p></div></div><div className="txr-io-grid">
     <div className="txr-io-panel"><div className="txr-io-heading"><h3>Inputs <span>({inputs.length})</span></h3><strong>{btc(inputTotal)}</strong></div><p>Earlier Bitcoin outputs used in this transaction</p>{inputs.slice(0,8).map((x,i)=><div className="txr-io-row" key={i}><span><small>INPUT {i+1}</small>{x.prevout?.scriptpubkey_address?<a href={"/btc/address/"+x.prevout.scriptpubkey_address}>{short(x.prevout.scriptpubkey_address)} ↗</a>:<span>{short(x.txid??"Source unavailable")}</span>}</span><strong>{btc(x.prevout?.value)}</strong></div>)}{inputs.length>8&&<details className="txr-extra"><summary>Show all {inputs.length} inputs</summary>{inputs.slice(8).map((x,i)=><div className="txr-io-row" key={i+8}><span>{x.prevout?.scriptpubkey_address?<a href={"/btc/address/"+x.prevout.scriptpubkey_address}>{short(x.prevout.scriptpubkey_address)} ↗</a>:"Source unavailable"}</span><strong>{btc(x.prevout?.value)}</strong></div>)}</details>}{inputs.length===0&&<p>Input data unavailable.</p>}</div>
     <div className="txr-io-panel"><div className="txr-io-heading"><h3>Outputs <span>({outputs.length})</span></h3><strong>{btc(outputTotal)}</strong></div><p>New Bitcoin outputs, including possible change</p>{outputs.slice(0,8).map((x,i)=><div className="txr-io-row" key={i}><span><small>OUTPUT {i+1}</small>{x.scriptpubkey_address?<a href={"/btc/address/"+x.scriptpubkey_address}>{short(x.scriptpubkey_address)} ↗</a>:<span>Non-address output</span>}</span><strong>{btc(x.value)}</strong></div>)}{outputs.length>8&&<details className="txr-extra"><summary>Show all {outputs.length} outputs</summary>{outputs.slice(8).map((x,i)=><div className="txr-io-row" key={i+8}><span>{x.scriptpubkey_address?<a href={"/btc/address/"+x.scriptpubkey_address}>{short(x.scriptpubkey_address)} ↗</a>:"Non-address output"}</span><strong>{btc(x.value)}</strong></div>)}</details>}{outputs.length===0&&<p>Output data unavailable.</p>}</div>
    </div></section>
    <footer className="txr-footer"><span>Transaction ID: <code>{short(txid)}</code> <button type="button" onClick={copy}>{copied?"✓ Copied":"Copy"}</button></span><a href={"https://mempool.space/tx/"+encodeURIComponent(txid)} target="_blank" rel="noopener noreferrer">Verify on Mempool.space ↗</a></footer>
   </>}
  </div><p className="txr-disclaimer">Live Bitcoin data refreshes automatically. Confirmation estimates are not guarantees. Never share a recovery phrase.</p>
 </main>;
}
