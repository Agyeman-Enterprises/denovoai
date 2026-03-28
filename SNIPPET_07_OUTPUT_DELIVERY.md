# DeNovo — Output & Delivery Snippet Brief
## PDF export, CSV download, copy to clipboard, print view, share links.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## What This Adds

Every output mechanism an app needs:
- PDF generation (invoices, reports, receipts)
- CSV export (data tables, order history)
- Copy to clipboard (links, codes, keys)
- Print view (clean print stylesheet)
- Share links (public URLs)
- File download (generated files)

No external PDF services. Use `@react-pdf/renderer` for PDF generation.

---

## Dependencies to Install
```bash
npm install @react-pdf/renderer papaparse
npm install --save-dev @types/papaparse
```

---

## New Files to Add

```
src/
├── app/
│   ├── dashboard/
│   │   └── exports/
│   │       └── page.tsx              # Export demo page
│   └── api/
│       ├── export/
│       │   ├── csv/route.ts          # CSV export endpoint
│       │   └── pdf/route.ts          # PDF generation endpoint
│       └── share/
│           └── route.ts              # Generate share link
└── components/
    └── output/
        ├── CopyButton.tsx            # Copy to clipboard
        ├── DownloadButton.tsx        # Trigger file download
        ├── PrintButton.tsx           # Trigger print
        ├── ShareButton.tsx           # Generate + copy share link
        ├── ExportCSVButton.tsx       # Export data as CSV
        └── pdf/
            ├── InvoicePDF.tsx        # Invoice PDF template
            └── ReportPDF.tsx         # Generic report PDF template
```

---

## Implementation Details

### `src/app/api/export/csv/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'listings'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let data: any[] = []

  switch (type) {
    case 'listings':
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, category, price_cents, status, created_at')
        .eq('user_id', user.id)
      data = listings ?? []
      break
    case 'purchases':
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, product_id, amount_cents, status, created_at')
        .eq('user_id', user.id)
      data = purchases ?? []
      break
  }

  const csv = Papa.unparse(data)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-${Date.now()}.csv"`,
    },
  })
}
```

### `src/app/api/export/pdf/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/output/pdf/InvoicePDF'
import React from 'react'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('order_id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch order data
  const { data: order } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF, { order, user })
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
    },
  })
}
```

### `src/components/output/pdf/InvoicePDF.tsx`
```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 12, color: '#666' },
  value: { fontSize: 12 },
  total: { fontSize: 16, fontWeight: 'bold', marginTop: 20 },
  divider: { borderBottom: '1px solid #eee', marginVertical: 12 },
})

export function InvoicePDF({ order, user }: { order: any; user: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoice</Text>
          <Text style={styles.label}>{{APP_NAME}}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Invoice #</Text>
          <Text style={styles.value}>{order.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {new Date(order.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>{order.product_id}</Text>
          <Text style={styles.value}>
            ${(order.amount_cents / 100).toFixed(2)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total}>
            ${(order.amount_cents / 100).toFixed(2)}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
```

### `src/components/output/CopyButton.tsx`
```typescript
'use client'
import { useState } from 'react'

export function CopyButton({
  text,
  label = 'Copy',
}: {
  text: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20
                 rounded-md transition-colors"
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}
```

### `src/components/output/ExportCSVButton.tsx`
```typescript
'use client'

export function ExportCSVButton({
  type,
  label = 'Export CSV',
}: {
  type: string
  label?: string
}) {
  const handleExport = () => {
    window.location.href = `/api/export/csv?type=${type}`
  }

  return (
    <button
      onClick={handleExport}
      className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20
                 rounded-md transition-colors"
    >
      {label}
    </button>
  )
}
```

### Print stylesheet (add to globals.css)
```css
@media print {
  nav, aside, button, .no-print { display: none !important; }
  body { background: white; color: black; }
  .print-only { display: block !important; }
  a[href]::after { content: " (" attr(href) ")"; }
}
```

---

## Verification Checklist
- [ ] CSV export downloads correct data as .csv file
- [ ] PDF invoice generates and downloads as .pdf
- [ ] Copy button copies text and shows feedback
- [ ] Print view hides navigation and buttons
- [ ] File downloads work in Chrome, Firefox, Safari
- [ ] PDF renders correctly with order data
- [ ] Unauthenticated requests to export endpoints return 401
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ CSV export works for listings and purchases
2. ✅/❌ PDF invoice generates with correct data
3. ✅/❌ Copy button works with clipboard API
4. ✅/❌ Print stylesheet hides UI chrome
5. ✅/❌ `npm run build` passes clean
