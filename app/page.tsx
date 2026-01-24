"use client";

import { useMemo, useState } from "react";
import { isLikelyTxid } from "@/lib/btc/validate";

export default function Page() {
  const [txid, setTxid] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => isLikelyTxid(txid), [txid]);

  function go() {
    const clean = txid.trim();
    if (!isLikelyTxid(clean)) {
      setError("That doesn’t look like a Bitcoin transaction ID (txid). It should be 64 characters (letters/numbers).");
      return;
    }
    setError(null);
    window.location.href = `/btc/${clean}`;
  }

  async function paste() {
    try {
      const t = await navigator.clipboard.readText();
      setTxid(t || "");
      setError(null);
    } catch {
      setError("Paste didn’t work. Click the box and paste manually (⌘V).");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") go();
  }

  return (
    <>
      <div className="h1">Pending Tracker</div>
      <p className="p">
        Paste a Bitcoin tra
