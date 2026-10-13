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
  type Chamber={x:number;y:number;w:number;h:number;kind:string};
  const particles=Array.from({length:310},(_,i)=>({
   offset:(i*0.618033988749895)%1,
   speed:.0032+(i%7)*.00043,
   angle:i*2.39996,
   radius:1.7+(i%4)*.42,
   lane:(i*.754877666)%1
  }));
  // Triangle-wave reflection gives each ball straight, independently angled
  // drifting and natural wall bounces instead of circular sine/cosine orbits.
  const bounce=(t:number)=>{const n=((t%2)+2)%2;return n<=1?n:2-n};
  const drift=(p:{angle:number;lane:number},time:number,seed:number)=>{
   const vx=.075+.055*((seed*0.61803398875)%1);
   const vy=.065+.06*((seed*.41421356237)%1);
   return {u:.08+.84*bounce(p.lane+time*vx+p.angle*.17),v:.08+.84*bounce(p.angle*.31+time*vy)};
  };
  let raf=0,last=0,elapsed=0,layout:Chamber[]=[];
  const measure=()=>{
   const rect=track.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
   canvas.width=Math.round(track.clientWidth*dpr);canvas.height=Math.round(track.clientHeight*dpr);
   canvas.style.width=track.clientWidth+"px";canvas.style.height=track.clientHeight+"px";
   ctx.setTransform(dpr,0,0,dpr,0,0);
   layout=Array.from(track.querySelectorAll<HTMLElement>(".motion-pool,.motion-hex")).map(el=>{const r=el.getBoundingClientRect();return {x:r.left-rect.left,y:r.top-rect.top,w:r.width,h:r.height,kind:el.classList.contains("motion-pool")?"pool":el.classList.contains("blue")?"blue":"gold"}});
  };
  const observer=new ResizeObserver(measure);observer.observe(track);measure();
  const drawBall=(x:number,y:number,r:number,blue:boolean,opacity=1)=>{
   const rgb=blue?"73,190,255":"255,139,29";
   ctx.globalAlpha=opacity;
   ctx.beginPath();ctx.fillStyle="rgba("+rgb+",.23)";ctx.shadowColor="rgba("+rgb+",.88)";ctx.shadowBlur=9;ctx.arc(x,y,r*1.9,0,Math.PI*2);ctx.fill();
   ctx.beginPath();ctx.fillStyle=blue?"#dcf7ff":"#fff4cb";ctx.shadowBlur=5;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
   ctx.shadowBlur=0;ctx.globalAlpha=1;
  };
  const point=(box:Chamber,u:number,v:number)=>{
   const cx=box.x+box.w/2,cy=box.y+box.h/2;
   if(box.kind==="pool")return {x:cx+(u-.5)*box.w*.78,y:cy+(v-.5)*box.h*.69};
   // Cover the usable hexagon interior, including upper/lower and side regions.
   const ny=Math.max(-1,Math.min(1,(v-.5)*2));
   const nx=Math.max(-1,Math.min(1,(u-.5)*2));
   const dy=ny*box.h*.43;
   const halfWidth=box.w*.42*(1-.48*Math.abs(ny));
   return {x:cx+nx*halfWidth,y:cy+dy};
  };
  const draw=(now:number)=>{
   const dt=Math.min((now-last)/1000||0,.05);last=now;elapsed+=dt;
   ctx.clearRect(0,0,track.clientWidth,track.clientHeight);
   if(layout.length){
    const pool=layout[0];
    for(let i=0;i<75;i++){
     const p=particles[i],uv=drift(p,elapsed*.72,i);
     const pos=point(pool,uv.u,uv.v);
     drawBall(pos.x,pos.y,p.radius,false,.73);
    }
    // More resident balls, with independent straight-line bounces across
    // the entire chamber rather than synchronized circular motion.
    for(let chamber=1;chamber<layout.length;chamber++){
     const box=layout[chamber];
     for(let j=0;j<13;j++){
      const seed=75+(chamber*13+j)%130,p=particles[seed];
      const uv=drift(p,elapsed*.65,seed);
      const pos=point(box,uv.u,uv.v);
      drawBall(pos.x,pos.y,p.radius*.82,box.kind==="blue",.72);
     }
    }
    // Many simultaneous crossings, with slower free-floating motion and
    // independently offset paths so there is no cannon-like stream.
    for(let i=0;i<82;i++){
     const p=particles[i+205];
     const progress=(p.offset+elapsed*p.speed)%1;
     const scaled=progress*(layout.length-1);
     const index=Math.min(layout.length-2,Math.floor(scaled));
     const local=scaled-index,box=layout[index];
     const uv=drift(p,elapsed*.62,i+205);
     let pos=point(box,uv.u,uv.v),blue=box.kind==="blue";
     if(local>.46){
      const next=layout[index+1],t=(local-.46)/.54;
      const from=point(box,.90,.20+p.lane*.60);
      const to=point(next,.10,.20+p.lane*.60);
      const blend=Math.min(1,(local-.46)/.09);const departure={x:pos.x+(from.x-pos.x)*blend,y:pos.y+(from.y-pos.y)*blend};const travel=Math.max(0,(local-.55)/.45);pos=local<.55?departure:{x:from.x+(to.x-from.x)*travel,y:from.y+(to.y-from.y)*travel+Math.sin(travel*Math.PI)*Math.sin(p.angle)*6};
      blue=t>.55?next.kind==="blue":blue;
     }
     drawBall(pos.x,pos.y,p.radius,blue,.82);
    }
   }
   raf=requestAnimationFrame(draw);
  };
  if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)raf=requestAnimationFrame(draw);
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
