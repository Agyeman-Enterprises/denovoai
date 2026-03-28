"use client";
import { useState } from "react";

export function ShareButton({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId }),
    });
    const data = await res.json();
    if (data.url) {
      setUrl(data.url);
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <button onClick={share} className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: copied ? "#34d399" : "rgba(255,255,255,0.6)" }}>
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
