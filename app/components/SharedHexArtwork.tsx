"use client";
const HEX_POINTS="25,0 75,0 100,50 75,100 25,100 0,50";
export default function HexArtwork({active=false,confirmed=false}:{active?:boolean;confirmed?:boolean}){
 const cells=[] as Array<{x:number;y:number;key:string}>;
 for(let row=0;row<8;row++)for(let col=0;col<10;col++){
  const x=col*12.8+(row%2?6.4:0)-9,y=row*14.6-4;
  if(x>4&&x<95&&y>2&&y<99)cells.push({x,y,key:row+"-"+col});
 }
 return <svg className="pt-shared-hex-artwork" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
   <radialGradient id={confirmed?"pt-confirmed-fill":active?"pt-selected-fill":"pt-idle-fill"} cx="50%" cy="52%" r="75%">
    <stop offset="0%" stopColor={confirmed?"#052e31":active?"#302210":"#111a20"}/><stop offset="100%" stopColor="#05111b"/>
   </radialGradient>
   <linearGradient id={confirmed?"pt-confirmed-line":active?"pt-selected-line":"pt-idle-line"} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor={confirmed?"#c4fff1":"#fff1a6"}/><stop offset=".5" stopColor={confirmed?"#56e7d4":"#ffc65b"}/><stop offset="1" stopColor={confirmed?"#79f3e0":"#aa762e"}/>
   </linearGradient>
   <filter id={confirmed?"pt-confirmed-halo":active?"pt-selected-halo":"pt-idle-halo"} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={active?3.5:confirmed?2.2:.6}/></filter>
   <clipPath id={confirmed?"pt-confirmed-clip":active?"pt-selected-clip":"pt-idle-clip"}><polygon points={HEX_POINTS}/></clipPath>
  </defs>
  <polygon points={HEX_POINTS} fill="none" stroke={confirmed?"#62ffe0":active?"#ffc450":"#b58b42"} strokeWidth={active?4.2:confirmed?2.8:1.3} opacity={active?0.8:.5} filter={`url(#${confirmed?"pt-confirmed-halo":active?"pt-selected-halo":"pt-idle-halo"})`}/>
  <polygon points={HEX_POINTS} fill={`url(#${confirmed?"pt-confirmed-fill":active?"pt-selected-fill":"pt-idle-fill"})`}/>
  <g clipPath={`url(#${confirmed?"pt-confirmed-clip":active?"pt-selected-clip":"pt-idle-clip"})`} opacity={confirmed?.08:active?.48:.22}>
   {cells.map((c,i)=><polygon key={c.key} points={`${c.x},${c.y-7} ${c.x+5.9},${c.y-3.5} ${c.x+5.9},${c.y+3.5} ${c.x},${c.y+7} ${c.x-5.9},${c.y+3.5} ${c.x-5.9},${c.y-3.5}`} fill={active&&i%11===0?"#e5a342":"none"} stroke="#bc8535" strokeWidth=".5"/>)}
  </g>
  <polygon points={HEX_POINTS} fill="none" stroke={`url(#${confirmed?"pt-confirmed-line":active?"pt-selected-line":"pt-idle-line"})`} strokeWidth={active?1.5:confirmed?1.1:.65}/>
 </svg>;
}
