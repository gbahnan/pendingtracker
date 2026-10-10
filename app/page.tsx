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
  const btc=chain==="btc";
  const accent=btc?"#ff9c08":"#376dff";
  const edge=btc?"#ffba32":"#668aff";
  const hot=btc?"#fff1b9":"#dbe5ff";
  const hex=(x:number,y:number,r:number)=>Array.from({length:6},(_,k)=>{
    const a=Math.PI/3*k-Math.PI/6;
    return `${(x+r*Math.cos(a)).toFixed(2)},${(y+r*Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  const particles=Array.from({length:135},(_,i)=>{
    const a=i*2.3999632297;
    const rad=26+Math.sqrt(i/135)*122;
    return {x:170+Math.cos(a)*rad*1.36,y:91+Math.sin(a)*rad*.57,
      r:.7+(i%7)*.34,opacity:.1+(i%6)*.065,dx:((i*17)%19)-9,dy:((i*13)%15)-7,
      duration:26+(i*7)%27,delay:-(i*11%37)};
  });
  const satellites=[
    [33,100,10],[77,47,16],[119,116,11],[261,45,13],[302,99,17],
    [330,56,9],[58,148,9],[259,146,10],[119,28,7],[322,145,7],
    [19,64,6],[213,28,7]
  ];
  return <div className={"pt-home-hex-scene pt-home-hex-"+chain} aria-hidden="true">
    <svg viewBox="0 0 340 182" preserveAspectRatio="xMidYMid meet" role="presentation">
      <defs>
        <radialGradient id={"nh-space-"+chain}><stop stopColor={accent} stopOpacity={btc?".29":".36"}/><stop offset=".5" stopColor={accent} stopOpacity=".095"/><stop offset="1" stopColor={accent} stopOpacity="0"/></radialGradient>
        <linearGradient id={"nh-core-"+chain} x1="0" y1="0" x2="1" y2="1"><stop stopColor={btc?"#57300b":"#142961"}/><stop offset=".43" stopColor={btc?"#1b130b":"#09152e"}/><stop offset="1" stopColor="#020913"/></linearGradient>
        <linearGradient id={"nh-edge-"+chain} x1="0" y1="0" x2="1" y2="1"><stop stopColor={hot}/><stop offset=".37" stopColor={edge}/><stop offset=".75" stopColor={accent}/><stop offset="1" stopColor={hot}/></linearGradient>
        <linearGradient id={"nh-facet-"+chain} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" stopOpacity=".92"/><stop offset=".42" stopColor={edge} stopOpacity=".8"/><stop offset="1" stopColor={accent} stopOpacity=".25"/></linearGradient>
        <filter id={"nh-bloom-"+chain} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>
        <filter id={"nh-soft-"+chain} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.3"/></filter>
      </defs>
      <ellipse cx="170" cy="91" rx="166" ry="91" fill={"url(#nh-space-"+chain+")"}/>
      {particles.map((p,i)=><polygon key={i} className="pt-home-drifting-cell" style={{"--drift-x":p.dx*2+"px","--drift-y":p.dy*2+"px",animationDuration:p.duration+"s",animationDelay:p.delay+"s"} as React.CSSProperties} points={hex(p.x,p.y,p.r)} fill={i%4===0?accent:"none"} fillOpacity={i%4===0?".32":"0"} stroke={i%8===0?hot:accent} strokeWidth=".42" opacity={p.opacity}/>)}
      {satellites.map(([x,y,r],i)=><g key={i} className="pt-home-drifting-satellite" style={{"--drift-x":((i%2?1:-1)*(11+i%5))+"px","--drift-y":((i%3-1)*13+5)+"px",animationDuration:(18+i*1.7)+"s",animationDelay:-(i*3)+"s"} as React.CSSProperties} opacity={i%4===0?".95":".83"}>
        <polygon points={hex(x,y,r+5)} fill={accent} opacity=".65" filter={"url(#nh-bloom-"+chain+")"}/>
        <polygon points={hex(x,y,r)} fill={accent} fillOpacity=".34" stroke={hot} strokeWidth="1.2"/>
        <polygon points={hex(x,y,r*.82)} fill="none" stroke={edge} strokeWidth="1"/>
        <polygon points={hex(x,y,r*.65)} fill={"url(#nh-facet-"+chain+")"} opacity=".83"/>
        <polygon points={hex(x,y,r*.32)} fill={hot} opacity=".73"/>
      </g>)}
      <polygon points={hex(170,91,61)} fill={accent} opacity=".76" filter={"url(#nh-bloom-"+chain+")"}/>
      <polygon points={hex(170,91,56)} fill={accent} opacity=".46" filter={"url(#nh-soft-"+chain+")"}/>
      <polygon points={hex(170,91,53)} fill={"url(#nh-core-"+chain+")"} stroke={"url(#nh-edge-"+chain+")"} strokeWidth="3.2"/>
      <polygon points={hex(170,91,47)} fill="none" stroke={hot} strokeOpacity=".9" strokeWidth=".8"/>
      <polygon points={hex(170,91,42)} fill="none" stroke={edge} strokeOpacity=".25" strokeWidth=".6"/>
      {btc
        ? <text x="170" y="111" textAnchor="middle" fill="#ffce63" fontSize="59" fontWeight="800" style={{filter:"drop-shadow(0 0 7px #ff9a00)"}}>₿</text>
        : <g filter="url(#nh-soft-eth)" opacity=".5"><polygon points="170,52 144,94 170,109 196,94" fill="#7296ff"/></g>}
      {!btc&&<g><polygon points="170,48 144,94 170,109" fill="#b8c9ff"/><polygon points="170,48 196,94 170,109" fill="#7596ff"/><polygon points="144,99 170,136 170,113" fill="#9bb4ff"/><polygon points="196,99 170,136 170,113" fill="#5475df"/></g>}
    </svg>
  </div>;
}

const comparisonExamples = {
  btc: {
    explore: {
      raw: [["Block height","950,000"],["Transactions","2,845"],["Block size","1,620,000 bytes"],["Block weight","3,920,000 WU"],["Median fee rate","4.2 sat/vB"],["Total transaction fees","0.085 BTC"],["Confirmations","3"],["Block hash","000000000000…8a42"]],
      heading: "Bitcoin has added another block to its blockchain.",
      intro: "Think of a block as a new page in Bitcoin's public record. This page contains 2,845 transactions that have now been recorded together.",
      details: [["2,845 transactions","This is how many Bitcoin transactions were included. Instead of recording transactions one at a time, Bitcoin groups them into blocks."],["4.2 sat/vB — median fee rate","This is the middle fee rate among transactions in this block. It tells you about the fees those transactions paid relative to their size, not what every sender paid."],["3 confirmations","Two additional blocks have been added after this one. Each confirmation adds more security to the transaction history recorded in this block."],["Block size and weight","These describe how much data the block contains and how Bitcoin measures the space transactions use. Weight units help determine how much fits in a block."]],
      bottom: "This block is part of Bitcoin's confirmed history. You can explore its transactions, understand the fees they paid, and see how this block fits into the network."
    },
    track: {
      raw: [["Transaction status","Unconfirmed"],["Confirmations","0"],["Fee rate","2.1 sat/vB"],["Virtual size","141 vB"],["Transaction fee","296 sats"],["Block height","Not assigned"],["RBF signaling","Enabled"],["Mempool status","Pending"]],
      heading: "Your Bitcoin transaction is still waiting.",
      intro: "The transaction has reached the network, but a miner hasn't included it in a block. That doesn't necessarily mean anything is wrong.",
      details: [["0 confirmations","Your transaction hasn't been recorded in a block yet. It gets its first confirmation when a miner includes it."],["2.1 sat/vB — fee rate","The sender offered 2.1 satoshis for each virtual byte of transaction size. Whether that fee is competitive depends on how busy the network is."],["296 sats — transaction fee","That's the total network fee offered. A satoshi is one hundred-millionth of a bitcoin."],["RBF enabled","The transaction signals that it may be replaced with a higher-fee version. Whether you can do this depends on the wallet and transaction circumstances."]],
      bottom: "The transaction is unconfirmed, not necessarily failed. Comparing its fee with current network conditions can help explain the wait and estimate when it might confirm."
    }
  },
  eth: {
    explore: {
      raw: [["Block number","24,000,000"],["Transactions","186"],["Gas used","18,500,000"],["Gas limit","36,000,000"],["Gas utilization","51.39%"],["Base fee","0.75 gwei"],["Block status","Canonical"],["Parent hash","0x7a3f…c921"]],
      heading: "Ethereum has processed another block of activity.",
      intro: "Ethereum records transactions and smart contract activity in blocks. This block contains 186 transactions that were processed together.",
      details: [["186 transactions","These transactions can include ETH payments, token transfers, and interactions with applications built on Ethereum."],["18.5 million gas used","Gas measures the computational work Ethereum performed. It's not a separate cryptocurrency — it's a unit used to measure how much processing transactions require."],["51.39% gas utilization","The transactions used about half the block's stated gas limit. This tells you how much of that block's execution capacity was used, not whether the entire network was congested."],["0.75 gwei base fee","This is the base fee rate per unit of gas for the block. Transactions may also include priority fees. One gwei equals one-billionth of an ETH."]],
      bottom: "You can see what Ethereum processed, how much computational work it required, and what the fee numbers mean — without decoding every technical field yourself."
    },
    track: {
      raw: [["Execution status","Success"],["Block number","24,000,000"],["Confirmations","12"],["Gas used","21,000"],["Effective gas price","0.8 gwei"],["Transaction fee","0.0000168 ETH"],["Nonce","42"],["Transaction type","2 (EIP-1559)"]],
      heading: "Your Ethereum transaction was processed successfully.",
      intro: "Ethereum included this transaction in a block and executed it without an error. The result is now recorded on the blockchain.",
      details: [["Success — what does that mean?","The transaction executed successfully. The specific result depends on whether it was an ETH transfer, token interaction, or another operation."],["21,000 gas used","This is the processing work charged for the transaction. A standard ETH transfer between regular accounts typically uses 21,000 gas."],["0.0000168 ETH — total network fee","This is the fee paid for processing. It comes from 21,000 gas multiplied by an effective price of 0.8 gwei per gas unit."],["Nonce 42 and EIP-1559","The nonce is the sender's transaction sequence number. EIP-1559 is the transaction's fee format. Neither represents an additional fee."]],
      bottom: "Your transaction succeeded and cost 0.0000168 ETH in network fees. You can explore its details and confirmations to understand what Ethereum recorded."
    }
  }
} as const;

export default function Page() {
  const router = useRouter();
  const [network, setNetwork] = useState<"btc" | "eth">("btc");
  const [comparisonChain, setComparisonChain] = useState<"btc" | "eth">("btc");
  const [comparisonMode, setComparisonMode] = useState<"explore" | "track">("explore");
  const comparison = comparisonExamples[comparisonChain][comparisonMode];
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
    <div className="pt-hero pt-hero-reference">
      <div className="pt-hero-ambient pt-hero-ambient-btc" aria-hidden="true"><span/><span/><span/><span/><span/><span/></div>
      <div className="pt-hero-ambient pt-hero-ambient-eth" aria-hidden="true"><span/><span/><span/><span/><span/><span/></div>
      <div className="pt-hero-intro">
        <h1>Track. <span className="pt-hero-gold">Explore.</span> <span className="pt-hero-blue">Understand.</span></h1>
        <h2 className="pt-hero-subtitle">A simpler blockchain explorer.</h2>
        <p className="pt-lead">We decode confusing blockchain data into clear, easy-to-understand summaries<br className="pt-hero-desktop-break"/> so you can track transactions, explore the network, and know what’s happening.</p>
      </div>
      <div className="pt-searchbox" id="transaction-search">
        <div className="pt-search-top"><div><h2>Track Your Transaction</h2><p className="pt-search-explain">Paste a Bitcoin or Ethereum transaction ID and we’ll turn the complex data<br className="pt-hero-desktop-break"/> into a simple, easy-to-understand summary.</p></div></div>
        <div className="pt-searchrow">
          <div className="pt-search-input-wrap"><span className="pt-search-magnifier" aria-hidden="true">⌕</span><input aria-label="Transaction hash or wallet address" placeholder="Enter a Bitcoin or Ethereum transaction hash..." value={query} onChange={e=>{setQuery(e.target.value);setError("");setAmbiguousHash("");}} onKeyDown={e=>{if(e.key==="Enter") search();}} spellCheck={false}/></div>
          <button onClick={search}>Track Transaction <span aria-hidden="true">→</span></button>
        </div>
        {ambiguousHash?<div className="pt-chain-choice" role="group" aria-label="Select blockchain"><p>This transaction ID could belong to more than one network. Which blockchain are you tracking?</p><div><button type="button" onClick={()=>router.push("/btc/"+ambiguousHash)}>₿ Bitcoin →</button><button type="button" onClick={()=>router.push("/eth/0x"+ambiguousHash)}>◆ Ethereum →</button></div></div>:null}
        {error ? <p className="pt-error" role="alert">{error}</p> : null}
        <div className="pt-hero-benefits">
          <div><span className="pt-benefit-icon" aria-hidden="true">▤</span><span><strong>Clear summaries</strong><small>No confusing technical jargon.</small></span></div>
          <div><span className="pt-benefit-icon" aria-hidden="true">◷</span><span><strong>Real-time status</strong><small>See what’s happening now.</small></span></div>
          <div><span className="pt-benefit-icon" aria-hidden="true">↗</span><span><strong>Understand delays</strong><small>Get insights and estimated timing.</small></span></div>
        </div>
        <p className="pt-hero-safety">No signup or wallet connection required. Never enter a seed phrase or private key.</p>
      </div>
    </div>

    
    <section className="pt-home-live" aria-labelledby="pt-home-live-title">
      <div className="pt-home-live-head"><div><h2 id="pt-home-live-title">Live Network Activity <span className="pt-live-pill">● LIVE</span></h2><p>Real-time Bitcoin and Ethereum network activity. Click into either explorer for full details.</p></div><a className="pt-live-dashboard-link" href="#network">View live dashboard →</a></div>
      <div className="pt-home-live-grid">
        <div className="pt-home-live-panel pt-live-btc"><div className="pt-live-panel-heading"><span className="pt-live-coin">₿</span><h3>Bitcoin</h3><a className="pt-live-explore-link" href="/bitcoin" aria-label="Open Bitcoin Explorer">Explore Bitcoin <span aria-hidden="true">↗</span></a></div><div className="pt-live-network-top"><div className="pt-live-chart"><NetworkHoneycomb chain="btc"/></div><div className="pt-live-facts"><span>Latest block<b>{btc?.height==null?"—":"#"+format(btc.height)}</b></span><span>Transactions waiting<b>{format(btc?.pending)}</b></span><span>Priority fee<b>{btc?.fastestFee==null?"—":btc.fastestFee+" sat/vB"}</b></span></div></div><div className="pt-reference-table"><div className="pt-reference-table-title"><h3>Recent Bitcoin Transactions</h3><a href="/bitcoin">View all →</a></div><div className="pt-reference-table-head"><span>TXID</span><span>Network fee</span><span>Size</span><span>Status</span></div>{(liveBtcTransactions.length?liveBtcTransactions.map(t=>({id:t.id,fee:t.fee,vsize:t.vsize})):btc?.recentTransactions??[]).slice(0,4).map(t=><a className="pt-reference-table-row" key={t.id} href={"/btc/"+t.id}><span>{t.id.slice(0,12)}…{t.id.slice(-7)}</span><span>{t.fee==null?"—":format(t.fee)+" sats"}</span><span>{t.vsize==null?"—":format(t.vsize)+" vB"}</span><span><em>Pending</em></span></a>)}{!liveBtcTransactions.length&&!btc?.recentTransactions?.length?<p className="pt-reference-empty">Waiting for Bitcoin transactions…</p>:null}</div></div>
        <div className="pt-home-live-panel pt-live-eth"><div className="pt-live-panel-heading"><span className="pt-live-coin">◆</span><h3>Ethereum</h3><a className="pt-live-explore-link" href="/ethereum" aria-label="Open Ethereum Explorer">Explore Ethereum <span aria-hidden="true">↗</span></a></div><div className="pt-live-network-top"><div className="pt-live-chart"><NetworkHoneycomb chain="eth"/></div><div className="pt-live-facts"><span>Latest block<b>{eth?.latestBlock==null?"—":"#"+format(Number(eth.latestBlock))}</b></span><span>Gas price<b>{eth?.gasGwei==null?"—":eth.gasGwei+" gwei"}</b></span><span>Block interval<b>~12 sec</b></span></div></div><div className="pt-reference-table"><div className="pt-reference-table-title"><h3>Recent Ethereum Transactions</h3><a href="/ethereum">View all →</a></div><div className="pt-reference-table-head"><span>TX Hash</span><span>Block</span><span>Type</span><span>Status</span></div>{(eth?.recentTransactions??[]).slice(0,4).map(t=><a className="pt-reference-table-row" key={t.hash} href={"/eth/"+t.hash}><span>{t.hash.slice(0,12)}…{t.hash.slice(-7)}</span><span>{t.block==null?"—":"#"+format(t.block)}</span><span>Transaction</span><span><em>{t.status??"Unknown"}</em></span></a>)}{!eth?.recentTransactions?.length?<p className="pt-reference-empty">Waiting for Ethereum transactions…</p>:null}</div></div>
      </div><p className="pt-home-live-source">Network data from mempool.space and Blockscout. Animated visuals are decorative, not historical measurements.</p>
    </section>
    <section className="pt-section pt-journey pt-comparison" id="how-it-works" data-chain={comparisonChain}>
      <div className="pt-comparison-heading">
        <div className="pt-eyebrow">THE PENDING TRACKER DIFFERENCE</div>
        <h2>Same blockchain. A clearer picture.</h2>
        <p>We show you the blockchain data — then translate it into clear explanations, so you understand what you're looking at and why it matters.</p>
      </div>
      <div className="pt-comparison-selector">
        <div className="pt-comparison-selector-title">CHOOSE YOUR BLOCKCHAIN</div>
        <div className="pt-comparison-chain-tabs" role="group" aria-label="Choose blockchain example">
          <button type="button" className={comparisonChain==="btc"?"is-active":""} data-chain="btc" aria-pressed={comparisonChain==="btc"} onClick={()=>setComparisonChain("btc")}><span className="pt-comparison-honeycombs" aria-hidden="true"><i/><i/><i/></span><span className="pt-comparison-button-content"><span className="pt-comparison-hex" aria-hidden="true">₿</span><span>Bitcoin<small>{comparisonChain==="btc"?"✓ Selected":"Click to explore"}</small></span></span></button>
          <button type="button" className={comparisonChain==="eth"?"is-active":""} data-chain="eth" aria-pressed={comparisonChain==="eth"} onClick={()=>setComparisonChain("eth")}><span className="pt-comparison-honeycombs" aria-hidden="true"><i/><i/><i/></span><span className="pt-comparison-button-content"><span className="pt-comparison-hex" aria-hidden="true">◆</span><span>Ethereum<small>{comparisonChain==="eth"?"✓ Selected":"Click to explore"}</small></span></span></button>
        </div>
      </div>
      <div className="pt-comparison-mode-tabs" role="group" aria-label="Choose what to explore">
        <button type="button" className={comparisonMode==="explore"?"is-active":""} aria-pressed={comparisonMode==="explore"} onClick={()=>setComparisonMode("explore")}><span aria-hidden="true">⬡</span> Explore Blockchain</button>
        <button type="button" className={comparisonMode==="track"?"is-active":""} aria-pressed={comparisonMode==="track"} onClick={()=>setComparisonMode("track")}><span aria-hidden="true">⌕</span> Track Transaction</button>
      </div>
      <div className="pt-comparison-grid">
        <div className="pt-comparison-raw">
          <h3><span aria-hidden="true">▤</span> Traditional Explorer</h3>
          <div className="pt-comparison-kicker">RAW BLOCKCHAIN DATA</div>
          <div className="pt-comparison-fields">{comparison.raw.map(([label,value])=><div className="pt-comparison-field" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        </div>
        <div className="pt-comparison-explained">
          <h3><span aria-hidden="true">✦</span> Pending Tracker Explains</h3>
          <div className="pt-comparison-copy"><h4>{comparison.heading}</h4><p>{comparison.intro}</p>
            {comparison.details.map(([label,description])=><div className="pt-comparison-detail" key={label}><h5>{label}</h5><p>{description}</p></div>)}
          </div>
          <div className="pt-comparison-bottom"><h5><span aria-hidden="true">✓</span> The bottom line</h5><p>{comparison.bottom}</p></div>
        </div>
      </div>
      <p className="pt-comparison-disclaimer">Illustrative examples using hypothetical data, not live blockchain measurements.</p>
      <div className="pt-comparison-footer"><h3>Not just transactions. The entire network, made understandable.</h3><p>From individual transactions and wallet activity to blocks, fees, and network conditions, Pending Tracker helps you explore Bitcoin and Ethereum without getting lost in technical data.</p></div>
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
