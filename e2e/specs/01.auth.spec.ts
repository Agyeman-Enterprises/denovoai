import { test, expect } from '@playwright/test';

/**
 * 01.auth.spec.ts — Gate 3: Auth Flow
 *
 * ⚠️  THIS FILE IS A TEMPLATE — Claude Code must implement every test
 *     based on this app's actual auth implementation before gates run.
 *
 * Rules:
 * - Tests must run against the LIVE app with a real Supabase/auth backend
 * - Use the standard test persona from CLAUDE.md (imatesta@gmail.com)
 * - Every test must clean up after itself (delete test account or use seeded data)
 * - If app has NO auth, replace all tests with: test.skip(true, 'No auth in this app')
 *
 * How to fill this in:
 * 1. Read GATE7.txt Section B for this app
 * 2. Find the actual login/signup route (e.g., /login, /auth/signin)
 * 3. Find the actual form selectors (data-testid preferred)
 * 4. Implement each test — remove throw statements as each is done
 */

const TEST_USER = {
  name: 'IMA Vampyr',
  email: 'imatesta@gmail.com',
  password: 'TestPass123!',
};

test.describe('Gate 3 — Auth Flow', () => {

  test('login page loads', async ({ page }) => {
    // TODO(gate3): Replace /login with the actual login route for this app
    // e.g., /auth/signin, /sign-in, /auth
    throw new Error('GATE3 NOT IMPLEMENTED — find the login route and update this test');
    // await page.goto('/login');
    // await expect(page.locator('form')).toBeVisible();
  });

  test('login with valid credentials reaches protected area', async ({ page }) => {
    // TODO(gate3): Implement full login flow
    // 1. Navigate to login page
    // 2. Fill email + password
    // 3. Submit
    // 4. Verify redirect to dashboard/home
    throw new Error('GATE3 NOT IMPLEMENTED — implement login with real credentials');
    // await page.goto('/login');
    // await page.fill('[data-testid="email-input"]', TEST_USER.email);
    // await page.fill('[data-testid="password-input"]', TEST_USER.password);
    // await page.click('[data-testid="login-btn"]');
    // await expect(page).toHaveURL(/dashboard|home|app/);
  });

  test('login with bad credentials shows error message', async ({ page }) => {
    // TODO(gate3): Verify error appears — not a blank page or crash
    throw new Error('GATE3 NOT IMPLEMENTED — implement bad credentials test');
    // await page.goto('/login');
    // await page.fill('[data-testid="email-input"]', 'bad@example.com');
    // await page.fill('[data-testid="password-input"]', 'wrongpassword');
    // await page.click('[data-testid="login-btn"]');
    // await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('logout button exists and is reachable', async ({ page }) => {
    // TODO(gate3): Login first, then verify logout is accessible
    throw new Error('GATE3 NOT IMPLEMENTED — implement logout visibility test');
    // await loginAsTestUser(page); // helper you write
    // await expect(page.locator('[data-testid="logout-btn"]')).toBeVisible();
  });

  test('logout clears session and protected route redirects', async ({ page }) => {
    // TODO(gate3): After logout, hitting a protected route must redirect to login
    throw new Error('GATE3 NOT IMPLEMENTED — implement post-logout redirect test');
    // await loginAsTestUser(page);
    // const protectedUrl = page.url();
    // await page.click('[data-testid="logout-btn"]');
    // await page.goto(protectedUrl);
    // await expect(page).toHaveURL(/login|signin|auth/);
  });

  test('unauthenticated access to protected route redirects to login', async ({ page }) => {
    // TODO(gate3): Hit a protected route without logging in first
    throw new Error('GATE3 NOT IMPLEMENTED — find a protected route and implement redirect test');
    // await page.goto('/dashboard'); // or whatever the protected route is
    // await expect(page).toHaveURL(/login|signin|auth/);
  });

  test('password field has visibility toggle', async ({ page }) => {
    // TODO(gate3): Rule 4 from CLAUDE.md — all password fields need a visibility toggle
    throw new Error('GATE3 NOT IMPLEMENTED — verify password toggle exists');
    // await page.goto('/login');
    // const pwField = page.locator('[data-testid="password-input"]');
    // await expect(pwField).toHaveAttribute('type', 'password');
    // await page.click('[data-testid="password-toggle"]');
    // await expect(pwField).toHaveAttribute('type', 'text');
  });

});
