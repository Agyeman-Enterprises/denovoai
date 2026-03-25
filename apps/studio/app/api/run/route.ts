import { NextResponse } from 'next/server'

// Deprecated — use POST /api/runs instead.
// Redirects callers to the new endpoint for backwards compatibility.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const prompt = String(body?.prompt ?? '').trim() || 'Build a community app'

  const res = await fetch(new URL('/api/runs', request.url).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ prompt }),
  })

  const data = await res.json()
  return NextResponse.json({ ok: res.ok, ...data }, { status: res.status })
}
