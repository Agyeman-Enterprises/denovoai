# DeNovo — File Upload Snippet Brief
## Supabase Storage. Images, documents, media. Resize, CDN, delete.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## Database Schema (add to existing)

```sql
create table if not exists file_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  bucket text not null,
  path text not null,
  filename text not null,
  mime_type text,
  size_bytes int,
  public_url text,
  entity_type text,   -- 'listing', 'profile', 'document', etc.
  entity_id uuid,     -- ID of the thing this file belongs to
  created_at timestamptz default now()
);

alter table file_uploads enable row level security;
create policy "own uploads" on file_uploads
  for all using (auth.uid() = user_id);
```

### Supabase Storage Buckets (create in Supabase dashboard)
```
avatars     — public, max 2MB, images only
listings    — public, max 10MB, images only
documents   — private, max 50MB, any type
```

---

## New Files to Add

```
src/
├── app/
│   ├── dashboard/
│   │   └── uploads/
│   │       └── page.tsx          # File management UI
│   └── api/
│       └── upload/
│           ├── route.ts          # Handle upload + DB record
│           └── delete/route.ts   # Delete file + DB record
└── components/
    └── upload/
        ├── FileUpload.tsx        # Drag-drop upload component
        ├── ImageUpload.tsx       # Image-specific with preview
        └── FileList.tsx          # List uploaded files
```

---

## Implementation Details

### `src/app/api/upload/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const bucket = formData.get('bucket') as string ?? 'listings'
  const entityType = formData.get('entity_type') as string
  const entityId = formData.get('entity_id') as string

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  await supabase.from('file_uploads').insert({
    user_id: user.id,
    bucket,
    path,
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    public_url: publicUrl,
    entity_type: entityType,
    entity_id: entityId,
  })

  return NextResponse.json({ url: publicUrl, path })
}
```

### `src/app/api/upload/delete/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path, bucket } = await request.json()

  // Verify ownership
  const { data: upload } = await supabase
    .from('file_uploads')
    .select('id')
    .eq('path', path)
    .eq('user_id', user.id)
    .single()

  if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.storage.from(bucket).remove([path])
  await supabase.from('file_uploads').delete().eq('path', path)

  return NextResponse.json({ success: true })
}
```

### `src/components/upload/FileUpload.tsx`
```typescript
'use client'
import { useState, useCallback } from 'react'

interface FileUploadProps {
  bucket?: string
  entityType?: string
  entityId?: string
  accept?: string
  maxSizeMB?: number
  onUpload: (url: string) => void
}

export function FileUpload({
  bucket = 'listings',
  entityType,
  entityId,
  accept = 'image/*',
  maxSizeMB = 10,
  onUpload,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const upload = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)
    if (entityType) formData.append('entity_type', entityType)
    if (entityId) formData.append('entity_id', entityId)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
    } else {
      onUpload(data.url)
    }

    setUploading(false)
  }, [bucket, entityType, entityId, onUpload])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) upload(file)
      }}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-white/20'}
        ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        id="file-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
        }}
      />
      <label htmlFor="file-input" className="cursor-pointer">
        {uploading ? 'Uploading...' : 'Drop file here or click to upload'}
      </label>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
```

---

## Verification Checklist
- [ ] Image upload to `listings` bucket works
- [ ] File record created in `file_uploads` table
- [ ] Public URL returns accessible image
- [ ] Delete removes from storage AND database
- [ ] Ownership check prevents deleting other users' files
- [ ] Drag and drop works in browser
- [ ] File size limit enforced
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ Supabase buckets created
2. ✅/❌ file_uploads table created with RLS
3. ✅/❌ Upload + delete API routes work
4. ✅/❌ FileUpload component renders and functions
5. ✅/❌ `npm run build` passes clean
