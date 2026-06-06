"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditBar } from "./EditBar";

interface Screen {
  id: string;
  name: string;
  purpose: string;
  screen_type: string;
  variants: Array<{ id: string; html_preview?: string; storage_path: string; is_active: boolean }>;
}

interface Props {
  screen: Screen;
  onClose: () => void;
  onEdit: (variantId: string, instruction: string) => void;
  onViewCode: () => void;
  isRegenerating: boolean;
}

export function ScreenPreview({ screen, onClose, onEdit, onViewCode, isRegenerating }: Props) {
  const activeVariant = screen.variants.find(v => v.is_active) ?? screen.variants[0];

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-border bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{screen.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{screen.purpose}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onViewCode} className="h-7 text-xs">
            Code
          </Button>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="relative flex-1 overflow-hidden bg-zinc-950">
        {isRegenerating ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Regenerating screen...</p>
            </div>
          </div>
        ) : activeVariant?.html_preview ? (
          <iframe
            srcDoc={activeVariant.html_preview}
            className="h-full w-full border-none"
            sandbox="allow-same-origin allow-scripts"
            title={screen.name}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No preview available</p>
          </div>
        )}
      </div>

      {/* Edit bar */}
      {activeVariant && (
        <EditBar
          variantId={activeVariant.id}
          onEdit={onEdit}
          disabled={isRegenerating}
        />
      )}
    </div>
  );
}
