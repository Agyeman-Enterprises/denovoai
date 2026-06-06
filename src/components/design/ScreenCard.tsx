"use client";

interface Props {
  name: string;
  purpose: string;
  screenType: string;
  htmlPreview?: string;
  isSelected: boolean;
  isGenerating: boolean;
  onClick: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  main:         "bg-blue-500/20 text-blue-300 border-blue-500/30",
  alternative:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  error:        "bg-red-500/20 text-red-300 border-red-500/30",
  empty:        "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  confirmation: "bg-green-500/20 text-green-300 border-green-500/30",
  mobile:       "bg-orange-500/20 text-orange-300 border-orange-500/30",
  onboarding:   "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

export function ScreenCard({ name, purpose, screenType, htmlPreview, isSelected, isGenerating, onClick }: Props) {
  const badgeClass = TYPE_COLORS[screenType] ?? TYPE_COLORS.main;

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 hover:border-primary/60 hover:shadow-lg ${
        isSelected ? "border-primary shadow-lg shadow-primary/20 ring-1 ring-primary/40" : "border-border bg-card"
      }`}
    >
      {/* Preview area */}
      <div className="relative h-40 w-full overflow-hidden bg-zinc-900">
        {isGenerating ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : htmlPreview ? (
          <iframe
            srcDoc={htmlPreview}
            className="pointer-events-none h-full w-full"
            style={{ transform: "scale(0.35)", transformOrigin: "top left", width: "285%", height: "285%" }}
            sandbox="allow-same-origin"
            title={name}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-muted-foreground">No preview</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold leading-tight text-foreground">{name}</span>
          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${badgeClass}`}>
            {screenType}
          </span>
        </div>
        <p className="line-clamp-2 text-[11px] text-muted-foreground">{purpose}</p>
      </div>
    </button>
  );
}
