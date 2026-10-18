import { mempoolBaseUrl } from "@/lib/btc/providers/mempool";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function upstream(path: string) {
  const response = await fetch(mempoolBaseUrl() + path, {
    next: { revalidate: 30 },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error("Bitcoin block provider unavailable");
  return response.json();
}

export async function GET(_request: Request, { params }: { params: { height: string } }) {
  const raw = params.height;
  if (!/^(0|[1-9][0-9]{0,6})$/.test(raw)) {
    return NextResponse.json({ error: "Invalid Bitcoin block height" }, { status: 400 });
  }
  const height = Number(raw);
  try {
    const idResponse = await fetch(mempoolBaseUrl() + "/api/block-height/" + height, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(7000),
    });
    if (idResponse.status === 404) return NextResponse.json({ error: "Block not found" }, { status: 404 });
    if (!idResponse.ok) throw new Error("Bitcoin block height unavailable");
    const id = (await idResponse.text()).trim();
    if (!/^[0-9a-f]{64}$/i.test(id)) throw new Error("Invalid block ID from provider");
    const [block, status] = await Promise.all([
      upstream("/api/block/" + id),
      upstream("/api/block/" + id + "/status").catch(() => null),
    ]);
    if (!block || block.id !== id || block.height !== height) throw new Error("Inconsistent block data");
    return NextResponse.json({
      height: block.height,
      id,
      timestamp: block.timestamp ?? null,
      transactionCount: block.tx_count ?? null,
      size: block.size ?? null,
      weight: block.weight ?? null,
      difficulty: block.difficulty ?? null,
      medianFeeRate: block.extras?.medianFee ?? null,
      totalFeesSats: block.extras?.totalFees ?? null,
      rewardSats: block.extras?.reward ?? null,
      miningPool: block.extras?.pool?.name ?? null,
      canonical: status?.in_best_chain ?? null,
    }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch {
    return NextResponse.json({ error: "Historical block information is temporarily unavailable" }, { status: 502 });
  }
}
