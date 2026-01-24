import { NextResponse } from "next/server";
import { getRecommendedFees, getTx, getTxStatus } from "@/lib/btc/providers/mempool";
import { computeFeerateSatVb, diagnoseBtcTx } from "@/lib/btc/diagnose";
import { isLikelyTxid } from "@/lib/btc/validate";
import { BtcMvpResult } from "@/lib/btc/types";

export const runtime = "edge"; // fast and cheap for an MVP

export async function GET(
  _req: Request,
  { params }: { params: { txid: string } }
) {
  const txid = (params?.txid || "").trim();

  if (!isLikelyTxid(txid)) {
    return NextResponse.json(
      { error: "Invalid txid. Expected 64 hex characters." },
      { status: 400 }
    );
  }

  let tx = null;
  let status = null;
  let fees = null;

  try {
    // Fees are useful even if tx isn't found.
    fees = await getRecommendedFees().catch(() => null);

    // Fetch tx and status in parallel; status endpoint is smaller.
    const [txRes, stRes] = await Promise.allSettled([getTx(txid), getTxStatus(txid)]);

    if (txRes.status === "fulfilled") tx = txRes.value;
    if (stRes.status === "fulfilled") status = stRes.value;

    const feerateSatVb = computeFeerateSatVb(tx);
    const diagnosis = diagnoseBtcTx({ txid, tx, status, fees, feerateSatVb });

    const result: BtcMvpResult = {
      txid,
      tx,
      status,
      fees,
      feerateSatVb,
      diagnosis,
      provider: "mempool.space",
      fetchedAtIso: new Date().toISOString(),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "Unknown error";
    const result: BtcMvpResult = {
      txid,
      tx,
      status,
      fees,
      feerateSatVb: tx ? computeFeerateSatVb(tx) : null,
      diagnosis: {
        code: "PROVIDER_ERROR",
        title: "Data provider error",
        summary: "We couldn’t fetch data from the upstream provider. Please try again shortly.",
        confidence: "low",
        actions: [
          { label: "Retry", detail: "Temporary provider outages happen. Try again in 30–60 seconds." },
          { label: "Try another explorer", detail: "If it’s time-sensitive, check a second source while you wait." }
        ],
        debug: { msg },
      },
      provider: "mempool.space",
      fetchedAtIso: new Date().toISOString(),
    };

    return NextResponse.json(result, { status: 502 });
  }
}
