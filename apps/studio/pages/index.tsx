import React, { useEffect, useState } from 'react'
import Head from 'next/head'

type Run = {
  id: string
  prompt: string
  mode: string
  createdAt: string
}

export default function Home() {
  const [runs, setRuns] = useState<Run[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    fetch('/api/runs')
      .then(r => r.json())
      .then(d => setRuns(d.runs || []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = runs.filter(r =>
    r.prompt.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    setCreating(true)
    try {
      await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const r = await fetch('/api/runs')
      const d = await r.json()
      setRuns(d.runs || [])
      setPrompt('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Head>
        <title>Denovo AI Platform</title>
        <meta name="description" content="Denovo AI Platform" />
      </Head>
      <div data-testid="app-root">
        <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 960, margin: '0 auto' }}>
          <header style={{ marginBottom: '2rem' }}>
            <code>Denovo AI Platform</code>
          </header>

          <h1 data-testid="hero-heading">Denovo AI</h1>

          <div
            data-testid="feature-cards"
            style={{ display: 'grid', gap: '1rem', marginTop: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {[
              ['AI Development', 'Build intelligent applications with our AI development tools.'],
              ['Smart Templates', 'Accelerate development with AI-powered smart templates.'],
              ['Orchestration', 'Orchestrate complex AI workflows with ease.'],
              ['Module Engine', 'Compose modular AI components into powerful applications.'],
            ].map(([title, desc]) => (
              <div
                key={title}
                data-testid="feature-card"
                style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}
              >
                <h2>{title}</h2>
                <p>{desc}</p>
              </div>
            ))}
          </div>

          {/* New Run form */}
          <section style={{ marginTop: '3rem', border: '1px solid #e0e0e0', borderRadius: 8, padding: '1.5rem' }}>
            <h2>Start a New Run</h2>
            <form
              data-testid="create-run-form"
              onSubmit={handleCreate}
              style={{ display: 'flex', gap: 8, marginTop: 12 }}
            >
              <input
                type="text"
                data-testid="run-prompt-input"
                placeholder="Describe the app you want to build..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: 14,
                }}
                aria-label="Run prompt"
              />
              <button
                type="submit"
                data-testid="create-primary"
                disabled={creating || !prompt.trim()}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  background: '#0070f3',
                  color: '#fff',
                  border: 'none',
                  cursor: creating || !prompt.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  opacity: creating || !prompt.trim() ? 0.6 : 1,
                }}
              >
                {creating ? 'Building...' : 'New Run'}
              </button>
            </form>
          </section>

          {/* Runs list */}
          <section style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2>Recent Runs</h2>
              <input
                type="text"
                data-testid="search-primary"
                placeholder="Search runs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
                aria-label="Search runs"
              />
            </div>

            {loading ? (
              <p style={{ color: '#999' }}>Loading runs...</p>
            ) : (
              <div data-testid="primary-list">
                {filtered.length === 0 ? (
                  <p
                    data-testid="empty-state"
                    style={{
                      color: '#999',
                      padding: '2rem',
                      textAlign: 'center',
                      border: '1px dashed #ccc',
                      borderRadius: 8,
                    }}
                  >
                    {runs.length === 0
                      ? 'No runs yet. Start a new run above.'
                      : 'No runs match your search.'}
                  </p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map(run => (
                      <li
                        key={run.id}
                        data-testid="run-item"
                        style={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 8,
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong>{run.prompt}</strong>
                          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                            {run.id} • {run.mode || 'auto'}
                          </div>
                        </div>
                        <a href={`/runs/${run.id}`} style={{ color: '#0070f3', fontSize: 13 }}>
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
