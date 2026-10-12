import EthereumExplorerOverview from "./EthereumExplorerOverview";
import "../bitcoin/bitcoin-explorer-redesign.css";
import "./ethereum-explorer-redesign.css";

export const metadata={
 title:"Ethereum Blockchain Explorer | Pending Tracker",
 description:"Explore live Ethereum blocks, gas prices and transactions with clear, plain-English explanations."
};
async function get(url:string){try{const r=await fetch(url,{next:{revalidate:12},signal:AbortSignal.timeout(7000)});return r.ok?await r.json():null}catch{return null}}
export default async function EthereumExplorer(){
 const [blocks,transactions]=await Promise.all([
  get("https://eth.blockscout.com/api/v2/blocks?type=block"),
  get("https://eth.blockscout.com/api/v2/transactions?filter=validated")
 ]);
 const initialBlocks=Array.isArray(blocks?.items)?blocks.items.slice(0,10).map((b:any)=>({height:b.height??null,hash:b.hash??null,timestamp:b.timestamp??null,transactionsCount:b.tx_count??b.transactions_count??null})):[];
 const initialTxs=Array.isArray(transactions?.items)?transactions.items.slice(0,12).filter((t:any)=>/^0x[a-f0-9]{64}$/i.test(t.hash??"")).map((t:any)=>({hash:t.hash,status:t.status??null,timestamp:t.timestamp??null,block:t.block??null})):[];
 return <main className="pt-ethereum-explorer-redesign"><EthereumExplorerOverview initialBlocks={initialBlocks} initialTxs={initialTxs}/></main>;
}
