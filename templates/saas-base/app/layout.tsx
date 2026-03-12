import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'App',
  description: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Built with DeNovo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#6366f1'};
            --primary-fg: ${process.env.NEXT_PUBLIC_PRIMARY_FG || '#ffffff'};
            --secondary: ${process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#e0e7ff'};
            --accent: ${process.env.NEXT_PUBLIC_ACCENT_COLOR || '#818cf8'};
            --sidebar-bg: ${process.env.NEXT_PUBLIC_SIDEBAR_BG || '#f8fafc'};
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
