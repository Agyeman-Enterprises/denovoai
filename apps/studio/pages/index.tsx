import React, { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type RunStatus = 'running' | 'built' | 'complete' | 'error'

type Run = {
  id: string
  prompt: string
  mode: string
  status: RunStatus
  phase: string
  phaseLabel: string
  appName?: string
  primaryColor?: string
  deployUrl?: string | null
  createdAt: string
}

const PHASE_STEPS = ['intent', 'spec', 'codegen', 'config', 'install', 'deploy', 'complete']
const PHASE_ICONS: Record<string, string> = {
  intent: '🔍', spec: '📐', codegen: '🎨', config: '⚙️', install: '📦', deploy: '🚀', complete: '✅', error: '❌',
}

function PhaseProgress({ phase, status }: { phase: string; status: RunStatus }) {
  const current = PHASE_STEPS.indexOf(phase)
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
      {PHASE_STEPS.slice(0, -1).map((p, i) => (
        <div key={p} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: status === 'error' && i === current ? '#ef4444'
            : i <= current ? '#6366f1'
            : '#e2e8f0',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

function RunCard({ run, onRefresh }: { run: Run; onRefresh: () => void }) {
  const isLive = run.status === 'complete' && run.deployUrl
  const isRunning = run.status === 'running'

  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(() => onRefresh(), 3000)
    return () => clearInterval(timer)
  }, [isRunning, run.id, onRefresh])

  return (
    <div style={{
      background: '#fff',
      border: isLive ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
      borderRadius: 12, padding: '20px', transition: 'border-color 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {run.appName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {run.primaryColor && (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: run.primaryColor }} />
              )}
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{run.appName}</span>
            </div>
          )}
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            {run.prompt.length > 100 ? run.prompt.slice(0, 100) + '...' : run.prompt}
          </p>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20, marginLeft: 12, flexShrink: 0,
          background: run.status === 'complete' ? '#dcfce7' : run.status === 'error' ? '#fee2e2' : '#fef9c3',
          color: run.status === 'complete' ? '#16a34a' : run.status === 'error' ? '#dc2626' : '#92400e',
        }}>
          {run.status === 'complete' ? 'Live' : run.status === 'error' ? 'Error' : 'Building...'}
        </span>
      </div>

      {isRunning && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{PHASE_ICONS[run.phase] || '⏳'}</span>
            <span style={{ fontSize: 13, color: '#475569' }}>{run.phaseLabel || 'Processing...'}</span>
          </div>
          <PhaseProgress phase={run.phase} status={run.status} />
        </div>
      )}

      {isLive && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href={run.deployUrl!} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', background: '#6366f1', color: '#fff',
            borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            Open Live App
          </a>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{run.deployUrl}</span>
        </div>
      )}

      {run.status === 'built' && (
        <p style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
          App built locally — add VERCEL_TOKEN to auto-deploy
        </p>
      )}
    </div>
  )
}

export default function Home() {
  const [runs, setRuns] = useState<Run[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [limitError, setLimitError] = useState(false)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const fetchRuns = async () => {
    const res = await fetch('/api/runs')
    const data = await res.json()
    setRuns(data.runs || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchRuns()
    const interval = setInterval(fetchRuns, 4000)
    return () => clearInterval(interval)
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || creating) return
    setCreating(true)
    setLimitError(false)
    const res = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    if (res.status === 402) { setLimitError(true); setCreating(false); return }
    setPrompt('')
    setCreating(false)
    await fetchRuns()
  }

  const filtered = runs.filter(r =>
    !search ||
    r.prompt.toLowerCase().includes(search.toLowerCase()) ||
    (r.appName || '').toLowerCase().includes(search.toLowerCase())
  )
  const activeRuns = runs.filter(r => r.status === 'running').length

  return (
    <>
      <Head>
        <title>DeNovo — AI App Factory</title>
      </Head>
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>D</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>DeNovo</span>
            <span style={{ fontSize: 12, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>AI App Factory</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {activeRuns > 0 && (
              <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 500 }}>
                ⚡ {activeRuns} building...
              </span>
            )}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user.email?.[0].toUpperCase()}</span>
                </div>
                <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                  style={{ fontSize: 13, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Sign out
                </button>
              </div>
            ) : (
              <a href="/login" style={{ fontSize: 14, color: '#6366f1', fontWeight: 500, textDecoration: 'none' }}>Sign in</a>
            )}
          </div>
        </header>

        <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.2 }}>
              Describe your app.{' '}
              <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                We build it.
              </span>
            </h1>
            <p style={{ color: '#64748b', fontSize: 16, margin: 0 }}>
              Landing page + app + Stripe billing — deployed to Vercel in minutes.
            </p>
          </div>

          <form onSubmit={handleCreate} style={{ marginBottom: 40 }}>
            <div style={{
              background: '#fff', border: '2px solid #e2e8f0', borderRadius: 16,
              padding: 4, boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
            }}>
              <textarea
                ref={promptRef}
                data-testid="run-prompt-input"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreate(e as any) } }}
                placeholder="e.g. Build a dog walking marketplace where owners book walkers, pay via Stripe, and leave reviews..."
                rows={3}
                aria-label="Describe your app"
                style={{
                  width: '100%', border: 'none', outline: 'none', resize: 'none',
                  padding: '14px 16px', fontSize: 15, color: '#0f172a',
                  background: 'transparent', fontFamily: 'inherit', lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px 8px' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Enter to build</span>
                <button type="submit" disabled={!prompt.trim() || creating}
                  data-testid="create-primary"
                  style={{
                    padding: '10px 20px',
                    background: prompt.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
                    color: prompt.trim() ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    cursor: prompt.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                  }}>
                  {creating ? 'Building...' : 'Build App'}
                </button>
              </div>
            </div>
            {limitError && (
              <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                Free plan limit reached. <a href="/billing" style={{ color: '#6366f1' }}>Upgrade to Pro</a>
              </p>
            )}
          </form>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 data-testid="recent-runs-heading" style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Recent Runs {runs.length > 0 && <span style={{ color: '#94a3b8', fontWeight: 400 }}>({runs.length})</span>}
              </h2>
              <input
                data-testid="search-primary"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                aria-label="Search runs"
                style={{ padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: 180 }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div data-testid="primary-list" style={{
                textAlign: 'center', padding: '60px 20px', background: '#fff',
                borderRadius: 16, border: '2px dashed #e2e8f0',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
                <h3 style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', margin: '0 0 8px' }}>No apps yet</h3>
                <p style={{ color: '#64748b', margin: 0 }}>Describe your idea above and we will build it.</p>
              </div>
            ) : (
              <div data-testid="primary-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(run => (
                  <RunCard key={run.id} run={run} onRefresh={fetchRuns} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
