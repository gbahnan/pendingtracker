"use client";

import { useState } from "react";

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
    {glow&&<polygon points={hex} fill="none" stroke={main} strokeWidth="14" opacity=".6" filter={"url(#"+id+"glow)"}/>}
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
 return <div className="lab-pool-col"><div className="lab-pool-title">MEMPOOL</div><div className="lab-pool-sub">Waiting transactions</div><div className="lab-pool"><div className="lab-pool-inset"/>{Array.from({length:85},(_,i)=><span key={i} className="lab-pool-dot" style={{left:(12+rand(i,4)*76)+"%",top:(17+rand(i,8)*66)+"%",width:(2+rand(i,2)*5)+"px",height:(2+rand(i,2)*5)+"px",animationDelay:-(rand(i,3)*6)+"s",animationDuration:(2+rand(i,5)*4)+"s"}}/>)}</div></div>;
}
export default function HexagonLab(){
 const [glow,setGlow]=useState(true);
 const [motion,setMotion]=useState(true);
 return <section className="lab-shell">
 <div className="lab-controls"><span>BITCOIN · 2.5D VISUAL PROTOTYPE</span><div><button onClick={()=>setGlow(!glow)}>{glow?"Glow on":"Glow off"}</button><button onClick={()=>setMotion(!motion)}>{motion?"Motion on":"Motion off"}</button></div></div>
 <div className={"lab-scroller "+(!motion?"lab-paused":"")}><div className="lab-track">
 <div className="lab-stream" aria-hidden="true">{Array.from({length:76},(_,i)=><span key={i} style={{top:(39+rand(i,22)*22)+"%",left:(rand(i,24)*98)+"%",animationDelay:-(rand(i,26)*8)+"s",animationDuration:(3+rand(i,29)*5)+"s"}}/>)}</div>
 <Pool/>{times.map((_,i)=><Hexagon key={i} index={i} glow={glow}/>)}
 <Hexagon index={6} blue glow={glow}/>
 </div></div>
 <p className="lab-note">Visual prototype only. Fee values and transaction count are placeholders; live data and confirmation behavior will be connected after design approval. Scroll horizontally to view the entire sequence.</p>
 <style jsx>{`
 .lab-shell{margin-top:32px}.lab-controls{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#edbc72;font-size:11px;font-weight:800;letter-spacing:.14em;margin-bottom:16px}.lab-controls>div{display:flex;gap:8px}.lab-controls button{border:1px solid #5e6974;background:#1c2a36;color:#e7eef4;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:12px;letter-spacing:0}.lab-scroller{overflow-x:auto;overflow-y:hidden;border:1px solid rgba(218,173,103,.12);border-radius:18px;background:radial-gradient(ellipse at 24% 50%,rgba(181,112,42,.12),transparent 57%),radial-gradient(ellipse at 96% 50%,rgba(31,128,195,.12),transparent 33%),#15232f;scrollbar-color:#6b6d69 transparent}.lab-track{position:relative;display:flex;align-items:center;gap:5px;width:max-content;min-height:305px;padding:36px 23px 22px}.lab-cell{position:relative;width:161px;flex:none;text-align:center;z-index:2}.lab-hex-wrap{width:161px;height:180px;position:relative;filter:drop-shadow(0 0 11px rgba(246,163,57,.3))}.lab-blue .lab-hex-wrap{filter:drop-shadow(0 0 14px rgba(56,171,246,.48))}.lab-hex-svg{width:100%;height:100%}.lab-hex-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;text-shadow:0 1px 7px #020912}.lab-hex-text strong{font-size:16px;font-weight:900}.lab-hex-text small{font-size:12px;color:#e0e7ef}.lab-btc{font-size:52px;color:#b9edff;text-shadow:0 0 14px #35a9ff}.lab-caption{position:absolute;top:-25px;left:0;width:100%;color:#6fd6ff;font-size:12px}.lab-caption small{display:block;color:#b4d1df;margin-top:4px}.lab-pool-col{width:263px;flex:none;text-align:center;z-index:2;align-self:center}.lab-pool-title{font-size:16px;font-weight:900;color:#f6bd62}.lab-pool-sub{font-size:12px;color:#c6d1da;margin:4px 0 15px}.lab-pool{height:135px;border-radius:33px;position:relative;overflow:hidden;border:4px solid #d8943b;background:radial-gradient(ellipse,#27313a,#0a1825 75%);box-shadow:inset 0 0 0 3px #07101a,inset 0 0 0 6px #ffbd61,0 0 13px #f8a640,0 0 31px rgba(241,149,49,.4)}.lab-pool-inset{position:absolute;inset:10px;border-radius:24px;border:1px solid #805a2c;pointer-events:none}.lab-pool-dot{position:absolute;border-radius:50%;background:#ffcb71;box-shadow:0 0 5px 2px #e98e22;animation:labFloat 3s ease-in-out infinite alternate}.lab-stream{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}.lab-stream span{position:absolute;width:4px;height:4px;background:#ffca75;border-radius:50%;box-shadow:0 0 8px 3px #df8a2e;animation:labDrift 5s linear infinite}.lab-stream span:nth-child(9n){background:#73d5ff;box-shadow:0 0 9px 3px #168bd1}.lab-paused *{animation-play-state:paused!important}.lab-note{font-size:12px;color:#91aab9;line-height:1.7;margin-top:16px}@keyframes labFloat{to{transform:translate(7px,-8px);opacity:.65}}@keyframes labDrift{0%{transform:translateX(-35px);opacity:0}15%{opacity:.95}85%{opacity:.95}100%{transform:translateX(55px);opacity:0}}@media(max-width:700px){.lab-track{min-height:260px;padding:28px 12px}.lab-cell{width:135px}.lab-hex-wrap{width:135px;height:152px}.lab-pool-col{width:195px}.lab-pool{height:110px}.lab-controls{align-items:flex-start;flex-direction:column}}
 `}</style>
 </section>;
}
