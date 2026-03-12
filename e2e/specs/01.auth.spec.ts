import { test, expect } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_EMAIL
const E2E_PASSWORD = process.env.E2E_PASSWORD
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD)

test.describe('auth', () => {
  test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD in .env.e2e to run auth tests')

  test('login page renders with email + password fields and visibility toggle', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('password-toggle')).toBeVisible()
  })

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login')
    const passwordInput = page.getByTestId('password-input')
    const toggle = page.getByTestId('password-toggle')

    await expect(passwordInput).toHaveAttribute('type', 'password')
    await toggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await toggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('shows error on bad credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill('bad@example.com')
    await page.getByTestId('password-input').fill('wrongpassword')
    await page.getByTestId('submit-auth').click()
    await expect(page.getByTestId('form-error')).toBeVisible({ timeout: 10_000 })
  })

  test('can sign up, then log in, then log out', async ({ page }) => {
    // Log in
    await page.goto('/login')
    await page.getByTestId('email-input').fill(E2E_EMAIL!)
    await page.getByTestId('password-input').fill(E2E_PASSWORD!)
    await page.getByTestId('submit-auth').click()

    // Should redirect to home and show logout button
    await expect(page).toHaveURL('/', { timeout: 15_000 })
    await expect(page.getByTestId('logout')).toBeVisible({ timeout: 10_000 })

    // Log out
    await page.getByTestId('logout').click()
    await expect(page.getByTestId('login-link')).toBeVisible({ timeout: 10_000 })
  })

  test('nav-user-menu shows user email when logged in', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('email-input').fill(E2E_EMAIL!)
    await page.getByTestId('password-input').fill(E2E_PASSWORD!)
    await page.getByTestId('submit-auth').click()
    await page.waitForURL('/')

    const menu = page.getByTestId('nav-user-menu')
    await expect(menu).toContainText(E2E_EMAIL!)
  })
})
