'use client'

import { useEffect, useState } from 'react'

interface UsageMeterProps {
  feature: string
  limit: number
  label?: string
}

export function UsageMeter({ feature, limit, label }: UsageMeterProps) {
  const [used, setUsed] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/billing/usage?feature=${encodeURIComponent(feature)}`)
      .then(r => r.json())
      .then((d: { used?: number }) => { if (typeof d.used === 'number') setUsed(d.used) })
      .catch(() => {})
  }, [feature])

  if (used === null) return null

  const pct     = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const urgent  = pct >= 90

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label ?? feature}</span>
        <span>{used} / {limit}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${urgent ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
