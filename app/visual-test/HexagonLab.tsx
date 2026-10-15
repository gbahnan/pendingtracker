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
 const main = blue?"#69c9ed":"#d9a75f";
 return <div className={"lab-cell "+(blue?"lab-blue":"")}>
  <div className="lab-hex-wrap">
   <svg viewBox="0 0 200 200" className="lab-hex-svg" aria-hidden="true">
    <defs>
     <linearGradient id={id+"metal"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={blue?"#d6f1fb":"#f7e3b6"}/><stop offset=".17" stopColor={blue?"#73c5e4":"#dbad6b"}/><stop offset=".42" stopColor={blue?"#164b68":"#754a26"}/><stop offset=".7" stopColor={blue?"#83cde7":"#e7bf80"}/><stop offset="1" stopColor={blue?"#174966":"#98652f"}/></linearGradient>
     <linearGradient id={id+"inner"} x1="0" y1="0" x2=".85" y2="1"><stop stopColor="#33404a"/><stop offset=".34" stopColor="#111c28"/><stop offset="1" stopColor="#050e18"/></linearGradient>
     <linearGradient id={id+"edge"} x1="0" y1="0" x2="1" y2="1"><stop stopColor={blue?"#d2f3ff":"#f5dfac"}/><stop offset=".5" stopColor={blue?"#317d9c":"#96602e"}/><stop offset="1" stopColor={blue?"#8ed6ee":"#dfb773"}/></linearGradient><filter id={id+"glow"} x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="8"/></filter>
     <radialGradient id={id+"shine"}><stop stopColor={blue?"#5ccfff":"#ffb84e"} stopOpacity=".55"/><stop offset="1" stopColor={blue?"#5ccfff":"#ffb84e"} stopOpacity="0"/></radialGradient>
    </defs>
    {glow&&<polygon points={hex} fill="none" stroke={main} strokeWidth="12" opacity=".30" filter={"url(#"+id+"glow)"}/>}
    <polygon points={hex} fill={"url(#"+id+"metal)"} stroke={"url(#"+id+"edge)"} strokeWidth="1.8"/>
    <polygon points={inner} fill="#091522" stroke={blue?"#1576b3":"#a45d20"} strokeWidth="3"/>
    <polygon points={core} fill={"url(#"+id+"inner)"} stroke={blue?"#5bb6ec":"#d7964b"} strokeOpacity=".65" strokeWidth="1.5"/>
    <path d="M100 4 L184 52 L171 59 L100 18 L29 59 L16 52Z" fill="#fff2c4" opacity={blue?".18":".23"}/>
    <path d="M184 52 L184 148 L100 196 L100 182 L171 141 L171 59Z" fill="#070e16" opacity=".49"/>
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
  type Ball={chamber:number;next:number;x:number;y:number;vx:number;vy:number;r:number;age:number;wait:number;travel:boolean;opacity:number;seed:number};
  let w=0,h=0,raf=0,last=0,acc=0,layout:Chamber[]=[];
  let balls:Ball[]=[];let nextSeed=10000;let flowClock=0;
  const random=(n:number)=>rand(n,37);
  const bounds=(box:Chamber,y:number)=>{
   const cy=box.y+box.h/2;
   if(box.kind==="pool")return {left:box.x+box.w*.15,right:box.x+box.w*.85,top:box.y+box.h*.20,bottom:box.y+box.h*.80};
   const dy=Math.min(1,Math.abs(y-cy)/(box.h*.33));
   const half=box.w*.295*(1-.47*dy);
   return {left:box.x+box.w/2-half,right:box.x+box.w/2+half,top:cy-box.h*.33,bottom:cy+box.h*.33};
  };
  const makeBall=(chamber:number,seed:number):Ball=>{
   const box=layout[chamber],cy=box.y+box.h/2;
   const y=cy+(random(seed+9)-.5)*box.h*.42;
   const edge=bounds(box,y);
   const x=edge.left+12+random(seed+13)*Math.max(2,edge.right-edge.left-24);
   const angle=random(seed+21)*Math.PI*2;
   const speed=6.5+random(seed+31)*8.5;
   return {chamber,next:chamber+1,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:2.35+random(seed+41)*1.15,age:0,wait:7+random(seed+51)*16,travel:false,opacity:.62+random(seed+61)*.22,seed};
  };
  const measure=()=>{
   const boundsRect=track.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);
   w=track.scrollWidth;h=track.clientHeight;
   canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
   canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(d,0,0,d,0,0);
   layout=Array.from(track.querySelectorAll<HTMLElement>(".lab-pool,.lab-hex-wrap")).map(el=>{
    const box=el.getBoundingClientRect();
    return {x:box.left-boundsRect.left,y:box.top-boundsRect.top,w:box.width,h:box.height,kind:el.classList.contains("lab-pool")?"pool" as const:el.closest(".lab-blue")?"blue" as const:"gold" as const};
   }).sort((a,b)=>a.x-b.x);
   // Rebuild only when the layout changes, not on each animation frame.
   balls=[];flowClock=0;
   if(layout.length){
    let seed=0;
    for(let c=0;c<layout.length;c++){
     const count=c===0?75:c===layout.length-1?12:17;
     for(let i=0;i<count;i++)balls.push(makeBall(c,seed++));
    }
   }
  };
  const observer=new ResizeObserver(measure);observer.observe(track);measure();
  const drawBall=(p:Ball)=>{
   const blue=layout[p.chamber]?.kind==="blue";
   const rgb=blue?"91,174,208":"196,139,67";
   ctx.globalAlpha=p.opacity;
   ctx.shadowColor="rgba("+rgb+",.42)";ctx.shadowBlur=2.5;
   ctx.beginPath();ctx.fillStyle=blue?"#74bfdf":"#c89451";
   ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
   ctx.shadowBlur=0;ctx.globalAlpha=p.opacity*.45;ctx.beginPath();ctx.fillStyle=blue?"#e2f6ff":"#ffe0a2";ctx.arc(p.x-p.r*.28,p.y-p.r*.30,Math.max(.55,p.r*.25),0,Math.PI*2);ctx.fill();
   ctx.shadowBlur=0;ctx.globalAlpha=1;
  };
  const clipInterior=(box:Chamber)=>{
   const cx=box.x+box.w/2,cy=box.y+box.h/2,rx=box.w*.295,ry=box.h*.335;
   ctx.beginPath();
   if(box.kind==="pool"){ctx.roundRect(box.x+13,box.y+13,box.w-26,box.h-26,22)}
   else{
    ctx.moveTo(cx,cy-ry);ctx.lineTo(cx+rx,cy-ry*.53);
    ctx.lineTo(cx+rx,cy+ry*.53);ctx.lineTo(cx,cy+ry);
    ctx.lineTo(cx-rx,cy+ry*.53);ctx.lineTo(cx-rx,cy-ry*.53);ctx.closePath();
   }
   ctx.clip();
  };
  const step=(dt:number)=>{
   flowClock+=dt;
   for(const p of balls){
    const box=layout[p.chamber];if(!box)continue;
    p.age+=dt;
    if(p.travel){
     const target=layout[p.next];
     if(!target){p.travel=false;continue}
     // Keep a single continuous position and velocity across both chambers.
     // Gentle acceleration toward the next opening; no positional lerps or teleports.
     const laneChoice=random(p.seed+91);
     const laneOffset=laneChoice<.72?0:laneChoice<.86?-.23:.23;
     const goalY=target.y+target.h/2+laneOffset*target.h;
     const desiredVy=Math.max(-11,Math.min(11,(goalY-p.y)*.25));
     p.vy+=(desiredVy-p.vy)*Math.min(1,dt*1.6);
     p.vx+=(20+random(p.seed+71)*10-p.vx)*Math.min(1,dt*1.1);
     p.x+=p.vx*dt;p.y+=p.vy*dt;
     const edge=bounds(target,p.y);
     if(p.x>edge.left+10){
      p.chamber=p.next;p.next=p.chamber+1;p.travel=false;
      p.wait=8+random(p.seed+Math.floor(p.age)*13)*15;p.age=0;
      p.vx=6+random(p.seed+12)*10;p.vy=(random(p.seed+22)-.5)*16;
     }
    }else{
     // Real velocity integration and wall reflection in each dark interior.
     p.x+=p.vx*dt;p.y+=p.vy*dt;
     let edge=bounds(box,p.y);
     const top=edge.top+p.r+6,bottom=edge.bottom-p.r-6;
     if(p.y<top){p.y=top+(top-p.y);p.vy=Math.abs(p.vy)}
     if(p.y>bottom){p.y=bottom-(p.y-bottom);p.vy=-Math.abs(p.vy)}
     edge=bounds(box,p.y);
     const left=edge.left+p.r+6,right=edge.right-p.r-6;
     if(p.x<left){p.x=left+(left-p.x);p.vx=Math.abs(p.vx)}
     if(p.x>right){p.x=right-(p.x-right);p.vx=-Math.abs(p.vx)}
     // Reflect off the central label area rather than moving over fee/time text.
     if(box.kind!=="pool"){
      const cx=box.x+box.w/2,cy=box.y+box.h/2;
      const halfW=box.w*.28+p.r,halfH=box.h*.135+p.r;
      if(Math.abs(p.x-cx)<halfW&&Math.abs(p.y-cy)<halfH){
       const dx=halfW-Math.abs(p.x-cx),dy=halfH-Math.abs(p.y-cy);
       if(dx<dy){const side=p.x<cx?-1:1;p.x=cx+side*halfW;p.vx=side*Math.max(8,Math.abs(p.vx))}
       else{const side=p.y<cy?-1:1;p.y=cy+side*halfH;p.vy=side*Math.max(8,Math.abs(p.vy))}
      }
     }
     // After an individual dwell, gradually turn toward the right opening.
     if(false&&p.chamber<layout.length-1&&p.wait<0){
      const cy=box.y+box.h/2;
      p.vx+=((box.kind==="pool"?13:16)-p.vx)*Math.min(1,dt*.55);
      const laneChoice=random(p.seed+91);
      const laneY=cy+(laneChoice<.72?0:laneChoice<.86?-.23:.23)*box.h;
      p.vy+=((laneY-p.y)*.18-p.vy)*Math.min(1,dt*.7);
      if(p.x>right-7&&Math.abs(p.y-laneY)<box.h*.15){
       p.travel=true;p.next=p.chamber+1;p.vx=(box.kind==="pool"?17:21)+random(p.seed+73)*9;
      }
     }
    }
   }
   // Maintain a permanent supply in the mempool, including after departures.
   const inPool=balls.filter(p=>p.chamber===0&&!p.travel).length;
   for(let i=inPool;i<75;i++)balls.push(makeBall(0,nextSeed++));
   // Recycle confirmed particles back into the mempool to avoid unlimited growth.
   const confirmed=layout.length-1;
   if(confirmed>0){
    const finished=balls.filter(p=>p.chamber===confirmed&&!p.travel);
    if(finished.length>15){
     const recycle=new Set(finished.slice(0,finished.length-15));
     balls=balls.filter(p=>!recycle.has(p));
    }
   }
  };
  const draw=(now:number)=>{
   const dt=last?Math.min((now-last)/1000,.05):0;last=now;
   if(motion){acc+=dt;let n=0;while(acc>=1/60&&n<4){step(1/60);acc-=1/60;n++}}
   ctx.clearRect(0,0,w,h);
   for(const p of balls){
    const current=layout[p.chamber];if(!current)continue;
    ctx.save();
    if(p.travel){
     const target=layout[p.next];
     if(target){
      // Draw across open space, with the metallic faces masking the crossing.
      ctx.beginPath();ctx.rect(current.x+current.w,0,Math.max(0,target.x-current.x-current.w),h);ctx.clip();
      drawBall(p);
      ctx.restore();
      ctx.save();
      clipInterior(current);drawBall(p);
      ctx.restore();ctx.save();
      clipInterior(target);drawBall(p);
     }
    }else{clipInterior(current);drawBall(p)}
    ctx.restore();
   }
   // Independently scattered crossings: no shared middle row, including
   // the last three links. Most paths remain central but are not collinear.
   for(let gap=0;gap<layout.length-1;gap++){
    const from=layout[gap],to=layout[gap+1];
    const left=from.x+from.w*.77,right=to.x+to.w*.23;
    const centerY=(from.y+from.h/2+to.y+to.h/2)/2;
    const height=Math.min(from.h,to.h);
    for(let j=0;j<10;j++){
     const seed=gap*101+j*17;
     const offset=(j+random(seed+4)*.72)/10;
     const speed=.72+random(seed+12)*.42;
     const phase=(flowClock*speed/10+offset)%1;
     // A wide, irregular spread instead of a thin line.
     const lane=(random(seed+8)+random(seed+19)-1)*.54;
     const wobble=Math.sin(flowClock*(.25+random(seed+23)*.16)+seed*1.7)*height*.065;
     const arc=Math.sin(phase*Math.PI)*(random(seed+31)-.5)*height*.20;
     const y=centerY+lane*height+wobble+arc;
     const x=left+(right-left)*phase;
     const ball:Ball={chamber:gap,next:gap+1,x,y,vx:0,vy:0,r:2.25+random(seed+17)*.85,age:0,wait:0,travel:true,opacity:.42+random(seed+29)*.18,seed};
     ctx.save();
     ctx.beginPath();ctx.rect(left,0,right-left,h);ctx.clip();
     drawBall(ball);
     ctx.restore();
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
 .lab-shell{margin-top:32px}.lab-controls{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#edbc72;font-size:11px;font-weight:800;letter-spacing:.14em;margin-bottom:16px}.lab-controls>div{display:flex;gap:8px}.lab-controls button{border:1px solid #5e6974;background:#1c2a36;color:#e7eef4;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:12px;letter-spacing:0}.lab-scroller{overflow-x:auto;overflow-y:hidden;border:1px solid rgba(218,173,103,.12);border-radius:18px;background:radial-gradient(ellipse at 21% 51%,rgba(174,109,43,.16),transparent 48%),radial-gradient(ellipse at 92% 48%,rgba(36,120,163,.15),transparent 38%),linear-gradient(180deg,#192734 0%,#13212e 52%,#111e2a 100%);scrollbar-color:#6b6d69 transparent}.lab-track{isolation:isolate;position:relative;display:flex;align-items:center;gap:21px;width:100%;min-width:max-content;min-height:305px;padding:36px 15px 22px}.lab-cell{position:relative;width:clamp(115px,11.1vw,161px);flex:none;text-align:center;z-index:2}.lab-hex-wrap{width:100%;height:auto;aspect-ratio:161/180;position:relative;filter:drop-shadow(0 2px 8px rgba(199,129,51,.24))}.lab-blue .lab-hex-wrap{filter:drop-shadow(0 0 13px rgba(57,153,206,.42))}.lab-hex-svg{width:100%;height:100%}.lab-hex-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;text-shadow:0 1px 7px #020912;pointer-events:none;white-space:nowrap}.lab-hex-text strong{font-size:17px;font-weight:800;letter-spacing:.025em;color:#f2f0e9;font-variant-numeric:tabular-nums}.lab-hex-text small{font-size:11px;color:#a9b8c3;letter-spacing:.02em;font-variant-numeric:tabular-nums}.lab-btc{font-size:52px;color:#a9dff0;text-shadow:0 0 16px rgba(60,167,222,.6)}.lab-caption{position:absolute;top:-30px;left:0;width:100%;color:#6fd6ff;font-size:12px}.lab-caption small{display:block;color:#b4d1df;margin-top:4px}.lab-pool-col{width:clamp(180px,18vw,263px);flex:none;text-align:center;z-index:2;align-self:center;position:relative;height:180px;display:flex;flex-direction:column;justify-content:center}.lab-pool-title{position:absolute;top:-28px;width:100%}.lab-pool-sub{position:absolute;top:-7px;width:100%}.lab-pool{flex:none}.lab-pool-title{font-size:16px;font-weight:900;color:#f6bd62}.lab-pool-sub{font-size:12px;color:#c6d1da;margin:4px 0 8px}.lab-pool{width:100%;height:135px;border-radius:33px;position:relative;overflow:hidden;border:4px solid #d8943b;background:radial-gradient(ellipse,#27313a,#0a1825 75%);box-shadow:inset 0 0 0 3px #07101a,inset 0 0 0 6px #ffbd61,0 0 13px #f8a640,0 0 31px rgba(241,149,49,.4)}.lab-pool-inset{position:absolute;inset:10px;border-radius:24px;border:1px solid #805a2c;pointer-events:none}.lab-pool-dot{position:absolute;border-radius:50%;background:#ffcb71;box-shadow:0 0 5px 2px #e98e22;animation:labFloat 3s ease-in-out infinite alternate}.lab-particles{position:absolute;inset:0;z-index:3;pointer-events:none}.lab-stream{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}.lab-stream span{position:absolute;width:4px;height:4px;background:#ffca75;border-radius:50%;box-shadow:0 0 8px 3px #df8a2e;animation:labDrift 5s linear infinite}.lab-stream span:nth-child(9n){background:#73d5ff;box-shadow:0 0 9px 3px #168bd1}.lab-paused *{animation-play-state:paused!important}@media(min-width:1000px){.lab-track{gap:19px}.lab-cell{width:clamp(112px,10.4vw,154px)}.lab-pool-col{width:clamp(178px,17.2vw,248px)}}.lab-note{font-size:12px;color:#91aab9;line-height:1.7;margin-top:16px}@keyframes labFloat{to{transform:translate(7px,-8px);opacity:.65}}@keyframes labDrift{0%{transform:translateX(-35px);opacity:0}15%{opacity:.95}85%{opacity:.95}100%{transform:translateX(55px);opacity:0}}@media(max-width:700px){.lab-track{gap:14px;min-height:260px;padding:28px 12px}.lab-cell{width:135px}.lab-hex-wrap{width:135px;height:152px}.lab-pool-col{width:195px;height:152px}.lab-pool{height:110px}.lab-controls{align-items:flex-start;flex-direction:column}}
 `}</style>
 </section>;
}
