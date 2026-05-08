'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'

type Step = 'loading' | 'scan' | 'verify' | 'done' | 'error'

interface EnrollData {
  factorId: string
  qrCode: string
  secret: string
}

export function MfaEnrollForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [step, setStep] = useState<Step>('loading')
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function startEnrollment() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error || !data) {
        setError(error?.message ?? 'Failed to start enrollment')
        setStep('error')
        return
      }
      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      })
      setStep('scan')
    }
    startEnrollment()
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollData || code.length !== 6) return
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollData.factorId,
      })
      if (challengeError || !challengeData) throw challengeError ?? new Error('Challenge failed')

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: challengeData.id,
        code,
      })
      if (verifyError) throw verifyError

      setStep('done')
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Setting up authenticator…
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Setup failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Authenticator enabled</CardTitle>
            <CardDescription>Two-factor authentication is now active</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Redirecting…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'scan' && enrollData) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Set up authenticator</CardTitle>
            <CardDescription>
              Scan the QR code with Google Authenticator, Authy, or any TOTP app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollData.qrCode}
                alt="TOTP QR code"
                className="h-48 w-48 rounded border"
              />
              <div className="grid w-full gap-2">
                <Label>Manual entry key</Label>
                <p className="break-all rounded bg-muted px-3 py-2 font-mono text-xs">
                  {enrollData.secret}
                </p>
              </div>
              <Button className="w-full" onClick={() => setStep('verify')}>
                I&apos;ve scanned the code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // step === 'verify'
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Verify code</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify}>
            <div className="flex flex-col items-center gap-6">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
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
              <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
                {isLoading ? 'Verifying…' : 'Enable authenticator'}
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground underline underline-offset-4"
                onClick={() => { setStep('scan'); setCode(''); setError(null) }}
              >
                Back to QR code
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
