import { test } from '@playwright/test'

// denovoai has no role-based permissions.
test.describe('permissions', () => {
  test.skip(true, 'denovoai has no role-based permissions — skipped by contract')

  test('placeholder', () => {
    // intentionally empty
  })
})
