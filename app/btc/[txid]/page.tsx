"use client";
import BlockchainWebGL from "../../bitcoin/BlockchainWebGL";
import {Honeycomb} from "../../components/ChainDashboard";
import HexArtwork from "../../components/SharedHexArtwork";
import styles from "./BitcoinTracker.module.css";
import "./transaction-refresh.css";
import "../../bitcoin/bitcoin-explorer-redesign.css";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {BtcMvpResult} from "@/lib/btc/types";
import {isLikelyTxid} from "@/lib/btc/validate";

type ProjectedBlock={position:number;transactionCount:number|null;feeRange:number[]|null;medianFee:number|null};
type Overview={btc?:{projectedBlocks?:ProjectedBlock[];height?:number|null;pending?:number|null;recentBlocks?:Array<{height:number|null;ageMinutes:number;transactionCount:number|null;id:string|null}>}};
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
 const [transactionTab,setTransactionTab]=useState("overview");
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
 const selectedBand=blocks.find(b=>b.position===selectedPosition)?.feeRange;
 const trackedFraction=selectedBand&&feeRate!=null&&selectedBand[1]>selectedBand[0]?Math.max(0,Math.min(1,(feeRate-selectedBand[0])/(selectedBand[1]-selectedBand[0]))):0.5;
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
   <div className="txr-breadcrumb"><a href="/bitcoin">Bitcoin Explorer</a><span>›</span>Transaction</div>
   {error&&<p className="txr-error" role="alert">{error}{result?" Showing the last available data.":""}</p>}
   {loading&&!result&&<div className="txr-loading">Checking your Bitcoin transaction against the live network…</div>}
   {result&&<>
    <section className="txr-network-v2" aria-label="Live Bitcoin network and transaction position">
     
     <div className="txr-explorer-motion fresh-journey"><BlockchainWebGL compactTransactionLabels pending={overview?.btc?.pending} fee={blocks[0]?.medianFee??null} projectedCount={blocks[0]?.transactionCount??null} projections={blocks} blocks={overview?.btc?.recentBlocks??[]} trackedPosition={!confirmed&&observed?selectedPosition:null} trackedFraction={trackedFraction} trackedConfirmedHeight={confirmed?blockHeight??null:null}/></div>
    </section>
    <section className="txr-snapshot-v2" aria-label="Your transaction snapshot">
     <header className="txr-page-title"><h1>Bitcoin <em>Transaction</em></h1><div className="txr-id"><code title={txid}>{txid}</code><button type="button" onClick={copy} aria-label="Copy transaction ID">{copied?"✓ Copied":"▢"}</button></div></header>
     <div className="txr-snapshot-v2-head"><div><span className="txr-v2-kicker">YOUR TRANSACTION</span><h2>Your Transaction <em>Snapshot</em></h2><p>{confirmed?"Your transaction is included in a Bitcoin block.":observed?"Your transaction is pending and waiting for confirmation.":"This transaction has not yet been located on the Bitcoin network."}</p></div><div className="txr-v2-status"><strong>{confirmed?"✓ Confirmed":observed?"⬡ Pending":"? Not found"}</strong><small>{confirmed?"Block #"+number(blockHeight):observed?"Waiting to be included in a block":"Verify transaction broadcast"}</small></div></div>
     <div className="txr-v2-primary">
      {[
       {icon:"₿",label:"Amount in Outputs",value:btc(outputTotal),help:"Total sent to new outputs; may include change."},
       {icon:"≋",label:"Transaction Fee",value:btc(tx?.fee),help:tx?.fee==null?"Fee unavailable":rate(feeRate)+" · "+number(tx.fee)+" sats paid to miners"},
       {icon:"◷",label:confirmed?"Confirmations":"ETA",value:confirmed?number(confirmations):feeEstimate,help:confirmed?"Confirmed in block #"+number(blockHeight):"Fee-based estimate; timing may change."},
       {icon:"⬡",label:"Transaction Status",value:confirmed?"Confirmed":observed?"Pending":"Not found",help:confirmed?"Included in the Bitcoin blockchain.":observed?"Waiting for a miner to include it in a block.":"Check whether it was broadcast."}
      ].map(x=><article className="txr-v2-primary-card" key={x.label}><span className="txr-v2-icon">{x.icon}</span><div><small>{x.label}</small><strong>{x.value}</strong><p>{x.help}</p></div></article>)}
     </div>
     <div className="txr-v2-secondary">
      {[
       ["Transaction Size",tx?.vsize!=null?number(tx.vsize)+" vB":tx?.weight!=null?number(Math.ceil(tx.weight/4))+" vB":"—"],
       ["Fee Rate",rate(feeRate)],["Inputs",number(inputs.length)],["Outputs",number(outputs.length)],
       ["Total Input",btc(inputTotal)],["Total Output",btc(outputTotal)]
      ].map(([label,value])=><div className="txr-v2-secondary-item" key={label}><small>{label}</small><strong>{value}</strong></div>)}
     </div>
    </section>
    <section className="txr-understand-v2 fresh-explore fresh-explore-premium">
     <div className="fresh-section-head fresh-explore-title"><div><div className="fresh-kicker">GO DEEPER, ONLY IF YOU WANT TO</div><h2>Understanding Your <em>Transaction</em></h2><p>Explore the actual transaction data. Choose a topic and we'll explain what it means.</p></div><div className="fresh-explore-decoration" aria-hidden="true">₿</div></div>
     <div className="fresh-tabs fresh-tabs-six" role="tablist" aria-label="Explore transaction details">
      {[
       {id:"overview",label:"Overview",icon:"⬡"},{id:"fees",label:"Fees",icon:"≋"},{id:"confirmations",label:"Confirmations",icon:"◷"},
       {id:"inputs",label:"Inputs",icon:"↘"},{id:"outputs",label:"Outputs",icon:"↗"},{id:"advanced",label:"Advanced",icon:"▤"}
      ].map(t=><button type="button" role="tab" aria-selected={transactionTab===t.id} key={t.id} className={transactionTab===t.id?"active":""} onClick={()=>{setTransactionTab(t.id);setUnderstandingExpanded(false)}}><span className="fresh-tab-icon" aria-hidden="true">{t.icon}</span>{t.label}</button>)}
     </div>
     <div className="fresh-explore-body">
      <div className="fresh-data fresh-data-premium">
       <h3>{({overview:"Your transaction overview",fees:"Transaction fees",confirmations:"Confirmation status",inputs:"Transaction inputs",outputs:"Transaction outputs",advanced:"Advanced transaction data"} as Record<string,string>)[transactionTab]}</h3>
       <p>{({overview:"The essential details of this specific Bitcoin transaction.",fees:"What your transaction paid miners and how that affects confirmation priority.",confirmations:"Whether your transaction is in a block and how many confirmations it has.",inputs:"Previous Bitcoin outputs this transaction spends. Addresses do not identify their owners.",outputs:"New Bitcoin outputs created by this transaction, potentially including change.",advanced:"The underlying blockchain fields for people who want to inspect them."} as Record<string,string>)[transactionTab]}</p>
       {(transactionTab==="overview"||transactionTab==="fees"||transactionTab==="confirmations"||transactionTab==="advanced")&&<div className="fresh-fee-list">
        {(transactionTab==="overview"?[
         {name:"Status",value:confirmed?"Confirmed":observed?"Pending":"Not found",note:"Current blockchain status"},
         {name:"Amount in outputs",value:btc(outputTotal),note:"May include change sent back to the sender"},
         {name:"Network fee",value:btc(tx?.fee),note:"Amount paid to Bitcoin miners"},
         {name:"Estimated wait",value:feeEstimate,note:"Not a guarantee"}
        ]:transactionTab==="fees"?[
         {name:"Total network fee",value:btc(tx?.fee),note:"Fee paid to miners"},
         {name:"Fee rate",value:rate(feeRate),note:"Satoshis paid per virtual byte"},
         {name:"Virtual size",value:tx?.vsize!=null?number(tx.vsize)+" vB":"—",note:"Used to calculate the fee rate"},
         {name:"Replace-by-fee",value:rbf?"Signaled":"Not signaled",note:"Whether opt-in replacement is indicated"}
        ]:transactionTab==="confirmations"?[
         {name:"Current status",value:confirmed?"Confirmed":observed?"Pending":"Not found",note:"Based on the live Bitcoin network"},
         {name:"Confirmations",value:confirmed?number(confirmations):"0",note:"Additional blocks increase this number"},
         {name:"Block height",value:confirmed?"#"+number(blockHeight):"Not yet included",note:"The block containing the transaction"},
         {name:"Estimated wait",value:feeEstimate,note:"Only applicable while pending"}
        ]:[
         {name:"Version",value:String(tx?.version??"—"),note:"Transaction format version"},
         {name:"Locktime",value:String(tx?.locktime??"—"),note:"Transaction locktime field"},
         {name:"Weight",value:tx?.weight!=null?number(tx.weight)+" WU":"—",note:"Block weight consumed"},
         {name:"Transaction ID",value:short(txid),note:"Unique identifier for this transaction"}
        ]).map(row=><div key={row.name}><span><strong>{row.name}</strong><small>{row.note}</small></span><b>{row.value}</b></div>)}
       </div>}
       {(transactionTab==="inputs"||transactionTab==="outputs")&&<div className="txr-v2-address-list">
        {(transactionTab==="inputs"?inputs:outputs).slice(0,understandingExpanded?1000:6).map((item,i)=>{const address=transactionTab==="inputs"?(item as typeof inputs[number]).prevout?.scriptpubkey_address:(item as typeof outputs[number]).scriptpubkey_address;const amount=transactionTab==="inputs"?(item as typeof inputs[number]).prevout?.value:(item as typeof outputs[number]).value;return <div className="txr-v2-address-row" key={i}><span><small>{transactionTab==="inputs"?"INPUT":"OUTPUT"} {i+1}</small>{address?<a href={"/btc/address/"+address}>{short(address)} ↗</a>:<strong>Address unavailable</strong>}</span><strong>{btc(amount)}</strong></div>})}
        {(transactionTab==="inputs"?inputs:outputs).length===0&&<p>No {transactionTab} data available.</p>}
       </div>}
       <button type="button" className="fresh-advanced-button" onClick={()=>setUnderstandingExpanded(v=>!v)} aria-expanded={understandingExpanded}>{understandingExpanded?"Hide more details":"⊕ Show more details"} <span>{understandingExpanded?"−":"＋"}</span></button>
       {understandingExpanded&&<div className="fresh-advanced">{transactionTab==="inputs"||transactionTab==="outputs"?<p>Showing all available {transactionTab}. Bitcoin addresses are pseudonymous and do not establish the real-world identity of their owners.</p>:transactionTab==="advanced"?<details><summary>View raw transaction JSON</summary><pre className="txr-v2-raw">{JSON.stringify(result,null,2)}</pre></details>:<p>{transactionTab==="overview"?summary:transactionTab==="fees"?feeHint+". Fee rates and mempool conditions can change before confirmation.":"Bitcoin confirmations accumulate when additional blocks are mined. A receiving service may require multiple confirmations."}</p>}</div>}
      </div>
      <aside className="fresh-explainer fresh-explainer-premium"><div className="fresh-explainer-icon">✦</div><span>PENDING TRACKER EXPLAINS</span><h3>{({overview:"What does my transaction status mean?",fees:"Did I pay enough in fees?",confirmations:"When is my payment final?",inputs:"Where did this Bitcoin come from?",outputs:"Where is the Bitcoin going?",advanced:"What are these technical fields?"} as Record<string,string>)[transactionTab]}</h3><p>{({overview:confirmed?"Your transaction has been included in a block.":observed?"Your transaction has been broadcast and is waiting to be included in a block.":"We could not locate this transaction on the network.",fees:"Miners generally prioritize higher fee rates when choosing which transactions to include. Your fee rate is "+rate(feeRate)+".",confirmations:confirmed?"Your transaction currently has "+number(confirmations)+" confirmation(s). The receiving wallet or exchange decides how many it requires.":"Your transaction has no confirmations yet. The estimated wait is "+feeEstimate+".",inputs:"Inputs reference earlier unspent Bitcoin outputs. They show which coins are being spent, not necessarily who owns the addresses.",outputs:"Outputs create new spendable Bitcoin amounts. Some may pay recipients while others return change to the sender.",advanced:"Version, locktime and weight describe how the transaction is structured and how much block space it uses."} as Record<string,string>)[transactionTab]}</p><div className="fresh-explain-learn"><details><summary>Learn more about this topic</summary><p>{transactionTab==="fees"?feeHint:transactionTab==="overview"?summary:transactionTab==="confirmations"?"Block times vary, so estimates are never guaranteed.":transactionTab==="inputs"?"A single payment may combine multiple inputs from previous transactions.":transactionTab==="outputs"?"An output is not automatically a distinct recipient; change outputs are common.":"These details help wallets and blockchain software interpret and validate transactions."}</p></details></div></aside>
     </div>
    </section>
    <footer className="txr-footer"><span>Transaction ID: <code>{short(txid)}</code> <button type="button" onClick={copy}>{copied?"✓ Copied":"Copy"}</button></span><a href={"https://mempool.space/tx/"+encodeURIComponent(txid)} target="_blank" rel="noopener noreferrer">Verify on Mempool.space ↗</a></footer>
   </>}
  </div><p className="txr-disclaimer">Live Bitcoin data refreshes automatically. Confirmation estimates are not guarantees. Never share a recovery phrase.</p>
 </main>;
}
