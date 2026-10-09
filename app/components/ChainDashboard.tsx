"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
type Net={btc?:{pending?:number|null;fastestFee?:number|null;halfHourFee?:number|null;hourFee?:number|null;economyFee?:number|null;minimumFee?:number|null;projectedBlocks?:Array<{position:number;transactionCount:number|null;feeRange:number[]|null;medianFee:number|null}>;latestBlock?:{height:number|null;id:string|null;ageMinutes:number;transactionCount:number|null}|null;recentTransactions?:Array<{id:string;fee:number|null;vsize:number|null}>;congestion?:string;explanation?:string};eth?:{gasGwei?:number|null;latestBlock?:string|number|null;recentBlocks?:Array<{height:number|string|null;hash:string|null;transactionsCount:number|null;timestamp:string|null}>;recentTransactions?:Array<{hash:string;status:string|null;block:number|null}>;explanation?:string}};const fmt=(v:number|null|undefined)=>v==null?"—":new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(v);

// Most cells remain visible. One transaction-like cell changes at a time;
// occasionally a cell travels to a neighboring slot while another takes its place.
function Honeycomb(){
 const [hidden,setHidden]=useState<number[]>([]);
 const [moving,setMoving]=useState<Array<{from:number;to:number;id:number}>>([]);
 const sequence=useRef(0);
 useEffect(()=>{
  let active=true;
  const timers=new Set<ReturnType<typeof setTimeout>>();
  const schedule=(fn:()=>void,delay:number)=>{
   const timer=setTimeout(()=>{timers.delete(timer);if(active)fn()},delay);
   timers.add(timer);
  };
  const startMove=()=>{
   const from=Math.floor(Math.random()*120);
   const col=Math.floor(from/10),row=from%10;
   const options=[row>0?from-1:-1,row<9?from+1:-1,col>0?from-10:-1,col<11?from+10:-1].filter(n=>n>=0);
   const to=options[Math.floor(Math.random()*options.length)];
   const id=++sequence.current;
   setHidden(old=>old.includes(from)?old:[...old,from]);
   setMoving(old=>[...old,{from,to,id}]);
   schedule(()=>setMoving(old=>old.filter(m=>m.id!==id)),2300);
   schedule(()=>setHidden(old=>old.filter(n=>n!==from)),2600);
  };
  // Independent staggered activity, with roughly three to five traveling cells visible.
  const tick=()=>{startMove();schedule(tick,275+Math.random()*65)};
  schedule(tick,350);
  return()=>{active=false;timers.forEach(clearTimeout);timers.clear()};
 },[]);
 const coords=(n:number)=>{const col=Math.floor(n/10),row=n%10;return {x:col*15-5,y:row*17.32+(col%2)*8.66-10}};
 const points=(x:number,y:number)=>Array.from({length:6},(_,k)=>{const a=Math.PI*k/3;return (x+10*Math.cos(a)).toFixed(2)+","+(y+10*Math.sin(a)).toFixed(2)}).join(" ");
 return <svg className="pt-chain-honeycomb pt-honeycomb-live" viewBox="0 0 160 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  {Array.from({length:120},(_,n)=>{const {x,y}=coords(n);return <polygon key={n} className={"pt-honeycomb-cell-live"+(hidden.includes(n)?" pt-honeycomb-empty":"")} points={points(x,y)}/>})}
  {moving.map(m=><polygon key={m.id} className="pt-honeycomb-traveler" points={points(coords(m.from).x,coords(m.from).y)} style={{"--hop-x":(coords(m.to).x-coords(m.from).x)+"px","--hop-y":(coords(m.to).y-coords(m.from).y)+"px"} as React.CSSProperties}/>)}
 </svg>;
}
export default function ChainDashboard({chain,trackedPosition,tracking=false,trackedEthBlock=null,ethPending=false}:{chain:"bitcoin"|"ethereum";trackedPosition?:number|null;tracking?:boolean;trackedEthBlock?:number|null;ethPending?:boolean}){
 const [data,setData]=useState<Net|null>(null);const [loading,setLoading]=useState(true);const [updated,setUpdated]=useState("");
 const [liveConnected,setLiveConnected]=useState(false);
 useEffect(()=>{
   let active=true, inFlight=false, lastFetch=0;
   let socket:WebSocket|null=null;
   let reconnect:ReturnType<typeof setTimeout>|null=null;
   let pendingRefresh:ReturnType<typeof setTimeout>|null=null;
   let retry=0;
   async function refresh(){
     if(!active||inFlight)return;
     inFlight=true;lastFetch=Date.now();
     try{const r=await fetch("/api/network",{cache:"no-store"});if(!r.ok)throw Error();
       const j=await r.json();if(active){setData(j);setUpdated(new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}));}
     }catch{}finally{inFlight=false;if(active)setLoading(false)}
   }
   function scheduleRefresh(){
     if(!active||pendingRefresh)return;
     pendingRefresh=setTimeout(()=>{pendingRefresh=null;void refresh()},Math.max(150,2500-(Date.now()-lastFetch)));
   }
   function connect(){
     if(!active||chain!=="bitcoin")return;
     try{
       socket=new WebSocket("wss://mempool.space/api/v1/ws");
       socket.onopen=()=>{if(!active)return;retry=0;setLiveConnected(true);socket?.send(JSON.stringify({action:"want",data:["blocks","mempool-blocks","stats"]}));scheduleRefresh()};
       socket.onmessage=(event)=>{if(!active)return;try{
         const message=JSON.parse(String(event.data));
         if(message.block||message.blocks||message["mempool-blocks"]||message["mempool-blocks-transactions"]||message.mempoolInfo||message.fees||message.conversions)scheduleRefresh();
       }catch{}};
       socket.onclose=()=>{if(!active)return;setLiveConnected(false);retry=Math.min(retry+1,5);reconnect=setTimeout(connect,Math.min(30000,1000*Math.pow(2,retry)))};
       socket.onerror=()=>socket?.close();
     }catch{setLiveConnected(false);reconnect=setTimeout(connect,10000)}
   }
   void refresh();connect();
   const fallback=setInterval(()=>{void refresh()},chain==="bitcoin"?8000:15000);
   return()=>{active=false;setLiveConnected(false);clearInterval(fallback);if(reconnect)clearTimeout(reconnect);if(pendingRefresh)clearTimeout(pendingRefresh);if(socket){socket.onclose=null;socket.close()}};
 },[chain]);
 const [blockFlash,setBlockFlash]=useState(false);
 const [queueFrame,setQueueFrame]=useState<Net["btc"]|null>(null);
 const lastBtcRef=useRef<Net["btc"]|null>(null);
 const lastHeightRef=useRef<number|null>(null);
 const flashTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
   const next=data?.btc;
   const height=next?.latestBlock?.height;
   if(height==null)return;
   const previous=lastBtcRef.current;
   const previousHeight=lastHeightRef.current;
   if(previousHeight!==null&&height>previousHeight&&previous?.projectedBlocks?.length){
     setQueueFrame(previous);
     setBlockFlash(true);
     if(flashTimerRef.current)clearTimeout(flashTimerRef.current);
     flashTimerRef.current=setTimeout(()=>{setBlockFlash(false);setQueueFrame(null)},1650);
   }
   lastBtcRef.current=next;
   lastHeightRef.current=height;
 },[data?.btc]);
 useEffect(()=>()=>{if(flashTimerRef.current)clearTimeout(flashTimerRef.current)},[]);
 const [ethShift,setEthShift]=useState(false);
 const lastEthHeight=useRef<number|null>(null);
 const ethShiftTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  const h=Number(data?.eth?.latestBlock);
  if(!Number.isFinite(h)||h<=0)return;
  if(lastEthHeight.current!==null&&h>lastEthHeight.current){
   setEthShift(true);
   if(ethShiftTimer.current)clearTimeout(ethShiftTimer.current);
   ethShiftTimer.current=setTimeout(()=>setEthShift(false),1450);
  }
  lastEthHeight.current=h;
 },[data?.eth?.latestBlock]);
 useEffect(()=>()=>{if(ethShiftTimer.current)clearTimeout(ethShiftTimer.current)},[]);
 const btc=data?.btc,eth=data?.eth,isBtc=chain==="bitcoin";
 const stat=isBtc?[{label:"Waiting transactions",value:fmt(btc?.pending),hint:"Payments waiting for a Bitcoin block"},{label:"Latest block",value:btc?.latestBlock?.height==null?"—":"#"+fmt(btc.latestBlock.height),hint:"Newest confirmed batch of transactions"},{label:"Priority fee guide",value:btc?.fastestFee==null?"—":fmt(btc.fastestFee)+" sat/vB",hint:"Estimated competitive fee rate"},{label:"Network traffic",value:btc?.congestion??"—",hint:"A rough view of how crowded the network is"}]:[{label:"Latest block",value:eth?.latestBlock==null?"—":"#"+eth.latestBlock,hint:"Newest recorded Ethereum block"},{label:"Average gas price",value:eth?.gasGwei==null?"—":fmt(eth.gasGwei)+" Gwei",hint:"Estimated price for one unit of gas"},{label:"Block rhythm",value:"~12 seconds",hint:"Typical Ethereum block interval, not a promise"},{label:"Network",value:"Mainnet",hint:"Ethereum's public production blockchain"}];
 const blocks=isBtc?(btc?.projectedBlocks??[]).slice(0,5).map(b=>({id:"p"+b.position,title:"Next ~"+b.position*10+" min",sub:"Projected block "+b.position,range:b.feeRange?.length?fmt(b.feeRange[0])+"–"+fmt(b.feeRange[1])+" sat/vB":"Fee range unavailable",median:b.medianFee,count:b.transactionCount==null?"Transactions unavailable":fmt(b.transactionCount)+" transactions",href:null as string|null})):(eth?.recentBlocks??[]).slice(0,5).map(b=>({id:b.hash??String(b.height),title:"Block #"+b.height,sub:"Recently recorded",range:"Confirmed block",median:null as number|null,count:b.transactionsCount==null?"Transaction count unavailable":fmt(b.transactionsCount)+" transactions",href:b.hash?"/eth/block/"+b.hash:null as string|null}));
 const displayBtc=blockFlash&&queueFrame?queueFrame:btc;
 const flowBlocks=(displayBtc?.projectedBlocks??[]).slice(0,5).map(b=>({id:"p"+b.position,median:b.medianFee,count:b.transactionCount==null?"Transactions unavailable":fmt(b.transactionCount)+" transactions"}));
 const feeLevels=isBtc?[{label:"Higher priority",fee:btc?.fastestFee,wait:"Often next block (~10 min)",note:"A current fee recommendation, not a guarantee"},{label:"Medium priority",fee:btc?.halfHourFee,wait:"Around 30 minutes",note:"Guide for roughly three average Bitcoin blocks"},{label:"Lower priority",fee:btc?.hourFee,wait:"Around 60 minutes",note:"May take longer if the network gets busier"},{label:"Economy",fee:btc?.economyFee,wait:"No dependable time",note:"Lower fees can wait much longer"}]:[{label:"Typical gas price",fee:eth?.gasGwei,wait:"Blocks usually ~12 seconds apart",note:"Actual inclusion depends on your transaction's max fee, priority fee and nonce"}];
 const flowVisualization=<div className="pt-chain-flow" aria-label="Animated illustration of transactions moving toward projected Bitcoin blocks">
        <div className="pt-chain-flow-head"><span className="pt-chain-flow-status"><span className="pt-chain-live-dot"/> {liveConnected?"LIVE MEMPOOL FLOW":"LIVE DATA · RECONNECTING"}</span><span>Animated flow · live projected fees and transactions</span></div>
        <div className="pt-chain-flow-scene">
          <div className="pt-chain-flow-stream" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{animationDelay:(i*.43)+"s",top:(16+(i*31)%69)+"%"}}/>)}</div>
          <div className={"pt-chain-flow-shapes"+(blockFlash?" pt-chain-flow-shift":"")} >
            <div className={"pt-chain-flow-unit pt-chain-flow-confirmed-unit"+(blockFlash?" pt-chain-flow-new-confirmation":"")}>
              <div className="pt-chain-flow-hex pt-chain-flow-hex-confirmed"><span>CONFIRMED</span><strong>{displayBtc?.latestBlock?.height==null?"—":"#"+fmt(displayBtc.latestBlock.height)}</strong><small>on chain</small></div>
              <div className="pt-chain-flow-caption"><span className="pt-chain-flow-time">Latest block</span><span className="pt-chain-flow-tx">{displayBtc?.latestBlock?.transactionCount==null?"Confirmed":fmt(displayBtc.latestBlock.transactionCount)+" transactions"}</span></div>
            </div>
            {flowBlocks.map((b,i)=><div className="pt-chain-flow-unit" key={b.id}>
              <div className={"pt-chain-flow-hex pt-chain-flow-hex-pending"+(blockFlash&&i===0?" pt-chain-flow-mined":"")}><Honeycomb/><div className="pt-chain-flow-shine"/><span>{i===0?"NEXT":String(i+1).padStart(2,"0")}</span><strong>{b.median==null?"—":fmt(b.median)}</strong><small>sat/vB</small></div>
              <div className="pt-chain-flow-caption">
                <span className="pt-chain-flow-time">~{(i+1)*10} min <small>estimated</small></span>
                <strong className="pt-chain-flow-fee">{b.median==null?"—":fmt(b.median)} <small>sat/vB</small></strong>
                <span className="pt-chain-flow-tx">{b.count} projected</span>{tracking&&trackedPosition===i+1&&<div className="pt-chain-tracked-arrow"><span>↑</span><strong>YOUR TRANSACTION</strong></div>}
              </div>
            </div>)}
            {blockFlash&&<div className="pt-chain-flow-unit pt-chain-flow-incoming" aria-hidden="true">
              <div className="pt-chain-flow-hex pt-chain-flow-hex-pending"><Honeycomb/><span>NEW</span><strong>→</strong><small>pending</small></div>
              <div className="pt-chain-flow-caption"><span className="pt-chain-flow-time">New projection</span></div>
            </div>}
          </div>
        </div>
        <div className="pt-chain-flow-confirmed"><span className={blockFlash?"pt-chain-confirmed-flash":""}>● {blockFlash?"NEW BLOCK CONFIRMED":"LATEST CONFIRMED BLOCK"} {btc?.latestBlock?.height==null?"":("#"+fmt(btc.latestBlock.height))}</span><span>Queue advances when a new block is detected; projections are recalculated from the live mempool.</span></div>
      </div>;
 const ethereumVisualization=<div className="pt-chain-flow pt-eth-flow" aria-label="Live Ethereum blocks and transaction status">
  <div className="pt-chain-flow-head"><span className="pt-chain-flow-status"><span className="pt-chain-live-dot"/> LIVE ETHEREUM BLOCKS</span><span>New blocks approximately every 12 seconds · live data</span></div>
  <div className="pt-chain-flow-scene">
   <div className={"pt-chain-flow-shapes"+(ethShift?" pt-chain-flow-shift":"")}>
    {(eth?.recentBlocks??[]).slice(0,5).map((b,i)=><div className="pt-chain-flow-unit" key={String(b.hash??b.height??i)}>
     <div className={"pt-chain-flow-hex pt-chain-flow-hex-pending"+(ethShift&&i===0?" pt-chain-flow-mined":"")}><Honeycomb/><div className="pt-chain-flow-shine"/><span>{i===0?"LATEST":"CONFIRMED"}</span><strong>#{b.height==null?"—":fmt(Number(b.height))}</strong><small>ETH BLOCK</small></div>
     <div className="pt-chain-flow-caption"><span className="pt-chain-flow-time">{i===0?"Latest block":"Previous block"}</span><span className="pt-chain-flow-tx">{b.transactionsCount==null?"Transactions unavailable":fmt(b.transactionsCount)+" transactions"}</span>
     {tracking&&trackedEthBlock!=null&&Number(b.height)===trackedEthBlock&&<div className="pt-chain-tracked-arrow"><span>↑</span><strong>YOUR TRANSACTION</strong></div>}
     </div>
    </div>)}
    {!(eth?.recentBlocks?.length)&&<div className="pt-chain-flow-unit"><div className="pt-chain-flow-hex pt-chain-flow-hex-pending"><Honeycomb/><span>ETHEREUM</span><strong>—</strong><small>loading blocks</small></div></div>}
   </div>
  </div>
  {tracking&&ethPending&&<div className="pt-eth-pending-locator"><span>↑ YOUR TRANSACTION</span><strong>Pending in the network · future block unknown</strong><small>Ethereum transactions are not assigned a guaranteed upcoming block. Gas settings and account nonce can affect inclusion.</small></div>}
  <div className="pt-chain-flow-confirmed"><span className={ethShift?"pt-chain-confirmed-flash":""}>● {ethShift?"NEW ETHEREUM BLOCK":"LATEST ETHEREUM BLOCK"} {eth?.latestBlock==null?"":"#"+eth.latestBlock}</span><span>Confirmed blocks advance when the network reports a new block; these are historical blocks, not a future queue.</span></div>
 </div>;
 if(tracking)return <div className="pt-dash pt-dash-tracking">{isBtc?flowVisualization:ethereumVisualization}</div>;
 return <div className="pt-dash">
  <div className="pt-dash-top"><div><div className="pt-eyebrow">LIVE NETWORK OVERVIEW</div><h2>What's happening on the {isBtc?"Bitcoin":"Ethereum"} network?</h2><p>A live snapshot of activity, waiting transactions and network costs — with the important numbers explained.</p></div><span className="pt-dash-live">{loading?"Loading live data…":updated?"● Updated "+updated:"● Data unavailable"}</span></div>
  <div className="pt-dash-stats" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>{stat.map(x=><div className="pt-dash-stat" key={x.label}><span>{x.label}</span><strong>{x.value}</strong><small>{x.hint}</small></div>)}</div>
  <section className="pt-dash-blocks" style={{marginTop:32,padding:"30px 0",background:"transparent",border:0,borderTop:"1px solid #40586a",borderBottom:"1px solid #40586a",borderRadius:0}}>
    <div className="pt-dash-heading" style={{marginBottom:24}}><div className="pt-eyebrow">{isBtc?"LIVE BITCOIN MEMPOOL":"ETHEREUM NETWORK ACTIVITY"}</div><h3 style={{fontSize:"clamp(23px,2.8vw,32px)",letterSpacing:"-0.03em",margin:"8px 0"}}>{isBtc?"Current estimated transaction confirmation times":"Latest confirmed Ethereum blocks"}</h3><p style={{maxWidth:850,lineHeight:1.7}}>{isBtc?"See how many transactions are currently projected for each upcoming Bitcoin block. Each column is a possible block, roughly 10 minutes apart on average — not a guaranteed appointment.":"Ethereum blocks arrive approximately every 12 seconds. These are recently recorded blocks, not predictions of future transaction waiting times."}</p></div>
    {isBtc?<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:18,color:"#adc4d0",fontSize:11,letterSpacing:"0.08em",fontWeight:700}}><span>NOW · MEMPOOL</span><span>PROJECTED BLOCKS →</span></div>
      {flowVisualization}
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:12,paddingTop:18,borderTop:"1px solid #344c5c"}}>
        <span style={{fontSize:12,lineHeight:1.7,color:"#bbced8"}}><strong style={{color:"#a8c9df"}}>What you're seeing:</strong> projected transaction groups, not actual scheduled blocks.</span>
        <span style={{fontSize:12,lineHeight:1.7,color:"#bbced8"}}>Blocks average ~10 minutes, but individual waits vary.</span>
      </div>
      <p style={{fontSize:11,lineHeight:1.7,color:"#9cb4c3",marginTop:12}}>These counts are live mempool estimates grouped by projected block position, not confirmed bookings or a guarantee that your transaction will appear at that time. Search your transaction above to review its fee and status.</p>
    </div>:ethereumVisualization}
  </section>
  {!isBtc?<section className="pt-dash-fees"><div className="pt-dash-heading"><div className="pt-eyebrow">ETHEREUM GAS</div><h3>What do Ethereum gas fees mean?</h3><p>Gas is the computation a transaction uses. Gwei is the unit used to quote gas prices. A typical block arrives roughly every 12 seconds, but this does not guarantee when an individual transaction will be included.</p></div><div className="pt-dash-feegrid">{feeLevels.map(f=><div className="pt-dash-feecard" key={f.label}><span>{f.label}</span><strong>{f.fee==null?"—":fmt(f.fee)+" Gwei"}</strong><b>{f.wait}</b><small>{f.note}</small></div>)}</div><p className="pt-dash-disclaimer">Ethereum does not have a dependable universal gas-price-to-minutes table. Search a transaction to see its actual status and any reported delay factors.</p></section>:null}
  <section className="pt-dash-recent"><div className="pt-dash-heading"><div><div className="pt-eyebrow">LIVE TRANSACTION ACTIVITY</div><h3>Recent {isBtc?"Bitcoin":"Ethereum"} transactions</h3><p>Choose any transaction to see its status, summary, and full technical record.</p></div></div><div className="pt-dash-txlist">{isBtc?(btc?.recentTransactions??[]).slice(0,5).map(t=><Link href={"/btc/"+t.id} className="pt-dash-tx" key={t.id}><div><b>{t.id.slice(0,16)}…{t.id.slice(-9)}</b><small>Waiting in the mempool · {t.fee==null?"Fee unavailable":fmt(t.fee)+" sats total fee"}</small></div><span>Explain →</span></Link>):(eth?.recentTransactions??[]).slice(0,5).map(t=><Link href={"/eth/"+t.hash} className="pt-dash-tx" key={t.hash}><div><b>{t.hash.slice(0,16)}…{t.hash.slice(-9)}</b><small>{t.status??"Status unavailable"}{t.block==null?"":" · Block #"+t.block}</small></div><span>Explain →</span></Link>)}{!(isBtc?btc?.recentTransactions?.length:eth?.recentTransactions?.length)?<p className="pt-dash-empty">Recent transactions are temporarily unavailable.</p>:null}</div></section>
  <section className="pt-dash-summary"><div className="pt-eyebrow">THE SIMPLE EXPLANATION</div><h3>What does all this mean?</h3><p>{isBtc?btc?.explanation??"Bitcoin transactions wait in a shared pool until miners add them to a block. The fee rate affects priority, but there is no guaranteed wait time.":eth?.explanation??"Ethereum transactions are processed in blocks, and gas fees pay for the work involved. A transaction's actual wait depends on its fee settings and other pending transactions."}</p><p>{isBtc?"If you are waiting on a Bitcoin payment, search its transaction ID above. We'll compare its actual fee with current conditions and explain what you can do next.":"If you are waiting on an Ethereum transfer, search its transaction hash above. We'll explain whether it succeeded, failed, or is still waiting, and show token movements when available."}</p><details><summary>More technical context ＋</summary><p>{isBtc?"Mempool: the waiting area for unconfirmed transactions. Sats: Bitcoin's smallest units. sat/vB: the fee rate per virtual byte. A block: a batch of confirmed transactions. Projections show possible miner selection, not guaranteed placement.":"Gas: computational work required by Ethereum. Gwei: one-billionth of an ETH. Nonce: the transaction sequence number from an address. A block: a batch of recorded transactions. A contract call can move tokens even if no ETH is directly transferred."}</p></details></section>
  <p className="pt-dash-source">Data from mempool.space and Blockscout · Refreshed approximately every 15 seconds while this page is open · Estimates are informational, not guarantees.</p>
 </div>
}