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
  <div className="pt-chain-search"><h2>Find a Bitcoin transaction or address</h2><p>Search directly on this blockchain. We'll show the result and explain what the record means in plain English.</p><ChainSearch chain="bitcoin"/></div>
  <section className="pt-chain-intro"><div className="pt-chain-how-intro"><div className="pt-eyebrow">THE NETWORK, EXPLAINED SIMPLY</div><h2>How does Bitcoin work?</h2><p>When you send Bitcoin, your payment is broadcast to the network and usually enters a waiting area called the mempool. Miners select waiting transactions and group them into blocks. A new block is found about every 10 minutes on average, but blocks do not follow a schedule. When your payment appears in a block, it receives its first confirmation; each later block adds another confirmation. A satoshi, or sat, is the smallest unit of Bitcoin: 100 million sats make one BTC. Transaction fees are quoted in sats per virtual byte (sat/vB), meaning the fee rate relative to the size of your transaction. Offering a higher fee rate can help miners choose your transaction sooner when the network is busy, but no fee guarantees a specific waiting time. The live figures below show how many transactions are waiting and what current fee recommendations mean.</p></div><details><summary>What do the technical words mean? <span aria-hidden="true">＋</span></summary><p>Satoshi (sat): 0.00000001 BTC. sat/vB: the fee rate relative to transaction size, not the total fee. Mempool: waiting area for unconfirmed transactions. Block: a recorded batch of transactions. Confirmation: a block includes your transaction.</p></details></section>
  <ChainDashboard chain="bitcoin"/>
  <div className="pt-chain-foot"><Link href="/ethereum">Explore Ethereum →</Link><span>Data: mempool.space · Estimates are not guarantees.</span></div>
 </main>
}