"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Overview = {
  btc: { available: boolean; pending: number | null; congestion: string; fastestFee: number | null; hourFee: number | null; halfHourFee: number | null; economyFee: number | null; confirmedTransactions: string[]; recentTransactions: {id:string;fee:number|null;vsize:number|null;value:number|null}[]; projectedBlocks: {position:number;transactionCount:number|null;medianFee:number|null;feeRange:number[]|null}[]; height: number | null; latestBlock: {height:number|null; ageMinutes:number; transactionCount:number|null; id:string|null}|null; explanation: string };
  eth: { available: boolean; gasGwei: number | null; latestBlock: string | number | null; recentBlocks: {height:number|string|null;hash:string|null;timestamp:string|null;transactionsCount:number|null}[]; recentTransactions: {hash:string;status:string|null;timestamp:string|null;block:number|null}[]; explanation: string };
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
  const [newestEvents, setNewestEvents] = useState<{btc:string;eth:string}>({btc:"",eth:""});
  const [selectedSatRate, setSelectedSatRate] = useState(5);
  const [liveBtcTransactions, setLiveBtcTransactions] = useState<{id:string;fee:number|null;vsize:number|null}[]>([]);
  const [btcStreamOnline, setBtcStreamOnline] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch("/api/network", {cache:"no-store"});
        if (!r.ok) throw new Error("Network data unavailable");
        const j = await r.json();
        if (active) setOverview(previous => { if(previous?.btc?.height != null && j.btc?.height > previous.btc.height) setNewestEvents(v=>({...v,btc:"New block #"+j.btc.height+" confirmed"})); else if(previous?.eth?.latestBlock != null && Number(j.eth?.latestBlock) > Number(previous.eth.latestBlock)) setNewestEvents(v=>({...v,eth:"New block #"+j.eth.latestBlock+" observed"})); return j; });
      } catch { if (active) setOverview(null); }
      finally { if (active) setLoading(false); }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    let active = true;
    let socket: WebSocket | null = null;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let lastRefresh = 0;
    const connect = () => {
      if (!active || document.visibilityState === "hidden") return;
      try {
        socket = new WebSocket("wss://mempool.space/api/v1/ws");
        socket.onopen = () => {
          if (!active) return;
          setBtcStreamOnline(true);
          socket?.send(JSON.stringify({action:"want",data:["blocks","mempool-blocks","stats","mempool-transactions"]}));
        };
        socket.onmessage = event => {
          if (!active) return;
          try {
            const msg = JSON.parse(event.data);
            const tx = msg["mempool-tx"] ?? msg.tx ?? (Array.isArray(msg["mempool-transactions"]) ? msg["mempool-transactions"][0] : null);
            if (tx && typeof tx.txid === "string" && /^[a-f0-9]{64}$/i.test(tx.txid)) {
              setLiveBtcTransactions(prev => [{id:tx.txid,fee:Number.isFinite(Number(tx.fee))?Number(tx.fee):null,vsize:Number.isFinite(Number(tx.vsize))?Number(tx.vsize):null},...prev.filter(t=>t.id!==tx.txid)].slice(0,12));
            }
            if ((msg.block || msg["mempool-blocks"]) && Date.now()-lastRefresh>3000) {
              lastRefresh=Date.now();
              fetch("/api/network",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(active&&j)setOverview(j);}).catch(()=>{});
            }
          } catch {}
        };
        socket.onclose = () => {
          if (!active) return;
          setBtcStreamOnline(false);
          reconnect = setTimeout(connect, 5000);
        };
        socket.onerror = () => socket?.close();
      } catch { setBtcStreamOnline(false); reconnect=setTimeout(connect,5000); }
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") { socket?.close(); if(reconnect)clearTimeout(reconnect); }
      else if (!socket || socket.readyState===WebSocket.CLOSED) connect();
    };
    connect();
    document.addEventListener("visibilitychange",visibility);
    return () => { active=false; if(reconnect)clearTimeout(reconnect); document.removeEventListener("visibilitychange",visibility); socket?.close(); };
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
      <div className="pt-hero-intro">
        <div className="pt-eyebrow"><span className="pt-pulse"/> THE BLOCKCHAIN, MADE SIMPLE</div>
        <h1>Your blockchain explorer.<br/><span>Without the confusion.</span></h1>
        <p className="pt-lead">Explore live Bitcoin and Ethereum activity, track any transaction, and understand what the technical details actually mean. We turn complicated blockchain data into clear, everyday language.</p>
        <div className="pt-hero-trust"><span>◇ Live blockchain data</span><span>◇ Plain-English explanations</span><span>◇ No account needed</span></div>
      </div>
      <div className="pt-searchbox" id="transaction-search">
        <div className="pt-search-top"><div><div className="pt-search-label">TRANSACTION EXPLAINER</div><h2>Wondering where your crypto went?</h2><p className="pt-search-explain">Paste your Bitcoin transaction ID or Ethereum transaction hash. We'll check the blockchain and give you an easy-to-read breakdown of <strong>whether it's pending or confirmed, what the fees mean, why it might be taking longer, and what you can do next.</strong> No technical knowledge needed.</p></div><div className="pt-search-symbol" aria-hidden="true">↗</div></div>
        <div className="pt-searchrow">
          <input aria-label="Transaction hash" placeholder="Paste a Bitcoin TXID, Ethereum hash, or explorer link" value={query} onChange={e=>{setQuery(e.target.value);setError("");}} onKeyDown={e=>{if(e.key==="Enter") search();}} spellCheck={false}/>
          <button onClick={search}>Explain my transaction <span aria-hidden="true">→</span></button>
        </div>
        {error ? <p className="pt-error" role="alert">{error}</p> : <p className="pt-hint">Free to explore · No wallet connection or signup · Never enter a seed phrase or private key.</p>}
      </div>
    </div>

    <section className="pt-section" id="network">
      <div className="pt-section-head"><div><div className="pt-eyebrow">LIVE BLOCKCHAIN EXPLORER</div><h2>{network==="btc"?"The Bitcoin Network, Live.":"The Ethereum Network, Live."}</h2><p>See what's happening on the network right now—and understand what it means for your transactions.</p></div><span className="pt-live" role="status">{loading?"Loading live data…":overview?"● Live data · refreshed every 5 seconds":"Network data temporarily unavailable"}</span></div>
      <div className="pt-tabs" role="tablist" aria-label="Choose blockchain">
        <button role="tab" aria-selected={network==="btc"} className={network==="btc"?"selected":""} onClick={()=>setNetwork("btc")}>₿ &nbsp; Bitcoin</button>
        <button role="tab" aria-selected={network==="eth"} className={network==="eth"?"selected":""} onClick={()=>setNetwork("eth")}>◆ &nbsp; Ethereum</button>
      </div>
      {newestEvents[network] ? <div className="pt-new-block" role="status">✦ {newestEvents[network]} · {network==="btc"?"Bitcoin":"Ethereum"} network</div> : null}
      <div className="pt-overview" aria-live="polite">
        <div className="pt-overview-heading"><div><div className="pt-eyebrow">{network==="btc"?"BITCOIN AT A GLANCE":"ETHEREUM AT A GLANCE"}</div><h3>{network==="btc"?"Bitcoin, explained as it happens":"Ethereum, explained as it happens"}</h3><p>{network==="btc"?"Four live signals that tell you whether Bitcoin payments may move quickly or need more time.":"Understand what Ethereum is doing right now, and how its network fees work."}</p></div><span className="pt-overview-mark" aria-hidden="true">{network==="btc"?"₿":"◆"}</span></div>
        <div className="pt-overview-cards">
          {network==="btc" ? <>
            <div className="pt-overview-card"><span>Network traffic</span><strong>{btc?.congestion??"—"}</strong><small>Network traffic describes how crowded Bitcoin's waiting area is. When many payments compete for limited block space, some can take longer to confirm.</small><p className="pt-card-why"><b>Why it matters:</b> {btc?.congestion==="Busy"?"The queue is busy, so low-fee payments may wait longer.":btc?.congestion==="Moderate"?"There is some competition for block space; fees may affect your place in line.":btc?.congestion==="Light"?"The queue is relatively light, but confirmation times can still vary.":"The busier the network, the more important your fee rate may become."}</p><details className="pt-card-more"><summary>See an example <span aria-hidden="true">＋</span></summary><p>Think of Bitcoin blocks as buses with limited seats. When lots of people are waiting, not everyone gets on the next bus. Miners generally select transactions based on the fees they offer.</p></details></div>
            <div className="pt-overview-card"><span>Transactions waiting</span><strong>{format(btc?.pending)}</strong><small>These are unconfirmed Bitcoin transactions in the mempool—the network's waiting area. Miners choose transactions from this queue to include in new blocks.</small><p className="pt-card-why"><b>Why it matters:</b> Your payment can appear on the network before it's confirmed. A large queue can mean more competition for space.</p><details className="pt-card-more"><summary>See an example <span aria-hidden="true">＋</span></summary><p>If you send Bitcoin and your wallet says “pending,” your transaction may be waiting in the mempool. Once a miner includes it in a block, it receives its first confirmation. Counts vary between nodes and data sources.</p></details></div>
            <div className="pt-overview-card"><span>Priority fee estimate</span><strong>{btc?.fastestFee==null?"—":btc.fastestFee+" sat/vB"}</strong><small>A satoshi (sat) is Bitcoin's smallest unit: 100 million sats equal 1 BTC. sat/vB means sats per virtual byte and measures how much fee a transaction offers for the space it uses.</small><p className="pt-card-why"><b>Why it matters:</b> Higher fee rates often get priority, but this estimate cannot guarantee when a transaction will confirm.</p><details className="pt-card-more"><summary>See an example <span aria-hidden="true">＋</span></summary><p>A transaction sized at 200 virtual bytes with a fee rate of 5 sat/vB pays 1,000 sats in fees. The actual total depends on both transaction size and fee rate.</p></details></div>
            <div className="pt-overview-card"><span>Latest block</span><strong>{format(btc?.height)}</strong><small>{btc?.latestBlock?"The latest block was found about "+btc.latestBlock.ageMinutes+" minutes ago. ":""}A block is a group of transactions added to Bitcoin's permanent record, like a new page in a ledger. New blocks are found about every 10 minutes on average.</small><p className="pt-card-why"><b>Why it matters:</b> When your payment enters a block, it receives its first confirmation. Later blocks add more confirmations.</p><details className="pt-card-more"><summary>See an example <span aria-hidden="true">＋</span></summary><p>If your transaction is included in block 900,000, it has one confirmation when that block is added. When block 900,001 follows, it has two confirmations. Block numbers are heights, not transaction counts.</p></details></div>
          </> : <>
            <div className="pt-overview-card"><span>Current gas estimate</span><strong>{eth?.gasGwei==null?"—":eth.gasGwei+" Gwei"}</strong><small>Gas price per unit of work; total transaction cost varies.</small></div>
            <div className="pt-overview-card"><span>Latest block</span><strong>{eth?.latestBlock??"—"}</strong><small>The most recently observed Ethereum block.</small></div>
            <div className="pt-overview-card"><span>Recent transactions</span><strong>{eth?.recentTransactions?.length==null?"—":format(eth.recentTransactions.length)}</strong><small>Transactions in the latest sample shown below—not the network total.</small></div>
            <div className="pt-overview-card"><span>Network</span><strong>Ethereum</strong><small>Live Ethereum mainnet activity, not a test network.</small></div>
          </>}
        </div>
        <div className="pt-overview-explainer"><span className="pt-overview-spark" aria-hidden="true">✦</span><div><h4>What does this mean for you?</h4><p>{network==="btc"?(btc?.congestion==="Busy"?"Bitcoin is busy right now. Lower-fee transactions may take longer to confirm; the fee estimate above can help you understand current demand.":btc?.congestion==="Moderate"?"Bitcoin has some transactions waiting. Confirmation times vary, and a higher fee rate may improve priority.":btc?.congestion==="Light"?"Bitcoin's waiting queue is relatively light. Your transaction still needs to be included in a block before it's confirmed.":"We're checking Bitcoin's live network conditions. The numbers above will update when data arrives."):(eth?.gasGwei!=null?"Ethereum gas prices change as demand changes. The gas estimate above is a price per unit of work, not the total fee for your specific transaction.":"We're checking Ethereum's latest gas and block information.")}</p></div></div>
      </div>
      {network==="btc" ? <>
        <section className="pt-compact-fees">
          <div className="pt-activity-head"><div><div className="pt-eyebrow">BITCOIN FEE ESTIMATES</div><h3>Estimated Bitcoin confirmation times</h3></div><span className="pt-live">● Network estimates</span></div>
          <p className="pt-timeline-intro">Live fee recommendations and projected blocks, shown as an easy-to-read timeline.</p>
          <div className="pt-fee-timeline" aria-label="Bitcoin estimated fee and confirmation timeline">{([
            {label:"Next block",time:"~10 min",fee:btc?.fastestFee},
            {label:"Soon",time:"~20 min",fee:btc?.projectedBlocks?.[1]?.feeRange?.[0]??null},
            {label:"Standard",time:"~30 min",fee:btc?.halfHourFee},
            {label:"Patient",time:"~60 min",fee:btc?.hourFee},
          ] as {label:string;time:string;fee:number|null|undefined}[]).map((tier,index)=><div className="pt-timeline-stop" key={tier.label}>
            <div className="pt-timeline-node"><span>{index+1}</span></div>
            <strong>{tier.time}</strong><small>{tier.label}</small><b>{tier.fee==null?"Fee unavailable":Number(tier.fee).toFixed(1)+" sat/vB"}</b>
          </div>)}</div>
          <p className="pt-fee-disclaimer">A sat is one hundred-millionth of a Bitcoin. sat/vB measures the fee rate, not the amount being sent. The 20-minute figure uses the second projected block's displayed lower fee boundary; other rates are provider recommendations.</p>
          <div className="pt-queue-controls"><label htmlFor="sat-rate">Check your fee rate</label><input id="sat-rate" type="number" min="0.1" max="100000" step="0.1" value={selectedSatRate} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=0.1&&v<=100000)setSelectedSatRate(v);}}/><strong>sat/vB</strong></div>
          <div className="pt-estimate-summary">{(()=>{
            const blocks=btc?.projectedBlocks??[];
            const match=blocks.find(b=>b.feeRange?.[0]!=null&&selectedSatRate>=b.feeRange[0]);
            return match?"Your "+selectedSatRate+" sat/vB rate is within or above the fee range of projected block "+match.position+" (~"+match.position*10+" minutes on average).":blocks.length?"Your fee rate is below the displayed projected blocks; the wait may be longer.":"Waiting for live block projections.";
          })()}</div>
          <p className="pt-fee-disclaimer">Estimates use mempool.space fee recommendations and projected blocks. Bitcoin blocks average ~10 minutes but can arrive sooner or later. These are not guarantees for any transaction.</p>
        </section>
        <section className="pt-activity-panel pt-compact-activity">
          <div className="pt-activity-head"><div><div className="pt-eyebrow">BITCOIN ACTIVITY</div><h3>Live transaction activity</h3></div><span className="pt-live">{btcStreamOnline?"● Bitcoin stream connected":"● Refreshes every 5s"}</span></div>
          <div className="pt-activity-list">
            {[...liveBtcTransactions.map(tx=>({...tx,value:null})),...(btc?.recentTransactions??[]).filter(tx=>!liveBtcTransactions.some(l=>l.id===tx.id))].slice(0,5).map(tx=><a className="pt-activity-row" href={"/btc/"+tx.id} key={tx.id}><span className="pt-activity-hash">{tx.id.slice(0,12)}…{tx.id.slice(-7)}</span><span>{tx.fee!=null&&tx.vsize?(tx.fee/tx.vsize).toFixed(1)+" sat/vB":"Pending"}</span><span className="pt-status-pending">Pending</span><span className="pt-activity-arrow">↗</span></a>)}
            {btc?.confirmedTransactions?.slice(0,5).map(id=><a className="pt-activity-row" href={"/btc/"+id} key={id}><span className="pt-activity-hash">{id.slice(0,12)}…{id.slice(-7)}</span><span>Block #{format(btc?.height)}</span><span className="pt-status-confirmed">Confirmed</span><span className="pt-activity-arrow">↗</span></a>)}
            {!btc?.recentTransactions?.length&&!btc?.confirmedTransactions?.length?<p className="pt-activity-empty">Waiting for Bitcoin network activity.</p>:null}
          </div>
          <p className="pt-fee-disclaimer">Latest observed pending transactions and transactions included in the newest block. Confirmations update when new blocks are observed.</p>
        </section>
        <div className="pt-insight pt-insight-compact"><div className="pt-insight-icon">✦</div><div><h3>In plain English</h3><p>{btc?.explanation ?? "We're waiting for live Bitcoin data. Try refreshing shortly."}</p><p className="pt-note">Fee estimates change constantly. Confirmation timing depends on more than transaction count.</p></div></div>
      </> : <>
        <section className="pt-activity-panel pt-compact-activity">
          <div className="pt-activity-head"><div><div className="pt-eyebrow">ETHEREUM ACTIVITY</div><h3>Recent blocks & transactions</h3></div><span className="pt-live">● Checks every 5s</span></div>
          <div className="pt-activity-list">
            {eth?.recentBlocks?.slice(0,3).map(block=><a key={"block-"+block.height} className="pt-activity-row" href={block.hash?"https://eth.blockscout.com/block/"+block.hash:"https://eth.blockscout.com/blocks"} target="_blank" rel="noopener noreferrer"><span>Block #{block.height}</span><span>{block.transactionsCount==null?"New block":format(block.transactionsCount)+" txs"}</span><span className="pt-status-confirmed">Observed</span><span className="pt-activity-arrow">↗</span></a>)}
            {eth?.recentTransactions?.slice(0,7).map(tx=><a key={tx.hash} className="pt-activity-row" href={"/eth/"+tx.hash}><span className="pt-activity-hash">{tx.hash.slice(0,14)}…{tx.hash.slice(-7)}</span><span>{tx.block==null?"Ethereum tx":"Block "+tx.block}</span><span className="pt-status-confirmed">{tx.status??"Validated"}</span><span className="pt-activity-arrow">↗</span></a>)}
            {!eth?.recentBlocks?.length&&!eth?.recentTransactions?.length?<p className="pt-activity-empty">Waiting for Ethereum network activity.</p>:null}
          </div>
        </section>
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
      <div className="pt-glossary">{Object.entries(terms).filter(([term])=>network==="btc"? !["Gas","Nonce"].includes(term) : !["Sats","Priority fee","Mempool","sat/vB","RBF","CPFP"].includes(term)).map(([term,meaning])=><details className="pt-term" key={term}><summary>{term}<span>＋</span></summary><p>{meaning}</p></details>)}</div>
    </section>
    <section className="pt-cta"><div className="pt-eyebrow">BUILT FOR CLARITY</div><h2>Know what's happening. Know what comes next.</h2><p>From a network-wide view to your exact transaction, Pending Tracker helps you understand the blockchain without becoming an expert.</p><a href="#transaction-search" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});}}>Track a transaction ↑</a></section>
  </main>;
}
