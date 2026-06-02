"use client";

import { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  screenName: string;
  storagePath: string;
  onClose: () => void;
}

export function CodePanel({ screenName, storagePath, onClose }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadCode() {
    if (code !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/design/code?path=${encodeURIComponent(storagePath)}`);
      const data = await res.json();
      setCode(data.code ?? "// Could not load code");
    } catch {
      setCode("// Failed to load code");
    }
    setLoading(false);
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Auto-load on mount
  if (code === null && !loading) { loadCode(); }

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-border bg-zinc-950">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{screenName}</h3>
          <p className="text-xs text-muted-foreground">TypeScript / React</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyCode} disabled={!code} className="h-7 gap-1.5 text-xs">
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <pre className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap break-words font-mono">
            {code ?? ""}
          </pre>
        )}
      </div>
    </div>
  );
}
