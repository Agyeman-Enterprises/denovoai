import { Page } from '@playwright/test'

// denovoai has no billing. This helper is a no-op.
export async function goToCheckout(_page: Page): Promise<void> {
  // No-op: denovoai does not have a billing/checkout flow
}
