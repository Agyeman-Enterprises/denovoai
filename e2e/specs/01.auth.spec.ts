import { test } from '@playwright/test'

// denovoai has no authentication flow.
test.describe('auth', () => {
  test.skip(true, 'denovoai has no authentication — skipped by contract')

  test('placeholder', () => {
    // intentionally empty
  })
})
