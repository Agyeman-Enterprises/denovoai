'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'

interface ChallengeState {
  factorId: string
  challengeId: string
}

export function MfaChallengeForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [challenge, setChallenge] = useState<ChallengeState | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function createChallenge() {
      const supabase = createClient()

      // List enrolled TOTP factors
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
      if (listError || !factors?.totp?.length) {
        setError('No authenticator enrolled. Please set one up first.')
        return
      }

      const factor = factors.totp[0]
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      })
      if (challengeError || !challengeData) {
        setError(challengeError?.message ?? 'Failed to create challenge')
        return
      }

      setChallenge({ factorId: factor.id, challengeId: challengeData.id })
    }
    createChallenge()
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge || code.length !== 6) return
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: challenge.factorId,
        challengeId: challenge.challengeId,
        code,
      })
      if (verifyError) throw verifyError

      // Session is now AAL2 — push to app root
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      // Re-create challenge on failure (challenges are single-use)
      setChallenge(null)
      const supabase = createClient()
      const { data: factors } = await supabase.auth.mfa.listFactors()
      if (factors?.totp?.[0]) {
        const { data: newChallenge } = await supabase.auth.mfa.challenge({
          factorId: factors.totp[0].id,
        })
        if (newChallenge) {
          setChallenge({ factorId: factors.totp[0].id, challengeId: newChallenge.id })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!challenge && !error) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading authenticator…
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Two-factor authentication</CardTitle>
          <CardDescription>Enter the code from your authenticator app to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify}>
            <div className="flex flex-col items-center gap-6">
              <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || code.length !== 6 || !challenge} data-testid="submit-btn"
              >
                {isLoading ? 'Verifying…' : 'Verify'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
