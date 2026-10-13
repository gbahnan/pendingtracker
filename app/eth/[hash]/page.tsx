"use client";
import EthereumBlockchainMotion from "../../ethereum/EthereumBlockchainMotion";
import {useCallback,useEffect,useMemo,useState} from "react";

import "../../bitcoin/bitcoin-explorer-redesign.css";
import "../../ethereum/ethereum-explorer-redesign.css";
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
 const [transactionTab,setTransactionTab]=useState("overview");
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
 return <main className="etr etr-redesign eth-fresh">
  <div className="etr-shell">
   <div className="etr-breadcrumb"><a href="/ethereum">Ethereum Explorer</a><span>›</span>Transaction</div>
   {error&&<p className="etr-error" role="alert">{error}{tx?" Showing the last available data.":""}</p>}
   {loading&&!tx&&<p className="etr-loading">Checking the Ethereum network…</p>}
   {tx&&<>
    <section className="etr-live-network" aria-label="Live Ethereum network and transaction position">
     <EthereumBlockchainMotion transactionMode pendingTransaction={!confirmed} trackedBlockHeight={confirmed&&block!=null?Number(block):null} pending={null} fee={network?.eth?.gasGwei??null} projectedCount={null} blocks={(network?.eth?.recentBlocks??[]).map((b:{height?:number|string|null;hash?:string|null;timestamp?:string|null;transactionsCount?:number|null})=>({height:b.height==null?null:Number(b.height),id:b.hash??null,ageMinutes:b.timestamp?Math.max(0,Math.floor((Date.now()-new Date(b.timestamp).getTime())/60000)):0,transactionCount:b.transactionsCount??null}))}/>
    </section>
    <section className="etr-snapshot" aria-label="Your Ethereum transaction snapshot">
     <header className="etr-title"><h1>Ethereum <em>Transaction</em></h1><div className="etr-hash"><code title={hash}>{hash}</code><button type="button" onClick={copy} aria-label="Copy transaction hash">{copied?"✓ Copied":"▢"}</button></div></header>
     <div className="etr-snapshot-head"><div><span className="etr-eyebrow">YOUR TRANSACTION</span><h2>Your Transaction <em>Snapshot</em></h2><p>{explanation}</p></div><div className={"etr-status "+(failed?"failed":confirmed?"confirmed":"pending")}><strong>{failed?"✕ Failed":confirmed?"✓ Confirmed":"⬡ Pending"}</strong><small>{confirmed?"Block #"+fmt(block):"Waiting for validator inclusion"}</small></div></div>
     <div className="etr-overview">{metric.map(m=><article className="etr-overview-item" key={m.label}><div className="etr-metric-icon">{m.icon}</div><div><small>{m.label}</small><strong>{m.value}</strong><p>{m.help}</p></div></article>)}</div>
     <div className="etr-snapshot-minor">{[{label:"Gas Price",value:gasPrice},{label:"Gas Used",value:gasUsed},{label:"Nonce",value:fmt(insights?.nonce)},{label:"Confirmations",value:confirmed?fmt(count):"0"},{label:"Transaction Type",value:method}].map(m=><div key={m.label}><small>{m.label}</small><strong>{m.value}</strong></div>)}</div>
    </section>
    <section className="etr-understand fresh-explore fresh-explore-premium" aria-label="Understanding your Ethereum transaction">
     <div className="fresh-section-head fresh-explore-title"><div><div className="fresh-kicker">GO DEEPER, ONLY IF YOU WANT TO</div><h2>Understanding Your <em>Transaction</em></h2><p>Real Ethereum transaction details explained in plain English.</p></div><div className="fresh-explore-decoration" aria-hidden="true">◆</div></div>
     <div className="fresh-tabs fresh-tabs-six" role="tablist" aria-label="Ethereum transaction details">
      {[{id:"overview",label:"Overview",icon:"◆"},{id:"gas",label:"Gas & Fees",icon:"≋"},{id:"confirmations",label:"Confirmations",icon:"◷"},{id:"addresses",label:"From & To",icon:"⇄"},{id:"tokens",label:"Tokens",icon:"◇"},{id:"advanced",label:"Advanced",icon:"▤"}].map(t=><button type="button" role="tab" aria-selected={transactionTab===t.id} key={t.id} className={transactionTab===t.id?"active":""} onClick={()=>{setTransactionTab(t.id);setExpanded(false)}}><span className="fresh-tab-icon" aria-hidden="true">{t.icon}</span>{t.label}</button>)}
     </div>
     <div className="fresh-explore-body">
      <div className="fresh-data fresh-data-premium">
       <h3>{({overview:"Transaction overview",gas:"Gas and network fees",confirmations:"Block inclusion and confirmations",addresses:"Sender and destination",tokens:"Token movements",advanced:"Technical transaction data"} as Record<string,string>)[transactionTab]}</h3>
       <p>{({overview:"A quick look at this Ethereum transaction and what happened.",gas:"Gas pays for Ethereum computation, including unsuccessful contract execution.",confirmations:"Inclusion, confirmations, and finality are different milestones on Ethereum.",addresses:"Ethereum transactions originate from an account and target another account or a smart contract.",tokens:"ERC-20 and NFT transfers reported in this transaction.",advanced:"Inspect the raw fields without cluttering the main transaction view."} as Record<string,string>)[transactionTab]}</p>
       {["overview","gas","confirmations","advanced"].includes(transactionTab)&&<div className="fresh-fee-list">{(transactionTab==="overview"?[{name:"Status",value:status,note:"Execution and inclusion status"},{name:"ETH value",value:ethAmount,note:"Direct ETH attached to this transaction"},{name:"Gas fee",value:gasFee,note:"Network processing cost"},{name:"Method",value:method,note:"Transaction operation"}]:transactionTab==="gas"?[{name:"Network fee",value:gasFee,note:"Total gas cost"},{name:"Gas price",value:gasPrice,note:"Effective cost per gas unit"},{name:"Gas used",value:gasUsed,note:"Computation consumed"},{name:"Max priority fee",value:gwei(insights?.maxPriorityFeePerGas),note:"Priority fee setting, when available"}]:transactionTab==="confirmations"?[{name:"Status",value:status,note:"Execution outcome"},{name:"Confirmations",value:confirmed?fmt(count):"0",note:"Blocks since inclusion"},{name:"Block",value:confirmed?"#"+fmt(block):"Awaiting inclusion",note:"Ethereum block number"},{name:"Finality",value:"Not independently verified",note:"Confirmations are not the same as consensus finality"}]:[{name:"Nonce",value:fmt(insights?.nonce),note:"Sender transaction sequence"},{name:"Gas used",value:gasUsed,note:"Execution gas units"},{name:"Method",value:method,note:"Transaction method"},{name:"Transaction hash",value:short(hash),note:"Unique transaction identifier"}]).map(d=><div key={d.name}><span><strong>{d.name}</strong><small>{d.note}</small></span><b>{d.value}</b></div>)}</div>}
       {transactionTab==="addresses"&&<div className="etr-addresses-tab">{[{label:"FROM · SENDER",address:from},{label:"TO · RECIPIENT OR CONTRACT",address:to??insights?.createdContract??null}].map(d=><div className="etr-address-tab-row" key={d.label}><small>{d.label}</small>{d.address?<a href={"/eth/address/"+d.address}>{d.address} ↗</a>:<strong>Unavailable / contract creation</strong>}</div>)}<p>Direct ETH value: {ethAmount}. Contract calls may also transfer tokens or perform other actions.</p></div>}
       {transactionTab==="tokens"&&<div className="etr-token-list">{tokens.slice(0,expanded?tokens.length:6).map((t,i)=><div className="etr-token-row" key={i}><span><b>{t.symbol??t.name??t.type??"Token"}</b><small>{short(t.from??"Unknown")} → {short(t.to??"Unknown")}</small></span><strong>{tokenAmount(t)}</strong></div>)}{!tokens.length&&<p>{insights?.tokenTransfersAvailable?"No token movements reported.":"Token-transfer data is unavailable."}</p>}{insights?.tokenTransfersHasMore&&<p>Additional transfers may be available on Blockscout.</p>}</div>}
       <button type="button" className="fresh-advanced-button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?"Hide more details":"⊕ Show more details"} <span>{expanded?"−":"＋"}</span></button>
       {expanded&&<div className="fresh-advanced">{transactionTab==="advanced"?<details><summary>View raw Ethereum transaction records</summary><pre className="etr-raw">{JSON.stringify({transaction:tx,insights},null,2)}</pre></details>:<p>{transactionTab==="overview"?activity+" "+next:transactionTab==="gas"?"The gas price and total gas paid are different measurements. A reverted contract call can still consume gas.":transactionTab==="confirmations"?"Ethereum generally has 12-second slots, but missed slots and transaction inclusion delays can occur.":transactionTab==="addresses"?"Addresses are pseudonymous. A contract may emit additional transfers that are not apparent from the direct ETH value.":"Showing all reported token transfers."}</p>}</div>}
      </div>
      <aside className="fresh-explainer fresh-explainer-premium"><div className="fresh-explainer-icon">✦</div><span>PENDING TRACKER EXPLAINS</span><h3>{({overview:"What happened to my transaction?",gas:"Why did I pay a gas fee?",confirmations:"Is my transaction final?",addresses:"Who sent and received this?",tokens:"What tokens moved?",advanced:"What do these fields mean?"} as Record<string,string>)[transactionTab]}</h3><p>{({overview:explanation,gas:"Ethereum gas compensates validators for processing. A failed execution may still incur a fee. Your recorded network fee is "+gasFee+".",confirmations:confirmed?"This transaction is in block #"+fmt(block)+" with "+fmt(count)+" confirmation(s). Network finality is a separate milestone.":"The transaction has not yet been included in a block. There is no reliable fixed queue position or guaranteed ETA.",addresses:"The sender is the account that submitted the transaction. The recipient may be a person, wallet, or smart contract. An address alone does not reveal its owner.",tokens:activity,advanced:"Nonce orders transactions from the same sender; gas measures computation; the transaction hash uniquely identifies this operation."} as Record<string,string>)[transactionTab]}</p><div className="fresh-explain-learn"><details><summary>Learn more about this topic</summary><p>{transactionTab==="overview"?next:transactionTab==="gas"?"Gas fees are different from the ETH or tokens being transferred.":transactionTab==="confirmations"?"An exchange may wait for additional confirmations or internal checks.":transactionTab==="addresses"?"Contract creation transactions may have no conventional recipient address.":transactionTab==="tokens"?"Token movements may come from smart-contract events and can differ from the direct ETH amount.":"Raw blockchain records are available under Advanced details."}</p></details></div></aside>
     </div>
    </section>
    <footer className="etr-footer"><span>Transaction hash: <code>{short(hash)}</code> <button type="button" onClick={copy}>{copied?"✓ Copied":"Copy"}</button></span><a href={"https://eth.blockscout.com/tx/"+hash} target="_blank" rel="noopener noreferrer">Verify on Blockscout ↗</a></footer>
   </>}
  </div><p className="etr-disclaimer">Live Ethereum mainnet data refreshes approximately every 15 seconds. Slot times and network fee estimates are not guarantees. No wallet connection required.</p>
 </main>;
}
