import ChainDashboard from "../components/ChainDashboard";
import ChainSearch from "../components/ChainSearch";
import Link from "next/link";
export const metadata={title:"Bitcoin Explorer | Pending Tracker",description:"Explore Bitcoin blocks, recent transactions, the mempool and fee estimates in plain English."};
async function get(url:string){try{const r=await fetch(url,{next:{revalidate:15},signal:AbortSignal.timeout(7000)});return r.ok?await r.json():null}catch{return null}}
const n=(v:number|null|undefined)=>v==null?"—":new Intl.NumberFormat("en-US").format(v);
export default async function BitcoinExplorer(){
 const [blocks,pool,fees,transactions]=await Promise.all([get("https://mempool.space/api/blocks"),get("https://mempool.space/api/mempool"),get("https://mempool.space/api/v1/fees/recommended"),get("https://mempool.space/api/mempool/recent")]);
 const recent=Array.isArray(blocks)?blocks.slice(0,12):[];
 const txs=Array.isArray(transactions)?transactions.slice(0,12):[];
 return <main className="pt-chain-page">
  <div className="pt-chain-breadcrumb"><Link href="/">Home</Link><span> / </span> Bitcoin Explorer</div>
  <div className="pt-chain-hero"><div className="pt-chain-symbol pt-chain-bitcoin">₿</div><div><div className="pt-eyebrow">BITCOIN BLOCKCHAIN EXPLORER</div><h1>Explore Bitcoin.</h1><p>See what is happening on Bitcoin in plain English. Every block and transaction leads to the underlying details, with explanations before the technical data.</p></div></div>
  <div className="pt-chain-search"><h2>Find a Bitcoin transaction or address</h2><p>Search directly on this blockchain. We'll show the result and explain what the record means in plain English.</p><ChainSearch chain="bitcoin"/></div>
  <ChainDashboard chain="bitcoin"/>
  <div className="pt-chain-foot"><Link href="/ethereum">Explore Ethereum →</Link><span>Data: mempool.space · Estimates are not guarantees.</span></div>
 </main>
}