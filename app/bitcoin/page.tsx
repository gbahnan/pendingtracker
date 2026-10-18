import Link from "next/link";
import BitcoinExplorerOverview from "./BitcoinExplorerOverview";
import "./bitcoin-v3.css";

export const metadata = {
 title: "Bitcoin Blockchain Explorer | Pending Tracker",
 description: "Explore live Bitcoin blocks, pending transactions, fee estimates and mempool activity with plain-English explanations."
};

export default function BitcoinExplorer(){
 return <main className="pt-bitcoin-explorer-redesign">\n  <div style={{display:"flex",justifyContent:"center",padding:"12px 18px 0"}}>\n    <Link href="/mempool/" style={{display:"inline-flex",alignItems:"center",gap:"8px",border:"1px solid rgba(212,175,92,.55)",borderRadius:"999px",padding:"10px 18px",color:"#e6c77a",background:"rgba(212,175,92,.08)",fontSize:"13px",fontWeight:600,textDecoration:"none"}}>Explore New Bitcoin Explorer <span aria-hidden="true">↗</span></Link>\n  </div>\n  <BitcoinExplorerOverview/>\n </main>;
}
