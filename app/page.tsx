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


function NetworkHoneycomb({chain}:{chain:"btc"|"eth"}) {
  const [phase,setPhase]=useState(0);
  useEffect(()=>{
    const timer=setInterval(()=>setPhase(v=>(v+1)%12),1800);
    return ()=>clearInterval(timer);
  },[]);
  const cells=Array.from({length:24},(_,i)=>({
    x:50+Math.cos(i*2.39996)* (26+(i%4)*12),
    y:50+Math.sin(i*2.39996)* (23+(i%5)*9),
    size:2.5+(i%3)*1.1,
    active:(i+phase)%7<3
  }));
  const hex=(x:number,y:number,r:number)=>Array.from({length:6},(_,k)=>{
    const a=Math.PI/3*k-Math.PI/6;
    return (x+r*Math.cos(a)).toFixed(2)+","+(y+r*Math.sin(a)).toFixed(2);
  }).join(" ");
  return <div className={"pt-home-hex-scene pt-home-hex-"+chain} aria-hidden="true">
    <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
      <defs><radialGradient id={"pt-home-hex-glow-"+chain}><stop stopColor="currentColor" stopOpacity=".18"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs>
      <ellipse cx="100" cy="50" rx="91" ry="49" fill={"url(#pt-home-hex-glow-"+chain+")"}/>
      {cells.map((c,i)=><polygon key={i} className={"pt-home-orbit-cell"+(c.active?" is-lit":"")} points={hex(c.x*2,c.y,c.size)} style={{animationDelay:(-i*.53)+"s"}}/>)}
      <polygon className="pt-home-core-hex" points={hex(100,50,35)}/>
      <polygon className="pt-home-core-inner" points={hex(100,50,29)}/>
      <text className="pt-home-core-symbol" x="100" y="60" textAnchor="middle">{chain==="btc"?"₿":"◆"}</text>
    </svg>
  </div>;
}

export default function Page() {
  const router = useRouter();
  const [network, setNetwork] = useState<"btc" | "eth">("btc");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [ambiguousHash,setAmbiguousHash]=useState("");
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
    const raw=query.trim();
    let q=raw;
    try {
      if(/^https?:\/\//i.test(raw)){
        const u=new URL(raw);
        const parts=u.pathname.split("/").filter(Boolean);
        const marker=parts.findIndex(p=>["tx","transaction","address"].includes(p.toLowerCase()));
        if(marker>=0&&parts[marker+1])q=parts[marker+1];
      }
    }catch{}
    q=q.split(/[?#]/)[0].replace(/\/$/,"");
    setAmbiguousHash("");
    if(/^0x[a-f\d]{40}$/i.test(q))return router.push("/eth/address/"+q);
    if(/^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(q))return router.push("/btc/address/"+q);
    if(/^0x[a-f\d]{64}$/i.test(q))return router.push("/eth/"+q);
    if(/^[a-f\d]{64}$/i.test(q)){setAmbiguousHash(q);setError("");return;}
    setError("Enter a Bitcoin or Ethereum transaction ID, wallet address, or supported explorer link. Never enter a private key or recovery phrase.");
  }

  const btc = overview?.btc, eth = overview?.eth;
  return <main className="pt-shell">
    <div className="pt-hero">
      <div className="pt-hero-intro">
        <div className="pt-eyebrow"><span className="pt-pulse"/> THE BLOCKCHAIN, MADE SIMPLE</div>
        <h1>Track. Explore. <span>Understand.</span></h1>
        <p className="pt-lead">Pending Tracker gives you real-time blockchain data and clear, plain-English explanations for Bitcoin and Ethereum transactions.</p>
        <div className="pt-hero-trust"><span>◇ Live blockchain data</span><span>◇ Plain-English explanations</span><span>◇ No account needed</span></div>
      </div>
      <div className="pt-searchbox" id="transaction-search">
        <div className="pt-search-top"><div><div className="pt-search-label">TRANSACTION EXPLAINER</div><h2>Where is my transaction?</h2><p className="pt-search-explain">Enter a transaction ID, wallet address, or block number to see its status, confirmation progress, fees, and what it means.</p></div><div className="pt-search-symbol" aria-hidden="true">↗</div></div>
        <div className="pt-searchrow">
          <input aria-label="Transaction hash" placeholder="Paste a transaction ID, address, or explorer link" value={query} onChange={e=>{setQuery(e.target.value);setError("");setAmbiguousHash("");}} onKeyDown={e=>{if(e.key==="Enter") search();}} spellCheck={false}/>
          <button onClick={search}>Track my transaction <span aria-hidden="true">→</span></button>
        </div>
        {ambiguousHash?<div className="pt-chain-choice" role="group" aria-label="Select blockchain"><p>This transaction ID could belong to more than one network. Which blockchain are you tracking?</p><div><button type="button" onClick={()=>router.push("/btc/"+ambiguousHash)}>₿ Bitcoin →</button><button type="button" onClick={()=>router.push("/eth/0x"+ambiguousHash)}>◆ Ethereum →</button></div></div>:null}
        {error ? <p className="pt-error" role="alert">{error}</p> : <p className="pt-hint">Free to explore · No wallet connection or signup · Never enter a seed phrase or private key.</p>}
      </div>
    </div>

    <section className="pt-chain-gateway" aria-labelledby="pt-chain-gateway-title">
      <div className="pt-chain-gateway-intro"><div className="pt-eyebrow">TWO BLOCKCHAINS. ONE SIMPLE STARTING POINT.</div><h2 id="pt-chain-gateway-title">Choose a blockchain to explore</h2><p>Browse a blockchain in its own dedicated explorer, or search a transaction directly inside Bitcoin or Ethereum. Every record should be easy to understand, with deeper technical information available when you want it.</p></div>
      <div className="pt-chain-gateway-grid">
        <a className="pt-chain-gateway-card pt-chain-gateway-btc" href="/bitcoin"><span className="pt-chain-gateway-icon">₿</span><span className="pt-chain-gateway-copy"><strong>Bitcoin Explorer</strong><small>Live blocks, transactions, addresses, mempool and fees</small><em>Explore Bitcoin <span aria-hidden="true">→</span></em></span><span className="pt-gateway-chart" aria-hidden="true">{Array.from({length:38},(_,i)=><i key={i} style={{height:`${12+((i*17+i*i*3)%48)}%`}} />)}</span><span className="pt-gateway-metrics"><span><b>{format(btc?.pending)}</b><small>Pending transactions</small></span><span><b>{btc?.halfHourFee==null?"—":btc.halfHourFee+" sat/vB"}</b><small>Suggested fee rate</small></span><span><b>~10 min</b><small>Typical block interval</small></span></span></a>
        <a className="pt-chain-gateway-card pt-chain-gateway-eth" href="/ethereum"><span className="pt-chain-gateway-icon">◆</span><span className="pt-chain-gateway-copy"><strong>Ethereum Explorer</strong><small>Live blocks, transactions, tokens, contracts and gas</small><em>Explore Ethereum <span aria-hidden="true">→</span></em></span><span className="pt-gateway-chart" aria-hidden="true">{Array.from({length:38},(_,i)=><i key={i} style={{height:`${12+((i*17+i*i*3)%48)}%`}} />)}</span><span className="pt-gateway-metrics"><span><b>{eth?.latestBlock==null?"—":format(Number(eth.latestBlock))}</b><small>Latest block</small></span><span><b>{eth?.gasGwei==null?"—":eth.gasGwei+" gwei"}</b><small>Current gas price</small></span><span><b>~12 sec</b><small>Typical block interval</small></span></span></a>
      </div>
    </section>
    <section className="pt-home-live" aria-labelledby="pt-home-live-title">
      <div className="pt-home-live-head"><div><h2 id="pt-home-live-title">Live Network Activity <span className="pt-live-pill">● LIVE</span></h2><p>Real-time Bitcoin and Ethereum network activity. Click into either explorer for full details.</p></div><a className="pt-live-dashboard-link" href="#network">View live dashboard →</a></div>
      <div className="pt-home-live-grid">
        <a className="pt-home-live-panel pt-live-btc" href="/bitcoin"><div className="pt-live-panel-heading"><span className="pt-live-coin">₿</span><h3>Bitcoin</h3></div><div className="pt-live-chart"><NetworkHoneycomb chain="btc"/></div><div className="pt-live-facts"><span>Latest block<b>{btc?.height==null?"—":"#"+format(btc.height)}</b></span><span>Transactions waiting<b>{format(btc?.pending)}</b></span><span>Priority fee<b>{btc?.fastestFee==null?"—":btc.fastestFee+" sat/vB"}</b></span></div></a>
        <a className="pt-home-live-panel pt-live-eth" href="/ethereum"><div className="pt-live-panel-heading"><span className="pt-live-coin">◆</span><h3>Ethereum</h3></div><div className="pt-live-chart"><NetworkHoneycomb chain="eth"/></div><div className="pt-live-facts"><span>Latest block<b>{eth?.latestBlock==null?"—":"#"+format(Number(eth.latestBlock))}</b></span><span>Gas price<b>{eth?.gasGwei==null?"—":eth.gasGwei+" gwei"}</b></span><span>Block interval<b>~12 sec</b></span></div></a>
      </div><p className="pt-home-live-source">Network data from mempool.space and Blockscout. Charts are decorative, not historical measurements.</p>
    </section>
    <section className="pt-section pt-journey" id="how-it-works">
      <div className="pt-eyebrow">TRACKING MADE SIMPLE</div><h2>Three steps. One clear answer.</h2>
      <p className="pt-section-sub">Find out if your transaction is pending or confirmed, what the fees mean, and what comes next.</p>
      <div className="pt-journey-grid">
        <div className="pt-journey-step"><span>01</span><h3>Paste your transaction ID</h3><p>Find it in your wallet or exchange and paste it above.</p></div>
        <div className="pt-journey-step"><span>02</span><h3>See what's happening</h3><p>Find out if it's waiting, confirmed, or not yet visible on the network.</p></div>
        <div className="pt-journey-step"><span>03</span><h3>Know what comes next</h3><p>Understand the fees, confirmation status, and possible next steps.</p></div>
      </div>
    </section>
<section className="pt-reference-transactions" aria-label="Recent blockchain transactions">
  <div className="pt-reference-table"><div className="pt-reference-table-title"><h3>Recent Bitcoin Transactions</h3><a href="/bitcoin">View all →</a></div><div className="pt-reference-table-head"><span>TXID</span><span>Network fee</span><span>Size</span><span>Status</span></div>{(liveBtcTransactions.length?liveBtcTransactions.map(t=>({id:t.id,fee:t.fee,vsize:t.vsize})):btc?.recentTransactions??[]).slice(0,4).map(t=><a className="pt-reference-table-row" key={t.id} href={"/btc/"+t.id}><span>{t.id.slice(0,12)}…{t.id.slice(-7)}</span><span>{t.fee==null?"—":format(t.fee)+" sats"}</span><span>{t.vsize==null?"—":format(t.vsize)+" vB"}</span><span><em>Pending</em></span></a>)}{!liveBtcTransactions.length&&!btc?.recentTransactions?.length?<p className="pt-reference-empty">Waiting for Bitcoin transactions…</p>:null}</div>
  <div className="pt-reference-table"><div className="pt-reference-table-title"><h3>Recent Ethereum Transactions</h3><a href="/ethereum">View all →</a></div><div className="pt-reference-table-head"><span>TX Hash</span><span>Block</span><span>Type</span><span>Status</span></div>{(eth?.recentTransactions??[]).slice(0,4).map(t=><a className="pt-reference-table-row" key={t.hash} href={"/eth/"+t.hash}><span>{t.hash.slice(0,12)}…{t.hash.slice(-7)}</span><span>{t.block==null?"—":"#"+format(t.block)}</span><span>Transaction</span><span><em>{t.status??"Unknown"}</em></span></a>)}{!eth?.recentTransactions?.length?<p className="pt-reference-empty">Waiting for Ethereum transactions…</p>:null}</div>
</section>
<details className="pt-network-drawer" id="network-dashboard"><summary><span><b>Live network dashboard</b><small>Expand for Bitcoin and Ethereum blocks, fees and live transactions</small></span><span aria-hidden="true">＋</span></summary>    <section className="pt-section" id="network">
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
            <div className="pt-overview-card"><span>Network traffic</span><strong>{btc?.congestion??"—"}</strong><small><b>What is it?</b> This tells you how busy Bitcoin is right now. More people sending Bitcoin means more payments competing for space.</small><p className="pt-card-why"><b>Why it matters</b> {btc?.congestion==="Busy"?"Bitcoin is busy. Payments with lower fees may take longer.":btc?.congestion==="Moderate"?"There are some payments waiting. Your fee can affect how soon yours confirms.":btc?.congestion==="Light"?"Bitcoin is less busy, but payments still need to be confirmed.":"When the network gets busy, lower-fee payments can take longer."}</p><details className="pt-card-more"><summary>Simple example <span aria-hidden="true">＋</span></summary><p>Imagine a checkout line. When more people are waiting, the line can move more slowly. Bitcoin also has limited room for payments in each block.</p></details></div>
            <div className="pt-overview-card"><span>Transactions waiting</span><strong>{format(btc?.pending)}</strong><small><b>What is it?</b> These Bitcoin payments have been sent but are not confirmed yet. They are waiting in the mempool, Bitcoin's waiting area.</small><p className="pt-card-why"><b>Why it matters</b> Your payment may show as pending until a miner adds it to a block.</p><details className="pt-card-more"><summary>Simple example <span aria-hidden="true">＋</span></summary><p>If your wallet says “pending,” your payment may be in this waiting area. The count shown comes from our network data source.</p></details></div>
            <div className="pt-overview-card"><span>Priority fee estimate</span><strong>{btc?.fastestFee==null?"—":btc.fastestFee+" sat/vB"}</strong><small><b>What is it?</b> A sat is a tiny piece of Bitcoin (100 million sats = 1 BTC). sat/vB is the fee rate your payment offers based on its size.</small><p className="pt-card-why"><b>Why it matters</b> A higher fee rate usually helps miners choose your payment sooner. It does not guarantee a time.</p><details className="pt-card-more"><summary>Simple example <span aria-hidden="true">＋</span></summary><p>If a payment is 200 vB in size and offers 5 sat/vB, the fee is 1,000 sats. vB simply measures how much space the payment uses in a block.</p></details></div>
            <div className="pt-overview-card"><span>Latest block</span><strong>{format(btc?.height)}</strong><small><b>What is it?</b> A block is a group of Bitcoin payments added to the blockchain. The number above tells you which block was added most recently.</small><p className="pt-card-why"><b>Why it matters</b> Once your payment is in a block, it has one confirmation. Each new block adds another.</p><details className="pt-card-more"><summary>Simple example <span aria-hidden="true">＋</span></summary><p>Think of a block as a new page in a record book. Bitcoin adds a new page about every 10 minutes on average.{btc?.latestBlock?" The latest was found about "+btc.latestBlock.ageMinutes+" minutes ago.":""}</p></details></div>
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
        <section className="pt-compact-fees pt-fee-explorer">
          <div className="pt-activity-head"><div><div className="pt-eyebrow">LIVE BITCOIN CONFIRMATION OUTLOOK</div><h3>When could my Bitcoin confirm?</h3></div><span className="pt-live">● Live network estimates</span></div>
          <p className="pt-timeline-intro">See how full the next Bitcoin blocks could be, compare current fee choices, and check where your fee rate may fit. Predictions change as new transactions arrive.</p>
          <div className="pt-fee-intro"><div className="pt-fee-intro-icon" aria-hidden="true">↗</div><div><b>How to read this</b><p>Think of each block as a bus carrying Bitcoin transactions. Miners usually pick payments offering higher fees first. A new bus arrives about every 10 minutes on average—but never on a fixed schedule.</p></div></div>
          <div className="pt-fee-heading"><div><h4>Upcoming blocks <span>· projected, not confirmed</span></h4><p>Each column is a possible future block, built from transactions waiting right now.</p></div><span className="pt-fee-live-tag">LIVE QUEUE</span></div>
          <div className="pt-projected-grid">
            {(btc?.projectedBlocks?.length?btc.projectedBlocks.slice(0,5):[1,2,3,4,5].map(position=>({position,transactionCount:null,medianFee:null,feeRange:null}))).map((block,index)=>{
              const low=block.feeRange?.[0],high=block.feeRange?.[1];
              const matches=low!=null&&high!=null&&selectedSatRate>=low&&selectedSatRate<=high;
              return <div className={"pt-projected-card"+(matches?" pt-projected-match":"")} key={block.position}>
                <div className="pt-projected-top"><span>BLOCK {block.position}</span></div><div className="pt-block-time">~{block.position*10} <span>min</span></div>
                <div className="pt-block-art" aria-hidden="true">{Array.from({length:20},(_,i)=><i key={i} style={{opacity:block.transactionCount==null?.2:(i<Math.max(2,Math.min(20,Math.round(block.transactionCount/160)))?1:.17)}}/>)}</div>
                <strong className="pt-block-fee">{low==null||high==null?"Fee unavailable":low.toFixed(1)+"–"+high.toFixed(1)+" sat/vB"}</strong>
                <small className="pt-block-tx-count">{block.transactionCount==null?"Awaiting transactions":format(block.transactionCount)+" transactions"}</small>
                {matches?<em>↗ Your rate overlaps</em>:<span className="pt-projected-foot">Estimated arrival</span>}
              </div>;
            })}
          </div>
          <p className="pt-fee-disclaimer">Block positions are estimates, not countdowns. Fee ranges can overlap between blocks, and miners may choose transactions differently. The tiles show a visual approximation of each block's transaction count, not individual transactions.</p>
          <div className="pt-simple-fee-head"><div><h4>Choose your fee</h4><p>Higher fees usually get priority. Pick what works for you.</p></div></div>
          <div className="pt-simple-fees">
            {([{title:"Fast",value:btc?.fastestFee,detail:"Higher priority"},{title:"Balanced",value:btc?.halfHourFee,detail:"Middle ground"},{title:"Save",value:btc?.hourFee,detail:"Less urgent"}] as {title:string;value:number|null|undefined;detail:string}[]).map(choice=><button type="button" className={"pt-simple-fee"+(choice.value!=null&&selectedSatRate===choice.value?" active":"")} key={choice.title} onClick={()=>{if(choice.value!=null)setSelectedSatRate(choice.value)}} disabled={choice.value==null}><span>{choice.title}</span><strong>{choice.value==null?"—":choice.value+" sat/vB"}</strong><small>{choice.detail}</small></button>)}
          </div>
          <details className="pt-simple-custom">
            <summary>Already sent Bitcoin? Compare your fee rate <span>＋</span></summary>
            <div className="pt-simple-custom-body"><label htmlFor="sat-rate">Fee rate from your wallet (sat/vB)</label><input id="sat-rate" type="number" min="0.1" max="100000" step="0.1" value={selectedSatRate} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=0.1&&v<=100000)setSelectedSatRate(v)}}/>
              <p role="status">{(()=>{const blocks=btc?.projectedBlocks??[];if(!blocks.length)return "Waiting for live estimates.";const matches=blocks.filter(block=>block.feeRange&&selectedSatRate>=block.feeRange[0]&&selectedSatRate<=block.feeRange[1]);if(matches.length)return "Your fee is within the current range for projected block "+matches[0].position+". This is an estimate, not a guarantee.";if(blocks[0]?.feeRange&&selectedSatRate>blocks[0].feeRange[1])return "Your fee is above the first projected block's current range. It may be competitive.";return "Your fee is outside the displayed projected ranges. It may take longer to confirm."})()}</p>
            </div>
          </details>
          <p className="pt-simple-source">Live estimates from mempool.space. Actual confirmation times vary. To track a specific transaction, search its ID above.</p>
        </section>
        <section className="pt-activity-panel pt-compact-activity pt-clean-activity">
          <div className="pt-activity-head"><div><div className="pt-eyebrow">HAPPENING ON BITCOIN</div><h3>Latest transactions</h3><p className="pt-activity-intro">See real transactions as they enter the network or get confirmed.</p></div><span className="pt-live">{btcStreamOnline?"● Live updates":"● Updating"}</span></div>
          <div className="pt-activity-list">
            {[...liveBtcTransactions.map(tx=>({...tx,value:null})),...(btc?.recentTransactions??[]).filter(tx=>!liveBtcTransactions.some(l=>l.id===tx.id))].slice(0,4).map(tx=><a className="pt-activity-row" href={"/btc/"+tx.id} key={tx.id}><span className="pt-activity-hash">{tx.id.slice(0,10)}…{tx.id.slice(-6)}</span><span className="pt-activity-meta">{tx.fee!=null&&tx.vsize?(tx.fee/tx.vsize).toFixed(1)+" sat/vB":"Fee pending"}</span><span className="pt-status-pending">Waiting</span><span className="pt-activity-arrow">↗</span></a>)}
            {btc?.confirmedTransactions?.slice(0,3).map(id=><a className="pt-activity-row" href={"/btc/"+id} key={id}><span className="pt-activity-hash">{id.slice(0,10)}…{id.slice(-6)}</span><span className="pt-activity-meta">Block #{format(btc?.height)}</span><span className="pt-status-confirmed">Confirmed</span><span className="pt-activity-arrow">↗</span></a>)}
            {!btc?.recentTransactions?.length&&!btc?.confirmedTransactions?.length?<p className="pt-activity-empty">Waiting for live Bitcoin transactions.</p>:null}
          </div>
          <p className="pt-activity-bottom">Select any transaction to see its details explained.</p>
        </section>
        <div className="pt-insight pt-insight-compact pt-clean-insight"><div className="pt-insight-icon">✦</div><div><h3>What this means right now</h3><p>{btc?.explanation ?? "Waiting for live Bitcoin data."}</p></div></div>
      </> : <>
        <section className="pt-compact-fees pt-fee-explorer pt-eth-explorer">
          <div className="pt-activity-head"><div><div className="pt-eyebrow">LIVE ETHEREUM BLOCKS</div><h3>Ethereum, block by block</h3></div><span className="pt-live">● Live network data</span></div>
          <p className="pt-timeline-intro">Ethereum usually adds a block about every 12 seconds. These are the latest blocks already added—not predictions of future transactions.</p>
          <div className="pt-fee-heading"><div><h4>Latest blocks <span>· confirmed on the network</span></h4><p>See how many transactions each block contains.</p></div><span className="pt-fee-live-tag">LIVE BLOCKS</span></div>
          <div className="pt-projected-grid">
            {(eth?.recentBlocks?.length?eth.recentBlocks.slice(0,5):[0,1,2,3,4].map(()=>({height:null,hash:null,timestamp:null,transactionsCount:null}))).map((block,index)=><a className="pt-projected-card pt-eth-block" key={block.hash??index} href={block.hash?"https://eth.blockscout.com/block/"+block.hash:"https://eth.blockscout.com/blocks"} target="_blank" rel="noopener noreferrer">
              <div className="pt-projected-top"><span>{index===0?"LATEST BLOCK":"RECENT BLOCK"}</span></div>
              <div className="pt-block-time">{block.timestamp&&Number.isFinite(new Date(block.timestamp).getTime())?Math.max(0,Math.floor((Date.now()-new Date(block.timestamp).getTime())/1000))+"s ago":"Added"} </div>
              <div className="pt-block-art" aria-hidden="true">{Array.from({length:20},(_,i)=><i key={i} style={{opacity:block.transactionsCount==null?.2:(i<Math.max(2,Math.min(20,Math.round(block.transactionsCount/12)))?1:.17)}}/>)}</div>
              <strong className="pt-block-fee">#{block.height??"—"}</strong>
              <small className="pt-block-tx-count">{block.transactionsCount==null?"Awaiting transactions":format(block.transactionsCount)+" transactions"}</small>
              <span className="pt-projected-foot">View block ↗</span>
            </a>)}
          </div>
          <p className="pt-sleek-note">These squares are a visual illustration of transaction volume, not individual transactions. Times show how long ago blocks were added.</p>
          <div className="pt-simple-fee-head"><div><h4>Ethereum network fee</h4><p>See the current gas price before you send.</p></div></div>
          <div className="pt-eth-gas-summary"><div><span>Current gas price</span><strong>{eth?.gasGwei==null?"—":eth.gasGwei+" Gwei"}</strong></div><p>Gas is what you pay to use Ethereum. Your total fee depends on what your transaction does, not just this rate.</p></div>
          <p className="pt-simple-source">Live blocks and gas information from Blockscout. A recent block does not predict when your transaction will confirm. Search your transaction ID above to check its status.</p>
        </section>
        <section className="pt-activity-panel pt-compact-activity pt-clean-activity">
          <div className="pt-activity-head"><div><div className="pt-eyebrow">HAPPENING ON ETHEREUM</div><h3>Latest activity</h3><p className="pt-activity-intro">Recent Ethereum transactions and blocks, explained simply.</p></div><span className="pt-live">● Live updates</span></div>
          <div className="pt-activity-list">
            {eth?.recentTransactions?.slice(0,5).map(tx=><a key={tx.hash} className="pt-activity-row" href={"/eth/"+tx.hash}><span className="pt-activity-hash">{tx.hash.slice(0,12)}…{tx.hash.slice(-6)}</span><span className="pt-activity-meta">{tx.block==null?"Transaction":"Block "+tx.block}</span><span className="pt-status-confirmed">{tx.status??"Recorded"}</span><span className="pt-activity-arrow">↗</span></a>)}
            {eth?.recentBlocks?.slice(0,2).map(block=><a key={"block-"+block.height} className="pt-activity-row" href={block.hash?"https://eth.blockscout.com/block/"+block.hash:"https://eth.blockscout.com/blocks"} target="_blank" rel="noopener noreferrer"><span>Block #{block.height}</span><span className="pt-activity-meta">{block.transactionsCount==null?"New block":format(block.transactionsCount)+" transactions"}</span><span className="pt-status-confirmed">Added</span><span className="pt-activity-arrow">↗</span></a>)}
            {!eth?.recentBlocks?.length&&!eth?.recentTransactions?.length?<p className="pt-activity-empty">Waiting for live Ethereum activity.</p>:null}
          </div>
          <p className="pt-activity-bottom">Select a transaction to see what happened.</p>
        </section>
        <div className="pt-insight pt-clean-insight"><div className="pt-insight-icon">✦</div><div><h3>What this means right now</h3><p>{eth?.explanation ?? "Waiting for live Ethereum data."}</p></div></div>
      </>}
      <p className="pt-source">Explanations are generated from live blockchain data using transparent rules, not a generative AI model. Sources: mempool.space and Blockscout · {overview ? "Updated " + new Date(overview.updatedAt).toLocaleTimeString() : "Awaiting data"} · Estimates are informational, not guarantees.</p>
    </section>

</details>
    <section className="pt-section pt-learn-simple" id="learn">
      <div className="pt-eyebrow">QUICK ANSWERS</div><h2>New to blockchain? Start here.</h2>
      <p className="pt-section-sub">Plain-English answers to the questions people ask most.</p>
      <div className="pt-glossary">
        <details className="pt-term"><summary>Why is my transaction still waiting?<span>＋</span></summary><p>It may be waiting for a block, offering a less competitive fee, or depending on an earlier transaction. Search your transaction ID above to see the available evidence.</p></details>
        <details className="pt-term"><summary>How long does confirmation take?<span>＋</span></summary><p>Bitcoin blocks arrive about every 10 minutes on average, but individual waits vary. Ethereum generally produces blocks more frequently. No estimated time is a guarantee.</p></details>
        <details className="pt-term"><summary>What does sat/vB mean?<span>＋</span></summary><p>It's Bitcoin's fee rate: how many tiny units of Bitcoin (sats) are offered for each unit of transaction size. A higher rate usually gives miners more reason to include a transaction sooner.</p></details>
        <details className="pt-term"><summary>Is it safe to paste my transaction ID?<span>＋</span></summary><p>Transaction IDs are public tracking references. Never share your wallet recovery phrase, private key, or password.</p></details>
        <details className="pt-term"><summary>Explore more blockchain terms<span>＋</span></summary><div className="pt-glossary-inner">{Object.entries(terms).filter(([term])=>network==="btc"?!["Gas","Nonce"].includes(term):!["Sats","Priority fee","Mempool","sat/vB","RBF","CPFP"].includes(term)).map(([term,meaning])=><details className="pt-term" key={term}><summary>{term}<span>＋</span></summary><p>{meaning}</p></details>)}</div></details>
      </div>
    </section>

  </main>;
}
