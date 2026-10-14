import BitcoinExplorerOverview from "./BitcoinExplorerOverview";
import "./bitcoin-explorer-redesign.css";
import "./bitcoin-border-refinement.css";

export const metadata = {
 title: "Bitcoin Blockchain Explorer | Pending Tracker",
 description: "Explore live Bitcoin blocks, pending transactions, fee estimates and mempool activity with plain-English explanations."
};

export default function BitcoinExplorer(){
 return <main className="pt-bitcoin-explorer-redesign"><BitcoinExplorerOverview/></main>;
}
