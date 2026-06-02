"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onAdd: (instruction: string) => void;
  disabled: boolean;
}

const SUGGESTIONS = [
  "Add a mobile variant of the dashboard",
  "Add an empty state for the main list",
  "Add a payment confirmation screen",
  "Add an error screen for network failure",
];

export function DesignPromptBar({ onAdd, disabled }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    if (!value.trim() || disabled) return;
    onAdd(value.trim());
    setValue("");
  }

  return (
    <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3">
      <div className="mx-auto flex max-w-4xl flex-col gap-2">
        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setValue(s); }}
              disabled={disabled}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Add a screen... e.g. mobile variant of the checkout"
            disabled={disabled}
            className="flex-1 rounded-xl border border-border bg-input px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="flex items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
