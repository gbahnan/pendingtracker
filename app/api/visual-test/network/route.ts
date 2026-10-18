import { NextResponse } from "next/server";
import { mempoolBaseUrl } from "@/lib/btc/providers/mempool";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const origin = mempoolBaseUrl() + "/api";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const [blocksResponse, tipResponse, recentResponse] = await Promise.all([
        fetch(origin + "/v1/fees/mempool-blocks", { signal: controller.signal, cache: "no-store" }),
        fetch(origin + "/blocks/tip/height", { signal: controller.signal, cache: "no-store" }),
        fetch(origin + "/blocks", { signal: controller.signal, cache: "no-store" }),
      ]);
      if (!blocksResponse.ok || !tipResponse.ok || !recentResponse.ok) throw new Error("Bitcoin network source unavailable");
      const raw = await blocksResponse.json();
      const tip = Number(await tipResponse.text());
      const recentRaw = await recentResponse.json();
      const confirmed = Array.isArray(recentRaw) ? recentRaw.slice(0, 6).map((block: { height?: number; id?: string; tx_count?: number }) => ({ height: Number.isSafeInteger(block.height) ? block.height : null, id: typeof block.id === "string" ? block.id : null, transactions: Number.isFinite(block.tx_count) ? block.tx_count : null })) : [];
      if (!Array.isArray(raw) || !Number.isSafeInteger(tip) || tip <= 0) throw new Error("Invalid Bitcoin network data");
      const projected = raw.slice(0, 6).map((block: { nTx?: number; feeRange?: number[] }) => ({
        transactions: typeof block.nTx === "number" && Number.isFinite(block.nTx) ? Math.max(0, Math.round(block.nTx)) : null,
        fee: Array.isArray(block.feeRange) && block.feeRange.length && Number.isFinite(block.feeRange[0]) ? block.feeRange[0] : null,
      }));
      return NextResponse.json({ tip, projected, confirmed, updatedAt: Date.now() }, { headers: { "Cache-Control": "no-store" } });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json({ error: "Live Bitcoin data temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
