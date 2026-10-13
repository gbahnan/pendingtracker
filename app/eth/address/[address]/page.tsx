import EthereumWallet from "./EthereumWallet";
import "../../../btc/address/[address]/wallet.css";
import "./ethereum-wallet.css";
export const metadata={title:"Ethereum Wallet Explorer | Pending Tracker",description:"Follow an Ethereum address with live ETH balances, token holdings, pending activity and easy-to-understand transaction history."};
export default function Page({params}:{params:{address:string}}){return <EthereumWallet address={params.address}/>}