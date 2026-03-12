import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const next = (router.query.next as string) ?? '/'
  const urlError = (router.query.error as string) ?? null

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(urlError)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message); return }
        router.push(next)
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) { setError(error.message); return }
        setMessage('Check your email to confirm your account.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f5', fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '2.5rem', width: '100%',
        maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: 22, fontWeight: 700 }}>
          Denovo AI
        </h1>
        <p style={{ margin: '0 0 1.5rem', color: '#666', fontSize: 14 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {error && (
          <div
            data-testid="form-error"
            style={{
              background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 6,
              padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            data-testid="success-toast"
            style={{
              background: '#f0fff4', border: '1px solid #86efac', borderRadius: 6,
              padding: '10px 14px', marginBottom: 16, color: '#16a34a', fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Email
            </label>
            <input
              data-testid="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 6,
                border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                data-testid="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'login' ? '••••••••' : 'min 8 characters'}
                minLength={mode === 'signup' ? 8 : undefined}
                style={{
                  width: '100%', padding: '9px 40px 9px 12px', borderRadius: 6,
                  border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                data-testid="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                  color: '#6b7280', padding: 2,
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            data-testid="submit-auth"
            disabled={loading}
            style={{
              padding: '10px 0', background: '#0070f3', color: '#fff', border: 'none',
              borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: 4,
            }}
          >
            {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') :
              (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button
                data-testid="toggle-mode"
                onClick={() => { setMode('signup'); setError(null) }}
                style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', fontWeight: 600 }}
              >Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button
                data-testid="toggle-mode"
                onClick={() => { setMode('login'); setError(null) }}
                style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', fontWeight: 600 }}
              >Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
