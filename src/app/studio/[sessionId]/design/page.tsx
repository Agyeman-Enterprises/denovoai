"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCheck, LayoutGrid, List } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ScreenCard } from "@/components/design/ScreenCard";
import { ScreenPreview } from "@/components/design/ScreenPreview";
import { CodePanel } from "@/components/design/CodePanel";
import { InventoryPanel } from "@/components/design/InventoryPanel";
import { DesignPromptBar } from "@/components/design/DesignPromptBar";
import type { ScreenSpec } from "@/lib/generation/inventory";

interface Variant {
  id: string;
  html_preview?: string;
  storage_path: string;
  is_active: boolean;
}

interface Screen {
  id: string;
  name: string;
  purpose: string;
  screen_type: string;
  position: number;
  variants: Variant[];
}

type UIPhase = "loading" | "inventory" | "generating" | "canvas";

const TYPE_FILTERS = ["all", "main", "alternative", "error", "empty", "confirmation", "mobile", "onboarding"];

export default function DesignPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const supabase = createClient();

  const [phase, setPhase] = useState<UIPhase>("loading");
  const [appName, setAppName] = useState("Your App");
  const [screens, setScreens] = useState<Screen[]>([]);
  const [inventorySpecs, setInventorySpecs] = useState<ScreenSpec[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0, failed: 0 });
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [approving, setApproving] = useState(false);
  const [generatingScreens, setGeneratingScreens] = useState<Set<string>>(new Set());

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/auth/login");
    });
  }, [supabase.auth, router]);

  // Load session + existing screens
  const loadSession = useCallback(async () => {
    const { data: session } = await supabase
      .from("sessions")
      .select("slot_map")
      .eq("id", sessionId)
      .single();

    if (session?.slot_map) {
      const sm = session.slot_map as Record<string, unknown>;
      setAppName(String(sm["APP_NAME"] ?? "Your App"));
    }

    const res = await fetch(`/api/design/screens/${sessionId}`);
    const data = await res.json();
    const existing: Screen[] = data.screens ?? [];

    if (existing.length > 0) {
      setScreens(existing);
      setPhase("canvas");
    } else {
      // No screens yet — fetch inventory suggestions
      await fetchInventory();
    }
  }, [sessionId, supabase]);

  useEffect(() => { loadSession(); }, [loadSession]);

  async function fetchInventory() {
    setLoadingInventory(true);
    setPhase("inventory");
    try {
      const res = await fetch("/api/design/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      setInventorySpecs(data.screens ?? []);
    } catch {
      setInventorySpecs([]);
    }
    setLoadingInventory(false);
  }

  async function handleGenerate() {
    setPhase("generating");
    setGenerationProgress({ completed: 0, total: inventorySpecs.length, failed: 0 });

    // First insert skeleton screens so we can show progress
    setScreens(inventorySpecs.map((s, i) => ({
      id: `pending-${i}`,
      name: s.name,
      purpose: s.purpose,
      screen_type: s.screen_type,
      position: i,
      variants: [],
    })));
    setGeneratingScreens(new Set(inventorySpecs.map((_, i) => `pending-${i}`)));

    const res = await fetch("/api/design/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const progress = await res.json();
    setGenerationProgress({ completed: progress.completed, total: progress.total, failed: progress.failed });

    // Reload real screens from DB
    const screensRes = await fetch(`/api/design/screens/${sessionId}`);
    const screensData = await screensRes.json();
    setScreens(screensData.screens ?? []);
    setGeneratingScreens(new Set());
    setPhase("canvas");
  }

  async function handleEdit(variantId: string, instruction: string) {
    setRegeneratingId(variantId);
    const res = await fetch("/api/design/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, instruction }),
    });
    const data = await res.json();

    // Update the screen in state with new variant
    setScreens(prev => prev.map(screen => {
      const hasVariant = screen.variants.some(v => v.id === variantId);
      if (!hasVariant) return screen;
      return {
        ...screen,
        variants: screen.variants
          .map(v => ({ ...v, is_active: false }))
          .concat([{ id: data.variantId, html_preview: data.htmlPreview, storage_path: "", is_active: true }]),
      };
    }));

    // Update selected screen
    if (selectedScreen?.variants.some(v => v.id === variantId)) {
      setSelectedScreen(prev => prev ? {
        ...prev,
        variants: prev.variants
          .map(v => ({ ...v, is_active: false }))
          .concat([{ id: data.variantId, html_preview: data.htmlPreview, storage_path: "", is_active: true }]),
      } : null);
    }
    setRegeneratingId(null);
  }

  async function handleAddScreen(instruction: string) {
    // Add to inventory and regenerate just that screen
    const count = screens.length + 1;
    const newSpec: ScreenSpec = {
      name: `${String(count).padStart(2, "0")}-NewScreen`,
      purpose: instruction,
      screen_type: "main",
    };
    setInventorySpecs([newSpec]);
    // Trigger single screen generation via inventory + generate
    await handleGenerate();
  }

  async function handleApprove() {
    setApproving(true);
    await fetch("/api/design/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    router.push(`/studio/confirm/${sessionId}`);
  }

  const filteredScreens = typeFilter === "all" ? screens : screens.filter(s => s.screen_type === typeFilter);

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </>
    );
  }

  // ── INVENTORY ─────────────────────────────────────────────────────────────
  if (phase === "inventory") {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          {loadingInventory ? (
            <div className="flex flex-1 items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Planning your screens...</p>
            </div>
          ) : (
            <InventoryPanel
              screens={inventorySpecs}
              onScreensChange={setInventorySpecs}
              onGenerate={handleGenerate}
              generating={false}
              appName={appName}
            />
          )}
        </div>
      </>
    );
  }

  // ── GENERATING ────────────────────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Designing your screens</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {generationProgress.completed} of {generationProgress.total} screens complete
            </p>
          </div>
          <div className="w-full max-w-md">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${generationProgress.total > 0 ? (generationProgress.completed / generationProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          {/* Skeleton grid while generating */}
          <div className="mt-4 grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {screens.map((s, i) => (
              <ScreenCard
                key={i}
                name={s.name}
                purpose={s.purpose}
                screenType={s.screen_type}
                isSelected={false}
                isGenerating={true}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── CANVAS ────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-foreground">{appName}</h1>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {screens.length} screens
            </span>
            {/* Type filter */}
            <div className="hidden items-center gap-1 sm:flex">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`rounded-md px-2 py-0.5 text-xs transition ${
                    typeFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleApprove}
            disabled={approving || screens.length === 0}
            className="gap-2"
            size="sm"
          >
            {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            Approve Design
          </Button>
        </div>

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Screen grid */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              {filteredScreens.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No screens match the filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredScreens.map(screen => (
                    <ScreenCard
                      key={screen.id}
                      name={screen.name}
                      purpose={screen.purpose}
                      screenType={screen.screen_type}
                      htmlPreview={screen.variants.find(v => v.is_active)?.html_preview}
                      isSelected={selectedScreen?.id === screen.id}
                      isGenerating={generatingScreens.has(screen.id)}
                      onClick={() => {
                        setSelectedScreen(screen);
                        setShowCode(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <DesignPromptBar onAdd={handleAddScreen} disabled={phase !== "canvas"} />
          </div>

          {/* Right panel — preview or code */}
          {selectedScreen && (
            <div className="hidden w-[400px] shrink-0 overflow-hidden lg:flex lg:flex-col">
              {showCode ? (
                <CodePanel
                  screenName={selectedScreen.name}
                  storagePath={selectedScreen.variants.find(v => v.is_active)?.storage_path ?? ""}
                  onClose={() => setShowCode(false)}
                />
              ) : (
                <ScreenPreview
                  screen={selectedScreen}
                  onClose={() => setSelectedScreen(null)}
                  onEdit={handleEdit}
                  onViewCode={() => setShowCode(true)}
                  isRegenerating={
                    selectedScreen.variants.some(v => v.id === regeneratingId)
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
