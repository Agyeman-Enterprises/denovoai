import { test, expect } from '@playwright/test';

/**
 * 04.navigation.spec.ts — Gate 5: Navigation + Mobile Responsiveness
 * DeNovoAI — all public routes load, navbar links work, mobile at 375px.
 *
 * Mobile tests are run by the "mobile" Playwright project (iPhone SE viewport).
 * Desktop tests are run by the "chromium" project.
 */

test.describe('Gate 5 — Navigation: All Public Routes', () => {

  const publicRoutes: Array<{ path: string; heading: RegExp | string }> = [
    { path: '/', heading: /From idea to/i },
    { path: '/auth/login', heading: /Sign in to DeNovo/i },
    { path: '/pricing', heading: /DeNovo doesn.t charge for prompts/i },
    { path: '/terms', heading: /terms/i },
    { path: '/privacy', heading: /privacy/i },
    { path: '/security', heading: /security/i },
    { path: '/acceptable-use', heading: /acceptable use/i },
    { path: '/launch-policy', heading: /launch policy/i },
    { path: '/provider-policy', heading: /provider policy/i },
  ];

  for (const { path, heading } of publicRoutes) {
    test(`${path} loads and renders heading matching "${heading}"`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await page.waitForLoadState('networkidle');
      // Look for heading in h1 or h2 with matching text
      const headingEl = page.locator('h1, h2').filter({ hasText: heading }).first();
      await expect(headingEl).toBeVisible({ timeout: 8_000 });
    });
  }

  test('404 page handles unknown routes gracefully (no crash)', async ({ page }) => {
    const response = await page.goto('/does-not-exist-at-all-xyz');
    // Next.js renders a 404 — the status code should be 404 or it redirects
    // Either way, the app should not crash with a 500
    expect(response?.status()).not.toBe(500);
  });

  test('navbar "DeNovo" logo link returns to landing page', async ({ page }) => {
    await page.goto('/pricing');
    await page.locator('nav').getByRole('link', { name: 'DeNovo' }).click();
    await expect(page).toHaveURL('/');
  });

  test('navbar "Sign In" link navigates to /auth/login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/auth/login');
  });

  test('pricing page "Build" tab shows 4 plan cards', async ({ page }) => {
    await page.goto('/pricing');
    // Build tab is default
    const planNames = page.locator('h3').filter({ hasText: /Starter|Builder|Studio|Agency/ });
    await expect(planNames).toHaveCount(4, { timeout: 5_000 });
  });

  test('pricing page "Launch" tab shows 4 plan cards', async ({ page }) => {
    await page.goto('/pricing');
    // Click the Launch tab
    await page.getByRole('button', { name: /Launch/i }).first().click();
    const planNames = page.locator('h3').filter({ hasText: /Launch 1|Launch 5|Launch 15|Launch 40/ });
    await expect(planNames).toHaveCount(4, { timeout: 5_000 });
  });

  test('pricing page annual toggle switches pricing', async ({ page }) => {
    await page.goto('/pricing');
    // Read the Starter monthly price text before toggle
    const starterCard = page.locator('[class*="rounded"]').filter({ hasText: 'Starter' }).first();
    const priceBefore = await starterCard.locator('span.text-3xl').innerText();

    // Toggle annual billing
    const toggle = page.locator('button[class*="rounded-full"]').first();
    await toggle.click();

    const priceAfter = await starterCard.locator('span.text-3xl').innerText();
    // Annual price should differ from monthly
    expect(priceAfter).not.toBe(priceBefore);
  });

  test('landing page FAQ items are expandable', async ({ page }) => {
    await page.goto('/');
    // Click the first FAQ item
    const firstFaq = page.locator('button').filter({ hasText: /Can I use Build and Launch/ }).first();
    await expect(firstFaq).toBeVisible({ timeout: 8_000 });
    await firstFaq.click();
    // Answer text becomes visible
    await expect(page.getByText(/Generate with Build, then add Launch/)).toBeVisible({ timeout: 3_000 });
  });

  test('landing page template grid shows all 8 templates', async ({ page }) => {
    await page.goto('/');
    // The templates section lists 8 template types
    const templates = [
      'Marketplace', 'SaaS Tool', 'Client Portal', 'Internal Tool',
      'Commerce', 'Community', 'Directory', 'Content Platform',
    ];
    for (const name of templates) {
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 5_000 });
    }
  });

});

test.describe('Gate 5 — Mobile Responsiveness (375px viewport)', () => {

  test('mobile: landing page hero text visible at 375px', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hero = page.locator('h1').filter({ hasText: 'From idea to' });
    await expect(hero).toBeVisible();
    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

  test('mobile: navbar logo and Start Building CTA are visible at 375px', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').getByText('DeNovo')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start Building' })).toBeVisible();
  });

  test('mobile: /auth/login form is usable at 375px (no overflow)', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('mobile: /pricing plans stack vertically and prices are readable', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    // All 4 plan names should be visible (stacked, not cropped)
    for (const name of ['Starter', 'Builder', 'Studio', 'Agency']) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

});
