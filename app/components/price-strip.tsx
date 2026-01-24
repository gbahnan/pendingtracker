"use client";

import { useEffect, useState } from "react";

type Coin = {
  rank: number;
  name: string;
  symbol: string;
  priceUsd: number | null;
  change24hPct: number | null;
};

function fmtMoney(n: number | null) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function fmtPct(n: number | null) {
  if (n === null || n === undefined) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function PriceStrip() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [provider, setProvider] = useState<string>("");

  async function load() {
    try {
      const res = await fetch("/api/market/top10", { cache: "no-store" });
      if (!res.ok) return;
      const data = await
