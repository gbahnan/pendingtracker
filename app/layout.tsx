import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pending Tracker — BTC",
  description: "Paste a Bitcoin transaction ID and get a simple explanation + what to do next.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="header">
            <div className="brand">
              <div className="logo" />
              <div>Pending Tracker</div>
            </div>
            <div className="nav">
              <Link href="/">Home</Link>
              <Link href="/faq">FAQ</Link>
            </div>
          </div>

          {children}

          <div className="footer">
            Educational tool only. Not financial advice. We never custody funds or submit transactions for you.
          </div>
        </div>
      </body>
    </html>
  );
}
