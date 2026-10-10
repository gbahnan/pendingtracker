"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
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

type BitcoinNet={btc?:{height?:number|null;pending?:number|null;fastestFee?:number|null;recentTransactions?:Array<{id:string;fee:number|null;vsize:number|null}>;latestBlock?:{height:number|null}|null;explanation?:string}};
const fmt=(v:number|null|undefined)=>v==null?"—":new Intl.NumberFormat("en-US").format(v);
export default function BitcoinExplorerLive({part="all"}:{part?:"search"|"live"|"all"}){
 const router=useRouter();
 const [query,setQuery]=useState("");const [error,setError]=useState("");
 const [net,setNet]=useState<BitcoinNet|null>(null);const [updated,setUpdated]=useState("");
 useEffect(()=>{let alive=true;const refresh=async()=>{try{const r=await fetch("/api/network",{cache:"no-store"});if(!r.ok)return;const j=await r.json();if(alive){setNet(j);setUpdated(new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}))}}catch{}};void refresh();const timer=setInterval(refresh,12000);return()=>{alive=false;clearInterval(timer)}},[]);
 const btc=net?.btc;
 function search(){let q=query.trim();try{if(/^https?:\/\//i.test(q)){const p=new URL(q).pathname.split("/").filter(Boolean);const i=p.findIndex(x=>["tx","transaction","address"].includes(x.toLowerCase()));if(i>=0&&p[i+1])q=p[i+1]}}catch{}q=q.split(/[?#]/)[0].replace(/\/$/,"");if(/^[a-f0-9]{64}$/i.test(q)){router.push("/btc/"+q);return}if(/^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(q)){router.push("/btc/address/"+q);return}setError("Enter a valid Bitcoin transaction ID or wallet address.")}
 return <>
 {(part==="search"||part==="all")&&<section className="pt-bitcoin-search pt-hero pt-hero-reference" id="transaction-search">
  <div className="pt-searchbox">
   <div className="pt-search-top"><div><h2>Track Your Transaction</h2><p className="pt-search-explain">Paste a Bitcoin transaction ID or wallet address and we'll turn the complex data into a simple, easy-to-understand summary.</p></div></div>
   <div className="pt-searchrow"><div className="pt-search-input-wrap"><span className="pt-search-magnifier" aria-hidden="true">⌕</span><input aria-label="Bitcoin transaction ID or wallet address" placeholder="Enter a Bitcoin transaction hash or address..." value={query} onChange={e=>{setQuery(e.target.value);setError("")}} onKeyDown={e=>{if(e.key==="Enter")search()}} spellCheck={false}/></div><button type="button" onClick={search}>Track Transaction <span aria-hidden="true">→</span></button></div>
   {error&&<p className="pt-error" role="alert">{error}</p>}
   <div className="pt-hero-benefits"><div><span className="pt-benefit-icon" aria-hidden="true">▤</span><span><strong>Clear summaries</strong><small>No confusing technical jargon.</small></span></div><div><span className="pt-benefit-icon" aria-hidden="true">◷</span><span><strong>Real-time status</strong><small>See what's happening now.</small></span></div><div><span className="pt-benefit-icon" aria-hidden="true">↗</span><span><strong>Understand delays</strong><small>Get insights and estimated timing.</small></span></div></div>
   <p className="pt-hero-safety">No signup or wallet connection required. Never enter a seed phrase or private key.</p>
  </div>
 </section>}
 {(part==="live"||part==="all")&&<section className="pt-home-live pt-bitcoin-live" aria-labelledby="pt-bitcoin-live-title">
  <div className="pt-home-live-head"><div><div className="pt-eyebrow">THE BITCOIN NETWORK · LIVE</div><h2 id="pt-bitcoin-live-title">Live Network Activity <span className="pt-live-pill">● LIVE</span></h2><p>Real Bitcoin blocks, waiting transactions and current fee conditions — explained alongside the data.</p></div><span className="pt-bitcoin-updated">{updated?"Updated "+updated:"Connecting to live data…"}</span></div>
  <div className="pt-home-live-grid"><div className="pt-home-live-panel pt-live-btc"><div className="pt-live-panel-heading"><span className="pt-live-coin">₿</span><h3>Bitcoin</h3><span className="pt-bitcoin-mainnet">MAINNET</span></div><div className="pt-live-network-top"><div className="pt-live-chart"><NetworkHoneycomb chain="btc"/></div><div className="pt-live-facts"><span>Latest block<b>{btc?.latestBlock?.height==null?"—":"#"+fmt(btc.latestBlock.height)}</b></span><span>Transactions waiting<b>{fmt(btc?.pending)}</b></span><span>Priority fee<b>{btc?.fastestFee==null?"—":btc.fastestFee+" sat/vB"}</b></span></div></div><div className="pt-reference-table"><div className="pt-reference-table-title"><h3>Recent Bitcoin Transactions</h3><span>LIVE MEMPOOL</span></div><div className="pt-reference-table-head"><span>TXID</span><span>Network fee</span><span>Size</span><span>Status</span></div>{(btc?.recentTransactions??[]).slice(0,4).map(t=><Link className="pt-reference-table-row" key={t.id} href={"/btc/"+t.id}><span>{t.id.slice(0,12)}…{t.id.slice(-7)}</span><span>{t.fee==null?"—":fmt(t.fee)+" sats"}</span><span>{t.vsize==null?"—":fmt(t.vsize)+" vB"}</span><span><em>Pending</em></span></Link>)}{!btc?.recentTransactions?.length&&<p className="pt-reference-empty">Waiting for Bitcoin transactions…</p>}</div></div>
  <aside className="pt-bitcoin-live-explained"><div className="pt-eyebrow">✦ PENDING TRACKER EXPLAINS</div><h3>What does this mean right now?</h3><p>{btc?.explanation??"Bitcoin transactions wait in the mempool until miners include them in a block. Fee competition affects priority, but confirmation times are never guaranteed."}</p><div className="pt-bitcoin-explain-point"><strong>Transactions waiting</strong><p>Payments that have been broadcast but are not yet confirmed in a Bitcoin block.</p></div><div className="pt-bitcoin-explain-point"><strong>Priority fee</strong><p>A live fee-rate recommendation, measured in satoshis per virtual byte (sat/vB). It is a guide, not a promise.</p></div><div className="pt-bitcoin-explain-point"><strong>Latest block</strong><p>The newest confirmed group of transactions added to Bitcoin's public record.</p></div><Link href="#bitcoin-fees" className="pt-bitcoin-text-link">Understand Bitcoin fees ↓</Link></aside></div>
  <p className="pt-home-live-source">Source: mempool.space via Pending Tracker · Values update while this page is open. The honeycomb is decorative.</p>
 </section>}
 </>;
}
