import { getRecommendedFees, mempoolBaseUrl } from "@/lib/btc/providers/mempool";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 2;

async function json(url: string) {
  const response = await fetch(url, { next: { revalidate: 2 }, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error("Data provider unavailable");
  return response.json();
}

export async function GET() {
  const alchemyRpc=async(method:string,params:unknown[])=>{const key=process.env.ALCHEMY_API_KEY;if(!key)return null;try{const r=await fetch("https://eth-mainnet.g.alchemy.com/v2/"+encodeURIComponent(key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(6500),next:{revalidate:2}});if(!r.ok)return null;const d=await r.json();return d.error?null:d.result}catch{return null}};
  const [alchemyBlock,alchemyGas,alchemyPriority]=await Promise.all([alchemyRpc("eth_getBlockByNumber",["latest",false]),alchemyRpc("eth_gasPrice",[]),alchemyRpc("eth_maxPriorityFeePerGas",[])]);
  const mempool = mempoolBaseUrl();
  const [fees, pool, blocks, gas, ethBlock, recentBlocks, projectedBlocks, recentTransactions, ethTransactions] = await Promise.allSettled([
    getRecommendedFees(),
    json(mempool + "/api/mempool"),
    fetch(mempool + "/api/blocks/tip/height", { next: { revalidate: 2 }, signal: AbortSignal.timeout(7000) }).then(async r => { if (!r.ok) throw new Error("Block height unavailable"); return Number(await r.text()); }),
    json("https://eth.blockscout.com/api/v2/stats"),
    json("https://eth.blockscout.com/api/v2/blocks?type=block"),
    json(mempool + "/api/blocks"),
    json(mempool + "/api/v1/fees/mempool-blocks"),
    json(mempool + "/api/mempool/recent"),
    json("https://eth.blockscout.com/api/v2/transactions?filter=validated"),
  ]);

  const get = (result: PromiseSettledResult<any>) => result.status === "fulfilled" ? result.value : null;
  const f = get(fees), p = get(pool), b = get(blocks), e = get(gas), eb = get(ethBlock), recent = get(recentBlocks), projected = get(projectedBlocks), txs = get(recentTransactions), etxs = get(ethTransactions);
  const tip = Array.isArray(recent) ? recent[0] : null;
  const confirmedIds = typeof tip?.id === "string" && /^[a-f0-9]{64}$/i.test(tip.id) ? await json(mempool + "/api/block/" + tip.id + "/txids").catch(() => null) : null;
  const tipTimestamp = Number(tip?.timestamp);
  const tipTxCount = Number(tip?.tx_count);
  const poolVsize = p?.vsize == null ? NaN : Number(p.vsize);
  const poolFees = p?.total_fee == null ? NaN : Number(p.total_fee);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const txCount = p?.count == null ? NaN : Number(p.count);
  const gasGwei = e?.gas_prices?.average == null ? NaN : Number(e.gas_prices.average);
  const congestion = !Number.isFinite(txCount) ? "Unavailable" : txCount > 100000 ? "Busy" : txCount > 25000 ? "Moderate" : "Light";
  const feeGuidance = f?.fastestFee != null && f?.halfHourFee != null && f?.hourFee != null ? ` Estimated fee rates: next block ${f.fastestFee} sat/vB, about 30 minutes ${f.halfHourFee} sat/vB, about an hour ${f.hourFee} sat/vB. These are estimates, not guarantees.` : " Live fee estimates are currently unavailable.";
  // Compare current fees to recent confirmed block medians, not a fabricated historical average.
  const recentFeeSamples=Array.isArray(recent)?recent.slice(0,12).map((block:any)=>Number(block?.extras?.medianFee)).filter((n:number)=>Number.isFinite(n)&&n>0):[];
  const sortedFeeSamples=[...recentFeeSamples].sort((a:number,b:number)=>a-b);
  const recentMedianFee=sortedFeeSamples.length?sortedFeeSamples[Math.floor(sortedFeeSamples.length/2)]:null;
  const currentHalfHourFee=f?.halfHourFee!=null?Number(f.halfHourFee):null;
  const feeContext=recentMedianFee==null||currentHalfHourFee==null||!Number.isFinite(currentHalfHourFee)
    ?null
    :currentHalfHourFee>recentMedianFee*1.5?"Current recommended fees are substantially above the median fee rate in recently confirmed blocks."
    :currentHalfHourFee<recentMedianFee*0.7?"Current recommended fees are below the median fee rate in recently confirmed blocks."
    :"Current recommended fees are in a similar range to the median fee rate in recently confirmed blocks.";
  const btc = {
    available: !!(f || p),
    pending: Number.isFinite(txCount) ? txCount : null,
    congestion,
    recentMedianFee,
    feeContext,
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
    confirmedTransactions: Array.isArray(confirmedIds) ? confirmedIds.slice(0, 8).filter((id: unknown) => typeof id === "string" && /^[a-f0-9]{64}$/i.test(id)) : [],
    recentBlocks: Array.isArray(recent) ? recent.slice(0, 8).filter((block: any) => Number.isFinite(Number(block?.height)) && /^[a-f0-9]{64}$/i.test(block?.id ?? "")).map((block: any) => ({ height: Number(block.height), id: block.id, ageMinutes: Number.isFinite(Number(block.timestamp)) ? Math.max(0, Math.floor((nowSeconds - Number(block.timestamp)) / 60)) : null, transactionCount: Number.isFinite(Number(block.tx_count)) ? Number(block.tx_count) : null, size: Number.isFinite(Number(block.size)) ? Number(block.size) : null, feeBTC: Number.isFinite(Number(block.extras?.totalFees)) ? Number(block.extras.totalFees) / 1e8 : null, poolName: typeof block.extras?.pool?.name === "string" ? block.extras.pool.name : null })) : [],
    recentTransactions: Array.isArray(txs) ? txs.slice(0, 12).filter((tx: any) => typeof tx?.txid === "string" && /^[a-f0-9]{64}$/i.test(tx.txid)).map((tx: any) => ({ id: tx.txid, fee: Number.isFinite(Number(tx.fee)) ? Number(tx.fee) : null, vsize: Number.isFinite(Number(tx.vsize)) ? Number(tx.vsize) : null, value: Number.isFinite(Number(tx.value)) ? Number(tx.value) : null })) : [],
    projectedBlocks: Array.isArray(projected) ? projected.slice(0, 6).map((block: any, index: number) => ({
      position: index + 1,
      transactionCount: block?.nTx != null && Number.isFinite(Number(block.nTx)) ? Number(block.nTx) : null,
      medianFee: block?.medianFee != null && Number.isFinite(Number(block.medianFee)) ? Math.round(Number(block.medianFee) * 10) / 10 : null,
      feeRange: Array.isArray(block?.feeRange) && block.feeRange.length > 0 ? [Math.min(...block.feeRange.map(Number).filter(Number.isFinite)), Math.max(...block.feeRange.map(Number).filter(Number.isFinite))] : null
    })) : [],
    explanation: !p ? "Bitcoin mempool activity is temporarily unavailable." + feeGuidance : congestion === "Busy"
      ? "Bitcoin's waiting area is crowded. Transactions offering lower fees may wait longer."
      : congestion === "Moderate"
      ? "Bitcoin has a noticeable backlog. Higher-fee transactions are generally prioritized by miners." + feeGuidance
      : "Bitcoin's waiting area is relatively light. Fees still matter, and confirmation times are never guaranteed." + feeGuidance
  };
  const alchemyGasGwei=typeof alchemyGas==="string"?Number(BigInt(alchemyGas))/1e9:null;
  const alchemyBaseGwei=typeof alchemyBlock?.baseFeePerGas==="string"?Number(BigInt(alchemyBlock.baseFeePerGas))/1e9:null;
  const alchemyTipGwei=typeof alchemyPriority==="string"?Number(BigInt(alchemyPriority))/1e9:null;
  const eth = {
    available: !!(e||alchemyBlock),
    gasGwei: alchemyGasGwei!=null&&Number.isFinite(alchemyGasGwei)?alchemyGasGwei:Number.isFinite(gasGwei)?gasGwei:null,
    baseFeeGwei:alchemyBaseGwei,
    priorityFeeGwei:alchemyTipGwei,
    gasSource:alchemyGasGwei!=null?"Alchemy":"Blockscout",
    latestBlock:alchemyBlock?.number?Number(BigInt(alchemyBlock.number)):eb?.items?.[0]?.height ?? null,
    totalTransactions: e?.total_transactions ?? null,
    recentBlocks: Array.isArray(eb?.items) ? eb.items.slice(0, 6).map((block: any) => ({ height: block.height ?? null, hash: block.hash ?? null, timestamp: block.timestamp ?? null, transactionsCount: block.tx_count ?? block.transactions_count ?? null })) : [],
    recentTransactions: Array.isArray(etxs?.items) ? etxs.items.slice(0, 10).filter((tx: any) => /^0x[a-f0-9]{64}$/i.test(tx.hash ?? "")).map((tx: any) => ({ hash: tx.hash, status: tx.status ?? null, timestamp: tx.timestamp ?? null, block: tx.block ?? null })) : [],
    explanation: !(e||alchemyBlock) ? "Ethereum network data is temporarily unavailable."
      : "Ethereum gas is the cost of processing transactions. It changes with demand and the work a transaction requires. A transaction can also wait because of its fee settings or an earlier pending transaction from the same wallet."
  };
  return NextResponse.json({ btc, eth, updatedAt: new Date().toISOString(), sources: ["mempool.space", "Blockscout", ...(alchemyBlock||alchemyGas?["Alchemy"]:[])] }, {
    headers: { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=2" }
  });
}
