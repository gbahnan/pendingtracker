import type { EthMvpResult } from "./types";
import { isLikelyEthTxHash } from "./validate";
import { blockscoutGetTxInfo } from "./providers/blockscout";
import { etherscanGetTxAndReceipt } from "./providers/etherscan";

function diagnose(r: Partial<EthMvpResult>): EthMvpResult["diagnosis"] {
  if (r.confirmed) {
    return {
      code: "CONFIRMED",
      title: "Confirmed",
      summary: "This Ethereum transaction is confirmed on-chain.",
      actions: [
        { label: "If you’re waiting on an exchange", detail: "Some exchanges require multiple confirmations before crediting." },
        { label: "Keep the link", detail: "You can share this page with support or the recipient." },
      ],
    };
  }

  // If we saw it but it isn't mined yet:
  if (r.txhash && r.raw) {
    return {
      code: "PENDING",
      title: "Pending",
      summary: "This transaction exists, but it hasn’t been included in a block yet.",
      actions: [
        { label: "Wait a bit", detail: "Many pending transactions confirm as network conditions change." },
        { label: "Speed up (if your wallet allows)", detail: "Some wallets can resend with a higher fee (replacement/‘speed up’). Exchanges usually do not." },
      ],
    };
  }

  return {
    code: "NOT_FOUND",
    title: "Not found (yet)",
    summary: "We couldn’t find this transaction on our data sources right now.",
    actions: [
      { label: "Double-check the hash", detail: "Ethereum tx hashes start with 0x and are 66 characters long." },
      { label: "If sent from an exchange", detail: "They may not have broadcast it yet — you may need to wait." },
    ],
  };
}

export async function getEthMvpResult(txhashRaw: string): Promise<
  | { ok: true; data: EthMvpResult }
  | { ok: false; status: number; error: string }
> {
  const txhash = (txhashRaw || "").trim();

  if (!isLikelyEthTxHash(txhash)) {
    return { ok: false, status: 400, error: "That doesn’t look like an Ethereum transaction hash (it should start with 0x and be 66 characters)." };
  }

  // 1) Try Blockscout first (no key required)
  try {
    const info = await blockscoutGetTxInfo(txhash);
    if (info) {
      const confirmed = !!info.blockNumber && info.blockNumber !== "0";
      const confirmations = info.confirmations ? Number(info.confirmations) : null;

      const data: EthMvpResult = {
        chain: "ETH",
        txhash,
        confirmed,
        blockNumber: info.blockNumber ?? null,
        confirmations,
        from: info.from ?? null,
        to: info.to ?? null,
        valueWei: info.value ?? null,
        gasUsed: info.gasUsed ?? null,
        gasPriceWei: info.gasPrice ?? null,
        maxFeePerGasWei: info.maxFeePerGas ?? null,
        maxPriorityFeePerGasWei: info.maxPriorityFeePerGas ?? null,
        provider: "Blockscout",
        fetchedAtIso: new Date().toISOString(),
        raw: info,
        diagnosis: diagnose({ confirmed: confirmed, raw: info, txhash }),
      };
      return { ok: true, data };
    }
  } catch {
    // fall through
  }

  // 2) Optional: Etherscan fallback if you add a key
  const key = process.env.ETHERSCAN_API_KEY;
  if (key) {
    try {
      const { tx, receipt } = await etherscanGetTxAndReceipt(txhash, key);
      const confirmed = !!receipt?.blockNumber;

      const data: EthMvpResult = {
        chain: "ETH",
        txhash,
        confirmed,
        blockNumber: receipt?.blockNumber ?? null,
        confirmations: null,
        from: tx?.from ?? null,
        to: tx?.to ?? null,
        valueWei: tx?.value ?? null,
        gasUsed: receipt?.gasUsed ?? null,
        gasPriceWei: tx?.gasPrice ?? null,
        maxFeePerGasWei: tx?.maxFeePerGas ?? null,
        maxPriorityFeePerGasWei: tx?.maxPriorityFeePerGas ?? null,
        provider: "Etherscan",
        fetchedAtIso: new Date().toISOString(),
        raw: { tx, receipt },
        diagnosis: diagnose({ confirmed: confirmed, raw: { tx, receipt }, txhash }),
      };
      return { ok: true, data };
    } catch {
      // fall through
    }
  }

  return { ok: false, status: 404, error: "Transaction not found on our free data sources right now." };
}
