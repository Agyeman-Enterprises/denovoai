"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";

const QUICK_EDITS = [
  { label: "Simplify", instruction: "Simplify the layout and remove unnecessary elements, keep it clean and focused" },
  { label: "Add content", instruction: "Add more realistic content, data, and detail to make it look production-ready" },
  { label: "Change layout", instruction: "Use a different layout arrangement while keeping the same content" },
  { label: "Change colors", instruction: "Apply a different but equally strong color palette suited to this type of app" },
  { label: "Make better", instruction: "Improve the overall design quality, polish, and visual hierarchy" },
  { label: "Fix alignment", instruction: "Fix alignment, spacing consistency, and visual rhythm throughout" },
  { label: "Regenerate", instruction: "" },
];

interface Props {
  variantId: string;
  onEdit: (variantId: string, instruction: string) => void;
  disabled: boolean;
}

export function EditBar({ variantId, onEdit, disabled }: Props) {
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  function handleQuick(instruction: string) {
    onEdit(variantId, instruction);
  }

  function handleCustom() {
    if (!customInput.trim()) return;
    onEdit(variantId, customInput.trim());
    setCustomInput("");
    setShowCustom(false);
  }

  return (
    <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-sm">
      {showCustom ? (
        <div className="flex gap-2 p-3">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCustom()}
            placeholder="Describe what to change..."
            autoFocus
            className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleCustom}
            disabled={!customInput.trim() || disabled}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Apply
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 p-3">
          {QUICK_EDITS.map(({ label, instruction }) => (
            <button
              key={label}
              onClick={() => handleQuick(instruction)}
              disabled={disabled}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-accent disabled:opacity-40"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(true)}
            disabled={disabled}
            className="flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-40"
          >
            <Wand2 className="h-3 w-3" />
            Custom
          </button>
        </div>
      )}
    </div>
  );
}
