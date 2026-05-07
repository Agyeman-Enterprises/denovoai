'use client'

import { Toaster } from 'sonner'

/**
 * Toast provider — add to root layout.tsx inside <body>.
 *
 * @example
 * // app/layout.tsx
 * import { ToastProvider } from '@/components/providers/toast-provider'
 * export default function RootLayout({ children }) {
 *   return <html><body><ToastProvider />{children}</body></html>
 * }
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:       'font-sans text-sm',
          description: 'text-muted-foreground',
        },
      }}
    />
  )
}
