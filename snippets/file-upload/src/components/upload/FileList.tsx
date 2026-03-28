"use client";

interface FileItem {
  id: string;
  filename: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  bucket: string;
  path: string;
  created_at: string;
}

interface FileListProps {
  files: FileItem[];
  onDelete?: (path: string, bucket: string) => void;
}

export function FileList({ files, onDelete }: FileListProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (files.length === 0) return <p className="text-sm text-white/25">No files uploaded.</p>;

  return (
    <div className="space-y-2">
      {files.map((f) => (
        <div key={f.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 min-w-0">
            {f.mime_type?.startsWith("image/") && (
              <img src={f.public_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-white/70 truncate">{f.filename}</p>
              <p className="text-xs text-white/25">{formatSize(f.size_bytes)} &middot; {new Date(f.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {onDelete && (
            <button onClick={() => onDelete(f.path, f.bucket)} className="text-xs text-red-400 hover:text-red-300 shrink-0 ml-2">Delete</button>
          )}
        </div>
      ))}
    </div>
  );
}
