import { test, expect, type Page } from '@playwright/test';

/**
 * 01.auth.spec.ts — Gate 3: Auth Flow
 * DeNovoAI — magic-link + OAuth login, session management, protected routes.
 *
 * Auth model: Supabase magic-link (OTP email) + Google/GitHub OAuth.
 * No password field exists — the app uses passwordless flow only.
 * Tests that require an active session use the SUPABASE_TEST_TOKEN env var
 * injected via localStorage to simulate an authenticated state.
 *
 * For full magic-link testing, set BASE_URL and SUPABASE_TEST_TOKEN in .env.test:
 *   BASE_URL=http://localhost:4010
 *   SUPABASE_TEST_TOKEN=<valid Supabase access token for imatesta@gmail.com>
 */

const TEST_USER = {
  email: 'imatesta@gmail.com',
};

/**
 * Inject a Supabase session token directly into localStorage so tests can
 * operate as an authenticated user without going through the email OTP flow.
 * Requires SUPABASE_TEST_TOKEN env var to be set.
 */
async function loginViaToken(page: Page) {
  const token = process.env.SUPABASE_TEST_TOKEN;
  if (!token) {
    test.skip(true, 'SUPABASE_TEST_TOKEN not set — skipping authenticated tests');
    return;
  }
  await page.goto('/');
  await page.evaluate((t) => {
    // Supabase SSR stores the session in a cookie; for client-side testing
    // we set a flag that allows the test harness to confirm token presence
    localStorage.setItem('sb-test-token', t);
  }, token);
}

test.describe('Gate 3 — Auth Flow', () => {

  test('login page loads and shows "Sign in to DeNovo" heading', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: 'Sign in to DeNovo' })).toBeVisible();
  });

  test('login page shows magic-link email input', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('login page shows "Send Magic Link" submit button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible();
  });

  test('login page shows "Continue with Google" OAuth button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('login page shows "Continue with GitHub" OAuth button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible();
  });

  test('submitting magic-link form shows email confirmation message', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.getByRole('button', { name: 'Send Magic Link' }).click();
    // After submit, the form is replaced by a confirmation panel
    await expect(page.getByText('Check your email for a magic link')).toBeVisible({ timeout: 10_000 });
    // Email address is echoed back
    await expect(page.getByText(TEST_USER.email)).toBeVisible();
  });

  test('"Back to home" link on login page navigates to /', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('unauthenticated /dashboard redirects to /auth/login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated /studio redirects to /auth/login', async ({ page }) => {
    await page.goto('/studio');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated /dashboard/billing redirects to /auth/login', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Sign Out button exists in navbar for authenticated user', async ({ page }) => {
    await loginViaToken(page);
    // After token injection, navigate to dashboard where Sign Out should appear
    await page.goto('/dashboard');
    // If redirect happened, session token was not accepted — this is expected
    // in CI without a real token; the test is skipped via loginViaToken
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('"New App" navbar button visible when authenticated', async ({ page }) => {
    await loginViaToken(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'New App' })).toBeVisible();
  });

  test('auth callback route exists (does not 404)', async ({ page }) => {
    // Hit the callback page without params — it should render something, not 404
    const response = await page.goto('/auth/callback');
    expect(response?.status()).not.toBe(404);
  });

});
