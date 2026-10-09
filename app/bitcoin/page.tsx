import ChainDashboard from "../components/ChainDashboard";
import ChainSearch from "../components/ChainSearch";
import Link from "next/link";
export const metadata={title:"Bitcoin Explorer | Pending Tracker",description:"Explore Bitcoin blocks, recent transactions, the mempool and fee estimates in plain English."};
async function get(url:string){try{const r=await fetch(url,{next:{revalidate:15},signal:AbortSignal.timeout(7000)});return r.ok?await r.json():null}catch{return null}}
const n=(v:number|null|undefined)=>v==null?"—":new Intl.NumberFormat("en-US").format(v);
export default async function BitcoinExplorer(){
 const [blocks,pool,fees,transactions]=await Promise.all([get("https://mempool.space/api/blocks"),get("https://mempool.space/api/mempool"),get("https://mempool.space/api/v1/fees/recommended"),get("https://mempool.space/api/mempool/recent")]);
 const recent=Array.isArray(blocks)?blocks.slice(0,12):[];
 const txs=Array.isArray(transactions)?transactions.slice(0,12):[];
 return <main className="pt-chain-page">
  <div className="pt-chain-back"><Link href="/">← Back to Pending Tracker</Link><span>BITCOIN EXPLORER</span></div>
  <div className="pt-chain-hero pt-chain-hero-refined"><div className="pt-chain-symbol pt-chain-bitcoin">₿</div><div><div className="pt-eyebrow">THE BITCOIN NETWORK, EXPLAINED</div><h1>Explore Bitcoin.</h1><p>A live view of Bitcoin, with simple explanations before the technical details.</p></div></div>
  <section className="pt-chain-how"><div className="pt-chain-how-intro"><div className="pt-eyebrow">START HERE · 30-SECOND EXPLANATION</div><h2>How does Bitcoin work?</h2><p>When you send Bitcoin, your transaction enters a waiting area called the mempool. Miners choose transactions and add them to blocks, which confirm the payment. The fee you offer, measured in sats per virtual byte, can influence how soon it is picked up.</p></div><div className="pt-chain-how-steps">
   <div><span>01</span><strong>Send</strong><p>Your payment is broadcast to the Bitcoin network.</p></div>
   <div><span>02</span><strong>Wait & set a fee</strong><p>The transaction waits for a miner. Higher fee rates may help it get selected sooner.</p></div>
   <div><span>03</span><strong>Confirmed in a block</strong><p>A miner includes the transaction in a block. More blocks add confirmations.</p></div>
  </div><details><summary>What do the technical words mean? <span aria-hidden="true">＋</span></summary><p>Satoshi (sat): 0.00000001 BTC. sat/vB: the fee rate relative to transaction size, not the total fee. Mempool: waiting area for unconfirmed transactions. Block: a recorded batch of transactions. Confirmation: a block includes your transaction.</p></details></section>
  <div className="pt-chain-search"><h2>Find a Bitcoin transaction or address</h2><p>Search directly on this blockchain. We'll show the result and explain what the record means in plain English.</p><ChainSearch chain="bitcoin"/></div>
  <ChainDashboard chain="bitcoin"/>
  <div className="pt-chain-foot"><Link href="/ethereum">Explore Ethereum →</Link><span>Data: mempool.space · Estimates are not guarantees.</span></div>
 </main>
}