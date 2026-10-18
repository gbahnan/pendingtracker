"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type BlockInfo = {height:number;id:string;timestamp:number|null;transactionCount:number|null;size:number|null;weight:number|null;difficulty:number|null;medianFeeRate:number|null;totalFeesSats:number|null;rewardSats:number|null;miningPool:string|null;canonical:boolean|null};
const fmt=(v:number|null|undefined)=>v==null?"Unavailable":v.toLocaleString("en-US",{maximumFractionDigits:2});
export default function BitcoinBlockDetails(){
 const params=useParams();
 const height=String(params?.height??"");
 const [block,setBlock]=useState<BlockInfo|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;setBlock(null);setError("");fetch("/api/btc/block/"+encodeURIComponent(height)).then(async r=>{if(!r.ok)throw Error("Block data is unavailable");return r.json()}).then(data=>{if(active)setBlock(data)}).catch(()=>{if(active)setError("We couldn't retrieve this Bitcoin block. Check the height or try again later.")});return()=>{active=false}},[height]);
 return <main style={{minHeight:"100vh",background:"#0c1018",color:"#f4eee1",padding:"clamp(24px,5vw,72px) 20px"}}>
 <div style={{maxWidth:900,margin:"0 auto"}}>
 <a href="/bitcoin" style={{color:"#e5b65e"}}>← Bitcoin explorer</a>
 <h1 style={{fontSize:"clamp(30px,5vw,52px)",marginBottom:8}}>Bitcoin block #{height}</h1>
 <p style={{opacity:.75}}>Historical block details, explained in plain English.</p>
 {error&&<p role="alert">{error}</p>}
 {!error&&!block&&<p>Loading verified block data…</p>}
 {block&&<>
 <p style={{overflowWrap:"anywhere",opacity:.85}}>Block ID: {block.id}</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginTop:32}}>
 {([
 ["Mined",block.timestamp?new Date(block.timestamp*1000).toLocaleString():"Unavailable","When this block was recorded on Bitcoin."],
 ["Transactions",fmt(block.transactionCount),"Payments and other transactions included in this block."],
 ["Mining pool",block.miningPool??"Not identified","Pool attribution is an estimate from available block metadata."],
 ["Block size",block.size!=null?fmt(block.size)+" bytes":"Unavailable","The serialized size of the block."],
 ["Median fee rate",block.medianFeeRate!=null?fmt(block.medianFeeRate)+" sat/vB":"Unavailable","Typical transaction fee rate in this block; not a current recommendation."],
 ["Total fees",block.totalFeesSats!=null?fmt(block.totalFeesSats)+" sats":"Unavailable","Total miner transaction fees reported for the block."],
 ["Difficulty",fmt(block.difficulty),"How difficult it was to find a valid proof-of-work block at this height."],
 ["Chain status",block.canonical===null?"Unavailable":block.canonical?"Main chain":"Not on main chain","Whether the provider currently considers this block part of the best chain."]
 ] as [string,string,string][]).map(([title,value,description])=><div key={title} style={{border:"1px solid #443b2b",borderRadius:14,padding:20,background:"#151a21"}}><small style={{color:"#d7b373"}}>{title}</small><div style={{fontSize:20,fontWeight:650,overflowWrap:"anywhere",margin:"9px 0"}}>{value}</div><p style={{fontSize:13,opacity:.72,margin:0}}>{description}</p></div>)}
 </div>
 <p style={{marginTop:30,opacity:.7}}>Block data is supplied by a Bitcoin explorer provider. Pool attribution and fee statistics may be unavailable for some blocks.</p>
 </>}
 </div></main>;
}
