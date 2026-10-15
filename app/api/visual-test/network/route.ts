import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const origin = "https://mempool.space/api";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const [blocksResponse, tipResponse] = await Promise.all([
        fetch(origin + "/v1/fees/mempool-blocks", { signal: controller.signal, cache: "no-store" }),
        fetch(origin + "/blocks/tip/height", { signal: controller.signal, cache: "no-store" }),
      ]);
      if (!blocksResponse.ok || !tipResponse.ok) throw new Error("Bitcoin network source unavailable");
      const raw = await blocksResponse.json();
      const tip = Number(await tipResponse.text());
      if (!Array.isArray(raw) || !Number.isSafeInteger(tip) || tip <= 0) throw new Error("Invalid Bitcoin network data");
      const projected = raw.slice(0, 6).map((block: { nTx?: number; feeRange?: number[] }) => ({
        transactions: typeof block.nTx === "number" && Number.isFinite(block.nTx) ? Math.max(0, Math.round(block.nTx)) : null,
        fee: Array.isArray(block.feeRange) && block.feeRange.length ? Number(block.feeRange[0]) : null,
      }));
      return NextResponse.json({ tip, projected, updatedAt: Date.now() }, { headers: { "Cache-Control": "no-store" } });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json({ error: "Live Bitcoin data temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
