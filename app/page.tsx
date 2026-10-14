"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./home-2026.css";
import "./home-clarity.css";
import SearchGuidance from "./components/SearchGuidance";
// @ts-ignore JS WebGL component intentionally owns its renderer lifecycle.


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


function HeroEmblem({chain,variant="hero"}:{chain:"btc"|"eth";variant?:"hero"|"network"}) {
 const uid=chain+"-"+variant;
 const btc=chain==="btc",a=btc?"#ffb521":"#238dff",b=btc?"#fff2c0":"#b6eaff",shade=btc?"#65320a":"#082d74";
 const hp=(x:number,y:number,r:number)=>Array.from({length:6},(_,i)=>{const t=i*Math.PI/3-Math.PI/6;return (x+r*Math.cos(t)).toFixed(1)+","+(y+r*Math.sin(t)).toFixed(1)}).join(" ");
 const satellites=variant==="hero"?[[36,42,19],[90,14,12],[252,31,17],[267,119,13],[40,184,16],[242,207,22],[110,225,10],[18,112,9]]:[[34,53,13],[77,22,9],[245,34,13],[260,104,9],[40,190,12],[245,193,14],[107,225,8],[20,117,7]];
 return <svg className={"pt26-hero-graphic "+chain+" "+variant} viewBox="0 0 300 250" aria-hidden="true">
 <defs>
 <linearGradient id={"hero-metal-"+chain} x1="0" y1="0" x2="1" y2="1"><stop stopColor={b}/><stop offset=".16" stopColor={a}/><stop offset=".48" stopColor={shade}/><stop offset=".72" stopColor={a}/><stop offset="1" stopColor={b}/></linearGradient>
 <radialGradient id={"hero-halo-"+chain}><stop stopColor={a} stopOpacity=".46"/><stop offset=".45" stopColor={a} stopOpacity=".15"/><stop offset="1" stopColor={a} stopOpacity="0"/></radialGradient>
 <filter id={"hero-blur-"+chain} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>
 </defs>
 <ellipse cx="149" cy="125" rx="145" ry="121" fill={"url(#hero-halo-"+chain+")"}/>
 {satellites.map(([x,y,r],i)=><g key={i} className="pt26-hero-satellite" style={{animationDelay:-(i*2.3)+"s",animationDuration:(12+i%3*4)+"s"}}>
 <polygon points={hp(x,y,r+3)} fill={a} opacity=".4" filter={"url(#hero-blur-"+chain+")"}/>
 <polygon points={hp(x,y,r)} fill="#071426" stroke={a} strokeWidth="1.4"/>
 <polygon points={hp(x,y,r-3)} fill={"url(#hero-metal-"+chain+")"} fillOpacity=".55" stroke={b} strokeOpacity=".5" strokeWidth=".6"/>
 <path d={`M ${x-r*.65} ${y} L ${x} ${y-r*.75} L ${x+r*.65} ${y}`} fill="none" stroke={b} strokeOpacity=".6" strokeWidth="1"/>
 </g>)}
 <polygon points={hp(148,122,100)} fill={a} opacity=".45" filter={"url(#hero-blur-"+chain+")"}/>
 <polygon points={hp(148,122,88)} fill={"url(#hero-metal-"+chain+")"} stroke={b} strokeWidth="2"/>
 <polygon points={hp(148,122,80)} fill="#020a13" stroke={shade} strokeWidth="3"/>
 <polygon points={hp(148,122,72)} fill="#05101d" stroke={a} strokeWidth="1.6"/>
 <polygon points={hp(148,122,66)} fill="none" stroke={b} strokeOpacity=".5" strokeWidth="1"/>
 <path d="M 104 70 L 148 46 L 192 70" fill="none" stroke={b} strokeOpacity=".8" strokeWidth="2.5"/>
 {btc?<text x="148" y="156" textAnchor="middle" fill={b} fontSize="105" fontWeight="800" style={{filter:"drop-shadow(0 0 9px #ff9b15)"}}>₿</text>:<g><polygon points="148,55 112,120 148,142" fill="#b9e1ff"/><polygon points="148,55 184,120 148,142" fill="#488bff"/><polygon points="112,130 148,185 148,151" fill="#9fd1ff"/><polygon points="184,130 148,185 148,151" fill="#2863dc"/><path d="M148 55 L148 142 L184 120" fill="none" stroke="#e1f5ff" strokeOpacity=".65"/></g>}
 </svg>;
}

const clarityTopics = {
  btc: [
    {icon:"⬡",title:"Block Height",description:"Shows the position of a block in Bitcoin's chain. Higher numbers mean a more recent block.",example:"971,152"},
    {icon:"⇄",title:"Transactions",description:"The number of transactions included in a block. Each one records a movement of Bitcoin.",example:"2,845 transactions"},
    {icon:"≋",title:"Median Fee Rate",description:"The middle fee rate paid by transactions in a block. It describes past fees, not a guaranteed confirmation speed.",example:"4.2 sat/vB"},
    {icon:"◷",title:"Confirmations",description:"A transaction gets its first confirmation when included in a block. Each later block adds one more.",example:"3 confirmations"},
    {icon:"◈",title:"Block Size",description:"How much transaction data is in a Bitcoin block, measured in bytes.",example:"1,620,000 bytes"},
    {icon:"▤",title:"Block Weight",description:"Bitcoin's measure of how much block capacity transactions use.",example:"3,920,000 WU"},
    {icon:"₿",title:"Total Fees",description:"The sum of transaction fees paid to the miner who produced a block.",example:"0.085 BTC"},
    {icon:"#",title:"Block Hash",description:"A unique cryptographic identifier for a block. You can use it to look up that exact block.",example:"000000…8a42"}
  ],
  eth: [
    {icon:"⬡",title:"Block Number",description:"Identifies a block's position in Ethereum's history. Each new block gets a higher number.",example:"26,179,324"},
    {icon:"⇄",title:"Transactions",description:"The transactions included in a block, from transfers to smart contract interactions.",example:"144 transactions"},
    {icon:"≋",title:"Gas Price",description:"The price per unit of computation on Ethereum. The total cost also depends on gas used.",example:"1.23 gwei"},
    {icon:"◷",title:"Block Time",description:"Ethereum creates opportunities for new blocks in roughly 12-second slots. Not every slot necessarily contains a block.",example:"~12 seconds per slot"},
    {icon:"◇",title:"Gas Used",description:"The total computational work consumed by transactions in a block.",example:"14,500,000 gas"},
    {icon:"▤",title:"Gas Limit",description:"The maximum amount of gas that can be used within a block.",example:"Block gas limit"},
    {icon:"◆",title:"Base Fee",description:"A network-set fee per gas that changes with demand and is burned rather than paid to validators.",example:"0.82 gwei"},
    {icon:"#",title:"Transaction Hash",description:"A unique identifier you can use to look up a particular Ethereum transaction.",example:"0xca03…6f0a40"}
  ]
} as const;

export default function Page() {
  const router = useRouter();
  const [network, setNetwork] = useState<"btc" | "eth">("btc");
  const [comparisonChain, setComparisonChain] = useState<"btc" | "eth">("btc");
  const [clarityExpanded, setClarityExpanded] = useState(false);
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

    <section className="pt26-hero">
      <div className="pt26-hero-content">
        <div className="pt26-kicker">TRACK &nbsp; • &nbsp; <b>EXPLORE</b> &nbsp; • &nbsp; <em>UNDERSTAND</em></div>
        <h1>A simpler <span>blockchain explorer.</span></h1>
        <p>Explore the Bitcoin and Ethereum blockchains like never before. Track transactions, search wallet addresses, and understand complex blockchain data through clear, easy-to-understand summaries.</p>
        <form className="pt26-search" onSubmit={e=>{e.preventDefault();search()}}><span className="magnify" aria-hidden="true">⌕</span><input aria-label="Search transaction or address" placeholder="Search a transaction hash or wallet address (Bitcoin or Ethereum)..." value={query} onChange={e=>{setQuery(e.target.value);setError("");setAmbiguousHash("")}}/><button type="submit" aria-label="Search blockchain">→</button></form>
        <SearchGuidance query={query} chain="both"/>
        <div className="pt26-chain-select"><button type="button" className={"btc"+(network==="btc"?" active":"")} onClick={()=>setNetwork("btc")}>₿ &nbsp; Bitcoin</button><button type="button" className={"eth"+(network==="eth"?" active":"")} onClick={()=>setNetwork("eth")}>◆ &nbsp; Ethereum</button></div>
        {ambiguousHash?<div className="pt26-chain-choice">Choose the blockchain: <button onClick={()=>router.push("/btc/"+ambiguousHash)}>Bitcoin →</button><button onClick={()=>router.push("/eth/0x"+ambiguousHash)}>Ethereum →</button></div>:null}
        {error?<p className="pt26-search-error" role="alert">{error}</p>:null}
      </div>
    </section>
    <section className="pt26-live" aria-label="Live Bitcoin and Ethereum network activity">
      <header className="pt26-live-title"><h2>Live Network Activity <span>● LIVE</span></h2><p>Real-time Bitcoin and Ethereum network activity. Click into either explorer for full details.</p></header>
      <div className="pt26-grid">
        <article className="pt26-panel btc">
          <div className="pt26-panel-head"><span className="coin">₿</span><div><h2>Bitcoin</h2></div><a className="pt26-explore" href="/bitcoin">Explore Bitcoin ↗</a></div>
          <div className="pt26-card-visual"><div className="pt26-scene"><HeroEmblem chain="btc" variant="network"/></div><div className="pt26-side-stats"><div><small>Latest block</small><strong>{format(btc?.height)}</strong></div><div><small>Transactions waiting</small><strong>{format(btc?.pending)}</strong></div><div><small>Priority fee</small><strong>{btc?.fastestFee==null?"—":btc.fastestFee+" sat/vB"}</strong></div></div></div>
          <div className="pt26-feed"><div className="pt26-feed-head"><strong>₿ &nbsp;Latest Bitcoin Transactions</strong><a href="/bitcoin">View More →</a></div>
            {[...liveBtcTransactions.map(t=>({...t,value:null})),...(btc?.recentTransactions??[]).filter(t=>!liveBtcTransactions.some(l=>l.id===t.id))].slice(0,5).map(t=><a className="pt26-feed-row" href={"/btc/"+t.id} key={t.id}><span className="hash">{t.id.slice(0,7)}…{t.id.slice(-5)}</span><span className="detail">{t.fee!=null&&t.vsize?(t.fee/t.vsize).toFixed(1)+" sat/vB":"Fee pending"}</span><span className="age">Pending</span><b>›</b></a>)}
            {!liveBtcTransactions.length&&!btc?.recentTransactions?.length?<p className="pt26-feed-empty">Waiting for live Bitcoin transactions…</p>:null}
          </div><a className="pt26-cta" href="/bitcoin">Explore Bitcoin Blockchain →</a>
        </article>
        <article className="pt26-panel eth">
          <div className="pt26-panel-head"><span className="coin">◆</span><div><h2>Ethereum</h2></div><a className="pt26-explore" href="/ethereum">Explore Ethereum ↗</a></div>
          <div className="pt26-card-visual"><div className="pt26-scene"><HeroEmblem chain="eth" variant="network"/></div><div className="pt26-side-stats"><div><small>Latest block</small><strong>{eth?.latestBlock==null?"—":format(Number(eth.latestBlock))}</strong></div><div><small>Gas price</small><strong>{eth?.gasGwei==null?"—":eth.gasGwei.toLocaleString("en-US",{maximumFractionDigits:2})+" Gwei"}</strong></div><div><small>Slot time</small><strong>~12 sec</strong></div></div></div>
          <div className="pt26-feed"><div className="pt26-feed-head"><strong>◆ &nbsp;Latest Ethereum Transactions</strong><a href="/ethereum">View More →</a></div>
            {(eth?.recentTransactions??[]).slice(0,5).map(t=><a className="pt26-feed-row" href={"/eth/"+t.hash} key={t.hash}><span className="hash">{t.hash.slice(0,7)}…{t.hash.slice(-5)}</span><span className="detail">{t.block==null?"Pending":"Block "+format(t.block)}</span><span className="age">{t.status??"Recorded"}</span><b>›</b></a>)}
            {!eth?.recentTransactions?.length?<p className="pt26-feed-empty">Waiting for live Ethereum transactions…</p>:null}
          </div><a className="pt26-cta" href="/ethereum">Explore Ethereum Blockchain →</a>
        </article>
      </div>
      <div className="pt26-wallet-follow" aria-label="Explore notable blockchain wallets">
        <div className="pt26-wallet-follow-copy"><strong>Explore Notable Wallets <span aria-hidden="true">↗</span></strong><span>See what major public wallets are holding and moving. Select a network to explore.</span></div>
        <div className="pt26-wallet-follow-actions">
          <details className="pt26-wallet-dropdown btc"><summary><span>₿</span> Bitcoin wallets <b aria-hidden="true">⌄</b></summary>
            <div className="pt26-wallet-menu"><p>Large publicly tracked Bitcoin addresses</p>
              {[
                {name:"Binance · Cold Wallet 1",address:"34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo"},
                {name:"Binance · Cold Wallet 2",address:"3M219KR5vEneNb47ewrPfWyb5jQ2DjxRP6"},
                {name:"Robinhood · Cold Wallet",address:"bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2"},
                {name:"Bitfinex · Cold Wallet",address:"bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97"},
                {name:"Tether · BTC Reserves",address:"bc1qjasf9z3h7w3jspkhtgatgpyvvzgpa2wwd2lr0eh5tx44reyn2k7sfc27a4"}
              ].map(w=><a key={w.address} href={"/btc/address/"+w.address}><span><strong>{w.name}</strong><small>{w.address.slice(0,11)}…{w.address.slice(-7)}</small></span><span aria-hidden="true">↗</span></a>)}
              <small className="pt26-wallet-disclaimer">Public third-party labels; ownership attributions may change.</small>
            </div>
          </details>
          <details className="pt26-wallet-dropdown eth"><summary><span>◆</span> Ethereum wallets <b aria-hidden="true">⌄</b></summary>
            <div className="pt26-wallet-menu"><p>Major publicly labeled Ethereum addresses</p>
              {[
                {name:"Binance 7 · Cold Wallet",address:"0xbe0eb53f46cd790cd13851d5eff43d12404d33e8"},
                {name:"Binance 14 · Exchange Wallet",address:"0x28C6c06298d514Db089934071355E5743bf21d60"},
                {name:"Binance · Hot Wallet 20",address:"0xf977814e90da44bfa03b6295a0616a897441acec"},
                {name:"Bitfinex 19 · Cold Wallet",address:"0xe92d1a43df510f82c66382592a047d288f85226f"},
                {name:"Vitalik Buterin · Public Address",address:"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}
              ].map(w=><a key={w.address} href={"/eth/address/"+w.address}><span><strong>{w.name}</strong><small>{w.address.slice(0,11)}…{w.address.slice(-7)}</small></span><span aria-hidden="true">↗</span></a>)}
              <small className="pt26-wallet-disclaimer">Public third-party labels; these are individual addresses, not complete entity holdings.</small>
            </div>
          </details>
        </div>
      </div>
    </section>
    <section className="pt-clarity" id="how-it-works" data-chain={comparisonChain}>
      <div className="pt-clarity-inner">
        <div className="pt-clarity-top">
          <div className="pt-clarity-intro">
            <h2>Same blockchain.<br/><span>A clearer picture.</span></h2>
            <p>We show you the blockchain data — then translate it into clear explanations, so you understand what you're looking at and why it matters.</p>
          </div>
          <div className="pt-clarity-switch" role="group" aria-label="Choose blockchain explanations">
            <button type="button" className={comparisonChain==="btc"?"active":""} aria-pressed={comparisonChain==="btc"} onClick={()=>{setComparisonChain("btc");setClarityExpanded(false)}}><span>₿</span> Bitcoin</button>
            <button type="button" className={comparisonChain==="eth"?"active":""} aria-pressed={comparisonChain==="eth"} onClick={()=>{setComparisonChain("eth");setClarityExpanded(false)}}><span>◆</span> Ethereum</button>
          </div>
        </div>
        <div className="pt-clarity-cards">
          {clarityTopics[comparisonChain].slice(0,clarityExpanded?8:4).map(topic=><article className="pt-clarity-card" key={topic.title}>
            <div className="pt-clarity-icon" aria-hidden="true"><span>{topic.icon}</span></div>
            <h3>{topic.title}</h3>
            <p>{topic.description}</p>
            <div className="pt-clarity-example"><small>EXAMPLE</small><strong>{topic.example}</strong></div>
          </article>)}
        </div>
        <button className="pt-clarity-more" type="button" aria-expanded={clarityExpanded} onClick={()=>setClarityExpanded(v=>!v)}>{clarityExpanded?"Show Fewer Explanations":"Show 4 More Explanations"} <span aria-hidden="true">{clarityExpanded?"⌃":"⌄"}</span></button>
        <p className="pt-clarity-note">Examples are illustrative, not live blockchain measurements.</p>
      </div>
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
    <section className="pt-section pt-learn-simple pt-faq-refresh" id="learn" aria-labelledby="pt-faq-title">
      <div className="pt-faq-heading">
        <div className="pt-eyebrow">QUICK ANSWERS</div>
        <h2 id="pt-faq-title">Blockchain questions? Simple answers.</h2>
        <p>Understand the basics of Bitcoin and Ethereum without the technical jargon.</p>
      </div>
      <div className="pt-faq-list">
        <details className="pt-faq-item"><summary><span className="pt-faq-symbol" aria-hidden="true">⬡</span><span>What is a blockchain explorer?</span><span className="pt-faq-chevron" aria-hidden="true">＋</span></summary><div className="pt-faq-answer"><p>Think of it as a search engine for a blockchain's public records. You can look up transactions, blocks, fees, and network activity. Pending Tracker shows the underlying data and explains what it means in everyday language.</p></div></details>
        <details className="pt-faq-item"><summary><span className="pt-faq-symbol" aria-hidden="true">◆</span><span>What's the difference between Bitcoin and Ethereum?</span><span className="pt-faq-chevron" aria-hidden="true">＋</span></summary><div className="pt-faq-answer"><p><strong>Bitcoin</strong> is primarily a network for transferring and holding bitcoin. <strong>Ethereum</strong> also runs smart contracts — programs that can power tokens and decentralized applications. Both record activity on public blockchains, but their fees, transaction details, and confirmation processes work differently. Pending Tracker explains each network using its own terminology.</p></div></details>
        <details className="pt-faq-item"><summary><span className="pt-faq-symbol" aria-hidden="true">⌛</span><span>Why is my transaction pending?</span><span className="pt-faq-chevron" aria-hidden="true">＋</span></summary><div className="pt-faq-answer"><p>A pending transaction has not yet been included in a block. On Bitcoin, its fee rate compared with other waiting transactions can affect when miners include it. On Ethereum, network demand, the offered fee, and account transaction ordering can affect when a transaction is processed. Pending does not automatically mean failed, and no confirmation estimate is guaranteed. Search your transaction ID to see what the available data tells us.</p></div></details>
        <details className="pt-faq-item"><summary><span className="pt-faq-symbol" aria-hidden="true">▤</span><span>What are blocks, confirmations, and network fees?</span><span className="pt-faq-chevron" aria-hidden="true">＋</span></summary><div className="pt-faq-answer"><p><strong>Blocks</strong> group recorded blockchain activity. A <strong>confirmation</strong> means a transaction has been included in a block; additional blocks can add confidence that the record will remain unchanged. <strong>Network fees</strong> are costs associated with processing transactions. Bitcoin commonly expresses fee rates in satoshis per virtual byte (sat/vB), while Ethereum uses gas to measure computational work and prices gas in units such as gwei. The amount and meaning of a fee depend on the network.</p></div></details>
      </div>
      <div className="pt-faq-safety"><span aria-hidden="true">◈</span><p><strong>A quick safety note:</strong> Transaction IDs are public references, but your wallet's recovery phrase, private keys, and passwords are secret. Never enter those into a blockchain explorer.</p></div>
    </section>

  </main>;
}
