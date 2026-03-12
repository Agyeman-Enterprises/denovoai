import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Denovo AI Platform',
  description: 'AI-powered product studio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
