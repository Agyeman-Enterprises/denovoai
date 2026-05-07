'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ReactNode } from 'react'

/**
 * Wrap root layout.tsx <body> with this provider.
 * Also add suppressHydrationWarning to the <html> element to prevent SSR mismatch.
 *
 * @example
 * // app/layout.tsx
 * <html suppressHydrationWarning>
 *   <body>
 *     <ThemeProvider>
 *       {children}
 *     </ThemeProvider>
 *   </body>
 * </html>
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
