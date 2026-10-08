"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Overview = {
  btc: { available: boolean; pending: number | null; congestion: string; fastestFee: number | null; hourFee: number | null; height: number | null; explanation: string };
  eth: { available: boolean; gasGwei: number | null; latestBlock: string | number | null; explanation: string };
  updatedAt: string;
};
const format = (n: number | null | undefined) => n == null ? "—" : new Intl.NumberFormat("en-US").format(n);
const terms: Record<string, string> = {
  "Mempool": "Bitcoin's waiting area. Transactions sit here before miners include them in a block.",
  "Gas": "The fee paid to execute a transaction on Ethereum. More complex actions generally use more gas.",
  "sat/vB": "Satoshis per virtual byte: Bitcoin's fee rate. A higher rate can make a transaction more attractive to miners.",
  "Block": "A batch of transactions added to the blockchain. Bitcoin adds blocks roughly every ten minutes on average.",
  "Confirmations": "The number of blocks added since a transaction was included in a block. More confirmations generally mean greater settlement confidence."
};

export default function Page() {
  const router = useRouter();
  const [network, setNetwork] = useState<"btc" | "eth">("btc");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
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
    const q = query.trim();
    if (/^0x[a-f\d]{64}$/i.test(q)) return router.push("/eth/" + q);
    if (/^[a-f\d]{64}$/i.test(q)) return router.push("/btc/" + q);
    setError("Enter a Bitcoin transaction ID (64 letters/numbers) or Ethereum transaction hash (0x followed by 64 letters/numbers).");
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
        {error ? <p className="pt-error" role="alert">{error}</p> : <p className="pt-hint">No wallet connection required. We never ask for private keys or seed phrases.</p>}
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
          <div className="pt-metric"><span>Priority fee</span><strong>{btc?.fastestFee == null ? "—" : btc.fastestFee + " sat/vB"}</strong><small>Current high-priority fee estimate</small></div>
          <div className="pt-metric"><span>Latest block</span><strong>{format(btc?.height)}</strong><small>Most recently mined height</small></div>
        </div>
        <div className="pt-insight"><div className="pt-insight-icon">✦</div><div><h3>In plain English</h3><p>{btc?.explanation ?? "We're waiting for live Bitcoin data. Try refreshing shortly."}</p><p className="pt-note">Fee estimates change constantly. Confirmation timing depends on more than transaction count.</p></div></div>
      </> : <>
        <div className="pt-metrics">
          <div className="pt-metric"><span>Average gas estimate</span><strong>{eth?.gasGwei == null ? "—" : eth.gasGwei + " Gwei"}</strong><small>As reported by our data provider</small></div>
          <div className="pt-metric"><span>Latest block</span><strong>{eth?.latestBlock ?? "—"}</strong><small>Most recent observed block</small></div>
          <div className="pt-metric"><span>Network</span><strong>Ethereum</strong><small>Mainnet</small></div>
          <div className="pt-metric"><span>Transaction fee</span><strong>Variable</strong><small>Depends on gas used and fee rate</small></div>
        </div>
        <div className="pt-insight"><div className="pt-insight-icon">✦</div><div><h3>In plain English</h3><p>{eth?.explanation ?? "We're waiting for live Ethereum data. Try refreshing shortly."}</p><p className="pt-note">Gas prices alone do not determine the final cost of a transaction.</p></div></div>
      </>}
      <p className="pt-source">Sources: mempool.space and Blockscout · {overview ? "Updated " + new Date(overview.updatedAt).toLocaleTimeString() : "Awaiting data"} · Estimates are informational, not guarantees.</p>
    </section>

    <section className="pt-section" id="learn">
      <div className="pt-eyebrow">CRYPTO WITHOUT THE CONFUSION</div><h2>Understand every number.</h2><p className="pt-section-sub">Tap a term to learn what it means. No technical background required.</p>
      <div className="pt-glossary">{Object.entries(terms).map(([term,meaning])=><details className="pt-term" key={term}><summary>{term}<span>＋</span></summary><p>{meaning}</p></details>)}</div>
    </section>
    <section className="pt-cta"><div className="pt-eyebrow">BUILT FOR CLARITY</div><h2>Know what's happening. Know what comes next.</h2><p>From a network-wide view to your exact transaction, Pending Tracker helps you understand the blockchain without becoming an expert.</p><a href="#top" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});}}>Track a transaction ↑</a></section>
  </main>;
}
