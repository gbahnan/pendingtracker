"use client";
import {useEffect,useRef,useState} from "react";
import "./BlockchainMotion.css";
type Block={height:number|null;ageMinutes:number;transactionCount:number|null;id:string|null};
type Projection={medianFee:number|null;feeRange:number[]|null};
type Props={pending:number|null|undefined;fee:number|null|undefined;blocks:Block[];projectedCount:number|null|undefined;projections?:Projection[]};
const fmt=(n:number|null|undefined)=>n==null?"—":Math.round(n).toLocaleString("en-US");
const times=[60,50,40,30,20,10];

function Hex({blue=false,time,feeText,seed=0}:{blue?:boolean;time?:number;feeText?:string;seed?:number}){
 return <div className={"motion-halo"+(blue?" blue":"")}><div className={"motion-hex"+(blue?" blue":"")}>
  
  <div className="motion-hex-content">{blue?<strong>₿</strong>:<><strong>~{time} MIN</strong><small>{feeText||"— sat/vB"}</small></>}</div>
 </div></div>
}
export default function BlockchainWebGL({pending,fee,blocks,projections=[]}:Props){
 const viewport=useRef<HTMLDivElement>(null);
 const trackRef=useRef<HTMLDivElement>(null);
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const pointer=useRef<{x:number;scroll:number;id:number}|null>(null);
 const [dragging,setDragging]=useState(false),[info,setInfo]=useState(false),[selected,setSelected]=useState<number|null>(null),[newBlock,setNewBlock]=useState(false);
 const prevTip=useRef<string|null>(null);
 const recent=blocks.slice(0,12);
 useEffect(()=>{
  const canvas=canvasRef.current,track=trackRef.current;
  if(!canvas||!track)return;
  const ctx=canvas.getContext("2d");if(!ctx)return;
  type Ball={phase:number;lane:number;speed:number;offset:number;radius:number;seed:number};
  const balls:Ball[]=Array.from({length:108},(_,i)=>({phase:(i*0.61803398875)%1,lane:(i*0.754877666)%1,speed:0.018+(i%9)*0.003,offset:i*1.73,radius:2.3+(i%5)*.45,seed:i*2.39996}));
  let raf=0,last=0,elapsed=0,layout:{x:number;y:number;w:number;h:number;kind:string}[]=[];
  const measure=()=>{
   const rect=track.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
   canvas.width=Math.round(track.clientWidth*dpr);canvas.height=Math.round(track.clientHeight*dpr);
   canvas.style.width=track.clientWidth+"px";canvas.style.height=track.clientHeight+"px";
   ctx.setTransform(dpr,0,0,dpr,0,0);
   layout=Array.from(track.querySelectorAll<HTMLElement>(".motion-pool,.motion-hex")).map(el=>{const r=el.getBoundingClientRect();return {x:r.left-rect.left,y:r.top-rect.top,w:r.width,h:r.height,kind:el.classList.contains("motion-pool")?"pool":el.classList.contains("blue")?"blue":"gold"}});
  };
  const observer=new ResizeObserver(measure);observer.observe(track);measure();
  const point=(box:{x:number;y:number;w:number;h:number;kind:string},u:number,v:number)=>{
   const cx=box.x+box.w/2,cy=box.y+box.h/2;
   if(box.kind==="pool")return {x:cx+(u-.5)*box.w*.79,y:cy+(v-.5)*box.h*.70};
   const yy=(v-.5)*box.h*.74;const limit=(box.w*.38)*(1-Math.abs(yy)/(box.h*.92));
   return {x:cx+(u*2-1)*limit,y:cy+yy};
  };
  const draw=(now:number)=>{
   const dt=Math.min((now-last)/1000||0,.05);last=now;elapsed+=dt;
   ctx.clearRect(0,0,track.clientWidth,track.clientHeight);
   if(layout.length){
    balls.forEach((b,i)=>{
     const journey=(b.phase+elapsed*b.speed)%1;
     const scaled=journey*layout.length;
     const index=Math.min(layout.length-1,Math.floor(scaled));
     const local=scaled-index;
     const box=layout[index];
     const angle=elapsed*(.95+(i%7)*.19)+b.seed;
     const u=.5+Math.sin(angle)*(.24+(b.lane*.12));
     const v=.5+Math.cos(angle*1.27)*(.25+((i%4)*.025));
     let pos=point(box,u,v),alpha=.86;
     // Balls spend most of their time bouncing inside a chamber, then travel across open space.
     if(local>.79&&index<layout.length-1){
      const next=layout[index+1],t=(local-.79)/.21;
      const exit=point(box,.94,.5+Math.sin(angle)*.08);
      const entry=point(next,.06,.5+Math.cos(angle)*.08);
      const smooth=t*t*(3-2*t);
      pos={x:exit.x+(entry.x-exit.x)*smooth,y:exit.y+(entry.y-exit.y)*smooth+Math.sin(t*Math.PI)*Math.sin(b.seed)*8};
     }
     const blue=box.kind==="blue" || (local>.79&&layout[index+1]?.kind==="blue"&&local>.91);
     const rgb=blue?"99,206,255":"255,190,79";
     ctx.beginPath();ctx.fillStyle="rgba("+rgb+","+(alpha*.17)+")";ctx.shadowColor="rgba("+rgb+",.9)";ctx.shadowBlur=13;ctx.arc(pos.x,pos.y,b.radius*2.2,0,Math.PI*2);ctx.fill();
     ctx.beginPath();ctx.fillStyle=blue?"#c9f4ff":"#fff1c6";ctx.shadowBlur=7;ctx.arc(pos.x,pos.y,b.radius,0,Math.PI*2);ctx.fill();
    });
    ctx.shadowBlur=0;
   }
   raf=requestAnimationFrame(draw);
  };
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!reduced)raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);observer.disconnect()};
 },[blocks.length]);

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
   <div ref={trackRef} className={"motion-track"+(newBlock?" motion-new":"")}><canvas ref={canvasRef} className="motion-canvas" aria-hidden="true"/>
    
    <div className="motion-cell mempool"><div className="motion-label"><strong>MEMPOOL</strong><span>{fmt(pending)} waiting transactions</span></div><div className="motion-pool"><span className="motion-pool-glow"/></div><div className="motion-caption"><strong>Unconfirmed transactions</strong></div></div>
    {times.map((t,i)=><div className="motion-cell motion-stage" key={t}><div className="motion-label"><span>Estimated confirmation</span></div><Hex time={t} feeText={stageFees[i]} seed={i+1}/><div className="motion-caption">{i===5?"Next projected block":"Estimated wait · not guaranteed"}</div></div>)}
    {recent.map((b,i)=><button type="button" className="motion-cell confirmed" key={b.id||i} onClick={()=>{if(!dragging)setSelected(selected===i?null:i)}}><div className="motion-label"><strong>CONFIRMED</strong><span>{fmt(b.ageMinutes)} min ago</span></div>{i===0&&<div className="motion-divider"/>}<Hex blue seed={i+8}/><div className="motion-caption"><strong>#{fmt(b.height)}</strong>{fmt(b.transactionCount)} transactions</div></button>)}
   </div>
  </div>
  <div className="motion-footer"><span>GOLD · Estimated waiting</span><span>BLUE · Confirmed blocks</span><span>Swipe on mobile · Drag or use arrows on desktop</span></div>
  {selected!==null&&recent[selected]&&<div className="motion-detail"><strong>Block #{fmt(recent[selected].height)}</strong><span>{fmt(recent[selected].transactionCount)} transactions · {fmt(recent[selected].ageMinutes)} min ago</span>{recent[selected].id&&<a href={"https://mempool.space/block/"+recent[selected].id} target="_blank" rel="noopener noreferrer">View block ↗</a>}</div>}
  <p className="motion-note">Live network figures and confirmed blocks. Time bands and moving particles are illustrative, not a simulation of individual transaction paths. Fee estimates may change.</p>
 </div>
}
