"use client";

import { useState, useCallback } from "react";

interface ImageUploadProps {
  bucket?: string;
  entityType?: string;
  entityId?: string;
  onUpload: (url: string) => void;
  currentUrl?: string;
}

export function ImageUpload({ bucket = "avatars", entityType, entityId, onUpload, currentUrl }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Images only"); return; }
    setUploading(true);
    setError(null);
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    if (entityType) formData.append("entity_type", entityType);
    if (entityId) formData.append("entity_id", entityId);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) { setError(data.error); setPreview(currentUrl || null); }
    else { setPreview(data.url); onUpload(data.url); }

    setUploading(false);
  }, [bucket, entityType, entityId, onUpload, currentUrl]);

  return (
    <div className="relative">
      <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-white/25">No image</span>
        )}
      </div>
      <input type="file" accept="image/*" className="hidden" id="image-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      <label htmlFor="image-input" className="mt-2 block text-xs text-violet-400 cursor-pointer hover:text-violet-300">
        {uploading ? "Uploading..." : "Change"}
      </label>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
