import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type Run = {
  id: string
  prompt: string
  mode: string
  status: string
  createdAt: string
}

type SubInfo = {
  plan: 'free' | 'pro'
  runCount: number
  runLimit: number
}

export default function Home() {
  const [runs, setRuns] = useState<Run[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [sub, setSub] = useState<SubInfo | null>(null)
  const [limitError, setLimitError] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Load runs
    fetch('/api/runs')
      .then(r => r.json())
      .then(d => setRuns(d.runs || []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false))

    // Load subscription info if supabase configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      fetch('/api/subscription')
        .then(r => r.json())
        .then(setSub)
        .catch(() => null)
    }

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setSub(null)
    setRuns([])
  }

  const filtered = runs.filter(r =>
    r.prompt.toLowerCase().includes(search.toLowerCase())
  )

  const atLimit = sub && sub.plan === 'free' && sub.runCount >= sub.runLimit

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || creating) return
    setCreating(true)
    setLimitError(false)

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (res.status === 402) {
        setLimitError(true)
        return
      }

      if (res.status === 401) {
        window.location.href = '/login'
        return
      }

      const r = await fetch('/api/runs')
      const d = await r.json()
      setRuns(d.runs || [])
      setPrompt('')

      // Refresh sub info
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        fetch('/api/subscription').then(r => r.json()).then(setSub).catch(() => null)
      }
    } finally {
      setCreating(false)
    }
  }

  const limitDisplay = sub?.runLimit === Infinity ? '∞' : String(sub?.runLimit ?? 3)

  return (
    <>
      <Head>
        <title>Denovo AI Platform</title>
        <meta name="description" content="Denovo AI Platform" />
      </Head>
      <div data-testid="app-root">
        {/* Header */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 2rem',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Denovo AI</span>
          <div data-testid="nav-user-menu" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {user ? (
              <>
                {sub && (
                  <span style={{
                    fontSize: 12, color: sub.plan === 'pro' ? '#1d4ed8' : '#6b7280',
                    background: sub.plan === 'pro' ? '#eff6ff' : '#f3f4f6',
                    borderRadius: 20, padding: '3px 10px', fontWeight: 600,
                  }}>
                    {sub.plan === 'pro' ? 'PRO' : `${sub.runCount}/${limitDisplay} runs`}
                  </span>
                )}
                <span style={{ fontSize: 13, color: '#374151' }}>{user.email}</span>
                <a href="/billing" style={{ fontSize: 13, color: '#0070f3', textDecoration: 'none' }}>
                  Billing
                </a>
                <button
                  data-testid="logout"
                  onClick={handleLogout}
                  style={{
                    background: 'none', border: '1px solid #d1d5db', borderRadius: 6,
                    padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: '#374151',
                  }}
                >Sign out</button>
              </>
            ) : (
              <a
                href="/login"
                data-testid="login-link"
                style={{
                  background: '#0070f3', color: '#fff', borderRadius: 6,
                  padding: '6px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                }}
              >Sign in</a>
            )}
          </div>
        </header>

        <main style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
          <h1 data-testid="hero-heading" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Denovo AI
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem', marginTop: 0 }}>
            AI-powered product studio. Describe what you want to build.
          </p>

          {/* Feature cards */}
          <div
            data-testid="feature-cards"
            style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {[
              ['AI Development', 'Build intelligent applications with AI.'],
              ['Smart Templates', 'Accelerate with AI-powered templates.'],
              ['Orchestration', 'Orchestrate complex AI workflows.'],
              ['Module Engine', 'Compose modular AI components.'],
            ].map(([title, desc]) => (
              <div key={title} data-testid="feature-card"
                style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: 8, background: '#fff' }}>
                <h2 style={{ fontSize: 15, margin: '0 0 6px', fontWeight: 600 }}>{title}</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Run limit warning */}
          {limitError && (
            <div data-testid="limit-warning" style={{
              background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8,
              padding: '12px 16px', marginBottom: 20, color: '#c2410c', fontSize: 14,
            }}>
              You&apos;ve used all {limitDisplay} free runs this month.{' '}
              <a href="/billing" style={{ color: '#0070f3', fontWeight: 600 }}>Upgrade to Pro</a> for unlimited runs.
            </div>
          )}

          {/* Create run form */}
          <section style={{ marginBottom: '2rem', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem', background: '#fff' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>Start a New Run</h2>
            {!user && process.env.NEXT_PUBLIC_SUPABASE_URL ? (
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
                <a href="/login" style={{ color: '#0070f3', fontWeight: 600 }}>Sign in</a> to create runs and track your history.
              </p>
            ) : (
              <form
                data-testid="create-run-form"
                onSubmit={handleCreate}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  type="text"
                  data-testid="run-prompt-input"
                  placeholder="Describe the app you want to build..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  required
                  disabled={!!atLimit}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6,
                    border: '1px solid #d1d5db', fontSize: 14,
                  }}
                  aria-label="Run prompt"
                />
                <button
                  type="submit"
                  data-testid="create-primary"
                  disabled={creating || !prompt.trim() || !!atLimit}
                  style={{
                    padding: '8px 20px', borderRadius: 6, background: '#0070f3',
                    color: '#fff', border: 'none', cursor: (creating || !prompt.trim() || !!atLimit) ? 'not-allowed' : 'pointer',
                    fontWeight: 600, opacity: (creating || !prompt.trim() || !!atLimit) ? 0.6 : 1,
                  }}
                >
                  {creating ? 'Building…' : 'New Run'}
                </button>
              </form>
            )}
          </section>

          {/* Runs list */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Runs</h2>
              <input
                type="text"
                data-testid="search-primary"
                placeholder="Search runs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
                aria-label="Search runs"
              />
            </div>

            {loading ? (
              <p style={{ color: '#999' }}>Loading runs…</p>
            ) : (
              <div data-testid="primary-list">
                {filtered.length === 0 ? (
                  <p data-testid="empty-state" style={{
                    color: '#999', padding: '2rem', textAlign: 'center',
                    border: '1px dashed #d1d5db', borderRadius: 8,
                  }}>
                    {runs.length === 0 ? 'No runs yet. Start one above.' : 'No runs match your search.'}
                  </p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map(run => (
                      <li key={run.id} data-testid="run-item" style={{
                        border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#fff',
                      }}>
                        <div>
                          <strong style={{ fontSize: 14 }}>{run.prompt}</strong>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                            {run.id} · {run.mode || 'auto'} · {run.status}
                          </div>
                        </div>
                        <a href={`/runs/${run.id}`} style={{ color: '#0070f3', fontSize: 13, whiteSpace: 'nowrap' }}>
                          View →
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  )
}
