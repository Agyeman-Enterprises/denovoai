import { Page } from '@playwright/test'

export const STRIPE_CARDS = {
  success: '4242424242424242',
  declineCard: '4000000000000002',
  requiresAuth: '4000002500003155',
}

/**
 * Fill Stripe checkout card fields.
 * Stripe embeds an iframe — locate the card frame then type into it.
 */
export async function fillStripeCard(
  page: Page,
  card = STRIPE_CARDS.success,
  expiry = '12/26',
  cvc = '123'
): Promise<void> {
  // Wait for Stripe iframe
  const cardFrame = page.frameLocator('iframe[name*="privateStripeFrame"], iframe[src*="stripe"]').first()

  await cardFrame.locator('[placeholder*="Card number"], [name="cardnumber"]').fill(card)
  await cardFrame.locator('[placeholder*="MM / YY"], [name="exp-date"]').fill(expiry)
  await cardFrame.locator('[placeholder*="CVC"], [name="cvc"]').fill(cvc)
}

/**
 * Click the Stripe checkout submit button (on stripe.com hosted checkout).
 */
export async function submitCheckout(page: Page): Promise<void> {
  await page.locator('button[type="submit"], button:has-text("Pay"), button:has-text("Subscribe")').click()
}

/**
 * Navigate to billing and click the upgrade button.
 * Returns false if user is already on Pro.
 */
export async function goToCheckout(page: Page): Promise<boolean> {
  await page.goto('/billing')
  const btn = page.getByTestId('checkout')
  const visible = await btn.isVisible({ timeout: 8_000 }).catch(() => false)
  if (!visible) return false
  await btn.click()
  return true
}
