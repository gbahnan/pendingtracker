import { NextResponse } from "next/server";
import { fetchBitcoinDataset } from "@/lib/btc/providers/datasets";

export const revalidate = 120;
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const finite = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;

export async function GET() {
  const [hash, difficulty] = await Promise.allSettled([
    fetchBitcoinDataset("hashrate"), fetchBitcoinDataset("difficultyAdjustment"),
  ]);
  const h = record(hash.status === "fulfilled" ? hash.value : null);
  const d = record(difficulty.status === "fulfilled" ? difficulty.value : null);
  const rate = finite(h.currentHashrate), change = finite(d.difficultyChange);
  const remaining = finite(d.remainingBlocks), time = finite(d.estimatedRetargetDate);
  return NextResponse.json({
    hashrateEH: rate !== null && rate > 0 ? rate / 1e18 : null,
    difficultyChange: change,
    remainingBlocks: remaining !== null && remaining >= 0 ? remaining : null,
    estimatedRetargetDate: time !== null && time > 0 && time < 8.64e15 ? new Date(time).toISOString() : null,
    available: rate !== null || change !== null,
    source: "mempool",
  }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=120" } });
}
