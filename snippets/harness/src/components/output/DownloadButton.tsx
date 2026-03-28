"use client";

export function DownloadButton({ url, filename, label = "Download" }: { url: string; filename: string; label?: string }) {
  const download = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <button onClick={download} className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
      {label}
    </button>
  );
}
