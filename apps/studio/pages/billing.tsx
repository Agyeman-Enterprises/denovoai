import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase/client'

interface SubData {
  plan: 'free' | 'pro'
  runCount: number
  runLimit: number
}

export default function BillingPage() {
  const router = useRouter()
  const success = router.query.success as string | undefined
  const canceled = router.query.canceled as string | undefined

  const [sub, setSub] = useState<SubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login?next=/billing')
    })
    fetch('/api/subscription')
      .then((r) => r.json())
      .then(setSub)
      .catch(() => setError('Failed to load subscription data'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUpgrade() {
    setUpgrading(true)
    setError(null)
    try {
      const r = await fetch('/api/checkout', { method: 'POST' })
      const data = await r.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Failed to start checkout')
      }
    } catch {
      setError('Failed to connect to billing')
    } finally {
      setUpgrading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const limitDisplay = sub?.runLimit === Infinity ? '∞' : String(sub?.runLimit ?? 3)

  return (
    <div data-testid="app-root" style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 2rem',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Denovo AI</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>← Studio</a>
          <button
            data-testid="logout"
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid #d1d5db', borderRadius: 6,
              padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: '#374151',
            }}
          >Sign out</button>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '3rem auto', padding: '0 1rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Billing &amp; Plan</h1>

        {success && (
          <div data-testid="success-toast" style={{
            background: '#f0fff4', border: '1px solid #86efac', borderRadius: 8,
            padding: '12px 16px', marginBottom: 24, color: '#16a34a',
          }}>
            ✅ You&apos;re now on Pro. Unlimited runs activated.
          </div>
        )}
        {canceled && (
          <div style={{
            background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8,
            padding: '12px 16px', marginBottom: 24, color: '#c2410c',
          }}>
            Checkout canceled. Still on Free plan.
          </div>
        )}

        {loading ? (
          <p style={{ color: '#999' }}>Loading…</p>
        ) : (
          <>
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
              padding: '1.5rem', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Current plan</div>
              <div data-testid="current-plan" style={{ fontSize: 22, fontWeight: 700, textTransform: 'capitalize' }}>
                {sub?.plan ?? 'free'}
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Runs this month</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {sub?.runCount ?? 0} / {limitDisplay}
                </div>
              </div>
            </div>

            {sub?.plan === 'free' && (
              <div style={{
                background: '#fff', border: '2px solid #0070f3', borderRadius: 12,
                padding: '1.5rem',
              }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Upgrade to Pro</h2>
                <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
                  Unlimited runs · Priority queuing · All models
                </p>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
                  $29<span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}>/month</span>
                </div>
                {error && (
                  <div data-testid="form-error" style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>
                    {error}
                  </div>
                )}
                <button
                  data-testid="checkout"
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  style={{
                    width: '100%', padding: '11px 0', background: '#0070f3', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
                    cursor: upgrading ? 'not-allowed' : 'pointer', opacity: upgrading ? 0.7 : 1,
                  }}
                >
                  {upgrading ? 'Redirecting…' : 'Upgrade to Pro →'}
                </button>
              </div>
            )}

            {sub?.plan === 'pro' && (
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                padding: '1.5rem', color: '#6b7280', fontSize: 14,
              }}>
                You&apos;re on Pro. Contact support to manage your subscription.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
