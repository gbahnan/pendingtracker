"use client";

import { useEffect, useMemo, useState } from "react";

function isLikelyEthHash(s: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(s.trim());
}

function shortHash(h: string) {
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

function weiToEth(wei: string) {
  try {
    const w = BigInt(wei || "0");
    const whole = w / 10n ** 18n;
    const frac = w % 10n ** 18n;
    const fracStr = frac.toString().padStart(18, "0").slice(0, 4);
    return `${whole.toString()}.${fracStr}`;
  } catch {
    return "0.0000";
  }
}

function Progress({ confirmed }: { confirmed: boolean }) {
  const stepStyle = (on: boolean) => ({
    width: 12,
    height: 12,
    borderRadius: 999,
    background: on ? "white" : "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.35)",
  });

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="badge">Where it is (ETH)</div>
      <div style={{ height: 10 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={stepStyle(true)} />
        <div className="small">Broadcasted</div>
        <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.15)" }} />
        <div style={stepStyle(!confirmed)} />
        <div className="small">Pending</div>
        <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.15)" }} />
        <div style={stepStyle(confirmed)} />
        <div className="small">Confirmed</div>
      </div>
    </div>
  );
}

export default function EthTxPage({ params }: { params: { hash: string } }) {
  const hash = params.hash ?? "";
  const ok = useMemo(() => isLikelyEthHash(hash), [hash]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eth/tx/${hash}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error || "Request failed.");
        setData(null);
      } else {
        setData(j);
      }
    } catch (e: any) {
      setError(e?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, ok]);

  if (!ok) {
    return (
      <div className="card">
        <div className="badge">Invalid ETH hash</div>
        <div style={{ height: 8 }} />
        <div className="small">An ETH hash looks like 0x + 64 hex characters.</div>
      </div>
    );
  }

  const confirmed = Boolean(data?.confirmed ?? (Number(data?.confirmations ?? 0) > 0));

  return (
    <>
      <div className="h1">ETH Transaction</div>
      <div className="small">
        Auto-refreshing every ~15 seconds.{" "}
        <button className="button" style={{ padding: "6px 10px" }} onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh now"}
        </button>
      </div>

      <div style={{ height: 12 }} />
      <Progress confirmed={confirmed} />
      <div style={{ height: 12 }} />

      {error && (
        <div className="card">
          <div className="badge">Error</div>
          <div style={{ height: 8 }} />
          <div>{error}</div>
        </div>
      )}

      {data && (
        <div className="grid">
          <div className="card">
            <div className="badge">Plain-English</div>
            <div style={{ height: 10 }} />
            <div style={{ fontWeight: 800 }}>
              {confirmed ? "Confirmed on Ethereum" : "Pending on Ethereum"}
            </div>

            <div style={{ height: 8 }} />
            <ul>
              <li>
                Ethereum is also a “fee market.” If your fee settings are low when the network is busy, your transaction
                can wait.
              </li>
              <li>
                Most wallets have a button called <b>Speed Up</b> (replace with higher fee) or <b>Cancel</b>.
              </li>
              <li>
                If it’s confirmed, you generally just wait for more confirmations if you need extra certainty.
              </li>
            </ul>

            <div style={{ height: 12 }} />
            <div className="small">Educational only. No custody, no execution, no financial advice.</div>
          </div>

          <div className="card">
            <div className="badge">Numbers (for reference)</div>
            <div style={{ height: 12 }} />
            <div className="kv">
              <div className="k">hash</div>
              <div>
                <code>{shortHash(hash)}</code>
              </div>
            </div>
            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">from</div>
              <div className="small">{shortHash(String(data.from ?? ""))}</div>
            </div>
            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">to</div>
              <div className="small">{shortHash(String(data.to ?? ""))}</div>
            </div>
            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">value</div>
              <div>{weiToEth(String(data.value ?? "0"))} ETH</div>
            </div>
            <div style={{ height: 10 }} />
            <div className="kv">
              <div className="k">confirmations</div>
              <div>{String(data.confirmations ?? (confirmed ? 1 : 0))}</div>
            </div>

            <div style={{ height: 14 }} />
            <details>
              <summary className="badge" style={{ cursor: "pointer" }}>
                Raw JSON
              </summary>
              <div style={{ height: 10 }} />
              <pre className="small">{JSON.stringify(data, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
