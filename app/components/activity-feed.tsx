"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BtcItem = {
  chain: "BTC";
  hash: string;
  feeRateSatVb: number | null;
};

type EthItem = {
  chain: "ETH";
  hash: string;
  valueWei: string;
};

function shortHash(h: string) {
  if (!h) return "—";
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

// Converts a wei string to a short ETH string WITHOUT BigInt.
// Example: "1230000000000000000" -> "1.2300"
function weiToEth(wei: string) {
  const raw = (wei || "0").toString().replace(/[^\d]/g, "");
  const s = raw.replace(/^0+/, "") || "0";

  // 1 ETH = 10^18 wei
  if (s.length <= 18) {
    const frac = s.padStart(18, "0").slice(0, 4);
    return `0.${frac}`;
  }

  const whole = s.slice(0, -18);
  const frac = s.slice(-18).padEnd(18, "0").slice(0, 4);
  return `${whole}.${frac}`;
}

export default function ActivityFeed() {
  const [btc, setBtc] = useState<BtcItem[]>([]);
  const [eth, setEth] = useState<EthItem[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      const btcItems = Array.isArray(data.btc) ? data.btc : [];
      const ethItems = Array.isArray(data.eth) ? data.eth : [];

      s
