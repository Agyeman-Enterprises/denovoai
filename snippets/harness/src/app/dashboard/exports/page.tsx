"use client";
export const dynamic = "force-dynamic";

import { CopyButton } from "@/components/output/CopyButton";
import { DownloadButton } from "@/components/output/DownloadButton";
import { PrintButton } from "@/components/output/PrintButton";
import { ShareButton } from "@/components/output/ShareButton";

export default function ExportsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#06060f] px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white">Exports & Delivery</h1>
        <p className="mt-2 text-sm text-white/40">Export data, share links, and download files.</p>

        <div className="mt-8 space-y-4">
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-semibold text-white/80">CSV Export</h3>
            <p className="mt-1 text-xs text-white/30">Export listings data as CSV</p>
            <div className="mt-3">
              <DownloadButton url="/api/export/csv?table=listings" filename="listings_export.csv" label="Download CSV" />
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-semibold text-white/80">Share & Copy</h3>
            <p className="mt-1 text-xs text-white/30">Generate share links and copy content</p>
            <div className="mt-3 flex gap-2">
              <CopyButton text="https://example.com/shared/demo" label="Copy Link" />
              <ShareButton entityType="listing" entityId="demo" />
              <PrintButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
