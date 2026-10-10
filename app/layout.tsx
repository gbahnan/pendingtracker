import "./components/explorer-dashboard.css";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

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
          <nav className="nav" aria-label="Main navigation">
            <Link href="/">Home</Link><Link href="/bitcoin">Bitcoin</Link><Link href="/ethereum">Ethereum</Link><Link href="/faq">FAQ</Link>
          </nav>
          <form className="pt-header-search" action="/" method="get"><a href="/#transaction-search">⌕ &nbsp; Search a transaction…</a></form>
        </header>

          {children}

          <footer className="footer pt-founder-footer">
            <div className="founder-credit">
              <span className="founder-eyebrow">FOUNDED &amp; DEVELOPED BY</span>
              <span className="founder-name">COLIN N. GOUDAS</span>
            </div>
            <p className="footer-disclaimer">Educational tool only. Not financial advice. We never custody funds or submit transactions for you.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
