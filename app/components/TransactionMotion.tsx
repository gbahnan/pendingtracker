"use client";
import "./TransactionMotion.css";
type Stage={title:string;detail:string;sub?:string;active?:boolean;complete?:boolean};
export default function TransactionMotion({chain,stages}:{chain:"btc"|"eth";stages:Stage[]}){
 const btc=chain==="btc";
 return <div className={"pt-tx-motion "+(btc?"pt-tx-motion-btc":"pt-tx-motion-eth")} role="region" aria-label={btc?"Bitcoin transaction stages":"Ethereum transaction stages"}>
  <div className="pt-tx-motion-scroll"><div className="pt-tx-motion-track">
   {stages.map((stage,i)=><div className="pt-tx-motion-unit" key={i}>
    <div className={"pt-tx-motion-halo "+(stage.active?"is-active ":"")+(stage.complete?"is-complete":"")}>
     <div className="pt-tx-motion-hex">
      {Array.from({length:12},(_,j)=><i key={j} className="pt-tx-motion-ball" style={{left:(17+(j*31)%65)+"%",top:(19+(j*19)%63)+"%",animationDelay:-(j*.9+i)+"s",animationDuration:(8+j%5*2)+"s"} as React.CSSProperties}/>)}
      <strong>{stage.complete?"✓":stage.active?"↑":btc?"₿":"◆"}</strong>
     </div>
    </div>
    <strong className="pt-tx-motion-title">{stage.title}</strong><small>{stage.detail}</small>{stage.sub&&<small>{stage.sub}</small>}{stage.active&&<span className="pt-tx-motion-marker">↑ Your transaction (estimate)</span>}
   </div>)}
  </div></div>
  <p className="pt-tx-motion-disclaimer">Animated particles illustrate network activity; they do not depict individual transactions or guarantee confirmation times.</p>
 </div>
}
