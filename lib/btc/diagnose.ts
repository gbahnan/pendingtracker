import { Diagnosis, FeeRecommendations, MempoolTx, TxStatus } from "./types";

/**
 * BIP125 "opt-in RBF" is signaled via input sequence numbers.
 * Many APIs also supply a direct `rbf` boolean; we accept either.
 */
export function txSignalsRbf(tx: MempoolTx | null | undefined): boolean | null {
  if (!tx) return null;
  if (typeof (tx as any).rbf === "boolean") return (tx as any).rbf as boolean;

  const vins = tx.vin || [];
  if (!vins.length) return null;

  // If any input has a sequence < 0xfffffffe, treat as signaling replaceability.
  // (Some wallets use 0xfffffffd, etc.)
  return vins.some(v => typeof v.sequence === "number" && v.sequence < 0xfffffffe);
}

export function computeVsize(tx: MempoolTx | null | undefined): number | null {
  if (!tx) return null;
  if (typeof tx.vsize === "number") return tx.vsize;
  if (typeof tx.weight === "number") return Math.ceil(tx.weight / 4);
  return null;
}

export function computeFeerateSatVb(tx: MempoolTx | null | undefined): number | null {
  if (!tx) return null;
  const fee = typeof tx.fee === "number" ? tx.fee : null;
  const vsize = computeVsize(tx);
  if (!fee || !vsize) return null;
  return Math.round((fee / vsize) * 10) / 10; // 0.1 sat/vB precision
}

function etaFromClass(cls: "fastest" | "halfHour" | "hour" | "economy" | "min"): { minMinutes: number; maxMinutes: number; note?: string } {
  switch (cls) {
    case "fastest": return { minMinutes: 10, maxMinutes: 25, note: "Usually next block if no unconfirmed ancestors." };
    case "halfHour": return { minMinutes: 20, maxMinutes: 60 };
    case "hour": return { minMinutes: 45, maxMinutes: 140 };
    case "economy": return { minMinutes: 120, maxMinutes: 480 };
    case "min": return { minMinutes: 360, maxMinutes: 2880, note: "Can take many hours or get dropped if mempool stays congested." };
  }
}

function classifyFeerate(feeRate: number, fees: FeeRecommendations | null | undefined): "fastest" | "halfHour" | "hour" | "economy" | "min" | "unknown" {
  if (!fees) return "unknown";
  const f = fees.fastestFee ?? null;
  const hh = fees.halfHourFee ?? null;
  const h = fees.hourFee ?? null;
  const e = fees.economyFee ?? null;
  const m = fees.minimumFee ?? null;

  // Basic ladder; if any are missing, degrade gracefully.
  if (f !== null && feeRate >= f) return "fastest";
  if (hh !== null && feeRate >= hh) return "halfHour";
  if (h !== null && feeRate >= h) return "hour";
  if (e !== null && feeRate >= e) return "economy";
  if (m !== null && feeRate >= m) return "min";
  if (m !== null && feeRate < m) return "min";
  return "unknown";
}

export function diagnoseBtcTx(args: {
  txid: string;
  tx: MempoolTx | null;
  status: TxStatus | null;
  fees: FeeRecommendations | null;
  feerateSatVb: number | null;
}): Diagnosis {
  const { tx, status, fees, feerateSatVb } = args;

  if (!tx && !status) {
    return {
      code: "NOT_SEEN",
      title: "Transaction not found (yet)",
      summary: "Our data provider cannot find this transaction. It may not have been broadcast, may not have propagated to this provider, or may have been replaced or dropped. We cannot determine which explanation applies from this result.",
      confidence: "low",
      actions: [
        { label: "Double-check the txid", detail: "Make sure the transaction ID is 64 hex characters (no spaces)." },
        { label: "Check your wallet/exchange", detail: "Look for a “broadcast / pending / sent” state, or re-broadcast options." },
        { label: "Try another explorer", detail: "If only one provider can’t see it, it may be a propagation issue." }
      ],
      debug: { hasTx: false, hasStatus: false }
    };
  }

  if (status?.confirmed || tx?.status?.confirmed) {
    const st = status || tx?.status!;
    return {
      code: "CONFIRMED",
      title: "Confirmed on-chain",
      summary: "This transaction has been included in a block.",
      eta: { minMinutes: 0, maxMinutes: 0 },
      confidence: "high",
      actions: [
        { label: "Wait for more confirmations (if needed)", detail: "Some services require multiple confirmations before crediting funds." }
      ],
      debug: { block_height: st.block_height, block_time: st.block_time }
    };
  }

  // Pending path
  const rbf = txSignalsRbf(tx);
  const fr = feerateSatVb ?? null;

  // If no fee data, give a generic pending response.
  if (fr === null) {
    return {
      code: "PENDING_OK",
      title: "Pending in the mempool",
      summary: "The transaction appears unconfirmed. Without fee/size details we can’t estimate priority precisely.",
      confidence: "medium",
      actions: [
        { label: "Check fee/priority", detail: "If your wallet shows a fee rate, compare it to current recommended fees." },
        { label: "If it’s urgent", detail: "Use RBF (fee bump) or CPFP (child-pays-for-parent) if your wallet supports it." }
      ],
      debug: { rbf }
    };
  }

  const cls = classifyFeerate(fr, fees);
  // Fee-tier heuristics are not a reliable transaction-specific ETA.\n  // Do not display precise minutes without ancestor/package and mempool position analysis.\n  const eta = undefined;

  const minFee = fees?.minimumFee ?? null;
  const economy = fees?.economyFee ?? null;
  const hour = fees?.hourFee ?? null;

  const veryLow = minFee !== null ? fr < minFee : (economy !== null ? fr < economy : false);
  const low = !veryLow && hour !== null ? fr < hour : false;

  const actions: Diagnosis["actions"] = [];
  if (rbf === true) {
    actions.push(
      { label: "Use RBF fee bump", detail: "In your wallet, choose “Increase fee / Speed up / Bump fee”. Create a replacement with a higher fee rate." }
    );
  } else if (rbf === false) {
    actions.push(
      { label: "RBF not signaled", detail: "This transaction may not be replaceable. If you control one of its outputs, CPFP may still work." }
    );
  } else {
    actions.push(
      { label: "Check replaceability (RBF)", detail: "Some wallets mark a transaction as “replaceable”. If yes, you can bump the fee." }
    );
  }

  actions.push(
    { label: "Consider CPFP", detail: "If you control an output of this unconfirmed transaction, you can spend it with a high-fee child transaction so miners include both." },
    { label: "If it’s not urgent", detail: "Waiting is often fine; fees may drop and your transaction can confirm later." }
  );

  if (veryLow) {
    return {
      code: rbf ? "RBF_AVAILABLE" : "VERY_LOW_FEE",
      title: "Very low fee for current conditions",
      summary: `Your fee rate (${fr} sat/vB) is below current low-priority levels. It may take many hours (or longer) if the mempool stays busy.`,
      eta,
      confidence: "medium",
      actions,
      debug: { fr, fees, rbf }
    };
  }

  if (low) {
    return {
      code: rbf ? "RBF_AVAILABLE" : "LOW_FEE",
      title: "Fee is a bit low right now",
      summary: `Your fee rate (${fr} sat/vB) is below the rates typically used for ~1 hour confirmation. It can still confirm, but timing is uncertain.`,
      eta,
      confidence: "medium",
      actions,
      debug: { fr, fees, rbf }
    };
  }

  return {
    code: "PENDING_OK",
    title: "Pending, with a competitive fee",
    summary: `Your fee rate (${fr} sat/vB) is within current recommended levels, but this does not guarantee when it will confirm. Unconfirmed parent transactions, competing transactions and changes in miner demand can affect timing.`,
    eta,
    confidence: "medium",
    actions,
    debug: { fr, fees, rbf }
  };
}
