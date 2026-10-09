import ChainDashboard from "../components/ChainDashboard";
import ChainSearch from "../components/ChainSearch";
import Link from "next/link";
export const metadata={title:"Ethereum Explorer | Pending Tracker",description:"Explore Ethereum blocks, transactions, gas fees and smart-contract activity in plain English."};
async function get(url:string){try{const r=await fetch(url,{next:{revalidate:15},signal:AbortSignal.timeout(7000)});return r.ok?await r.json():null}catch{return null}}
const n=(v:number|null|undefined)=>v==null?"—":new Intl.NumberFormat("en-US").format(v);
export default async function EthereumExplorer(){
 const [blocks,transactions,stats]=await Promise.all([get("https://eth.blockscout.com/api/v2/blocks?type=block"),get("https://eth.blockscout.com/api/v2/transactions?filter=validated"),get("https://eth.blockscout.com/api/v2/stats")]);
 const recent=Array.isArray(blocks?.items)?blocks.items.slice(0,12):[];
 const txs=Array.isArray(transactions?.items)?transactions.items.slice(0,12):[];
 return <main className="pt-chain-page">
  <div className="pt-chain-back"><Link href="/">← Back to Pending Tracker</Link><span>ETHEREUM EXPLORER</span></div>
  <div className="pt-chain-hero pt-chain-hero-refined"><div className="pt-chain-symbol pt-chain-ethereum">◆</div><div><div className="pt-eyebrow">THE ETHEREUM NETWORK, EXPLAINED</div><h1>Explore Ethereum.</h1><p>A live view of Ethereum, with clear explanations of gas, blocks, transactions and contracts.</p></div></div>
  <section className="pt-chain-how"><div className="pt-chain-how-intro"><div className="pt-eyebrow">START HERE · 30-SECOND EXPLANATION</div><h2>How does Ethereum work?</h2><p>When you send ETH or use an Ethereum app, you create a transaction. Validators add transactions to blocks, usually around every 12 seconds. You pay gas for the work performed, and the price of gas is commonly shown in Gwei.</p></div><div className="pt-chain-how-steps">
   <div><span>01</span><strong>Submit</strong><p>Your transfer or contract request reaches Ethereum.</p></div>
   <div><span>02</span><strong>Pay for gas</strong><p>Gas covers the computation; your fee settings can affect inclusion.</p></div>
   <div><span>03</span><strong>Confirmed in a block</strong><p>A validator includes the transaction in a block. The result may succeed or fail.</p></div>
  </div><details><summary>What do the technical words mean? <span aria-hidden="true">＋</span></summary><p>Gas: units of computation used by an Ethereum transaction. Gwei: one-billionth of one ETH, commonly used for gas prices. Validator: a participant that proposes or confirms blocks. Nonce: the order number of transactions sent from an address. Smart contract: code that runs on Ethereum.</p></details></section>
  <div className="pt-chain-search"><h2>Find an Ethereum transaction or address</h2><p>Search directly on this blockchain. We'll show the result and explain what the record means in plain English.</p><ChainSearch chain="ethereum"/></div>
  <ChainDashboard chain="ethereum"/>
  <div className="pt-chain-foot"><Link href="/bitcoin">Explore Bitcoin →</Link><span>Data: Blockscout · Gas fees and network activity can change.</span></div>
 </main>
}