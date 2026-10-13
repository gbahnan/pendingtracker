"use client";
import {useEffect,useRef,useState} from "react";
type Block={height:number|null;ageMinutes:number;transactionCount:number|null;id:string|null};
type Props={pending:number|null|undefined;fee:number|null|undefined;blocks:Block[];projectedCount:number|null|undefined};
const fmt=(n:number|null|undefined)=>n==null?"—":Math.round(n).toLocaleString("en-US");
const buckets=[{label:"40+ MIN",sub:"Longer wait",share:.21},{label:"30–40 MIN",sub:"Lower priority",share:.23},{label:"20–30 MIN",sub:"Moderate priority",share:.23},{label:"10–20 MIN",sub:"Higher priority",share:.20},{label:"0–10 MIN",sub:"Next block candidate",share:.13}];
function Hex({blue=false,bright=false}:{blue?:boolean;bright?:boolean}){return <div className={"motion-hex "+(blue?"motion-blue ":"")+(bright?"motion-bright":"")}><div className="motion-hex-inner">{blue?"✓":bright?"₿":""}</div></div>}
export default function BlockchainWebGL({pending,fee,blocks,projectedCount}:Props){
 const scroller=useRef<HTMLDivElement>(null);const anchor=useRef<HTMLDivElement>(null);const initialized=useRef(false);const [selected,setSelected]=useState<number|null>(null);const [explain,setExplain]=useState(false);
 useEffect(()=>{if(initialized.current)return;const node=scroller.current,target=anchor.current;if(!node||!target)return;const id=requestAnimationFrame(()=>{node.scrollLeft=Math.max(0,target.offsetLeft-node.offsetLeft-node.clientWidth*.58);initialized.current=true});return()=>cancelAnimationFrame(id)},[]);
 const recent=blocks.slice(0,9);
 return <div className="motion-root">
 <div className="motion-intro"><span className="motion-live"><i/> LIVE BITCOIN NETWORK</span><button type="button" onClick={()=>setExplain(!explain)} aria-expanded={explain}>ⓘ How does this work? {explain?"−":"+"}</button></div>
 {explain&&<p className="motion-help">Each glowing dot is a visual illustration of a waiting transaction, not a tracked individual payment. Gold stages group transactions by estimated confirmation time, based on fee priority and network conditions. When a new block is mined, it becomes part of the blue confirmed history. Confirmation times are estimates, never guarantees.</p>}
 <div className="motion-window" ref={scroller} aria-label="Scrollable Bitcoin confirmation timeline" tabIndex={0}>
 <div className="motion-track">
 <div className="motion-rail"/><div className="motion-flow-dots" aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{animationDelay:`-${i*.63}s`,top:`${45+(i%5-2)*5}%`}}/>)}</div>
 <div className="motion-stage motion-pool"><div className="motion-stage-top"><strong>MEMPOOL</strong><small>{fmt(pending)} waiting</small></div><div className="motion-pool-shape">{Array.from({length:105},(_,i)=><i key={i} style={{left:`${3+(i*43%94)}%`,top:`${8+(i*31%83)}%`,animationDelay:`-${i*.17}s`}}/>)}</div><span className="motion-stage-note">Transactions waiting to be included</span></div>
 {buckets.map((b,i)=><div className="motion-stage motion-wait" key={b.label}><div className="motion-stage-top"><strong>{b.label}</strong><small>Estimated wait</small></div><Hex/><strong className="motion-stage-value">{pending==null?"—":fmt(Math.round(pending*b.share))} <small>est.</small></strong><span className="motion-stage-note">{b.sub}</span></div>)}
 <div className="motion-stage motion-next" ref={anchor}><div className="motion-stage-top"><strong>NEXT BLOCK</strong><small>Projected · ~10 min average</small></div><Hex bright/><strong className="motion-stage-value">{fmt(projectedCount)} <small>tx projected</small></strong><span className="motion-stage-note">{fee==null?"Fee estimate unavailable":`Median fee: ${fee.toFixed(1)} sat/vB`}</span></div>
 {recent.map((b,i)=><button type="button" key={b.id||i} className={"motion-stage motion-confirmed "+(selected===i?"motion-selected":"")} onClick={()=>setSelected(selected===i?null:i)}><div className="motion-stage-top"><strong>CONFIRMED</strong><small>{b.ageMinutes} min ago</small></div><Hex blue/><strong className="motion-stage-value">#{fmt(b.height)}</strong><span className="motion-stage-note">{fmt(b.transactionCount)} transactions</span></button>)}
 </div></div>
 <div className="motion-scroll-guide"><span>← Longer estimated waits</span><span>↔ Drag or scroll to explore</span><span>Older confirmed blocks →</span></div>
 {selected!==null&&recent[selected]&&<div className="motion-detail"><strong>Block #{fmt(recent[selected].height)}</strong><span>{fmt(recent[selected].transactionCount)} transactions confirmed {recent[selected].ageMinutes} minutes ago.</span>{recent[selected].id&&<a href={"/btc/block/"+recent[selected].id}>Explore block ↗</a>}</div>}
 <p className="motion-disclaimer">Live block data · Estimated waiting-time bands are illustrative, not measured transaction counts. Moving particles demonstrate the process, not individual transactions.</p>
 </div>
}