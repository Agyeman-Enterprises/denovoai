"use client";

import { useState } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScreenSpec } from "@/lib/generation/inventory";

const TYPE_OPTIONS = ["main", "alternative", "error", "empty", "confirmation", "mobile", "onboarding"] as const;

interface Props {
  screens: ScreenSpec[];
  onScreensChange: (screens: ScreenSpec[]) => void;
  onGenerate: () => void;
  generating: boolean;
  appName: string;
}

export function InventoryPanel({ screens, onScreensChange, onGenerate, generating, appName }: Props) {
  function updateScreen(index: number, updates: Partial<ScreenSpec>) {
    const next = screens.map((s, i) => i === index ? { ...s, ...updates } : s);
    onScreensChange(next);
  }

  function removeScreen(index: number) {
    onScreensChange(screens.filter((_, i) => i !== index));
  }

  function addScreen() {
    const count = screens.length + 1;
    onScreensChange([...screens, {
      name: `${String(count).padStart(2, "0")}-NewScreen`,
      purpose: "Describe this screen's purpose",
      screen_type: "main",
    }]);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">Screen Inventory</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {screens.length} screens planned for <span className="text-foreground">{appName}</span>. Edit before generating.
        </p>
      </div>

      {/* Screen list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          {screens.map((screen, i) => (
            <div key={i} className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-border/80">
              <div className="flex-1 space-y-1.5">
                <input
                  value={screen.name}
                  onChange={e => updateScreen(i, { name: e.target.value })}
                  className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none"
                />
                <input
                  value={screen.purpose}
                  onChange={e => updateScreen(i, { purpose: e.target.value })}
                  className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none"
                />
              </div>
              <select
                value={screen.screen_type}
                onChange={e => updateScreen(i, { screen_type: e.target.value as ScreenSpec["screen_type"] })}
                className="shrink-0 rounded border border-border bg-background px-1.5 py-1 text-xs text-muted-foreground focus:outline-none"
              >
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button
                onClick={() => removeScreen(i)}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addScreen}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-xs text-muted-foreground transition hover:border-border/80 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add screen
        </button>
      </div>

      {/* Generate button */}
      <div className="shrink-0 border-t border-border px-6 py-4">
        <Button
          onClick={onGenerate}
          disabled={generating || screens.length === 0}
          className="w-full gap-2"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating {screens.length} screens...
            </>
          ) : (
            `Generate all ${screens.length} screens`
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Takes 2–5 min. You can edit any screen after.
        </p>
      </div>
    </div>
  );
}
