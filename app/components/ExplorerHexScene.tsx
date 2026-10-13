"use client";
import "./ExplorerHexScene.css";
type Props={chain:"btc"|"eth";kind:"transaction"|"wallet"};
const polygon=(x:number,y:number,r:number)=>Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return (x+Math.cos(a)*r).toFixed(1)+","+(y+Math.sin(a)*r).toFixed(1)}).join(" ");
export default function ExplorerHexScene({chain,kind}:Props){
 const btc=chain==="btc",accent=btc?"#e9a832":"#387ef5",edge=btc?"#ffd277":"#91b8ff",id="pt-scene-"+chain+"-"+kind;
 const particles=Array.from({length:55},(_,i)=>{const a=i*2.39996,r=30+Math.sqrt(i/55)*132;return {x:170+Math.cos(a)*r*1.18,y:92+Math.sin(a)*r*.58,size:1+(i%4)*.45,dx:((i*11)%21)-10,dy:((i*7)%19)-9,delay:-(i%19),duration:19+(i%13)*2}});
 const satellites=[[46,85,9],[88,42,12],[118,131,8],[251,44,11],[291,99,14],[255,141,8],[65,145,7],[304,53,7]];
 return <div className={"pt-explorer-hex-scene "+(btc?"pt-scene-btc":"pt-scene-eth")+" pt-scene-"+kind} aria-hidden="true"><svg viewBox="0 0 340 184" preserveAspectRatio="xMidYMid meet">
 <defs><linearGradient id={id+"-edge"} x1="0" y1="0" x2="1" y2="1"><stop stopColor={edge}/><stop offset=".55" stopColor={accent}/><stop offset="1" stopColor={edge}/></linearGradient><linearGradient id={id+"-core"} x1="0" y1="0" x2="1" y2="1"><stop stopColor={btc?"#282014":"#182131"}/><stop offset="1" stopColor="#080b11"/></linearGradient></defs>
 {particles.map((p,i)=><circle key={i} className="pt-scene-particle" cx={p.x} cy={p.y} r={p.size} fill={i%3===0?edge:accent} opacity={.22+(i%4)*.12} style={{animationDelay:p.delay+"s",animationDuration:p.duration+"s","--dx":p.dx+"px","--dy":p.dy+"px"} as React.CSSProperties}/>)}
 {satellites.map(([x,y,r],i)=><g key={i} className="pt-scene-satellite" style={{animationDelay:-(i*3)+"s",animationDuration:(23+i*2)+"s"} as React.CSSProperties}><polygon points={polygon(x,y,r)} fill={btc?"#20190e":"#101722"} stroke={accent} strokeWidth="1.2" opacity=".86"/><circle cx={x} cy={y} r="2.3" fill={edge} opacity=".85"/></g>)}
 <polygon points={polygon(170,92,56)} fill={"url(#"+id+"-core)"} stroke={"url(#"+id+"-edge)"} strokeWidth="3"/>
 <polygon points={polygon(170,92,49)} fill="none" stroke={edge} strokeWidth=".65" opacity=".7"/>
 <text x="170" y="112" textAnchor="middle" fill={edge} fontSize={btc?"61":"65"} fontWeight="700">{btc?"₿":"◆"}</text>
 </svg></div>
}
