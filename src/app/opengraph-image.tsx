import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'Open Graph Image'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'My App'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          width:           '100%',
          height:          '100%',
          background:      'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color:           '#f8fafc',
          fontFamily:      'sans-serif',
          padding:         '80px',
        }}
      >
        <p style={{ fontSize: 72, fontWeight: 700, margin: 0, letterSpacing: '-2px' }}>
          {SITE_NAME}
        </p>
        <p style={{ fontSize: 32, color: '#94a3b8', margin: '16px 0 0' }}>
          Built with Agyeman Enterprises
        </p>
      </div>
    ),
    size,
  )
}
