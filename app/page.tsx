"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Overview = {
  btc: { available: boolean; pending: number | null; congestion: string; fastestFee: number | null; hourFee: number | null; halfHourFee: number | null; economyFee: number | null; recentTransactions: {id:string;fee:number|null;vsize:number|null;value:number|null}[]; projectedBlocks: {position:number;transactionCount:number|null;medianFee:number|null;feeRange:number[]|null}[]; height: number | null; latestBlock: {height:number|null; ageMinutes:number; transactionCount:number|null; id:string|null}|null; explanation: string };
  eth: { available: boolean; gasGwei: number | null; latestBlock: string | number | null; explanation: string };
  updatedAt: string;
};
const format = (n: number | null | undefined) => n == null ? "—" : new Intl.NumberFormat("en-US").format(n);
const terms: Record<string, string> = {
  "Sats": "Satoshis are the smallest units of Bitcoin. There are 100 million sats in one bitcoin.",
  "Priority fee": "An estimate of a competitive Bitcoin fee rate. It does not guarantee confirmation.",
  "Mempool": "Bitcoin's waiting area. Transactions sit here before miners include them in a block.",
  "Gas": "The fee paid to execute a transaction on Ethereum. More complex actions generally use more gas.",
  "sat/vB": "Satoshis per virtual byte: Bitcoin's fee rate. A higher rate can make a transaction more attractive to miners.",
  "Block": "A batch of transactions added to the blockchain. Bitcoin adds blocks roughly every ten minutes on average.",
  "Confirmations": "The number of blocks added since a transaction was included in a block. More confirmations generally mean greater settlement confidence.",
  "Transaction hash": "A public tracking number for a blockchain transaction. It is safe to share a transaction hash, but never a wallet seed phrase or private key.",
  "RBF": "Replace-by-fee: a way some Bitcoin wallets let you replace an unconfirmed transaction with one that pays a higher fee.",
  "CPFP": "Child-pays-for-parent: a Bitcoin technique that can encourage miners to confirm a low-fee transaction by attaching a higher-fee spending transaction.",
  "Nonce": "Ethereum uses a sequence number for transactions from the same account. An earlier pending nonce can hold up later transactions."
};

export default function Page() {
  const router = useRouter();
  const [network, setNetwork] = useState<"btc" | "eth">("btc");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSatRate, setSelectedSatRate] = useState(5);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch("/api/network");
        if (!r.ok) throw new Error("Network data unavailable");
        const j = await r.json();
        if (active) setOverview(j);
      } catch { if (active) setOverview(null); }
      finally { if (active) setLoading(false); }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  function search() {
    const q = query.trim().replace(/^https?:\/\/[^/]+\/tx\//i, "").split(/[?#]/)[0].replace(/\/$/, "");
    if (/^0x[a-f\d]{64}$/i.test(q)) return router.push("/eth/" + q);
    if (/^[a-f\d]{64}$/i.test(q)) return router.push("/btc/" + q);
    setError("Paste a Bitcoin transaction ID or Ethereum transaction hash. You can also paste a transaction link from a blockchain explorer.");
  }

  const btc = overview?.btc, eth = overview?.eth;
  return <main className="pt-shell">
    <div className="pt-hero">
      <div className="pt-eyebrow"><span className="pt-pulse"/> THE BLOCKCHAIN, EXPLAINED</div>
      <h1>Crypto moves fast.<br/><span>Understanding it shouldn't be hard.</span></h1>
      <p className="pt-lead">Explore what's happening on Bitcoin and Ethereum, or find out exactly what's happening with your transaction. Real blockchain data, translated into plain English.</p>
      <div className="pt-searchbox">
        <div className="pt-search-label">UNDERSTAND YOUR TRANSACTION</div>
        <div className="pt-searchrow">
          <input aria-label="Transaction hash" placeholder="Paste a Bitcoin or Ethereum transaction hash…" value={query} onChange={e=>{setQuery(e.target.value);setError("");}} onKeyDown={e=>{if(e.key==="Enter") search();}} spellCheck={false}/>
          <button onClick={search}>Explain my transaction →</button>
        </div>
        {error ? <p className="pt-error" role="alert">{error}</p> : <p className="pt-hint">No wallet connection required. Paste a transaction ID or explorer link. Never share private keys or seed phrases.</p>}
      </div>
    </div>

    <section className="pt-section" id="network">
      <div className="pt-section-head"><div><div className="pt-eyebrow">LIVE NETWORK INTELLIGENCE</div><h2>What's happening on the blockchain?</h2><p>Live data with the technical jargon translated for you.</p></div><span className="pt-live">{loading ? "Loading live data…" : overview ? "● Live · updates every minute" : "Network data temporarily unavailable"}</span></div>
      <div className="pt-tabs" role="tablist" aria-label="Choose blockchain">
        <button role="tab" aria-selected={network==="btc"} className={network==="btc"?"selected":""} onClick={()=>setNetwork("btc")}>₿ &nbsp; Bitcoin</button>
        <button role="tab" aria-selected={network==="eth"} className={network==="eth"?"selected":""} onClick={()=>setNetwork("eth")}>◆ &nbsp; Ethereum</button>
      </div>
      {network==="btc" ? <>
        <div className="pt-metrics">
          <div className="pt-metric"><span>Transactions waiting</span><strong>{format(btc?.pending)}</strong><small>In the Bitcoin mempool</small></div>
          <div className="pt-metric"><span>Network traffic</span><strong>{btc?.congestion ?? "—"}</strong><small>Based on pending transaction count</small></div>
          <div className="pt-metric"><span>Priority fee</span><strong>{btc?.fastestFee == null ? "—" : btc.fastestFee + " sat/vB"}</strong><small>Estimated competitive fee rate; not a guarantee</small></div>
          <div className="pt-metric"><span>Latest block</span><strong>{format(btc?.height)}</strong><small>{btc?.latestBlock ? `Mined about ${btc.latestBlock.ageMinutes} min ago` : "Most recently mined height"}</small></div>
        </div>
        <section className="pt-activity-panel">
          <div className="pt-activity-head"><div><div className="pt-eyebrow">LIVE BITCOIN EXPLORER</div><h3>New transactions entering the mempool</h3><p>Recently observed unconfirmed Bitcoin transactions. Updates every minute.</p></div><span className="pt-live">● Recent activity</span></div>
          <div className="pt-activity-list">{btc?.recentTransactions?.length ? btc.recentTransactions.map(tx=><a className="pt-activity-row" href={"/btc/"+tx.id} key={tx.id}>
            <span className="pt-activity-hash">{tx.id.slice(0,12)}…{tx.id.slice(-8)}</span>
            <span>{tx.fee!=null&&tx.vsize ? (tx.fee/tx.vsize).toFixed(1)+" sat/vB" : "Fee unavailable"}</span>
            <span>{tx.value==null ? "Value unavailable" : (tx.value/100000000).toFixed(5)+" BTC"}</span>
            <span className="pt-activity-arrow">Inspect ↗</span>
          </a>) : <p className="pt-activity-empty">Waiting for recent Bitcoin transactions from the network.</p>}</div>
          <p className="pt-fee-disclaimer">Recently observed mempool activity, not guaranteed distinct payments. Transactions may confirm or be replaced between updates.</p>
        </section>
        <section className="pt-queue-panel" aria-label="Bitcoin pending fee position explorer">
          <div className="pt-eyebrow">BITCOIN PENDING-TIME EXPLORER</div>
          <h3>At your fee rate, where might you land?</h3>
          <p>Explore the live waiting line. Change the sats per virtual byte to compare your fee with the projected next blocks.</p>
          <div className="pt-queue-controls"><label htmlFor="sat-rate">Your Bitcoin fee rate</label><input id="sat-rate" type="number" min="0.1" max="100000" step="0.1" value={selectedSatRate} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=0.1&&v<=100000)setSelectedSatRate(v);}}/><strong>sat/vB</strong></div>
          <div className="pt-queue-blocks">
            {(btc?.projectedBlocks?.length ? btc.projectedBlocks : []).map(block=>{
              const low=block.feeRange?.[0], high=block.feeRange?.[1];
              const above=low!=null&&selectedSatRate>=low;
              const below=high!=null&&selectedSatRate<high;
              return <div className={"pt-queue-block "+(above?"pt-queue-match":"")} key={block.position}>
                <span>Projected block {block.position}</span>
                <strong>{block.position===1?"Next block":"~"+block.position*10+" min average"}</strong>
                <small>{low==null||high==null?"Fee range unavailable":low.toFixed(1)+"–"+high.toFixed(1)+" sat/vB"}</small>
                <small>{block.transactionCount==null?"":format(block.transactionCount)+" transactions"}</small>
                <div className="pt-queue-indicator">{low==null?"Data unavailable":above&&!below?"Your rate is above this block's displayed fee range":above?"Your rate overlaps this block's fee range":"Your rate is below this block's displayed fee range"}</div>
              </div>;
            })}
            {!btc?.projectedBlocks?.length&&<p>Projected block information is temporarily unavailable. Fee recommendations above may still be available.</p>}
          </div>
          <p className="pt-fee-disclaimer">These are mempool.space projected blocks, not scheduled confirmations. The time labels use Bitcoin's long-run ~10-minute average per block, not a prediction. Fee ranges overlap, transaction dependencies affect placement, and a rate inside a range does not guarantee inclusion. This is a fee comparison—not a forecast for your specific transaction.</p>
        </section>
        <div className="pt-fee-panel">
          <div className="pt-fee-heading"><div><div className="pt-eyebrow">LIVE BITCOIN FEE GUIDE</div><h3>How fees affect your place in line</h3><p>Compare current fee-rate estimates. Longer bars mean higher fees, not a guaranteed shorter wait.</p></div><span className="pt-live">Updated with network data</span></div>
          <div className="pt-fee-bars">{([
            {name:"High priority",hint:"Next-block target",value:btc?.fastestFee},
            {name:"Standard",hint:"Around 30 minutes",value:btc?.halfHourFee},
            {name:"Patient",hint:"Around 1 hour",value:btc?.hourFee},
            {name:"Economy",hint:"May take longer",value:btc?.economyFee}
          ] as {name:string;hint:string;value:number|null|undefined}[]).map(tier=><div className="pt-fee-row" key={tier.name}>
            <div className="pt-fee-label"><b>{tier.name}</b><small>{tier.hint}</small></div>
            <div className="pt-fee-track" role="img" aria-label={tier.value == null ? tier.name + ": unavailable" : tier.name + ": " + tier.value + " sats per virtual byte"}><div className="pt-fee-fill" style={{width:tier.value == null || !btc?.fastestFee ? "0%" : Math.max(3,Math.min(100,tier.value / btc.fastestFee * 100)) + "%"}} /></div>
            <strong>{tier.value == null ? "—" : tier.value + " sat/vB"}</strong>
          </div>)}</div>
          <p className="pt-fee-disclaimer">A sat is 1/100,000,000 of a BTC. These are network fee-rate recommendations from mempool.space, not transaction-specific predictions. Blocks arrive unpredictably, and actual confirmation time can differ substantially. Paste your transaction above for its own fee comparison.</p>
        </div>
        <div className="pt-explainer-grid">
          <article className="pt-explainer"><div className="pt-eyebrow">MEMPOOL EXPLAINED</div><h3>Bitcoin's waiting room</h3><p>{btc?.pending == null ? "Waiting for live mempool data." : "There are " + format(btc.pending) + " transactions waiting to be included in a block. The queue grows when people send Bitcoin and shrinks when miners confirm transactions."}</p><a href="https://mempool.space" target="_blank" rel="noopener noreferrer">View the live mempool ↗</a></article>
          <article className="pt-explainer"><div className="pt-eyebrow">FEES EXPLAINED</div><h3>What are sats and priority fees?</h3><p>One sat is 0.00000001 BTC. A fee rate in sat/vB tells you how many sats you pay for each virtual byte of transaction size, not how much Bitcoin you send.</p><p>{btc?.fastestFee == null ? "Fee estimates are temporarily unavailable." : "At " + btc.fastestFee + " sat/vB, a hypothetical 140-vB transaction would cost around " + format(Math.round(btc.fastestFee * 140)) + " sats. Your transaction may have a different size."}</p></article>
          <article className="pt-explainer"><div className="pt-eyebrow">LATEST BLOCK EXPLAINED</div><h3>A new batch was confirmed</h3><p>{btc?.latestBlock ? "Block #" + format(btc.latestBlock.height) + " was mined about " + btc.latestBlock.ageMinutes + " minutes ago and included " + format(btc.latestBlock.transactionCount) + " transactions." : "Waiting for latest block details."}</p><p>Blocks arrive roughly every 10 minutes on average, but individual intervals vary. Not every pending transaction gets into the next block.</p></article>
        </div>
        <div className="pt-insight"><div className="pt-insight-icon">✦</div><div><h3>In plain English</h3><p>{btc?.explanation ?? "We're waiting for live Bitcoin data. Try refreshing shortly."}</p><p className="pt-note">Fee estimates change constantly. Confirmation timing depends on more than transaction count.</p></div></div>
      </> : <>
        <div className="pt-metrics">
          <div className="pt-metric"><span>Average gas estimate</span><strong>{eth?.gasGwei == null ? "—" : eth.gasGwei + " Gwei"}</strong><small>As reported by our data provider</small></div>
          <div className="pt-metric"><span>Latest block</span><strong>{eth?.latestBlock ?? "—"}</strong><small>Most recent observed block</small></div>
          <div className="pt-metric"><span>Network</span><strong>Ethereum</strong><small>Mainnet</small></div>
          <div className="pt-metric"><span>Transaction fee</span><strong>Variable</strong><small>Depends on gas used and fee rate</small></div>
        </div>
        <div className="pt-explainer-grid">
          <article className="pt-explainer"><div className="pt-eyebrow">ETHEREUM GAS</div><h3>What does Gwei mean?</h3><p>One Gwei is one billionth of an ETH. Ethereum gas prices are quoted in Gwei per unit of gas used, not as a fixed transfer fee.</p><p>{eth?.gasGwei == null ? "Live gas information is unavailable." : "The current provider estimate is " + eth.gasGwei + " Gwei. At that rate, a simple 21,000-gas ETH transfer would cost about " + (eth.gasGwei * 21000 / 1000000000).toFixed(6) + " ETH, if that rate applied to the whole transaction."}</p></article>
          <article className="pt-explainer"><div className="pt-eyebrow">LATEST ETHEREUM BLOCK</div><h3>Another batch of activity</h3><p>{eth?.latestBlock == null ? "Waiting for Ethereum block data." : "The latest observed Ethereum block is #" + eth.latestBlock + ". It contains network activity recorded by validators."}</p><p>Ethereum normally proposes blocks roughly every 12 seconds. Inclusion and finality are different milestones.</p><a href="https://eth.blockscout.com/blocks" target="_blank" rel="noopener noreferrer">Explore Ethereum blocks ↗</a></article>
          <article className="pt-explainer"><div className="pt-eyebrow">PENDING ETHEREUM TRANSACTIONS</div><h3>Why might a transfer wait?</h3><p>A pending transaction can be delayed by insufficient fee settings, a busy network, or an earlier transaction from the same account with a lower nonce.</p><p>Paste a transaction hash above to see its observed status. A network-wide gas estimate alone cannot diagnose a particular transfer.</p></article>
        </div>
        <div className="pt-insight"><div className="pt-insight-icon">✦</div><div><h3>In plain English</h3><p>{eth?.explanation ?? "We're waiting for live Ethereum data. Try refreshing shortly."}</p><p className="pt-note">Gas prices alone do not determine the final cost of a transaction.</p></div></div>
      </>}
      <p className="pt-source">Explanations are generated from live blockchain data using transparent rules, not a generative AI model. Sources: mempool.space and Blockscout · {overview ? "Updated " + new Date(overview.updatedAt).toLocaleTimeString() : "Awaiting data"} · Estimates are informational, not guarantees.</p>
    </section>

    <section className="pt-section" id="how-it-works">
      <div className="pt-eyebrow">HOW IT WORKS</div><h2>From confusing to clear in seconds.</h2>
      <div className="pt-metrics pt-steps">
        <div className="pt-metric"><span>01 · FIND</span><strong>Paste a transaction</strong><small>Copy a transaction ID or link from your wallet or exchange. No signup or wallet connection.</small></div>
        <div className="pt-metric"><span>02 · UNDERSTAND</span><strong>Read the explanation</strong><small>See whether it is pending, confirmed, failed, or not yet found—and what the evidence means.</small></div>
        <div className="pt-metric"><span>03 · DECIDE</span><strong>Know your options</strong><small>Get practical next steps and verify the details with an independent blockchain explorer.</small></div>
      </div>
    </section>
    <section className="pt-section" id="learn">
      <div className="pt-eyebrow">CRYPTO WITHOUT THE CONFUSION</div><h2>Understand every number.</h2><p className="pt-section-sub">Tap a term to learn what it means. No technical background required.</p>
      <div className="pt-glossary">{Object.entries(terms).map(([term,meaning])=><details className="pt-term" key={term}><summary>{term}<span>＋</span></summary><p>{meaning}</p></details>)}</div>
    </section>
    <section className="pt-cta"><div className="pt-eyebrow">BUILT FOR CLARITY</div><h2>Know what's happening. Know what comes next.</h2><p>From a network-wide view to your exact transaction, Pending Tracker helps you understand the blockchain without becoming an expert.</p><a href="#top" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});}}>Track a transaction ↑</a></section>
  </main>;
}
