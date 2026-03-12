import { Page } from '@playwright/test'

// denovoai has no authentication. This helper is a no-op.
export async function login(_page: Page): Promise<void> {
  // No-op: denovoai does not require authentication
}

export async function adminLogin(_page: Page): Promise<void> {
  // No-op: denovoai does not require authentication
}

export async function logout(_page: Page): Promise<void> {
  // No-op: denovoai does not require authentication
}
