'use client'
import Sidebar from '@/components/app/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto', marginLeft: '240px' }}>
        {children}
      </main>
    </div>
  )
}
