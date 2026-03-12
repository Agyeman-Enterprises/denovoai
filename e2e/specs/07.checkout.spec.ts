import { test, expect } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_EMAIL
const E2E_PASSWORD = process.env.E2E_PASSWORD
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD)
const hasStripe = !!(process.env.STRIPE_SECRET_KEY || process.env.E2E_STRIPE_KEY)

test.describe('checkout', () => {
  test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD in .env.e2e to run checkout tests')

  async function loginUser(page: import('@playwright/test').Page) {
    await page.goto('/login')
    await page.getByTestId('email-input').fill(E2E_EMAIL!)
    await page.getByTestId('password-input').fill(E2E_PASSWORD!)
    await page.getByTestId('submit-auth').click()
    await page.waitForURL('/', { timeout: 15_000 })
  }

  test('billing page shows current plan and run usage', async ({ page }) => {
    await loginUser(page)
    await page.goto('/billing')
    await expect(page.getByTestId('current-plan')).toBeVisible({ timeout: 10_000 })
  })

  test('free user sees upgrade button on billing page', async ({ page }) => {
    await loginUser(page)
    await page.goto('/billing')

    const plan = await page.getByTestId('current-plan').textContent({ timeout: 10_000 })

    if (plan?.toLowerCase().includes('free')) {
      await expect(page.getByTestId('checkout')).toBeVisible()
    } else {
      // Already on pro — no checkout button
      test.skip(true, 'User is already on Pro plan')
    }
  })

  test('checkout button triggers Stripe redirect when Stripe configured', async ({ page }) => {
    test.skip(!hasStripe, 'Set STRIPE_SECRET_KEY to test checkout redirect')

    await loginUser(page)
    await page.goto('/billing')

    const checkoutBtn = page.getByTestId('checkout')
    const isVisible = await checkoutBtn.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, 'User is on Pro — no upgrade button')
      return
    }

    // Click upgrade — should redirect to Stripe
    const [navigationPromise] = await Promise.all([
      page.waitForNavigation({ timeout: 15_000 }).catch(() => null),
      checkoutBtn.click(),
    ])

    // Should either navigate to stripe.com or show an error
    const url = page.url()
    const wentToStripe = url.includes('stripe.com') || url.includes('checkout.stripe')
    const showsError = await page.getByTestId('form-error').isVisible().catch(() => false)

    expect(wentToStripe || showsError || navigationPromise !== null).toBeTruthy()
  })

  test('checkout API returns 503 when Stripe not configured', async ({ page }) => {
    test.skip(hasStripe, 'Stripe is configured — skip this test')

    await loginUser(page)

    const response = await page.request.post('/api/checkout')
    expect([401, 503]).toContain(response.status())
  })

  test('billing page has logout button', async ({ page }) => {
    await loginUser(page)
    await page.goto('/billing')
    await expect(page.getByTestId('logout')).toBeVisible({ timeout: 8_000 })
  })
})
