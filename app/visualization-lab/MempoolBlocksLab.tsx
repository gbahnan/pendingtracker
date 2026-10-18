"use client";

import { useEffect, useRef, useState } from "react";

type ProjectedBlock = { transactions: number | null; fee: number | null };
type ConfirmedBlock = { height: number | null; id: string | null; transactions: number | null };
type LiveNetwork = { tip: number; projected: ProjectedBlock[]; confirmed?: ConfirmedBlock[]; updatedAt: number };
type Props = {
  pending?: number | null;
  fee?: number | null;
  blocks?: unknown[];
  projectedCount?: number | null;
  projections?: unknown[];
  trackedPosition?: number | null;
  trackedFraction?: number | null;
  trackedConfirmedHeight?: number | null;
  compactTransactionLabels?: boolean;
  overview?: boolean;
};

const format = (value: number | null | undefined) => value == null ? "—" : value.toLocaleString("en-US");
const feeFormat = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function MempoolBlocksLab({ trackedPosition = null, trackedFraction = null, trackedConfirmedHeight = null, compactTransactionLabels = false }: Props) {
  const [network, setNetwork] = useState<LiveNetwork | null>(null);
  const [state, setState] = useState<"loading" | "live" | "stale">("loading");
  const [motion, setMotion] = useState(true);
  const previousTip = useRef<number | null>(null);
  const [newBlock, setNewBlock] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let transition: ReturnType<typeof setTimeout> | undefined;
    async function update() {
      try {
        const response = await fetch("/api/visual-test/network", { cache: "no-store" });
        if (!response.ok) throw new Error("Network unavailable");
        const next = await response.json() as LiveNetwork;
        if (!Number.isSafeInteger(next.tip) || !Array.isArray(next.projected)) throw new Error("Invalid network data");
        if (!active) return;
        if (previousTip.current !== null && next.tip > previousTip.current) {
          setNewBlock(true);
          if (transition) clearTimeout(transition);
          transition = setTimeout(() => { if (active) setNewBlock(false); }, 1100);
        }
        previousTip.current = next.tip;
        setNetwork(next);
        setState("live");
      } catch { if (active) setState("stale"); }
    }
    void update();
    const interval = setInterval(() => { void update(); }, 5000);
    return () => { active = false; clearInterval(interval); if (transition) clearTimeout(transition); };
  }, []);

  const projected = network?.projected ?? [];
  const confirmed = network?.confirmed ?? [];
  return <section className={"pt-mempool-view" + (compactTransactionLabels ? " pt-mempool-tx" : "")} aria-label="Bitcoin mempool projected blocks and confirmed blocks">
    <div className="pt-mempool-heading">
      <span><span className={"pt-mempool-status " + state} />{state === "live" ? "LIVE BITCOIN NETWORK" : state === "stale" ? "NETWORK DATA UNAVAILABLE" : "CONNECTING TO BITCOIN NETWORK"}</span>
      <button type="button" onClick={() => setMotion(value => !value)} aria-pressed={motion}>{motion ? "Pause animation" : "Resume animation"}</button>
    </div>
    <div className="pt-mempool-scroll" ref={scroller} tabIndex={0} aria-label="Scroll horizontally to explore Bitcoin projected and confirmed blocks">
      <div className={"pt-mempool-track" + (newBlock && motion ? " new-block" : "") + (!motion ? " reduced-motion" : "")}>
        <div className="pt-mempool-pool">
          <div className="pt-mempool-pool-visual">
            {Array.from({ length: 55 }, (_, i) => <i key={i} style={{ left: ((i * 37 + 17) % 92 + 3) + "%", top: ((i * 23 + 11) % 88 + 6) + "%", animationDelay: "-" + (i % 17) / 3 + "s", opacity: 0.35 + (i % 6) / 12 }} />)}
          </div>
          <strong>MEMPOOL</strong>
          <small>Waiting transactions</small>
        </div>
        {Array.from({ length: 6 }, (_, i) => {
          const position = 6 - i;
          const block = projected[position - 1];
          const count = block?.transactions ?? null;
          const fill = count === null ? 0 : Math.min(100, Math.max(10, count / 35));
          const marked = trackedPosition === position;
          return <div className="pt-mempool-slot" key={position}>
            <div className="pt-mempool-block projected">
              <div className="pt-mempool-block-fill" style={{ height: fill + "%" }} />
              <div className="pt-mempool-block-content">
                <span className="pt-mempool-block-top">PROJECTED BLOCK</span>
                <strong>~{position * 10} min</strong>
                <span className="pt-mempool-fee">{feeFormat(block?.fee)} <small>sat/vB min</small></span>
              </div>
              <div className="pt-mempool-block-bottom">{format(count)} <small>transactions</small></div>
            </div>
            {marked && <div className="pt-mempool-marker" style={{ left: (12 + clamp(trackedFraction ?? 0.5) * 76) + "%" }}><b>YOUR TX</b><span>▲</span></div>}
          </div>;
        })}
        <div className="pt-mempool-divider" aria-hidden="true" />
        {Array.from({ length: 6 }, (_, i) => {
          const block = confirmed[i];
          const marked = trackedConfirmedHeight !== null && block?.height === trackedConfirmedHeight;
          return <div className="pt-mempool-slot" key={"confirmed-" + i}>
            <div className="pt-mempool-block confirmed">
              <div className="pt-mempool-block-fill" />
              <div className="pt-mempool-block-content">
                <span className="pt-mempool-block-top">CONFIRMED</span>
                <strong>{block?.height != null ? "#" + format(block.height) : "—"}</strong>
                <span className="pt-mempool-fee">Bitcoin block</span>
              </div>
              <div className="pt-mempool-block-bottom">{format(block?.transactions)} <small>transactions</small></div>
            </div>
            {marked && <div className="pt-mempool-marker confirmed-marker"><b>YOUR TX</b><span>▲</span></div>}
          </div>;
        })}
      </div>
    </div>
    <style jsx>{`
      .pt-mempool-view{width:100%;min-width:0;margin:0;color:#e7e9ec}
      .pt-mempool-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 4px 10px;font-size:10px;letter-spacing:.11em;font-weight:700;color:#b9a27b}
      .pt-mempool-heading button{background:transparent;border:1px solid #6d593b;border-radius:7px;padding:6px 9px;color:#c9b18b;cursor:pointer;font-size:11px;letter-spacing:0}
      .pt-mempool-status{display:inline-block;width:7px;height:7px;margin-right:8px;border-radius:50%;background:#aa9b77}
      .pt-mempool-status.live{background:#63c59b;box-shadow:0 0 9px #63c59b}.pt-mempool-status.stale{background:#dc9d70}
      .pt-mempool-scroll{overflow-x:auto;overflow-y:hidden;max-width:100%;scrollbar-width:thin;scrollbar-color:#876b42 transparent;touch-action:pan-x pan-y}
      .pt-mempool-track{display:flex;align-items:center;gap:12px;width:max-content;min-height:239px;padding:9px 5px 37px}
      .pt-mempool-pool{width:182px;flex:none;text-align:center;align-self:center}
      .pt-mempool-pool-visual{position:relative;height:155px;overflow:hidden;border:2px solid #ac8246;border-radius:8px;background:linear-gradient(0deg,#5e3e1d 0%,#3b2c20 28%,#161d24 100%);box-shadow:inset 0 0 20px #080d13,0 0 15px #b37b3426}
      .pt-mempool-pool-visual i{position:absolute;display:block;width:5px;height:5px;background:#e2b56e;border-radius:2px;box-shadow:0 0 5px #e6ad59;animation:pt-mempool-float 4s ease-in-out infinite alternate}
      .pt-mempool-pool strong{display:block;margin-top:8px;color:#e5b66b;font-size:13px;letter-spacing:.1em}
      .pt-mempool-pool small{display:block;margin-top:3px;color:#b1bbc4;font-size:10px}
      .pt-mempool-slot{width:137px;flex:none;position:relative}
      .pt-mempool-block{position:relative;overflow:hidden;height:174px;border:2px solid #ba8845;border-radius:5px;background:linear-gradient(180deg,#18222c,#111820);box-shadow:0 0 13px #a66a2926,inset 0 0 14px #050b13}
      .pt-mempool-block-fill{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg,#bf92543d,#9a602c8c);transition:height .9s ease}
      .pt-mempool-block-content{position:absolute;inset:0 0 27px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center}
      .pt-mempool-block-top{font-size:9px;letter-spacing:.1em;color:#c6a475;font-weight:700}
      .pt-mempool-block-content strong{font-size:22px;color:#f2e1c3;letter-spacing:-.03em;white-space:nowrap}
      .pt-mempool-fee{font-size:13px;font-weight:700;color:#e4b56f}.pt-mempool-fee small{font-size:10px;font-weight:400;color:#c1b7a7}
      .pt-mempool-block-bottom{position:absolute;bottom:0;left:0;right:0;min-height:27px;display:flex;align-items:center;justify-content:center;gap:3px;background:#0a111acc;font-size:12px;font-weight:700;color:#e3bf87;white-space:nowrap}
      .pt-mempool-block-bottom small{font-size:9px;color:#aebbc4;font-weight:400}
      .pt-mempool-block.confirmed{border-color:#5d99b3;background:linear-gradient(180deg,#172b37,#101b25);box-shadow:0 0 12px #287aa333}
      .pt-mempool-block.confirmed .pt-mempool-block-fill{height:100%;background:linear-gradient(180deg,#23516a2b,#2457785e)}
      .pt-mempool-block.confirmed .pt-mempool-block-top,.pt-mempool-block.confirmed .pt-mempool-fee{color:#8fc6de}
      .pt-mempool-block.confirmed .pt-mempool-block-bottom{color:#b3d9e9}
      .pt-mempool-divider{width:1px;height:145px;background:linear-gradient(transparent,#80b5cf99,transparent);margin:0 5px}
      .pt-mempool-marker{position:absolute;bottom:-31px;z-index:2;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;white-space:nowrap;color:#ffce83;text-shadow:0 0 8px #b77c2c;pointer-events:none}
      .pt-mempool-marker b{font-size:10px;letter-spacing:.05em}.pt-mempool-marker span{font-size:18px;line-height:17px}
      .confirmed-marker{left:50%}
      .new-block .confirmed:first-of-type{animation:pt-mempool-confirm 1.1s ease}
      .new-block .pt-mempool-block.confirmed{animation:pt-mempool-confirm 1.1s ease}
      .reduced-motion *, .reduced-motion *:before{animation:none!important;transition:none!important}
      @keyframes pt-mempool-float{to{transform:translate(2px,-9px);opacity:.4}}
      @keyframes pt-mempool-confirm{50%{box-shadow:0 0 23px #4cb9e599}}
      @media(max-width:700px){
        .pt-mempool-heading{font-size:9px;padding-bottom:7px}
        .pt-mempool-track{gap:6px;min-height:155px;padding:4px 3px 32px}
        .pt-mempool-pool{width:88px}.pt-mempool-pool-visual{height:105px}.pt-mempool-pool strong{font-size:10px;margin-top:5px}.pt-mempool-pool small{font-size:8px}
        .pt-mempool-slot{width:79px}.pt-mempool-block{height:112px;border-width:1px}
        .pt-mempool-block-content{gap:6px;bottom:22px}.pt-mempool-block-top{font-size:6px;letter-spacing:0}
        .pt-mempool-block-content strong{font-size:14px}.pt-mempool-fee{font-size:10px}.pt-mempool-fee small{display:block;font-size:8px}
        .pt-mempool-block-bottom{min-height:22px;font-size:9px;flex-direction:column;gap:0}.pt-mempool-block-bottom small{font-size:7px}
        .pt-mempool-divider{height:95px;margin:0 2px}.pt-mempool-marker{bottom:-26px}.pt-mempool-marker b{font-size:8px}.pt-mempool-marker span{font-size:14px}
      }
      @media(prefers-reduced-motion:reduce){.pt-mempool-view *, .pt-mempool-view *:before{animation:none!important;transition:none!important}}
    `}</style>
  </section>;
}
