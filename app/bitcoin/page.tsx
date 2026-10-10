import ChainDashboard from "../components/ChainDashboard";
import BitcoinExplorerLive from "../components/BitcoinExplorerLive";
import Link from "next/link";
export const metadata={title:"Bitcoin Explorer | Pending Tracker",description:"Explore live Bitcoin mempool confirmation projections, fees, blocks and transactions with clear explanations."};
export default function BitcoinExplorer(){
 return <main className="pt-shell pt-bitcoin-explorer">
  <div className="pt-chain-back"><Link href="/">← Back to Pending Tracker</Link><span>BITCOIN EXPLORER</span></div>
  <header className="pt-bitcoin-intro"><div className="pt-hero-ambient pt-hero-ambient-btc" aria-hidden="true"><span/><span/><span/><span/><span/><span/></div><div className="pt-hero-ambient pt-hero-ambient-btc pt-bitcoin-ambient-right" aria-hidden="true"><span/><span/><span/><span/><span/><span/></div><div className="pt-eyebrow">₿ THE BITCOIN NETWORK, EXPLAINED</div><h1>Explore <span>Bitcoin.</span></h1><p>Live blockchain data. Clear answers. Understand what Bitcoin is doing, what transactions are waiting for, and what the numbers mean.</p></header>
  <BitcoinExplorerLive part="search"/>
  <section className="pt-bitcoin-estimates" aria-label="Current Bitcoin transaction confirmation estimates"><ChainDashboard chain="bitcoin" view="estimates"/></section>
  <BitcoinExplorerLive part="live"/>
  <section className="pt-bitcoin-education" id="bitcoin-fees">
   <div className="pt-eyebrow">UNDERSTAND THE NETWORK</div><h2>Bitcoin, without the jargon.</h2><p className="pt-bitcoin-education-lead">Every number has a meaning. Here's what to know when you're sending, receiving or exploring Bitcoin.</p>
   <div className="pt-bitcoin-education-grid">
    <article><span>01 / WAITING</span><h3>What is the mempool?</h3><p>It's the collection of unconfirmed transactions that nodes have heard about. Miners can choose transactions from it for the next block, often favoring competitive fees.</p></article>
    <article><span>02 / FEES</span><h3>What does sat/vB mean?</h3><p>Bitcoin fee rates are measured in satoshis per virtual byte. The rate matters more than the total fee when comparing transaction priority.</p></article>
    <article><span>03 / CONFIRMATIONS</span><h3>When is a payment confirmed?</h3><p>Its first confirmation arrives when a miner includes it in a block. Additional blocks build on that history. Blocks average about ten minutes, but timing varies.</p></article>
    <article><span>04 / ESTIMATES</span><h3>Why can waiting times change?</h3><p>New transactions, changing fee competition and unpredictable block arrivals can move the queue. Projected blocks are estimates, not scheduled appointments.</p></article>
   </div>
  </section>
  <div className="pt-chain-foot"><Link href="/ethereum">Explore Ethereum →</Link><span>Data from mempool.space · Informational estimates, not guarantees.</span></div>
 </main>;
}
