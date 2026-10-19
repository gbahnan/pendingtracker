import "./components/explorer-dashboard.css";
import "./globals.css";
import "./site-polish.css";
import "./mobile-responsive.css";
import type { Metadata } from "next";
import Link from "next/link";
import ActiveNav from "./components/ActiveNav";

export const metadata: Metadata = {
  title: "Pending Tracker | The Blockchain Explorer That Explains Everything",
  description: "Track Bitcoin and Ethereum transactions in plain English, or explore each blockchain through live blocks, addresses, tokens and fees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header pt-reference-header">
          <Link href="/" className="brand"><span className="pt-brand-hex" aria-hidden="true">⬡</span><span>PENDING TRACKER</span></Link>
          <ActiveNav />
          <form className="pt-header-search" action="/" method="get"><a href="/#transaction-search">⌕ &nbsp; Search a transaction…</a></form>
        </header>

          {children}

          <footer className="footer pt-founder-footer">
            <div className="founder-credit">
              <span className="founder-eyebrow">Founded By</span>
              <span className="founder-name">COLIN GOUDAS</span>
            </div>
            <p className="footer-copyright">© {new Date().getFullYear()} Pending Tracker. All rights reserved.</p>
            <p className="footer-disclaimer">Educational tool only. Not financial advice. We never custody funds or submit transactions for you.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
