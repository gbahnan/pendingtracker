"use client";
import {useEffect,useRef,useState} from "react";
import "./BlockchainMotion.css";
type Block={height:number|null;ageMinutes:number;transactionCount:number|null;id:string|null};
type Projection={medianFee:number|null;feeRange:number[]|null};
type Props={pending:number|null|undefined;fee:number|null|undefined;blocks:Block[];projectedCount:number|null|undefined;projections?:Projection[]};
const fmt=(n:number|null|undefined)=>n==null?"—":Math.round(n).toLocaleString("en-US");
const times=[60,50,40,30,20,10];
const dots=Array.from({length:80},(_,i)=>({left:7+(i*37)%84,top:10+(i*43)%78,delay:-((i*13)%61)/7,duration:1.5+(i%5)*.37}));
function Hex({blue=false,time,feeText}:{blue?:boolean;time?:number;feeText?:string}){
 return <div className={"motion-halo"+(blue?" blue":"")}><div className={"motion-hex"+(blue?" blue":"")}>
  <div className="motion-sparks" aria-hidden="true">{dots.slice(0,blue?13:10).map((d,i)=><i key={i} style={{left:d.left+"%",top:d.top+"%",["--delay" as string]:d.delay+"s",["--dur" as string]:d.duration+"s"}}/>)}</div>
  <div className="motion-hex-content">{blue?<strong>₿</strong>:<><strong>~{time} MIN</strong><small>{feeText||"— sat/vB"}</small></>}</div>
 </div></div>
}
export default function BlockchainWebGL({pending,fee,blocks,projections=[]}:Props){
 const viewport=useRef<HTMLDivElement>(null);
 const pointer=useRef<{x:number;scroll:number;id:number}|null>(null);
 const [dragging,setDragging]=useState(false),[info,setInfo]=useState(false),[selected,setSelected]=useState<number|null>(null),[newBlock,setNewBlock]=useState(false);
 const prevTip=useRef<string|null>(null);
 const recent=blocks.slice(0,12);
 useEffect(()=>{const tip=blocks[0]?.id;if(!tip)return;if(prevTip.current&&prevTip.current!==tip){setNewBlock(true);const t=setTimeout(()=>setNewBlock(false),1700);prevTip.current=tip;return()=>clearTimeout(t)}prevTip.current=tip},[blocks]);
 useEffect(()=>{const node=viewport.current;if(!node)return;node.scrollLeft=0},[]);
 const stageFees=times.map((_,i)=>{const p=projections[Math.min(5-i,projections.length-1)];const n=p?.medianFee;return n!=null&&Number.isFinite(n)?n.toFixed(n<1?2:1)+" sat/vB":i===5&&fee!=null?fee.toFixed(1)+" sat/vB":"Fee unavailable"});
 function down(e:React.PointerEvent<HTMLDivElement>){if(e.pointerType==="touch"||e.button!==0)return;const n=viewport.current;if(!n)return;pointer.current={x:e.clientX,scroll:n.scrollLeft,id:e.pointerId};setDragging(false)}
 function move(e:React.PointerEvent<HTMLDivElement>){const p=pointer.current,n=viewport.current;if(!p||!n||p.id!==e.pointerId)return;const d=e.clientX-p.x;if(Math.abs(d)>5){setDragging(true);if(!n.hasPointerCapture(e.pointerId))n.setPointerCapture(e.pointerId);n.scrollLeft=p.scroll-d}}
 function up(e:React.PointerEvent<HTMLDivElement>){pointer.current=null;setTimeout(()=>setDragging(false),0);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}
 return <div className="motion">
  <div className="motion-top"><span className="motion-live">LIVE BITCOIN NETWORK</span><button className="motion-info" type="button" onClick={()=>setInfo(!info)} aria-expanded={info}>ⓘ How does this work? {info?"−":"＋"}</button></div>
  {info&&<p className="motion-explain">Gold hexagons illustrate estimated waiting times, not guaranteed countdowns. Their fee rates are indicative estimates based on projected mempool blocks, not a guaranteed rate for a particular time. Blue hexagons represent actual confirmed blocks. Animated dots explain the journey; they are not individually tracked transactions.</p>}
  <div className="motion-arrows"><span>← Longer estimated waits</span><div><button type="button" aria-label="Scroll toward mempool" onClick={()=>viewport.current?.scrollBy({left:-360,behavior:"smooth"})}>←</button><button type="button" aria-label="Scroll toward confirmed blocks" onClick={()=>viewport.current?.scrollBy({left:360,behavior:"smooth"})}>→</button></div><span>Drag or scroll to see confirmed blocks →</span></div>
  <div className={"motion-window"+(dragging?" grabbing":"")} ref={viewport} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} tabIndex={0} aria-label="Horizontally scrollable Bitcoin transaction journey">
   <div className={"motion-track"+(newBlock?" motion-new":"")}>
    
    <div className="motion-cell mempool"><div className="motion-label"><strong>MEMPOOL</strong><span>{fmt(pending)} waiting transactions</span></div><div className="motion-pool"><span className="motion-pool-glow"/>{dots.map((d,i)=><i key={i} style={{left:d.left+"%",top:d.top+"%",["--delay" as string]:d.delay+"s",["--dur" as string]:d.duration+"s"}}/>)}</div><div className="motion-caption"><strong>Unconfirmed transactions</strong></div></div>
    {times.map((t,i)=><div className="motion-cell motion-stage" key={t}><div className="motion-label"><span>Estimated confirmation</span></div><Hex time={t} feeText={stageFees[i]}/><div className="motion-caption">{i===5?"Next projected block":"Estimated wait · not guaranteed"}</div></div>)}
    {recent.map((b,i)=><button type="button" className="motion-cell confirmed" key={b.id||i} onClick={()=>{if(!dragging)setSelected(selected===i?null:i)}}><div className="motion-label"><strong>CONFIRMED</strong><span>{fmt(b.ageMinutes)} min ago</span></div>{i===0&&<div className="motion-divider"/>}<Hex blue/><div className="motion-caption"><strong>#{fmt(b.height)}</strong>{fmt(b.transactionCount)} transactions</div></button>)}
   </div>
  </div>
  <div className="motion-footer"><span>GOLD · Estimated waiting</span><span>BLUE · Confirmed blocks</span><span>Swipe on mobile · Drag or use arrows on desktop</span></div>
  {selected!==null&&recent[selected]&&<div className="motion-detail"><strong>Block #{fmt(recent[selected].height)}</strong><span>{fmt(recent[selected].transactionCount)} transactions · {fmt(recent[selected].ageMinutes)} min ago</span>{recent[selected].id&&<a href={"https://mempool.space/block/"+recent[selected].id} target="_blank" rel="noopener noreferrer">View block ↗</a>}</div>}
  <p className="motion-note">Live network figures and confirmed blocks. Time bands and moving particles are illustrative, not a simulation of individual transaction paths. Fee estimates may change.</p>
 </div>
}
