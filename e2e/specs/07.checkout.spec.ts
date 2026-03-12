import { test } from '@playwright/test'

// denovoai has no billing or checkout.
test.describe('checkout', () => {
  test.skip(true, 'denovoai has no billing/checkout — skipped by contract')

  test('placeholder', () => {
    // intentionally empty
  })
})
