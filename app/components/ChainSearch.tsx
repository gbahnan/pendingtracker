"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function ChainSearch({chain}:{chain:"bitcoin"|"ethereum"}){
 const router=useRouter();
 const [value,setValue]=useState("");
 const [error,setError]=useState("");
 function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  let q=value.trim();
  try{if(/^https?:\/\//i.test(q)){const u=new URL(q);const p=u.pathname.split("/").filter(Boolean);const i=p.findIndex(x=>["tx","transaction","address"].includes(x.toLowerCase()));if(i>=0&&p[i+1])q=p[i+1];}}catch{}
  q=q.split(/[?#]/)[0].replace(/\/$/,"");
  if(chain==="bitcoin"){
   if(/^[a-f0-9]{64}$/i.test(q))return router.push("/btc/"+q);
   if(/^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(q))return router.push("/btc/address/"+q);
   setError("Enter a 64-character Bitcoin transaction ID or a Bitcoin wallet address.");
  }else{
   if(/^0x[a-f0-9]{64}$/i.test(q))return router.push("/eth/"+q);
   if(/^0x[a-f0-9]{40}$/i.test(q))return router.push("/eth/address/"+q);
   setError("Enter an Ethereum transaction hash (0x plus 64 characters) or wallet address (0x plus 40 characters).");
  }
 }
 return <form className="pt-chain-inline-search" onSubmit={submit}>
  <label htmlFor={"pt-search-"+chain}>Search {chain==="bitcoin"?"Bitcoin":"Ethereum"} transactions or addresses</label>
  <div><input id={"pt-search-"+chain} value={value} onChange={e=>{setValue(e.target.value);setError("");}} placeholder={chain==="bitcoin"?"Paste Bitcoin TXID or wallet address":"Paste Ethereum transaction hash or wallet address"} autoComplete="off" spellCheck={false}/><button type="submit">Search →</button></div>
  {error?<p className="pt-chain-search-error" role="alert">{error}</p>:<small>Public transaction IDs and addresses only. Never enter a seed phrase or private key.</small>}
 </form>
}