"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import ChainDashboard from "../../components/ChainDashboard";
import styles from "../../btc/[txid]/BitcoinTracker.module.css";

type TokenTransfer={from?:string|null;to?:string|null;symbol?:string|null;name?:string|null;decimals?:number|null;amount?:string|null;tokenId?:string|null;type?:string|null};
type Insights={available?:boolean;status?:string|null;method?:string|null;from?:string|null;to?:string|null;createdContract?:string|null;blockNumber?:number|string|null;gasUsed?:number|string|null;gasPrice?:number|string|null;fee?:string|null;nonce?:number|string|null;revertReason?:string|null;tokenTransfers?:TokenTransfer[];tokenTransfersHasMore?:boolean;tokenTransfersAvailable?:boolean};
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
 const confirmed=Boolean(tx?.confirmed??(Number(tx?.confirmations??0)>0));
 const failed=Boolean(tx?.failed||(/error|fail/i.test(insights?.status??"")&&confirmed));
 const status=!tx?"Unavailable":failed?"Failed":confirmed?"Confirmed":"Pending";
 const count=Number(tx?.confirmations??0);
 const valueWei=tx?.valueWei??tx?.value??"0";
 const ethAmount=amount(valueWei)+" ETH";
 const tokens=insights?.tokenTransfers??[];
 const hasTokens=tokens.length>0;
 const contract=Boolean(insights?.method&&insights.method!=="transfer")||Boolean(insights?.createdContract);
 const method=insights?.method??(contract?"Contract interaction":hasTokens?"Token activity":BigInt(String(valueWei||"0"))>0n?"ETH transfer":"Ethereum transaction");
 const from=insights?.from??tx?.from??null,to=insights?.to??tx?.to??null;
 const gasFee=insights?.fee!=null?amount(insights.fee)+" ETH":"Unavailable";
 const gasUsed=insights?.gasUsed!=null?fmt(insights.gasUsed):"Unavailable";
 const gasPrice=gwei(insights?.gasPrice);
 const totalTokens=hasTokens?tokens.length+(insights?.tokenTransfersHasMore?"+":""):insights?.tokenTransfersAvailable?"0":"Unavailable";
 const explanation=!tx?"Transaction details are unavailable at the moment. Please try again shortly."
  :failed?"This transaction was included in an Ethereum block, but the requested operation did not complete successfully. This can happen when a smart contract rejects an operation or runs into an execution problem. Ethereum may still charge gas for the work performed, even when the operation fails."
  :confirmed?"Your transaction has been recorded in an Ethereum block and currently has "+fmt(tx.confirmations??1)+" confirmation"+(count===1?"":"s")+". The network has processed it successfully. If a wallet or exchange still says pending, that service may be waiting for more confirmations or completing its own internal checks."
  :"Your transaction has been broadcast and is awaiting inclusion in an Ethereum block. New blocks are typically proposed about every 12 seconds, but that does not guarantee when your transaction will be included. Gas settings, network activity and earlier pending transactions from the same account can affect the wait.";
 const activity=hasTokens?"The transaction includes "+tokens.length+(insights?.tokenTransfersHasMore?" or more":"")+" reported token movement"+(tokens.length===1&&!insights?.tokenTransfersHasMore?"":"s")+". Token movements are separate from any ETH sent directly.":contract?"This transaction interacts with an Ethereum contract. Contract calls can perform actions without sending ETH directly, and the method name alone does not establish everything that happened.":"The direct ETH amount is "+ethAmount+". This is the value attached to the transaction, not the gas fee.";
 const next=failed?"What to do next: check the reported failure reason and your wallet activity before retrying. Avoid repeating a transaction without understanding why it failed.":confirmed?"What to do next: no acceleration is needed. If the receiving service has not credited your funds, check its deposit requirements using this transaction hash.":"What to do next: you can usually wait. If it is urgent, check whether your wallet supports speeding up or replacing this transaction with the same nonce. Avoid sending a duplicate payment.";
 function copy(){navigator.clipboard?.writeText(hash).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1600)}).catch(()=>{})}
 if(!valid)return <main className={styles.page}><div className={styles.shell}><a className={styles.back} href="/ethereum">← Ethereum Explorer</a><h1>Invalid Ethereum transaction hash</h1><p>Enter 0x followed by 64 hexadecimal characters.</p></div></main>;
 return <main className={styles.page+" "+styles.ethPage}>
  <div className={styles.shell}>
   <a className={styles.back} href="/ethereum">← &nbsp; Ethereum Explorer</a>
   <header className={styles.hero}>
    <div className={styles.ethCoin} aria-hidden="true">◆</div>
    <div className={styles.heroText}><div className={styles.eyebrow}>YOUR ETHEREUM TRANSACTION</div><h1>{failed?"Your transaction failed":confirmed?"Your transaction is confirmed":<>Waiting for <span>confirmation</span></>}</h1><p>{failed?"The transaction was included in a block, but its execution failed. Gas may still have been charged.":confirmed?"Ethereum recorded this transaction. Your wallet or exchange may still need time to credit the funds.":"Track your transaction on Ethereum and understand what its gas, status and transfers mean."}</p></div>
    <div className={styles.ethStatus}>{status}</div>
   </header>
   {error&&<p className={styles.error} role="alert">{error}{tx?" Showing the last available data.":""}</p>}
   {loading&&!tx&&<p className={styles.loading}>Checking the Ethereum network…</p>}
   {tx&&<>
    <div className={styles.ethNetwork}><ChainDashboard chain="ethereum" tracking trackedEthBlock={confirmed?Number(insights?.blockNumber??tx?.blockNumber??tx?.block_number??0)||null:null} ethPending={!confirmed}/><p className={styles.ethCaveat}>Ethereum blocks are proposed approximately every 12 seconds. Pending transactions do not have a guaranteed position in a future block. A failed transaction can still be included in a block.</p></div>
    <section className={styles.summary} aria-label="Ethereum transaction status"><div className={styles.summarySectionHeading}><span className={styles.summarySectionNumber}>1</span><h2>WHERE IS MY TRANSACTION?</h2></div>
     <div className={styles.summaryGrid}>
      {[
       ["STATUS",status,failed?"Included in a block, but execution failed.":confirmed?"Recorded on the Ethereum blockchain.":"Awaiting inclusion in a block."],
       ["CONFIRMATIONS",confirmed?fmt(tx.confirmations??1):"0","More blocks increase confirmations. Receiving services set their own requirements."],
       ["BLOCK",confirmed?fmt(insights?.blockNumber??tx?.blockNumber??tx?.block_number):"Pending","The Ethereum block containing your transaction, if confirmed."],
       ["NETWORK GAS",network?.eth?.gasGwei==null?"Unavailable":network.eth.gasGwei+" Gwei","Current network gas estimate, not your transaction's actual fee."],
       ["EXECUTION",failed?"Reverted":confirmed?"Succeeded":"Not yet known",failed?"A failed execution may still consume gas.":confirmed?"The transaction was processed successfully.":"Final execution outcome is not known yet."]
      ].map(([label,value,help])=><div className={styles.fact} key={label}><div className={styles.factTop}><span className={styles.ethFactIcon}>◆</span><div><div className={styles.factLabel}>{label}</div><div className={styles.factValue}><strong>{value}</strong></div></div></div><p>{help}</p></div>)}
     </div><div className={styles.summaryFooter}><div>Transaction hash <code title={hash}>{short(hash)}</code><button type="button" onClick={copy}>{copied?"✓ Copied":"▢ Copy"}</button></div><a href={"https://eth.blockscout.com/tx/"+hash} target="_blank" rel="noopener noreferrer">View on Blockscout ↗</a></div>
    </section>
    <section className={styles["pt-story"]}>
     <div className={styles["pt-story-eyebrow"]}>THE SAME BLOCKCHAIN. A CLEARER PICTURE.</div>
     <h2>Your Ethereum transaction, <em>in plain English.</em></h2><p className={styles["pt-story-sub"]}>Real Ethereum data. Clear explanations.</p>
     <div className={styles["pt-story-intro"]}><div className={styles["pt-story-introicon"]} aria-hidden="true">✦</div><div><h3>Your transaction, explained</h3><p>{explanation}</p><p>{activity} {insights?.fee!=null?"The reported network processing fee is "+gasFee+".":""} {failed&&insights?.revertReason?"Reported failure reason: "+insights.revertReason:""}</p><p className={styles["pt-story-takeaway"]}>{next}</p></div></div>
     <div className={styles["pt-story-data"]}><h3>UNDERSTANDING YOUR TRANSACTION</h3>
      {[
       ["Direct ETH amount",ethAmount,"ETH attached directly to the transaction. A token swap or contract call can move tokens even when this value is zero."],
       ["Network fee",gasFee,"The gas fee for Ethereum processing, separate from the ETH transferred. Even a reverted contract operation can incur a fee."],
       ["Gas used",gasUsed,"How many units of computation this transaction consumed. More complex contract interactions often use more gas."],
       ["Token transfers",String(totalTokens),"Reported ERC-20 or NFT movements. A single contract interaction can produce several transfers; some operations have none."]
      ].map(([label,value,help])=><div className={styles["pt-story-row"]} key={label}><div><small>{label}</small><strong>{value}</strong></div><div><b>What this means</b><p>{help}</p></div></div>)}
     </div>
     <details className={styles["pt-story-advanced"]}><summary><b>Explore additional blockchain data</b><span>Gas price, nonce, method, block, addresses and execution details — each explained. ↓</span></summary>
      {[
       ["Effective gas price",gasPrice,"The reported price per gas unit. One Gwei is one-billionth of an ETH; the actual fee depends on gas used."],
       ["Nonce",fmt(insights?.nonce),"The sequence number of transactions sent by an Ethereum account. An earlier pending nonce can delay later transactions."],
       ["Method",method,"The function or operation identified by the explorer, if available. A method name does not prove what the operation achieved."],
       ["Block number",confirmed?fmt(insights?.blockNumber??tx.blockNumber??tx.block_number):"Pending","The block that included this transaction, if one exists."],
       ["Sender",from??"Unavailable","The sending Ethereum address. It does not reveal the real-world identity of the owner."],
       ["Recipient / contract",to??insights?.createdContract??"Unavailable","The destination address or contract. Contract creation can have no ordinary recipient address."],
       ["Transaction hash",hash,"The unique identifier for looking up this transaction on Ethereum."]
      ].map(([label,value,help])=><div className={styles["pt-story-row"]} key={label}><div><small>{label}</small><strong className={styles["pt-story-wrap"]}>{value}</strong></div><div><b>What this means</b><p>{help}</p></div></div>)}
      {insights?.revertReason&&<p className={styles.ethFailure}>Reported failure reason: {insights.revertReason}</p>}
      <details className={styles["pt-story-raw"]}><summary>View raw Ethereum data</summary><pre>{JSON.stringify({transaction:tx,insights},null,2)}</pre></details>
     </details>
     <section className={styles["pt-story-flow"]} aria-label="Ethereum transaction movement">
      <h3>WHERE DID THE ETHEREUM ASSETS GO?</h3>
      <p className={styles["pt-story-flowlead"]}>Ethereum uses account-to-account transactions and smart contracts—not Bitcoin's input/output model. The flow below shows the direct transaction and any token movements reported by the explorer.</p>
      <div className={styles["pt-story-flowgrid"]}><div className={styles["pt-story-flowendpoint"]}><small>FROM · SENDING ADDRESS</small><strong className={styles.ethAddressValue}>{from?short(from):"Unavailable"}</strong><small>Account that submitted the transaction</small></div><div className={styles["pt-story-path"]} aria-hidden="true"><span className={styles["pt-story-linegold"]}/><div className={styles["pt-story-coin"]}>◆</div><span className={styles["pt-story-lineteal"]}/></div><div className={styles["pt-story-flowendpoint"]}><small>TO · DESTINATION</small><strong className={styles.ethAddressValue}>{to?short(to):insights?.createdContract?"Contract creation":"Unavailable"}</strong><small>{method}</small></div></div>
      <div className={styles["pt-story-flowfooter"]}><span>Direct ETH: <b>{ethAmount}</b></span><span>Gas fee: <b>{gasFee}</b></span></div>
      <div className={styles["pt-story-addressgrid"]}><div><h4>Transaction addresses</h4><p className={styles["pt-story-addresshelp"]}>Ethereum account and destination</p><div className={styles["pt-story-addressrow"]}><span>From {from?<a href={"/eth/address/"+from}>{short(from)} ↗</a>:<small>Unavailable</small>}</span></div><div className={styles["pt-story-addressrow"]}><span>To {to?<a href={"/eth/address/"+to}>{short(to)} ↗</a>:<small>{insights?.createdContract?"Contract creation":"Unavailable"}</small>}</span><strong>{ethAmount}</strong></div></div>
       <div><h4>Token movements <span>({totalTokens})</span></h4><p className={styles["pt-story-addresshelp"]}>ERC-20, NFT and other reported transfers</p>{tokens.slice(0,8).map((t,i)=><div className={styles["pt-story-addressrow"]} key={i}><span>{t.symbol??t.name??t.type??"Token"}<small>{t.from?short(t.from):"Unknown"} → {t.to?short(t.to):"Unknown"}</small></span><strong>{tokenAmount(t)}</strong></div>)}{tokens.length>8&&<details className={styles["pt-story-showall"]}><summary>Show remaining token movements ↓</summary>{tokens.slice(8).map((t,i)=><div className={styles["pt-story-addressrow"]} key={i}><span>{t.symbol??t.name??"Token"}<small>{t.from?short(t.from):"Unknown"} → {t.to?short(t.to):"Unknown"}</small></span><strong>{tokenAmount(t)}</strong></div>)}</details>}{insights?.tokenTransfersHasMore&&<p>More token transfers exist; Blockscout has additional records.</p>}{!hasTokens&&<p>{insights?.tokenTransfersAvailable?"No token movements were reported.":"Token-transfer data is currently unavailable."}</p>}</div></div>
     </section>
     <p className={styles["pt-story-source"]}>Live Ethereum mainnet data · <a href={"https://eth.blockscout.com/tx/"+hash} target="_blank" rel="noopener noreferrer">Verify on Blockscout ↗</a></p>
    </section>
   </>}
  </div><p className="pt-tx-footnote">Live updates approximately every 15 seconds · No wallet connection required · Block times are not transaction guarantees.</p>
 </main>;
}
