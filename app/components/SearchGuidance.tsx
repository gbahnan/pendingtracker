"use client";
import {useState} from "react";
import "./SearchGuidance.css";

export default function SearchGuidance({query="",chain="both"}:{query?:string;chain?:"btc"|"eth"|"both"}){
 const [help,setHelp]=useState<"transaction"|"wallet"|null>(null);
 const q=query.trim();
 const ethTx=/^0x[a-f0-9]{64}$/i.test(q),ethAddress=/^0x[a-f0-9]{40}$/i.test(q);
 const btcTx=/^[a-f0-9]{64}$/i.test(q),btcAddress=/^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(q);
 const detected=ethTx?"Ethereum transaction":ethAddress?"Ethereum address":btcAddress?"Bitcoin address":btcTx?(chain==="eth"?"Unrecognized Ethereum hash":"Bitcoin transaction"):null;
 return <div className="pt-search-guidance">
  {detected?<p className="pt-search-detected" role="status">✓ {detected} detected</p>:<p className="pt-search-guide-label">Look up a <button type="button" aria-expanded={help==="transaction"} onClick={()=>setHelp(help==="transaction"?null:"transaction")}>transaction <span aria-hidden="true">ⓘ</span></button> or <button type="button" aria-expanded={help==="wallet"} onClick={()=>setHelp(help==="wallet"?null:"wallet")}>wallet address <span aria-hidden="true">ⓘ</span></button></p>}
  {help&&<div className="pt-search-guide-detail"><strong>{help==="transaction"?"Track a transaction":"Explore a wallet"}</strong><p>{help==="transaction"?"Paste the public transaction ID (hash) from your wallet or exchange to check its status, confirmations and fees.":"Paste a public wallet address to view its on-chain balance and transaction history. Never enter your private key or recovery phrase."}</p><button type="button" onClick={()=>setHelp(null)} aria-label="Close search help">×</button></div>}
 </div>;
}
