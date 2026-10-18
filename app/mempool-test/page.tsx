"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Result = { data?: unknown; error?: string };
const panels = [
  { key: "recommendedFees", title: "Recommended fees", detail: "Live fee estimates for different confirmation priorities." },
  { key: "projectedBlocks", title: "Projected blocks", detail: "Transactions Mempool expects in upcoming Bitcoin blocks." },
  { key: "mempoolStats", title: "Unconfirmed activity", detail: "Size and volume of the waiting transaction pool." },
  { key: "difficultyAdjustment", title: "Mining difficulty", detail: "Expected adjustment in Bitcoin mining difficulty." },
] as const;

export default function MempoolTestPage() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [loading, setLoading] = useState(true);
  const [txid, setTxid] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all(panels.map(async (panel) => {
      try {
        const response = await fetch("/api/btc/data/" + panel.key);
        const result = (await response.json()) as Result;
        return [panel.key, response.ok ? result : { error: result.error || "Unavailable" }] as const;
      } catch {
        return [panel.key, { error: "Data temporarily unavailable" }] as const;
      }
    })).then((entries) => {
      if (active) { setResults(Object.fromEntries(entries)); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const validTxid = /^[a-f0-9]{64}$/i.test(txid.trim());
  return (
    <main style={{ maxWidth: 1160, margin: "0 auto", padding: "48px 18px 90px", color: "#e9e5dc" }}>
      <div style={{ fontSize: 12, letterSpacing: 2, color: "#d4aa57", marginBottom: 12 }}>ISOLATED DEVELOPMENT EXPERIMENT</div>
      <h1 style={{ fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.15, marginBottom: 16 }}>Mempool-powered Bitcoin explorer test</h1>
      <p style={{ maxWidth: 740, lineHeight: 1.7, color: "#b5b4b0", marginBottom: 32 }}>A separate comparison page using Mempool data behind Pending Tracker styling. This is a data-layer experiment, not a fork of Mempool’s full frontend or a self-hosted backend. Nothing here replaces your existing Bitcoin or Ethereum pages.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (validTxid) window.location.href = "/btc/" + txid.trim(); }} style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 30 }}>
        <input aria-label="Bitcoin transaction ID" placeholder="Enter a Bitcoin transaction ID" value={txid} onChange={(e) => setTxid(e.target.value)} style={{ flex: "1 1 320px", minWidth: 0, background: "#15191e", border: "1px solid #725a30", borderRadius: 12, padding: 15, color: "#f4f0e6" }} />
        <button type="submit" disabled={!validTxid} style={{ borderRadius: 12, padding: "12px 24px", border: "1px solid #c59b49", background: validTxid ? "#b58a3c" : "#494138", color: "#fff", cursor: validTxid ? "pointer" : "not-allowed" }}>Inspect transaction</button>
      </form>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 16 }}>
        {panels.map((panel) => (
          <article key={panel.key} style={{ background: "linear-gradient(150deg,#202127,#13161a)", border: "1px solid #4e412c", borderRadius: 18, padding: 22, minHeight: 210 }}>
            <h2 style={{ color: "#e4bb6d", fontSize: 19, marginBottom: 10 }}>{panel.title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "#aeb0b4" }}>{panel.detail}</p>
            {loading ? <p>Loading live data…</p> : results[panel.key]?.error ? <p style={{ color: "#efb2a3" }}>{results[panel.key].error}</p> : <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12, lineHeight: 1.5, maxHeight: 230, overflowY: "auto", color: "#e2ded3" }}>{JSON.stringify(results[panel.key]?.data ?? null, null, 2)}</pre>}
          </article>
        ))}
      </section>
      <p style={{ marginTop: 32, color: "#a9a9a9", fontSize: 13 }}>Experimental only · <Link href="/bitcoin" style={{ color: "#e4bb6d" }}>Return to existing Bitcoin explorer</Link></p>
    </main>
  );
}
