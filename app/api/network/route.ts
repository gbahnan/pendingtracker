import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 30;

async function json(url: string) {
  const response = await fetch(url, { next: { revalidate: 30 }, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error("Data provider unavailable");
  return response.json();
}

export async function GET() {
  const [fees, pool, blocks, gas, ethBlock, recentBlocks, projectedBlocks, recentTransactions] = await Promise.allSettled([
    json("https://mempool.space/api/v1/fees/recommended"),
    json("https://mempool.space/api/mempool"),
    fetch("https://mempool.space/api/blocks/tip/height", { next: { revalidate: 30 }, signal: AbortSignal.timeout(7000) }).then(async r => { if (!r.ok) throw new Error("Block height unavailable"); return Number(await r.text()); }),
    json("https://eth.blockscout.com/api/v2/stats"),
    json("https://eth.blockscout.com/api/v2/blocks?type=block"),
    json("https://mempool.space/api/blocks"),
    json("https://mempool.space/api/v1/fees/mempool-blocks"),
    json("https://mempool.space/api/mempool/recent"),
  ]);

  const get = (result: PromiseSettledResult<any>) => result.status === "fulfilled" ? result.value : null;
  const f = get(fees), p = get(pool), b = get(blocks), e = get(gas), eb = get(ethBlock), recent = get(recentBlocks), projected = get(projectedBlocks), txs = get(recentTransactions);
  const tip = Array.isArray(recent) ? recent[0] : null;
  const tipTimestamp = Number(tip?.timestamp);
  const tipTxCount = Number(tip?.tx_count);
  const poolVsize = p?.vsize == null ? NaN : Number(p.vsize);
  const poolFees = p?.total_fee == null ? NaN : Number(p.total_fee);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const txCount = p?.count == null ? NaN : Number(p.count);
  const gasGwei = e?.gas_prices?.average == null ? NaN : Number(e.gas_prices.average);
  const congestion = !Number.isFinite(txCount) ? "Unavailable" : txCount > 100000 ? "Busy" : txCount > 25000 ? "Moderate" : "Light";
  const btc = {
    available: !!(f || p),
    pending: Number.isFinite(txCount) ? txCount : null,
    congestion,
    fastestFee: f?.fastestFee != null && Number.isFinite(Number(f.fastestFee)) ? Number(f.fastestFee) : null,
    hourFee: f?.hourFee != null && Number.isFinite(Number(f.hourFee)) ? Number(f.hourFee) : null,
    halfHourFee: f?.halfHourFee != null && Number.isFinite(Number(f.halfHourFee)) ? Number(f.halfHourFee) : null,
    economyFee: f?.economyFee != null && Number.isFinite(Number(f.economyFee)) ? Number(f.economyFee) : null,
    minimumFee: f?.minimumFee != null && Number.isFinite(Number(f.minimumFee)) ? Number(f.minimumFee) : null,
    height: b != null && Number.isFinite(Number(b)) ? Number(b) : (tip?.height != null && Number.isFinite(Number(tip.height)) ? Number(tip.height) : null),
    latestBlock: tip && Number.isFinite(tipTimestamp) && tipTimestamp > 0 ? {
      height: Number.isFinite(Number(tip.height)) ? Number(tip.height) : null,
      timestamp: new Date(tipTimestamp * 1000).toISOString(),
      ageMinutes: Math.max(0, Math.floor((nowSeconds - tipTimestamp) / 60)),
      transactionCount: Number.isFinite(tipTxCount) ? tipTxCount : null,
      id: typeof tip.id === "string" && /^[a-fA-F0-9]{64}$/.test(tip.id) ? tip.id : null
    } : null,
    mempoolVsizeMB: Number.isFinite(poolVsize) ? Math.round(poolVsize / 10000) / 100 : null,
    mempoolFeesBTC: Number.isFinite(poolFees) ? Math.round(poolFees / 1000000) / 100 : null,
    recentTransactions: Array.isArray(txs) ? txs.slice(0, 12).filter((tx: any) => typeof tx?.txid === "string" && /^[a-f0-9]{64}$/i.test(tx.txid)).map((tx: any) => ({ id: tx.txid, fee: Number.isFinite(Number(tx.fee)) ? Number(tx.fee) : null, vsize: Number.isFinite(Number(tx.vsize)) ? Number(tx.vsize) : null, value: Number.isFinite(Number(tx.value)) ? Number(tx.value) : null })) : [],
    projectedBlocks: Array.isArray(projected) ? projected.slice(0, 6).map((block: any, index: number) => ({
      position: index + 1,
      transactionCount: block?.nTx != null && Number.isFinite(Number(block.nTx)) ? Number(block.nTx) : null,
      medianFee: block?.medianFee != null && Number.isFinite(Number(block.medianFee)) ? Math.round(Number(block.medianFee) * 10) / 10 : null,
      feeRange: Array.isArray(block?.feeRange) && block.feeRange.length > 0 ? [Math.min(...block.feeRange.map(Number).filter(Number.isFinite)), Math.max(...block.feeRange.map(Number).filter(Number.isFinite))] : null
    })) : [],
    explanation: !p ? "Bitcoin network data is temporarily unavailable." : congestion === "Busy"
      ? "Bitcoin's waiting area is crowded. Transactions offering lower fees may wait longer."
      : congestion === "Moderate"
      ? "Bitcoin has a noticeable backlog. Higher-fee transactions are generally prioritized by miners."
      : "Bitcoin's waiting area is relatively light. Fees still matter, and confirmation times are never guaranteed."
  };
  const eth = {
    available: !!e,
    gasGwei: Number.isFinite(gasGwei) ? gasGwei : null,
    latestBlock: eb?.items?.[0]?.height ?? null,
    totalTransactions: e?.total_transactions ?? null,
    explanation: !e ? "Ethereum network data is temporarily unavailable."
      : "Ethereum gas is the cost of processing transactions. It changes with demand and the work a transaction requires. A transaction can also wait because of its fee settings or an earlier pending transaction from the same wallet."
  };
  return NextResponse.json({ btc, eth, updatedAt: new Date().toISOString(), sources: ["mempool.space", "Blockscout"] }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
  });
}
