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
          <div className="header">
            <div className="brand">
              <div className="logo" aria-hidden="true" />
              <div>Pending Tracker</div>
            </div>
            <div className="nav">
              <Link href="/">Track</Link>
              <Link href="/bitcoin">Bitcoin</Link>
              <Link href="/ethereum">Ethereum</Link>
              <Link href="/faq">FAQ</Link>
            </div>
          </div>

          {children}

          <div className="footer">
            <div>Educational tool only. Not financial advice. We never custody funds or submit transactions for you.</div>
            <div className="founder-credit">Founded &amp; Developed by Colin N. Goudas</div>
          </div>
        </div>
      </body>
    </html>
  );
}
