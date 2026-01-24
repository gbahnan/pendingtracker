"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("Could not copy. You can copy the URL from the address bar.");
    }
  }

  return (
    <button className="button secondary" onClick={copy}>
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
