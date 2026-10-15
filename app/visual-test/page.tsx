import type { Metadata } from "next";
import HexagonLab from "./HexagonLab";

export const metadata: Metadata = {
  title: "Visualization Test | Pending Tracker",
  robots: { index: false, follow: false },
};

export default function VisualizationTestPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#17212b", color: "#eef3f7", padding: "clamp(28px, 6vw, 80px) 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ color: "#e9bb70", fontSize: 12, letterSpacing: "0.16em", fontWeight: 700 }}>PENDING TRACKER · PRIVATE DESIGN WORKSPACE</p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", margin: "16px 0 12px" }}>Blockchain Visualization Lab</h1>
        <p style={{ maxWidth: 680, color: "#a9bfcc", lineHeight: 1.7 }}>This separate testing page is reserved for developing the new Bitcoin and Ethereum 2.5D visualizations. The live explorers are not modified here.</p>
        <HexagonLab />
      </div>
    </main>
  );
}
