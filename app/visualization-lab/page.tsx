import type { Metadata } from "next";
import MempoolBlocksLab from "./MempoolBlocksLab";

export const metadata: Metadata = {
  title: "Bitcoin Block Visualization Lab | Pending Tracker",
  robots: { index: false, follow: false },
};

export default function VisualizationLabPage() {
  return <main style={{ minHeight: "100vh", background: "#101a24", color: "#e9eef2", padding: "clamp(22px, 5vw, 60px) 14px" }}>
    <div style={{ maxWidth: 1250, margin: "0 auto" }}>
      <p style={{ fontSize: 11, letterSpacing: ".15em", color: "#d8ad6e", fontWeight: 700 }}>PENDING TRACKER · DEVELOPMENT PREVIEW</p>
      <h1 style={{ fontSize: "clamp(26px, 4vw, 42px)", margin: "12px 0" }}>Bitcoin Visualization Lab</h1>
      <p style={{ maxWidth: 780, color: "#b0bec9", lineHeight: 1.6, fontSize: 14, marginBottom: 28 }}>Experimental rectangular Bitcoin block visualization. The Bitcoin Explorer and transaction pages continue using their existing visualization while this is tested. Data refreshes approximately every five seconds; projected blocks are estimates, not guaranteed confirmation times.</p>
      <MempoolBlocksLab />
    </div>
  </main>;
}
