import { test, expect } from '@playwright/test';

/**
 * 00.smoke.spec.ts — Gate 2: App Loads
 * DeNovoAI — verifies the app starts, renders, no console errors.
 */

test.describe('Gate 2 — App Loads', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });
  });

  test('landing page loads with HTTP 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('page title is set (not default Next.js placeholder)', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).not.toBe('');
    expect(title).not.toBe('Next.js');
    expect(title).not.toBe('Create Next App');
  });

  test('hero heading is visible on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // The hero h1 contains "From idea to"
    const hero = page.locator('h1').filter({ hasText: 'From idea to' });
    await expect(hero).toBeVisible();
  });

  test('DeNovo brand name is visible in navbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').getByText('DeNovo')).toBeVisible();
  });

  test('"Start Building" CTA is visible to unauthenticated visitor', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Start Building' })).toBeVisible();
  });

  test('zero uncaught JS errors on landing page load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toHaveLength(0);
  });

  test('zero failed network requests on landing page load', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      if (!req.url().includes('analytics') && !req.url().includes('telemetry')) {
        failedRequests.push(req.url());
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(failedRequests).toHaveLength(0);
  });

  test('/api/health returns healthy response', async ({ page }) => {
    const response = await page.goto('/api/health');
    expect(response?.status()).toBeLessThan(400);
  });
});
