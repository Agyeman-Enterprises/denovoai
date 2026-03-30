import { test, expect } from '@playwright/test';

/**
 * 04.navigation.spec.ts — Gate 5: Navigation + Mobile Responsive
 *
 * ⚠️  THIS FILE IS A TEMPLATE — Claude Code must implement every test
 *     based on this app's actual routes and navigation structure.
 *
 * Rules:
 * - Every nav link in the app must be clicked and verified
 * - "Resolves to real content" means a non-empty, non-error page
 * - Mobile tests run in the 'mobile' project (iPhone SE viewport — 375px)
 * - No route may show a 404 or blank page
 * - No nav item may lead to "Coming Soon" content
 *
 * How to fill this in:
 * 1. Read GATE7.txt Section A for this app — list every route
 * 2. Implement desktop nav tests for each route
 * 3. Implement mobile tests (these run in the mobile Playwright project)
 */

test.describe('Gate 5 — Navigation (Desktop)', () => {

  test.beforeEach(async ({ page }) => {
    // TODO(gate5): Log in if app has auth, then navigate to main page
    throw new Error('GATE5 SETUP NOT IMPLEMENTED — login and navigate to app root');
    // await loginAsTestUser(page);
    // await page.goto('/');
    // await page.waitForLoadState('networkidle');
  });

  test('landing/home page loads with real content', async ({ page }) => {
    // TODO(gate5): Verify main content area renders — not blank
    throw new Error('GATE5 HOME NOT IMPLEMENTED — verify home page renders real content');
    // await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    // const bodyText = await page.locator('body').innerText();
    // expect(bodyText.trim().length).toBeGreaterThan(50);
  });

  test('primary nav item 1 resolves to real content', async ({ page }) => {
    // TODO(gate5): Replace with actual nav item 1 name, route, and content check
    throw new Error('GATE5 NAV1 NOT IMPLEMENTED — implement for actual nav item 1');
    // await page.click('[data-testid="nav-[item1]"]');
    // await page.waitForLoadState('networkidle');
    // await expect(page).toHaveURL(/[expected-route]/);
    // await expect(page.locator('[data-testid="[item1]-content"]')).toBeVisible();
  });

  test('primary nav item 2 resolves to real content', async ({ page }) => {
    // TODO(gate5): Replace with actual nav item 2
    throw new Error('GATE5 NAV2 NOT IMPLEMENTED — implement for actual nav item 2');
  });

  test('primary nav item 3 resolves to real content', async ({ page }) => {
    // TODO(gate5): Replace with actual nav item 3 — add more tests if more nav items exist
    throw new Error('GATE5 NAV3 NOT IMPLEMENTED — implement for actual nav item 3');
  });

  test('no nav item leads to 404 or blank page', async ({ page }) => {
    // TODO(gate5): Navigate to each route and verify no 404 responses
    // List all routes for this app
    throw new Error('GATE5 NO-404 NOT IMPLEMENTED — list all routes and check each');
    // const routes = ['/dashboard', '/profile', '/settings']; // fill in actual routes
    // for (const route of routes) {
    //   const response = await page.goto(route);
    //   expect(response?.status(), `${route} returned non-200`).toBeLessThan(400);
    //   const bodyText = await page.locator('body').innerText();
    //   expect(bodyText.trim().length, `${route} is blank`).toBeGreaterThan(0);
    // }
  });

  test('no nav item shows Coming Soon or placeholder content', async ({ page }) => {
    // TODO(gate5): Click through all nav items and check for stub text
    throw new Error('GATE5 NO-STUBS NOT IMPLEMENTED — verify no stub/placeholder content in nav');
    // const routes = ['/dashboard', '/profile', '/settings'];
    // for (const route of routes) {
    //   await page.goto(route);
    //   const text = await page.locator('body').innerText();
    //   expect(text, `${route} has stub content`).not.toMatch(/coming soon|phase 2|todo|placeholder/i);
    // }
  });

  test('page title is not default framework title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).not.toBe('React App');
    expect(title).not.toBe('Next.js');
    expect(title).not.toBe('Vite App');
    expect(title.trim()).not.toBe('');
  });

});

// ── Mobile tests (run by the 'mobile' Playwright project — iPhone SE 375px) ──

test.describe('Gate 9f — Mobile Responsive (375px)', () => {

  test('mobile: app renders at 375px without horizontal scroll', async ({ page }) => {
    // TODO(gate9f): Verify no horizontal overflow on mobile
    throw new Error('GATE9F MOBILE NOT IMPLEMENTED — implement mobile layout test');
    // await page.goto('/');
    // await page.waitForLoadState('networkidle');
    // // Check for horizontal scroll (scrollWidth > viewport width)
    // const hasHorizontalScroll = await page.evaluate(() => {
    //   return document.documentElement.scrollWidth > window.innerWidth;
    // });
    // expect(hasHorizontalScroll).toBe(false);
  });

  test('mobile: all buttons are tappable (min 44px touch targets)', async ({ page }) => {
    // TODO(gate9f): Verify all interactive elements meet minimum touch target size
    throw new Error('GATE9F TOUCH TARGETS NOT IMPLEMENTED — implement touch target size test');
    // await page.goto('/');
    // const buttons = page.locator('button, a, [role="button"]');
    // const count = await buttons.count();
    // for (let i = 0; i < Math.min(count, 20); i++) {
    //   const el = buttons.nth(i);
    //   const box = await el.boundingBox();
    //   if (box) {
    //     expect(box.height, `Button ${i} height`).toBeGreaterThanOrEqual(44);
    //   }
    // }
  });

  test('mobile: navigation is usable', async ({ page }) => {
    // TODO(gate9f): Verify nav works on mobile (hamburger menu, bottom nav, etc.)
    throw new Error('GATE9F NAV NOT IMPLEMENTED — implement mobile navigation test');
    // await page.goto('/');
    // // If there's a hamburger menu, open it and verify it works
    // const hamburger = page.locator('[data-testid="mobile-menu-btn"]');
    // if (await hamburger.isVisible()) {
    //   await hamburger.click();
    //   await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    // }
  });

});
