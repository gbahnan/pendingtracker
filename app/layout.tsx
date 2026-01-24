import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pending Tracker (BTC MVP)",
  description: "Explain why a Bitcoin transaction is pending and what you can do about it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
