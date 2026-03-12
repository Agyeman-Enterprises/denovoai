import { test } from '@playwright/test'

// denovoai has no auth sessions.
test.describe('session', () => {
  test.skip(true, 'denovoai has no auth sessions — skipped by contract')

  test('placeholder', () => {
    // intentionally empty
  })
})
