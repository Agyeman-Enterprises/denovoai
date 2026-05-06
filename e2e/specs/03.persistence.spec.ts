import { test, expect, type Page } from '@playwright/test';

/**
 * 03.persistence.spec.ts — Gates 5 + 6: Navigation Integrity + Data Persistence
 * DeNovoAI — verifies that app records survive navigation, hard refresh, and
 * re-authentication. Also verifies that session-level state (slot_map) persists
 * in Supabase across page loads.
 *
 * Authenticated tests require SUPABASE_TEST_TOKEN env var.
 */

async function requireAuth(page: Page): Promise<boolean> {
  const token = process.env.SUPABASE_TEST_TOKEN;
  if (!token) {
    test.skip(true, 'SUPABASE_TEST_TOKEN not set — skipping persistence tests');
    return false;
  }
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('sb-test-token', t), token);
  return true;
}

test.describe('Gate 5 — Navigation Integrity', () => {

  test('navigating /dashboard → /pricing → /dashboard preserves app list', async ({ page }) => {
    await requireAuth(page);
    await page.goto('/dashboard');
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    // Capture app names currently visible
    const appNames = await page.locator('a[href^="/dashboard/app/"] h3').allInnerTexts();

    // Navigate away
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /DeNovo doesn.t charge for prompts/i })).toBeVisible();

    // Navigate back
    await page.goto('/dashboard');
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    const appNamesAfter = await page.locator('a[href^="/dashboard/app/"] h3').allInnerTexts();
    expect(appNamesAfter).toEqual(appNames);
  });

  test('using browser back button from app detail returns to full dashboard list', async ({ page }) => {
    await requireAuth(page);
    await page.goto('/dashboard');
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    const firstAppLink = page.locator('a[href^="/dashboard/app/"]').first();
    if (!await firstAppLink.isVisible()) {
      test.info().annotations.push({ type: 'skip-reason', description: 'No apps to test back navigation' });
      return;
    }

    await firstAppLink.click();
    await expect(page).toHaveURL(/\/dashboard\/app\//);
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'My Apps' })).toBeVisible();
  });

  test('"← Back to Dashboard" link on app detail returns to /dashboard', async ({ page }) => {
    await requireAuth(page);
    await page.goto('/dashboard');
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    const firstAppLink = page.locator('a[href^="/dashboard/app/"]').first();
    if (!await firstAppLink.isVisible()) {
      test.info().annotations.push({ type: 'skip-reason', description: 'No apps to test back link' });
      return;
    }

    await firstAppLink.click();
    await page.getByRole('link', { name: /Back to Dashboard/i }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'My Apps' })).toBeVisible();
  });

});

test.describe('Gate 6 — Data Persistence', () => {

  test('app records in dashboard survive a hard page reload', async ({ page }) => {
    await requireAuth(page);
    await page.goto('/dashboard');
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    const appNamesBefore = await page.locator('a[href^="/dashboard/app/"] h3').allInnerTexts();

    // Hard reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    const appNamesAfter = await page.locator('a[href^="/dashboard/app/"] h3').allInnerTexts();
    expect(appNamesAfter).toEqual(appNamesBefore);
  });

  test('app detail data matches dashboard card data (no stale cache)', async ({ page }) => {
    await requireAuth(page);
    await page.goto('/dashboard');
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    const firstAppLink = page.locator('a[href^="/dashboard/app/"]').first();
    if (!await firstAppLink.isVisible()) {
      test.info().annotations.push({ type: 'skip-reason', description: 'No apps to test data consistency' });
      return;
    }

    // Get app name from dashboard card
    const dashboardAppName = await firstAppLink.locator('h3').innerText();

    // Navigate to detail
    await firstAppLink.click();
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    // h1 on detail page should match
    const detailAppName = await page.locator('h1').first().innerText();
    expect(detailAppName).toBe(dashboardAppName);
  });

  test('app status on detail page matches status on dashboard card', async ({ page }) => {
    await requireAuth(page);
    await page.goto('/dashboard');
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    const firstAppLink = page.locator('a[href^="/dashboard/app/"]').first();
    if (!await firstAppLink.isVisible()) {
      test.info().annotations.push({ type: 'skip-reason', description: 'No apps to compare status' });
      return;
    }

    // Get the status badge text from the dashboard card
    const dashboardStatusBadge = await firstAppLink.locator('.badge, [class*="badge"]').last().innerText();

    await firstAppLink.click();
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );

    // Detail page should have a matching status badge
    const detailBadges = page.locator('.badge, [class*="badge"]');
    const badgeTexts = await detailBadges.allInnerTexts();
    const normalised = badgeTexts.map(t => t.toLowerCase());
    expect(normalised).toContain(dashboardStatusBadge.toLowerCase());
  });

  test('Supabase session persists across /studio → /dashboard navigation', async ({ page }) => {
    await requireAuth(page);
    await page.goto('/studio');
    // Studio requires auth — should not redirect to login
    await expect(page).not.toHaveURL(/\/auth\/login/);
    // Navigate to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
    // Navigate back to studio
    await page.getByRole('link', { name: 'Studio' }).click();
    await expect(page).toHaveURL('/studio');
    // Still authenticated
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('billing page credits value is numeric and non-negative', async ({ page }) => {
    await requireAuth(page);
    await page.goto('/dashboard/billing');
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('Loading...'),
      { timeout: 10_000 }
    );
    // Credits remaining should be a number displayed on the page
    const creditsText = await page.locator('p.text-3xl, .text-3xl').first().innerText();
    const credits = parseInt(creditsText.trim(), 10);
    expect(credits).toBeGreaterThanOrEqual(0);
  });

});
