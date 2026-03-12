import { Page } from '@playwright/test'

export async function login(page: Page, email?: string, password?: string): Promise<void> {
  const e = email ?? process.env.E2E_EMAIL ?? ''
  const p = password ?? process.env.E2E_PASSWORD ?? ''

  if (!e || !p) return // No credentials — no-op (tests will skip via contract)

  await page.goto('/login')
  await page.getByTestId('email-input').fill(e)
  await page.getByTestId('password-input').fill(p)
  await page.getByTestId('submit-auth').click()
  await page.waitForURL('/', { timeout: 15_000 })
}

export async function logout(page: Page): Promise<void> {
  const btn = page.getByTestId('logout')
  const visible = await btn.isVisible().catch(() => false)
  if (visible) {
    await btn.click()
    await page.waitForTimeout(500)
  }
}

export async function adminLogin(page: Page): Promise<void> {
  // denovoai has no separate admin role — same as regular login
  return login(page)
}
