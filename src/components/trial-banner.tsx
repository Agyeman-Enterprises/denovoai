'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function TrialBanner() {
  const [days,    setDays]    = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/billing/account')
      .then(r => r.json())
      .then((d: { daysRemaining?: number }) => {
        if (typeof d.daysRemaining === 'number') setDays(d.daysRemaining)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || days === null) return null

  const urgent = days <= 3

  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-2 text-sm ${urgent ? 'border-destructive bg-destructive/10' : 'border-border bg-muted'}`}>
      <span>
        {days === 0
          ? 'Your trial has expired.'
          : `Trial ends in ${days} day${days === 1 ? '' : 's'}.`}
      </span>
      <Button size="sm" variant={urgent ? 'destructive' : 'default'} asChild>
        <a href="/billing" data-testid="nav-billing">Upgrade now</a>
      </Button>
    </div>
  )
}
