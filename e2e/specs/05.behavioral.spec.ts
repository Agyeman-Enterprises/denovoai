import { test, expect } from '@playwright/test';

/**
 * 05.behavioral.spec.ts — Gates 7 + 8: Product-Specific Behavioral Test
 *
 * ⚠️  THIS FILE IS A TEMPLATE — Claude Code must fill in every test
 *     based on this app's GATE7.txt before this spec is valid.
 *
 * Rules:
 * - Every section in GATE7.txt must have at least one test here
 * - Tests must run against the LIVE app — no mocking of core behavior
 * - Tests must use real data — no hardcoded arrays or fake responses
 * - A test that always passes regardless of app state is INVALID
 * - Remove the @skip tags as each section is implemented
 *
 * How to fill this in:
 * 1. Read GATE7.txt for this app
 * 2. For each section (A, B, C...) write tests that cover every checkbox
 * 3. Run: npx playwright test e2e/specs/05.behavioral.spec.ts
 * 4. All tests must pass before running run-gate.sh
 */

// ─── Test data ───────────────────────────────────────────────────────────────
// Use the standard test persona defined in CLAUDE.md
const TEST_USER = {
  name: 'IMA Vampyr',
  email: 'imatesta@gmail.com',
  phone: '671-846-1441',
};

// ─── SECTION A: Navigation ───────────────────────────────────────────────────

test.describe('Section A — Navigation', () => {
  test('app loads and main UI is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // TODO(gate7): Replace with the actual main UI element selector for this app
    // e.g. await expect(page.locator('[data-testid="spreadsheet-grid"]')).toBeVisible();
    throw new Error('GATE7 SECTION A NOT IMPLEMENTED — fill in this test from GATE7.txt');
  });

  test('all primary navigation items resolve to real content', async ({ page }) => {
    await page.goto('/');
    // TODO(gate7): List every nav item and verify it renders real content
    // e.g.:
    // await page.click('[data-testid="nav-home"]');
    // await expect(page.locator('[data-testid="home-panel"]')).toBeVisible();
    throw new Error('GATE7 SECTION A NOT IMPLEMENTED — fill in nav checks from GATE7.txt');
  });

  test('no navigation items show placeholder or Coming Soon content', async ({ page }) => {
    await page.goto('/');
    // TODO(gate7): Click through every tab/nav item and verify no stub text
    // Check that none contain "Coming Soon", "Phase 2", "TODO", "Placeholder"
    throw new Error('GATE7 SECTION A NOT IMPLEMENTED — fill in stub checks from GATE7.txt');
  });
});

// ─── SECTION B: Auth Flow (remove if no auth) ───────────────────────────────

test.describe('Section B — Auth Flow', () => {
  test.skip(true, 'TODO(gate7): Implement if app has auth — skip if no auth');

  test('signup creates account', async ({ page }) => {
    // TODO(gate7): Implement signup flow test
    throw new Error('NOT IMPLEMENTED');
  });

  test('login with valid credentials reaches dashboard', async ({ page }) => {
    // TODO(gate7): Implement login test
    throw new Error('NOT IMPLEMENTED');
  });

  test('login with bad credentials shows error', async ({ page }) => {
    // TODO(gate7): Implement bad credentials test
    throw new Error('NOT IMPLEMENTED');
  });

  test('logout clears session', async ({ page }) => {
    // TODO(gate7): Implement logout test
    throw new Error('NOT IMPLEMENTED');
  });
});

// ─── SECTION C: Primary Entity CRUD ─────────────────────────────────────────

test.describe('Section C — Primary Entity CRUD', () => {
  // TODO(gate7): Replace 'entity' with the actual entity name (projects, patients, etc.)

  test('CREATE — form submits and entity appears in list', async ({ page }) => {
    // TODO(gate7): Implement create test
    // Must verify data written to DB — check it appears in list after creation
    throw new Error('GATE7 SECTION C NOT IMPLEMENTED — fill in from GATE7.txt');
  });

  test('READ — list renders entities from DB', async ({ page }) => {
    // TODO(gate7): Verify list is populated from database, not hardcoded
    throw new Error('GATE7 SECTION C NOT IMPLEMENTED — fill in from GATE7.txt');
  });

  test('UPDATE — edit form loads data and save persists changes', async ({ page }) => {
    // TODO(gate7): Implement update test
    throw new Error('GATE7 SECTION C NOT IMPLEMENTED — fill in from GATE7.txt');
  });

  test('DELETE — entity removed after confirmation', async ({ page }) => {
    // TODO(gate7): Implement delete test with confirmation dialog
    throw new Error('GATE7 SECTION C NOT IMPLEMENTED — fill in from GATE7.txt');
  });

  test('PERSIST — created entity survives hard refresh', async ({ page }) => {
    // TODO(gate7): Create entity, reload page, verify it still exists
    throw new Error('GATE7 SECTION C NOT IMPLEMENTED — fill in from GATE7.txt');
  });
});

// ─── SECTION D onward: Add sections from GATE7.txt ──────────────────────────
// Copy the pattern above for every additional section in this app's GATE7.txt.
// Each checkbox in GATE7.txt must map to at least one test here.

// ─── CRITICAL FLOW: End-to-end ───────────────────────────────────────────────

test.describe('Critical Flow — End to End', () => {
  test('complete critical user flow with persistence', async ({ page }) => {
    /**
     * TODO(gate7): Implement the critical flow from GATE7.txt Section E.
     * This is the most important test in the suite.
     * It must:
     * 1. Complete the full user journey from start to finish
     * 2. Use real data (not mocked)
     * 3. Verify data persists after hard refresh
     * 4. Verify data persists after tab close and reopen
     */
    throw new Error('GATE7 CRITICAL FLOW NOT IMPLEMENTED — fill in from GATE7.txt Section E');
  });
});
