'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CheckoutButtonProps {
  priceId: string
  label?: string
  successPath?: string
  cancelPath?: string
  className?: string
}

export function CheckoutButton({
  priceId,
  label = 'Subscribe',
  successPath = '/billing',
  cancelPath  = '/billing',
  className,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res  = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId, successPath, cancelPath }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Redirecting…' : label}
    </Button>
  )
}
