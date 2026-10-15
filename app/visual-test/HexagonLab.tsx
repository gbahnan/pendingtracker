"use client";

import { useEffect, useRef, useState } from "react";

const times = [60, 50, 40, 30, 20, 10];
const fees = ["0.20", "0.20", "0.30", "0.40", "1.3", "2.3"];
const hex = "100,4 184,52 184,148 100,196 16,148 16,52";
const inner = "100,18 171,59 171,141 100,182 29,141 29,59";
const core = "100,29 161,65 161,135 100,171 39,135 39,65";
const rand = (i:number, seed:number) => {const x=Math.sin(i*127.1+seed*311.7)*43758.5453;return x-Math.floor(x)};
function Hexagon({index,blue=false,glow=true}:{index:number;blue?:boolean;glow?:boolean}) {
 const id = "vhex"+index;
 const main = blue?"#70d9ff":"#ffc16b";
 return <div className={"lab-cell "+(blue?"lab-blue":"")}>
  <div className="lab-hex-wrap">
   <svg viewBox="0 0 200 200" className="lab-hex-svg" aria-hidden="true">
    <defs>
     <linearGradient id={id+"metal"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={blue?"#e1faff":"#fff1c0"}/><stop offset=".17" stopColor={blue?"#5bc7ff":"#ffc16b"}/><stop offset=".42" stopColor={blue?"#07598b":"#8e4b17"}/><stop offset=".7" stopColor={blue?"#64cfff":"#ffd183"}/><stop offset="1" stopColor={blue?"#07518d":"#a76024"}/></linearGradient>
     <linearGradient id={id+"inner"} x1="0" y1="0" x2=".85" y2="1"><stop stopColor="#33404a"/><stop offset=".34" stopColor="#111c28"/><stop offset="1" stopColor="#050e18"/></linearGradient>
     <filter id={id+"glow"} x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="8"/></filter>
     <radialGradient id={id+"shine"}><stop stopColor={blue?"#5ccfff":"#ffb84e"} stopOpacity=".55"/><stop offset="1" stopColor={blue?"#5ccfff":"#ffb84e"} stopOpacity="0"/></radialGradient>
    </defs>
    {glow&&<polygon points={hex} fill="none" stroke={main} strokeWidth="14" opacity=".42" filter={"url(#"+id+"glow)"}/>}
    <polygon points={hex} fill={"url(#"+id+"metal)"} stroke={blue?"#9be9ff":"#ffe1a2"} strokeWidth="1.8"/>
    <polygon points={inner} fill="#091522" stroke={blue?"#1576b3":"#a45d20"} strokeWidth="3"/>
    <polygon points={core} fill={"url(#"+id+"inner)"} stroke={blue?"#5bb6ec":"#d7964b"} strokeOpacity=".65" strokeWidth="1.5"/>
    <path d="M100 4 L184 52 L171 59 L100 18 L29 59 L16 52Z" fill="#fff2c4" opacity={blue?".22":".31"}/>
    <path d="M184 52 L184 148 L100 196 L100 182 L171 141 L171 59Z" fill="#070e16" opacity=".4"/>
    <ellipse cx="100" cy="100" rx="77" ry="77" fill={"url(#"+id+"shine)"} opacity=".18"/>
    {Array.from({length:13},(_,i)=>{const x=53+rand(i,index+3)*94;const y=48+rand(i,index+17)*103;return <circle key={i} cx={x} cy={y} r={1.3+rand(i,index+9)*2.1} fill={blue?"#79ddff":"#ffc05b"} opacity={.42+rand(i,index+7)*.55} className="lab-spark"/>})}
   </svg>
   <div className="lab-hex-text">{blue?<><span className="lab-btc">₿</span></>:<><strong>~{times[index]} MIN</strong><small>{fees[index]} sat/vB</small></>}</div>
  </div>
  <div className="lab-caption">{blue?<><b>CONFIRMED</b><small>Latest block</small></>:null}</div>
 </div>;
}
function Pool(){
 return <div className="lab-pool-col"><div className="lab-pool-title">MEMPOOL</div><div className="lab-pool-sub">Waiting transactions</div><div className="lab-pool"><div className="lab-pool-inset"/></div></div>;
}

function MovingParticles({motion}:{motion:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current,track=canvas?.parentElement;
  if(!canvas||!track)return;
  const ctx=canvas.getContext("2d");if(!ctx)return;
  type Chamber={x:number;y:number;w:number;h:number;kind:"pool"|"gold"|"blue"};
  let w=0,h=0,raf=0,last=0,elapsed=0,layout:Chamber[]=[];
  const particles=Array.from({length:310},(_,i)=>({angle:i*2.39996,lane:(i*.754877666)%1,radius:2.6+(i%4)*.62}));
  // Same triangle-wave wall reflection as the production Bitcoin explorer.
  const bounce=(t:number)=>{const n=((t%2)+2)%2;return n<=1?n:2-n};
  const drift=(p:{angle:number;lane:number},time:number,seed:number)=>{
   const vx=.075+.055*((seed*.61803398875)%1);
   const vy=.065+.06*((seed*.41421356237)%1);
   return {u:.08+.84*bounce(p.lane+time*vx+p.angle*.17),v:.08+.84*bounce(p.angle*.31+time*vy)};
  };
  const measure=()=>{
   const bounds=track.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);
   w=track.scrollWidth;h=track.clientHeight;
   canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
   canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(d,0,0,d,0,0);
   layout=Array.from(track.querySelectorAll<HTMLElement>(".lab-pool,.lab-hex-wrap")).map(el=>{
    const box=el.getBoundingClientRect();
    return {x:box.left-bounds.left,y:box.top-bounds.top,w:box.width,h:box.height,kind:el.classList.contains("lab-pool")?"pool" as const:el.closest(".lab-blue")?"blue" as const:"gold" as const};
   }).sort((a,b)=>a.x-b.x);
  };
  const observer=new ResizeObserver(measure);observer.observe(track);measure();
  const drawBall=(x:number,y:number,r:number,blue:boolean,opacity:number)=>{
   const rgb=blue?"99,193,239":"228,159,70";
   ctx.globalAlpha=opacity;ctx.beginPath();ctx.fillStyle="rgba("+rgb+",.24)";
   ctx.shadowColor="rgba("+rgb+",.65)";ctx.shadowBlur=4;
   ctx.arc(x,y,r*1.35,0,Math.PI*2);ctx.fill();
   const sphere=ctx.createRadialGradient(x-r*.28,y-r*.3,r*.08,x,y,r);
   if(blue){sphere.addColorStop(0,"#e7f8ff");sphere.addColorStop(.25,"#93d9f6");sphere.addColorStop(.73,"#368ab9");sphere.addColorStop(1,"#15527a")}
   else{sphere.addColorStop(0,"#ffedc5");sphere.addColorStop(.25,"#efb864");sphere.addColorStop(.72,"#bf792d");sphere.addColorStop(1,"#754319")}
   ctx.beginPath();ctx.fillStyle=sphere;ctx.shadowBlur=1.5;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;
  };
  const point=(box:Chamber,u:number,v:number)=>{
   const cx=box.x+box.w/2,cy=box.y+box.h/2;
   if(box.kind==="pool")return {x:cx+(u-.5)*box.w*.72,y:cy+(v-.5)*box.h*.61};
   const ny=Math.max(-1,Math.min(1,(v-.5)*2)),nx=Math.max(-1,Math.min(1,(u-.5)*2));
   return {x:cx+nx*box.w*.39*(1-.48*Math.abs(ny)),y:cy+ny*box.h*.4};
  };
  const draw=(now:number)=>{
   const dt=Math.min((now-last)/1000||0,.05);last=now;if(motion)elapsed+=dt;
   ctx.clearRect(0,0,w,h);
   if(layout.length){
    const pool=layout[0];
    // Independently bouncing particles stay inside the mempool, never spawn behind it.
    ctx.save();ctx.beginPath();ctx.roundRect(pool.x+13,pool.y+13,pool.w-26,pool.h-26,22);ctx.clip();
    for(let i=0;i<75;i++){const p=particles[i],uv=drift(p,elapsed*.72,i),pos=point(pool,uv.u,uv.v);drawBall(pos.x,pos.y,p.radius*1.06,false,.76)}
    ctx.restore();
    const clipInterior=(box:Chamber)=>{
     const cx=box.x+box.w/2,cy=box.y+box.h/2,rx=box.w*.295,ry=box.h*.335;
     ctx.beginPath();ctx.moveTo(cx,cy-ry);ctx.lineTo(cx+rx,cy-ry*.53);
     ctx.lineTo(cx+rx,cy+ry*.53);ctx.lineTo(cx,cy+ry);
     ctx.lineTo(cx-rx,cy+ry*.53);ctx.lineTo(cx-rx,cy-ry*.53);
     ctx.closePath();ctx.clip();
    };
    for(let chamber=1;chamber<layout.length;chamber++){
     const box=layout[chamber];
     ctx.save();clipInterior(box);
     for(let j=0;j<9;j++){
      const seed=75+(chamber*13+j)%130,p=particles[seed],uv=drift(p,elapsed*.65,seed);
      const top=j%2===0,u=.12+.76*bounce(p.lane+elapsed*(.065+(seed%5)*.007)+p.angle*.17);
      const v=(top?.12:.77)+.10*bounce(p.angle*.31+elapsed*(.047+(seed%3)*.009));
      const pos=point(box,box.kind==="gold"?u:uv.u,box.kind==="gold"?v:uv.v);
      drawBall(pos.x,pos.y,p.radius*.94,box.kind==="blue",.72);
     }
     ctx.restore();
    }
    // Twelve staggered travelers per gap, never crossing the metallic frames.
    for(let gap=0;gap<layout.length-1;gap++){
     const from=layout[gap],to=layout[gap+1];
     const x0=from.x+from.w+4,x1=to.x-4;
     if(x1<=x0)continue;
     for(let j=0;j<12;j++){
      const phase=(j/12+gap*.137+elapsed*(.09+(j%4)*.009))%1;
      const lane=(j*.61803398875+gap*.17)%1;
      const midY=(from.y+from.h/2+to.y+to.h/2)/2;
      const y=midY+(lane-.5)*46+Math.sin(phase*Math.PI)*Math.sin(j*2.17+gap)*3;
      const x=x0+(x1-x0)*phase;
      drawBall(x,y,2.5+(j%3)*.43,to.kind==="blue"&&phase>.5,.82*Math.min(1,phase*8,(1-phase)*8));
     }
    }
   }
   raf=requestAnimationFrame(draw);
  };
  raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);observer.disconnect()};
 },[motion]);
 return <canvas className="lab-particles" ref={ref} aria-hidden="true"/>;
}
export default function HexagonLab(){
 const [glow,setGlow]=useState(true);
 const [motion,setMotion]=useState(true);
 return <section className="lab-shell">
 <div className="lab-controls"><span>BITCOIN · 2.5D VISUAL PROTOTYPE</span><div><button onClick={()=>setGlow(!glow)}>{glow?"Glow on":"Glow off"}</button><button onClick={()=>setMotion(!motion)}>{motion?"Motion on":"Motion off"}</button></div></div>
 <div className={"lab-scroller "+(!motion?"lab-paused":"")}><div className="lab-track">
 <MovingParticles motion={motion}/><Pool/>{times.map((_,i)=><Hexagon key={i} index={i} glow={glow}/>)}
 <Hexagon index={6} blue glow={glow}/>
 </div></div>
 <p className="lab-note">Visual prototype only. Fee values and transaction count are placeholders; live data and confirmation behavior will be connected after design approval. Scroll horizontally to view the entire sequence.</p>
 <style jsx global>{`
 .lab-shell{margin-top:32px}.lab-controls{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#edbc72;font-size:11px;font-weight:800;letter-spacing:.14em;margin-bottom:16px}.lab-controls>div{display:flex;gap:8px}.lab-controls button{border:1px solid #5e6974;background:#1c2a36;color:#e7eef4;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:12px;letter-spacing:0}.lab-scroller{overflow-x:auto;overflow-y:hidden;border:1px solid rgba(218,173,103,.12);border-radius:18px;background:radial-gradient(ellipse at 24% 50%,rgba(181,112,42,.12),transparent 57%),radial-gradient(ellipse at 96% 50%,rgba(31,128,195,.12),transparent 33%),#15232f;scrollbar-color:#6b6d69 transparent}.lab-track{isolation:isolate;position:relative;display:flex;align-items:center;gap:21px;width:100%;min-width:max-content;min-height:305px;padding:36px 15px 22px}.lab-cell{position:relative;width:clamp(115px,11.1vw,161px);flex:none;text-align:center;z-index:2}.lab-hex-wrap{width:100%;height:auto;aspect-ratio:161/180;position:relative;filter:drop-shadow(0 0 11px rgba(246,163,57,.3))}.lab-blue .lab-hex-wrap{filter:drop-shadow(0 0 14px rgba(56,171,246,.48))}.lab-hex-svg{width:100%;height:100%}.lab-hex-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;text-shadow:0 1px 7px #020912;pointer-events:none;white-space:nowrap}.lab-hex-text strong{font-size:16px;font-weight:900}.lab-hex-text small{font-size:12px;color:#e0e7ef}.lab-btc{font-size:52px;color:#b9edff;text-shadow:0 0 14px #35a9ff}.lab-caption{position:absolute;top:-30px;left:0;width:100%;color:#6fd6ff;font-size:12px}.lab-caption small{display:block;color:#b4d1df;margin-top:4px}.lab-pool-col{width:clamp(180px,18vw,263px);flex:none;text-align:center;z-index:2;align-self:center;position:relative;height:180px;display:flex;flex-direction:column;justify-content:center}.lab-pool-title{position:absolute;top:-28px;width:100%}.lab-pool-sub{position:absolute;top:-7px;width:100%}.lab-pool{flex:none}.lab-pool-title{font-size:16px;font-weight:900;color:#f6bd62}.lab-pool-sub{font-size:12px;color:#c6d1da;margin:4px 0 8px}.lab-pool{width:100%;height:135px;border-radius:33px;position:relative;overflow:hidden;border:4px solid #d8943b;background:radial-gradient(ellipse,#27313a,#0a1825 75%);box-shadow:inset 0 0 0 3px #07101a,inset 0 0 0 6px #ffbd61,0 0 13px #f8a640,0 0 31px rgba(241,149,49,.4)}.lab-pool-inset{position:absolute;inset:10px;border-radius:24px;border:1px solid #805a2c;pointer-events:none}.lab-pool-dot{position:absolute;border-radius:50%;background:#ffcb71;box-shadow:0 0 5px 2px #e98e22;animation:labFloat 3s ease-in-out infinite alternate}.lab-particles{position:absolute;inset:0;z-index:3;pointer-events:none}.lab-stream{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}.lab-stream span{position:absolute;width:4px;height:4px;background:#ffca75;border-radius:50%;box-shadow:0 0 8px 3px #df8a2e;animation:labDrift 5s linear infinite}.lab-stream span:nth-child(9n){background:#73d5ff;box-shadow:0 0 9px 3px #168bd1}.lab-paused *{animation-play-state:paused!important}@media(min-width:1000px){.lab-track{gap:19px}.lab-cell{width:clamp(112px,10.4vw,154px)}.lab-pool-col{width:clamp(178px,17.2vw,248px)}}.lab-note{font-size:12px;color:#91aab9;line-height:1.7;margin-top:16px}@keyframes labFloat{to{transform:translate(7px,-8px);opacity:.65}}@keyframes labDrift{0%{transform:translateX(-35px);opacity:0}15%{opacity:.95}85%{opacity:.95}100%{transform:translateX(55px);opacity:0}}@media(max-width:700px){.lab-track{gap:14px;min-height:260px;padding:28px 12px}.lab-cell{width:135px}.lab-hex-wrap{width:135px;height:152px}.lab-pool-col{width:195px;height:152px}.lab-pool{height:110px}.lab-controls{align-items:flex-start;flex-direction:column}}
 `}</style>
 </section>;
}
