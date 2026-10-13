import WalletDashboard from "./WalletDashboard";
import "./wallet.css";

export const metadata={title:"Bitcoin Wallet Explorer | Pending Tracker",description:"Explore any Bitcoin address, its balance, transactions and recent activity in plain English."};
async function get(url:string){try{const r=await fetch(url,{next:{revalidate:45},signal:AbortSignal.timeout(9000)});return r.ok?await r.json():null}catch{return null}}
type Tx={txid:string;fee:number;status?:{confirmed:boolean;block_time?:number};vin?:{prevout?:{scriptpubkey_address?:string;value?:number}}[];vout?:{scriptpubkey_address?:string;value?:number}[]};
export default async function BitcoinAddress({params}:{params:{address:string}}){
 const address=decodeURIComponent(params.address);
 const valid=/^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address);
 const [info,txs,price]=valid?await Promise.all([
  get("https://mempool.space/api/address/"+encodeURIComponent(address)),
  get("https://mempool.space/api/address/"+encodeURIComponent(address)+"/txs"),
  get("https://mempool.space/api/v1/prices")
 ]):[null,null,null];
 const chain=info?.chain_stats??{},mem=info?.mempool_stats??{};
 const received=(chain.funded_txo_sum??0)+(mem.funded_txo_sum??0);
 const sent=(chain.spent_txo_sum??0)+(mem.spent_txo_sum??0);
 const confirmedBalance=(chain.funded_txo_sum??0)-(chain.spent_txo_sum??0);
 const pendingChange=(mem.funded_txo_sum??0)-(mem.spent_txo_sum??0);
 const transactions:Tx[]=Array.isArray(txs)?txs:[];
 const activity=transactions.map(t=>{
  const incoming=(t.vout??[]).reduce((sum,v)=>sum+(v.scriptpubkey_address===address?(v.value??0):0),0);
  const outgoing=(t.vin??[]).reduce((sum,v)=>sum+(v.prevout?.scriptpubkey_address===address?(v.prevout?.value??0):0),0);
  return {txid:t.txid,delta:incoming-outgoing,confirmed:!!t.status?.confirmed,time:t.status?.block_time??null,fee:t.fee??0};
 });
 const named=address==="34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo"?"Binance Cold Wallet":null;
 return <WalletDashboard address={address} valid={valid} available={!!info} name={named} balance={confirmedBalance} pending={pendingChange} received={received} sent={sent} txCount={(chain.tx_count??0)+(mem.tx_count??0)} utxos={(chain.funded_txo_count??0)-(chain.spent_txo_count??0)} price={typeof price?.USD==="number"?price.USD:null} activity={activity}/>;
}
