"use client";
import TransactionMotion from "../../components/TransactionMotion";
import ExplorerHexScene from "../../components/ExplorerHexScene";
import {useCallback,useEffect,useMemo,useState} from "react";

import "./ethereum-transaction.css";

type TokenTransfer={from?:string|null;to?:string|null;symbol?:string|null;name?:string|null;decimals?:number|null;amount?:string|null;tokenId?:string|null;type?:string|null};
type Insights={available?:boolean;status?:string|null;method?:string|null;from?:string|null;to?:string|null;createdContract?:string|null;blockNumber?:number|string|null;gasUsed?:number|string|null;gasPrice?:number|string|null;fee?:string|null;nonce?:number|string|null;revertReason?:string|null;receiptVerified?:boolean;networkConfirmations?:number|null;maxFeePerGas?:string|null;maxPriorityFeePerGas?:string|null;tokenTransfers?:TokenTransfer[];tokenTransfersHasMore?:boolean;tokenTransfersAvailable?:boolean};
type Tx={confirmed?:boolean;failed?:boolean;confirmations?:number|string;valueWei?:string;value?:string;from?:string;to?:string;blockNumber?:number|string;block_number?:number|string;diagnosis?:{summary?:string}};
const short=(s:string)=>s.length>26?s.slice(0,14)+"…"+s.slice(-9):s;
const amount=(value:unknown,decimals=18,digits=8)=>{try{const n=BigInt(String(value??"0"));const negative=n<0n?"-":"";const raw=(n<0n?-n:n).toString().padStart(decimals+1,"0");const whole=decimals?raw.slice(0,-decimals):raw;const fraction=decimals?raw.slice(-decimals).slice(0,digits).replace(/0+$/,""):"";return negative+whole+(fraction?"."+fraction:"")}catch{return "Unavailable"}};
const fmt=(v:unknown)=>v==null?"Unavailable":String(v).replace(/\B(?=(\d{3})+(?!\d))/g,",");
const gwei=(v:unknown)=>v==null?"Unavailable":amount(v,9,4)+" Gwei";
const tokenAmount=(t:TokenTransfer)=>t.amount!=null&&t.decimals!=null?amount(t.amount,t.decimals,8):t.tokenId!=null?"Token #"+t.tokenId:"Amount unavailable";
export default function EthereumTransaction({params}:{params:{hash:string}}){
 const hash=params.hash??"";
 const valid=useMemo(()=>/^0x[a-f0-9]{64}$/i.test(hash),[hash]);
 const [tx,setTx]=useState<Tx|null>(null);
 const [insights,setInsights]=useState<Insights|null>(null);
 const [network,setNetwork]=useState<any>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [copied,setCopied]=useState(false);
 const [expanded,setExpanded]=useState(false);
 const refresh=useCallback(async()=>{
  if(!valid)return;
  try{
   const [txResponse,detailsResponse,networkResponse]=await Promise.all([
    fetch("/api/eth/tx/"+hash,{cache:"no-store"}),
    fetch("/api/eth/insights/"+hash,{cache:"no-store"}),
    fetch("/api/network",{cache:"no-store"})
   ]);
   const base=await txResponse.json();
   if(!txResponse.ok)throw Error(base?.error??"Ethereum transaction data is unavailable.");
   setTx(base);
   if(detailsResponse.ok){const d=await detailsResponse.json();setInsights(d?.available?d:null)}
   if(networkResponse.ok)setNetwork(await networkResponse.json());
   setError(null);
  }catch(e){setError(e instanceof Error?e.message:"Ethereum network data is unavailable.");}
  finally{setLoading(false)}
 },[hash,valid]);
 useEffect(()=>{void refresh();const id=setInterval(()=>void refresh(),15000);return()=>clearInterval(id)},[refresh]);
 const confirmed=Boolean(insights?.receiptVerified||(tx?.confirmed??(Number(tx?.confirmations??0)>0)));
 const failed=Boolean(tx?.failed||(/error|fail/i.test(insights?.status??"")&&confirmed));
 const status=!tx?"Unavailable":failed?"Failed":confirmed?"Confirmed":"Pending";
 const count=Number(insights?.networkConfirmations??tx?.confirmations??0);
 const valueWei=tx?.valueWei??tx?.value??"0";
 const ethAmount=amount(valueWei)+" ETH";
 const tokens=insights?.tokenTransfers??[];
 const hasTokens=tokens.length>0;
 const contract=Boolean(insights?.method&&insights.method!=="transfer")||Boolean(insights?.createdContract);
 const method=insights?.method??(contract?"Contract interaction":hasTokens?"Token activity":/^\\d+$/.test(String(valueWei||"0"))&&BigInt(String(valueWei||"0"))>0n?"ETH transfer":"Ethereum transaction");
 const from=insights?.from??tx?.from??null,to=insights?.to??tx?.to??null;
 const gasFee=insights?.fee!=null?amount(insights.fee)+" ETH":"Unavailable";
 const gasUsed=insights?.gasUsed!=null?fmt(insights.gasUsed):"Unavailable";
 const gasPrice=gwei(insights?.gasPrice);
 const totalTokens=hasTokens?tokens.length+(insights?.tokenTransfersHasMore?"+":""):insights?.tokenTransfersAvailable?"0":"Unavailable";
 const explanation=!tx?"Transaction details are unavailable at the moment. Please try again shortly."
  :failed?"This transaction was included in an Ethereum block, but the requested operation did not complete successfully. This can happen when a smart contract rejects an operation or runs into an execution problem. Ethereum may still charge gas for the work performed, even when the operation fails."
  :confirmed?"Your transaction has been recorded in an Ethereum block and currently has "+fmt(insights?.networkConfirmations??tx.confirmations??1)+" confirmation"+(count===1?"":"s")+". The network has processed it successfully. If a wallet or exchange still says pending, that service may be waiting for more confirmations or completing its own internal checks."
  :"Your transaction has been broadcast and is awaiting inclusion in an Ethereum block. New blocks are typically proposed about every 12 seconds, but that does not guarantee when your transaction will be included. Gas settings, network activity and earlier pending transactions from the same account can affect the wait.";
 const activity=hasTokens?"The transaction includes "+tokens.length+(insights?.tokenTransfersHasMore?" or more":"")+" reported token movement"+(tokens.length===1&&!insights?.tokenTransfersHasMore?"":"s")+". Token movements are separate from any ETH sent directly.":contract?"This transaction interacts with an Ethereum contract. Contract calls can perform actions without sending ETH directly, and the method name alone does not establish everything that happened.":"The direct ETH amount is "+ethAmount+". This is the value attached to the transaction, not the gas fee.";
 const next=failed?"What to do next: check the reported failure reason and your wallet activity before retrying. Avoid repeating a transaction without understanding why it failed.":confirmed?"What to do next: no acceleration is needed. If the receiving service has not credited your funds, check its deposit requirements using this transaction hash.":"What to do next: you can usually wait. If it is urgent, check whether your wallet supports speeding up or replacing this transaction with the same nonce. Avoid sending a duplicate payment.";
 function copy(){navigator.clipboard?.writeText(hash).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1600)}).catch(()=>{})}

 const block=insights?.blockNumber??tx?.blockNumber??tx?.block_number;
 const gasFeeWei=insights?.fee;
 const metric=[
 {icon:"◆",label:"Direct ETH Value",value:ethAmount,help:"ETH attached to this transaction. Token transfers are shown below."},
 {icon:"≋",label:"Network Fee (Gas)",value:gasFee,help:"Gas paid for network processing; this can apply even if execution fails."},
 {icon:"◷",label:confirmed?"Confirmations":"Confirmation Status",value:confirmed?fmt(insights?.networkConfirmations??tx?.confirmations??1):"Waiting",help:confirmed?"New blocks add confirmations. Finality is a separate milestone.":"No guaranteed confirmation time; gas settings and nonce matter."},
 {icon:"⬡",label:confirmed?"Block Number":"Transaction Status",value:confirmed?fmt(block):status,help:confirmed?"The block where this transaction was included.":"Waiting to be included in a block."}
 ];
 const details=[
 {icon:"≋",label:"Gas Price",value:gasPrice,help:"Effective price per gas unit, shown in Gwei. This is not the total fee."},
 {icon:"⇄",label:"Transaction Type",value:method,help:contract?"This interacts with a smart contract, which may transfer tokens or execute other actions.":hasTokens?"This transaction includes reported token movements.":"This describes the transaction's main operation."},
 {icon:"▤",label:"Gas Used",value:gasUsed,help:"Units of Ethereum computation consumed. Unlike Bitcoin, this is not a transaction's byte size."},
 {icon:"⬡",label:"Execution Status",value:status,help:failed?"The operation reverted; gas may still be charged.":confirmed?"Included in a block and processed successfully.":"The result is not known until inclusion."},
 ...(expanded?[
 {icon:"₿",label:"Direct ETH Amount",value:ethAmount,help:"ETH directly attached to the transaction; does not include ERC-20 or NFT transfers."},
 {icon:"◷",label:"Nonce",value:fmt(insights?.nonce),help:"Sender transaction sequence. An earlier pending nonce can delay this transaction."},
 {icon:"◇",label:"Token Movements",value:String(totalTokens),help:"Reported token transfers; some contract interactions produce several."},
 {icon:"⬡",label:"Block Number",value:confirmed?fmt(block):"Pending",help:"The block containing the transaction, when available."}
 ]:[])
 ];
 if(!valid)return <main className="etr"><div className="etr-shell"><a href="/ethereum">← Ethereum Explorer</a><h1>Invalid Ethereum transaction hash</h1><p>Enter 0x followed by 64 hexadecimal characters.</p></div></main>;
 return <main className="etr">
  <ExplorerHexScene chain="eth" kind="transaction"/>
  <div className="etr-shell">
   <div className="etr-breadcrumb"><a href="/ethereum">Ethereum Explorer</a><span>›</span>Transaction</div>
   <header className="etr-title"><h1>Ethereum <em>Transaction</em></h1><div className="etr-hash"><code title={hash}>{hash}</code><button type="button" onClick={copy} aria-label="Copy transaction hash">{copied?"✓ Copied":"▢"}</button></div></header>
   {error&&<p className="etr-error" role="alert">{error}{tx?" Showing the last available data.":""}</p>}
   {loading&&!tx&&<p className="etr-loading">Checking the Ethereum network…</p>}
   {tx&&<>
    <section className="etr-tracker" aria-label="Ethereum transaction status">
     <div className="etr-tracker-heading"><div><h2>{failed?"Transaction Included · Execution Failed":confirmed?"Your Transaction Is Confirmed":"Your Transaction Is Pending"}</h2><p>{failed?"Ethereum included the transaction, but its execution reverted.":confirmed?"Your transaction is recorded in an Ethereum block.":"Ethereum transactions are included by validators; there is no reliable fixed position in a future block."}</p></div><span className="etr-live"><i/> Live Ethereum data</span></div>
     <TransactionMotion chain="eth" stages={[{title:failed?"Execution failed":confirmed?"Included in block":"Transaction seen",detail:confirmed?"Block #"+fmt(block):"Broadcast to network",complete:confirmed&&!failed},{title:"Block inclusion",detail:confirmed?"Completed":"Awaiting validator",complete:confirmed},{title:"Confirmations",detail:confirmed?fmt(tx.confirmations??1)+" so far":"After inclusion",complete:confirmed},{title:"Finality",detail:"Separate network milestone"},{title:"Receiving service",detail:"May have its own checks"}]}/>
<p className="etr-swipe-hint">Swipe to explore stages <span aria-hidden="true">→</span></p>
     <p className="etr-timeline-note">{confirmed?"Block inclusion is confirmed. This diagram shows stages, not measured timestamps or finality verification.":failed?"A reverted transaction can be included in a block and still incur a gas fee.":"Ethereum slots are typically 12 seconds, but inclusion, confirmation and finality are not guaranteed by a countdown."}</p>
     <div className="etr-overview">{metric.map(m=><article className="etr-overview-item" key={m.label}><div className="etr-metric-icon">{m.icon}</div><div><small>{m.label}</small><strong>{m.value}</strong><p>{m.help}</p></div></article>)}</div>
    </section>
    <section className="etr-summary"><div className="etr-eyebrow">YOUR TRANSACTION</div><h2>{failed?<>This transaction <em>did not execute successfully.</em></>:confirmed?<>This transaction has been <em>confirmed.</em></>:<>Your transaction is <em>waiting for confirmation.</em></>}</h2><p>{explanation}</p><p>{activity} {insights?.fee!=null?"The network processing fee is "+gasFee+".":""}</p><p className="etr-next">{next}</p>{failed&&insights?.revertReason&&<p className="etr-failure">Reported failure reason: {insights.revertReason}</p>}</section>
    <section className="etr-details"><div className="etr-section-heading"><div><h2>Key Transaction Details</h2><p>Four useful Ethereum details, explained in plain English.</p></div><button type="button" className="etr-more" aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>{expanded?"Show Fewer Details":"Show 4 More Details"} <span>{expanded?"⌃":"⌄"}</span></button></div><div className="etr-cards">{details.map(d=><article className="etr-card" key={d.label}><div className="etr-card-icon">{d.icon}</div><h3>{d.label}</h3><strong>{d.value}</strong><p>{d.help}</p></article>)}</div>
    <details className="etr-advanced"><summary>Explore technical Ethereum data (addresses, nonce, method, gas and raw records)</summary><div><small>Transaction hash</small><code>{hash}</code></div><div><small>Sender</small><code>{from??"Unavailable"}</code></div><div><small>Recipient / contract</small><code>{to??insights?.createdContract??"Unavailable"}</code></div><div><small>Method</small><strong>{method}</strong></div><div><small>Nonce</small><strong>{fmt(insights?.nonce)}</strong></div><div><small>Gas price</small><strong>{gasPrice}</strong></div><div><small>Gas used</small><strong>{gasUsed}</strong></div><details><summary>View raw Ethereum records</summary><pre>{JSON.stringify({transaction:tx,insights},null,2)}</pre></details></details>
    </section>
    <section className="etr-movement"><div className="etr-section-heading"><div><h2>From &amp; To</h2><p>Ethereum uses accounts and smart contracts, not Bitcoin-style inputs and outputs. Token movements appear separately.</p></div></div><div className="etr-movement-grid"><article className="etr-movement-panel"><div className="etr-panel-head"><h3>From <span>(1)</span></h3><strong>Sender</strong></div><p>Address that submitted this transaction</p><div className="etr-address-row"><span><small>FROM ADDRESS</small>{from?<a href={"/eth/address/"+from}>{short(from)} ↗</a>:<b>Unavailable</b>}</span><strong>{ethAmount}</strong></div></article><article className="etr-movement-panel"><div className="etr-panel-head"><h3>To <span>({to?"1":insights?.createdContract?"Contract":"—"})</span></h3><strong>Destination</strong></div><p>Recipient or contract called by the transaction</p><div className="etr-address-row"><span><small>TO ADDRESS</small>{to?<a href={"/eth/address/"+to}>{short(to)} ↗</a>:insights?.createdContract?<a href={"/eth/address/"+insights.createdContract}>{short(insights.createdContract)} ↗</a>:<b>Contract creation / unavailable</b>}</span><strong>{ethAmount}</strong></div></article></div>
     <div className="etr-tokens"><div className="etr-section-heading"><div><h2>Token Movements <span>({totalTokens})</span></h2><p>ERC-20 and NFT transfers reported for this transaction. These are separate from the direct ETH value.</p></div></div>{tokens.length>0?<div className="etr-token-list">{tokens.map((t,i)=><div className="etr-token-row" key={i}><span><b>{t.symbol??t.name??t.type??"Token"}</b><small>{short(t.from??"Unknown")} → {short(t.to??"Unknown")}</small></span><strong>{tokenAmount(t)}</strong></div>)}</div>:<p className="etr-token-empty">{insights?.tokenTransfersAvailable?"No token transfers were reported.":"Token-transfer data is unavailable."}</p>}{insights?.tokenTransfersHasMore&&<p className="etr-token-empty">More token movements may be available on Blockscout.</p>}</div>
    </section>
    <footer className="etr-footer"><span>Transaction hash: <code>{short(hash)}</code> <button type="button" onClick={copy}>{copied?"✓ Copied":"Copy"}</button></span><a href={"https://eth.blockscout.com/tx/"+hash} target="_blank" rel="noopener noreferrer">Verify on Blockscout ↗</a></footer>
   </>}
  </div><p className="etr-disclaimer">Live Ethereum mainnet data refreshes approximately every 15 seconds. Slot times and network fee estimates are not guarantees. No wallet connection required.</p>
 </main>;
}
