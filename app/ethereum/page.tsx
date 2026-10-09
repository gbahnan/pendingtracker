import ChainDashboard from "../components/ChainDashboard";
import ChainSearch from "../components/ChainSearch";
import Link from "next/link";
export const metadata={title:"Ethereum Explorer | Pending Tracker",description:"Explore Ethereum blocks, transactions, gas fees and smart-contract activity in plain English."};
async function get(url:string){try{const r=await fetch(url,{next:{revalidate:15},signal:AbortSignal.timeout(7000)});return r.ok?await r.json():null}catch{return null}}
const n=(v:number|null|undefined)=>v==null?"—":new Intl.NumberFormat("en-US").format(v);
export default async function EthereumExplorer(){
 const [blocks,transactions,stats]=await Promise.all([get("https://eth.blockscout.com/api/v2/blocks?type=block"),get("https://eth.blockscout.com/api/v2/transactions?filter=validated"),get("https://eth.blockscout.com/api/v2/stats")]);
 const recent=Array.isArray(blocks?.items)?blocks.items.slice(0,12):[];
 const txs=Array.isArray(transactions?.items)?transactions.items.slice(0,12):[];
 return <main className="pt-chain-page">
  <div className="pt-chain-breadcrumb"><Link href="/">Home</Link><span> / </span> Ethereum Explorer</div>
  <div className="pt-chain-hero"><div className="pt-chain-symbol pt-chain-ethereum">◆</div><div><div className="pt-eyebrow">ETHEREUM BLOCKCHAIN EXPLORER</div><h1>Explore Ethereum.</h1><p>Understand Ethereum activity at a glance. Browse blocks, transactions, tokens and contracts, with straightforward summaries and deeper technical records when you need them.</p></div></div>
  <div className="pt-chain-search"><h2>Find an Ethereum transaction or address</h2><p>Search directly on this blockchain. We'll show the result and explain what the record means in plain English.</p><ChainSearch chain="ethereum"/></div>
  <ChainDashboard chain="ethereum"/>
  <div className="pt-chain-foot"><Link href="/bitcoin">Explore Bitcoin →</Link><span>Data: Blockscout · Gas fees and network activity can change.</span></div>
 </main>
}