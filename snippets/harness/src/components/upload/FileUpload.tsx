"use client";

import { useState, useCallback } from "react";

interface FileUploadProps {
  bucket?: string;
  entityType?: string;
  entityId?: string;
  accept?: string;
  onUpload: (url: string) => void;
}

export function FileUpload({ bucket = "listings", entityType, entityId, accept = "image/*", onUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    if (entityType) formData.append("entity_type", entityType);
    if (entityId) formData.append("entity_id", entityId);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) setError(data.error);
    else onUpload(data.url);

    setUploading(false);
  }, [bucket, entityType, entityId, onUpload]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-violet-500 bg-violet-500/10" : "border-white/10"} ${uploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input type="file" accept={accept} className="hidden" id="file-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      <label htmlFor="file-input" className="cursor-pointer text-sm text-white/40">
        {uploading ? "Uploading..." : "Drop file here or click to upload"}
      </label>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
