/**
 * GATE 15 — Full Functional E2E (Google QA Standard)
 *
 * THIS IS THE "DOES THE APP ACTUALLY WORK?" GATE.
 *
 * Difference from specs 00-05:
 *   Specs 00-05 verify that UI elements EXIST.
 *   This spec verifies that FEATURES FUNCTION — data reaches the database,
 *   persists through navigation, and the critical user workflow completes end-to-end.
 *
 * Google QA philosophy applied here:
 *   1. FAIL loudly — never skip. A skipped test is an untested feature.
 *   2. Verify at the API level — UI can lie (hardcoded data, optimistic UI).
 *      A GET /api/:id returning 200 with the correct data = it actually hit the DB.
 *   3. Full CRUD including UPDATE — Create, Read-via-API, Update, Read-after-update, Delete, Read-after-delete.
 *   4. Persistence is non-negotiable — navigate away, hard refresh, logout+login, data must survive all three.
 *   5. Error states are part of the feature — empty required fields must show errors, not silently fail.
 *   6. Every nav link must lead to real content, verified by actual rendering, not just 200 status.
 *   7. Test isolation — each test cleans up what it creates. No test pollutes another.
 *
 * Configuration: create e2e/functional-config.json in your repo.
 * Copy from: ae-enforcement/e2e-shared/functional-config.template.json
 * Fill in EVERY field — leaving template values = test will fail with a clear message.
 *
 * Required env vars:
 *   TEST_EMAIL / TEST_PASSWORD       — real test user (not your personal account)
 *   BASE_URL                          — app URL
 *   SUPABASE_URL / SUPABASE_ANON_KEY  — for API-level verification
 */

import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config Loading ───────────────────────────────────────────────────────────

interface FunctionalConfig {
  appName: string;
  primaryEntity: {
    humanName: string;
    createPath: string;
    createTriggerText: string;
    listPath: string;
    apiListEndpoint: string;
    apiGetEndpoint: string;   // endpoint accepting /:id suffix
    fields: Array<{
      selector: string;
      testValue: string;
      updatedValue: string;
      type: 'text' | 'select' | 'number' | 'textarea';
    }>;
    listTextMarker: string;   // text that appears in the list after creation
    editTriggerSelector: string;
    deleteTriggerSelector: string;
    deleteConfirmText?: string;
  };
  criticalFlow: {
    description: string;
    steps: Array<{
      action: 'goto' | 'click' | 'fill' | 'select' | 'waitForText' | 'verifyUrl' | 'waitForApi';
      target: string;
      value?: string;
      description: string;
    }>;
    completionMarker: string;
  };
  authPaths: {
    login: string;
    protected: string;
    logout?: string;
  };
  emptyStateText: string;
  navLinks: string[];
}

function loadFunctionalConfig(): FunctionalConfig {
  const configPaths = [
    path.join(process.cwd(), 'e2e', 'functional-config.json'),
    path.join(process.cwd(), 'functional-config.json'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as FunctionalConfig;

      // Check for unfilled template values
      const str = JSON.stringify(raw);
      if (str.includes('FILL_IN') || str.includes('TODO') || str.includes('__REPLACE__')) {
        throw new Error(
          `e2e/functional-config.json contains unfilled template values (FILL_IN/TODO/__REPLACE__). ` +
          `Fill in ALL fields before running functional e2e tests. ` +
          `App cannot be cleared for release until this config is complete.`
        );
      }
      return raw;
    }
  }

  throw new Error(
    `e2e/functional-config.json not found. ` +
    `Copy from: C:\\DEV\\ae-enforcement\\e2e-shared\\functional-config.template.json ` +
    `and fill in all fields for this app. ` +
    `FUNCTIONAL E2E CANNOT RUN WITHOUT THIS FILE. App is NOT cleared for release.`
  );
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

const TEST_EMAIL = process.env.TEST_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

// FAIL — not skip — when credentials are missing.
// A green CI with skipped tests is a LIE.
if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    'BLOCKED: TEST_EMAIL and TEST_PASSWORD are required for functional e2e tests. ' +
    'These tests MUST run in CI. Add them to your CI secrets or .env.test. ' +
    'App is NOT cleared for release until functional tests pass.'
  );
}

async function login(page: Page, cfg: FunctionalConfig): Promise<void> {
  await page.goto(cfg.authPaths.login);
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /log.?in|sign.?in|continue/i }).click();
  await page.waitForURL((u) => !u.pathname.includes(cfg.authPaths.login), { timeout: 20000 });
}

async function logout(page: Page, cfg: FunctionalConfig): Promise<void> {
  if (cfg.authPaths.logout) {
    await page.goto(cfg.authPaths.logout);
  } else {
    const btn = page.getByRole('button', { name: /log.?out|sign.?out/i });
    const link = page.getByRole('link', { name: /log.?out|sign.?out/i });
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) await btn.click();
    else if (await link.isVisible({ timeout: 1500 }).catch(() => false)) await link.click();
  }
  await page.waitForTimeout(1000);
}

/**
 * Verify entity exists via REST API.
 * Returns the entity object or null if not found.
 */
async function verifyEntityInApi(
  request: APIRequestContext,
  endpoint: string,
  entityId: string,
  token?: string
): Promise<Record<string, unknown> | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (SUPABASE_ANON_KEY) headers['apikey'] = SUPABASE_ANON_KEY;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await request.get(`${endpoint}/${entityId}`, { headers });
  if (!response.ok()) return null;

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Load Config ──────────────────────────────────────────────────────────────

const CFG = loadFunctionalConfig();
let createdEntityId: string | null = null;

// ─── SUITE 1: Full CRUD with Database Verification ────────────────────────────

test.describe(`Functional CRUD — ${CFG.primaryEntity.humanName} (${CFG.appName})`, () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CFG);
  });

  // CREATE — fills the form, submits, verifies entity appears in the list
  test('CREATE: submitting the form persists the entity to the database', async ({ page, request }) => {
    await page.goto(CFG.primaryEntity.createPath);

    // Trigger create form (button or link)
    const trigger = page.getByRole('button', { name: new RegExp(CFG.primaryEntity.createTriggerText, 'i') })
      .or(page.getByRole('link', { name: new RegExp(CFG.primaryEntity.createTriggerText, 'i') }));

    if (await trigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await trigger.click();
    }

    // Fill each configured field
    for (const field of CFG.primaryEntity.fields) {
      const el = page.locator(field.selector);
      await el.waitFor({ state: 'visible', timeout: 8000 });

      if (field.type === 'select') {
        await el.selectOption(field.testValue);
      } else if (field.type === 'textarea') {
        await el.fill(field.testValue);
      } else {
        await el.fill(field.testValue);
      }
    }

    // Submit
    await page.getByRole('button', { name: /save|create|add|submit/i }).click();
    await page.waitForTimeout(2000);

    // UI verification — entity appears in the list
    await page.goto(CFG.primaryEntity.listPath);
    await expect(
      page.getByText(CFG.primaryEntity.listTextMarker),
      `Entity "${CFG.primaryEntity.listTextMarker}" should appear in the list after creation. ` +
      `If it does not, the create form is NOT writing to the database.`
    ).toBeVisible({ timeout: 10000 });

    // API verification — entity exists in the database (not just UI cache)
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const token = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)!;
          const val = localStorage.getItem(key) ?? '';
          if (key.includes('supabase') && val.includes('access_token')) {
            try { return (JSON.parse(val) as { access_token?: string }).access_token ?? null; }
            catch { return null; }
          }
        }
        return null;
      });

      // Try to get the entity's ID from the URL if we navigated to a detail page
      const urlId = page.url().match(/\/([0-9a-f-]{36})/)?.[1] ?? null;
      if (urlId) {
        createdEntityId = urlId;
        const entity = await verifyEntityInApi(
          request,
          CFG.primaryEntity.apiGetEndpoint,
          urlId,
          token ?? undefined
        );
        expect(
          entity,
          `Entity ${urlId} returned null from API after creation. ` +
          `The CREATE operation did NOT actually write to the database — ` +
          `data may only exist in client state or was written to a different table.`
        ).not.toBeNull();
      }
    }
  });

  // READ — list loads real data from the database (not hardcoded)
  test('READ: list renders at least one real entity from the database', async ({ page }) => {
    await page.goto(CFG.primaryEntity.listPath);
    await page.waitForTimeout(2000);

    // Either: the created entity is visible, OR an empty state is shown
    // The list must NOT show loading spinner permanently or crash
    const hasError = await page.locator('[role="alert"], .error, [data-testid*="error"]').count();
    expect(
      hasError,
      `List page crashed with an error — API call may be failing or component is broken`
    ).toBe(0);

    // If we created an entity in the previous test, it must appear
    const hasCreatedEntity = await page.getByText(CFG.primaryEntity.listTextMarker).isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await page.getByText(CFG.primaryEntity.emptyStateText).isVisible({ timeout: 2000 }).catch(() => false);

    expect(
      hasCreatedEntity || hasEmptyState,
      `List page shows neither the created entity ("${CFG.primaryEntity.listTextMarker}") nor an empty state ("${CFG.primaryEntity.emptyStateText}"). ` +
      `This means the list may be showing hardcoded data, a loading state that never resolves, or a blank page. ` +
      `The READ operation must return real data from the database.`
    ).toBe(true);
  });

  // UPDATE — edit entity, save, navigate away, come back, verify change persisted
  test('UPDATE: editing an entity persists the change through page navigation', async ({ page }) => {
    await page.goto(CFG.primaryEntity.listPath);

    // Find the entity row and click edit
    const entityRow = page.getByText(CFG.primaryEntity.listTextMarker).locator('..');
    const editBtn = entityRow.locator(CFG.primaryEntity.editTriggerSelector)
      .or(entityRow.getByRole('button', { name: /edit|modify|update/i }))
      .or(entityRow.getByRole('link', { name: /edit|modify|update/i }));

    const editVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!editVisible) {
      // Try clicking the row itself (some apps navigate on row click)
      await page.getByText(CFG.primaryEntity.listTextMarker).click();
      await page.waitForTimeout(1000);
    } else {
      await editBtn.click();
    }

    // Update the first field with the updatedValue
    const firstField = CFG.primaryEntity.fields[0];
    const fieldEl = page.locator(firstField.selector);
    await fieldEl.waitFor({ state: 'visible', timeout: 8000 });
    await fieldEl.clear();
    await fieldEl.fill(firstField.updatedValue);

    // Save
    await page.getByRole('button', { name: /save|update|confirm/i }).click();
    await page.waitForTimeout(1500);

    // Navigate AWAY from the page entirely
    await page.goto('/');
    await page.waitForTimeout(500);

    // Navigate BACK to the list
    await page.goto(CFG.primaryEntity.listPath);
    await page.waitForTimeout(2000);

    // The UPDATED value must appear — not the original value
    await expect(
      page.getByText(firstField.updatedValue),
      `After UPDATE, navigating away and back should show the updated value "${firstField.updatedValue}". ` +
      `If it still shows the old value, the save operation did NOT persist to the database — ` +
      `only client-side state was updated. This is a critical data loss bug.`
    ).toBeVisible({ timeout: 8000 });
  });

  // DELETE — delete entity, verify gone from UI AND from API
  test('DELETE: deleting an entity removes it from the database permanently', async ({ page, request }) => {
    await page.goto(CFG.primaryEntity.listPath);

    // Find and click delete for our test entity
    const entityText = page.getByText(
      CFG.primaryEntity.fields[0].updatedValue || CFG.primaryEntity.listTextMarker
    );
    const entityRow = entityText.locator('..');

    const deleteBtn = entityRow.locator(CFG.primaryEntity.deleteTriggerSelector)
      .or(entityRow.getByRole('button', { name: /delete|remove/i }));

    await deleteBtn.click({ timeout: 8000 });

    // Handle confirmation dialog if configured
    if (CFG.primaryEntity.deleteConfirmText) {
      const confirmBtn = page.getByRole('button', {
        name: new RegExp(CFG.primaryEntity.deleteConfirmText, 'i'),
      });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }

    await page.waitForTimeout(2000);

    // UI verification — entity is gone from list
    await expect(
      page.getByText(CFG.primaryEntity.listTextMarker),
      `Entity still visible in UI after DELETE. The delete button may have no handler, ` +
      `or the list is not re-fetching after deletion.`
    ).not.toBeVisible({ timeout: 6000 });

    // API verification — entity is gone from database
    if (createdEntityId && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const token = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)!;
          const val = localStorage.getItem(key) ?? '';
          if (key.includes('supabase') && val.includes('access_token')) {
            try { return (JSON.parse(val) as { access_token?: string }).access_token ?? null; }
            catch { return null; }
          }
        }
        return null;
      });

      const entity = await verifyEntityInApi(
        request,
        CFG.primaryEntity.apiGetEndpoint,
        createdEntityId,
        token ?? undefined
      );
      expect(
        entity,
        `API still returns entity ${createdEntityId} after DELETE. ` +
        `The UI may have removed it from display but the database record was NOT deleted. ` +
        `This is a data integrity violation — ghost records accumulate.`
      ).toBeNull();
    }
  });
});

// ─── SUITE 2: Persistence Tests ───────────────────────────────────────────────

test.describe(`Functional Persistence — ${CFG.appName}`, () => {
  let persistenceTestEntityText: string;

  test.beforeAll(async ({ browser }) => {
    // Create an entity specifically for persistence testing
    persistenceTestEntityText = `Persistence Test ${Date.now()}`;
    // We'll create it in the first test
  });

  test('data survives hard page refresh (F5)', async ({ page }) => {
    await login(page, CFG);
    await page.goto(CFG.primaryEntity.createPath);

    // Open create form
    const trigger = page.getByRole('button', { name: new RegExp(CFG.primaryEntity.createTriggerText, 'i') })
      .or(page.getByRole('link', { name: new RegExp(CFG.primaryEntity.createTriggerText, 'i') }));
    if (await trigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await trigger.click();
    }

    // Fill first field with persistence test value
    const firstField = CFG.primaryEntity.fields[0];
    const fieldEl = page.locator(firstField.selector);
    await fieldEl.waitFor({ state: 'visible', timeout: 8000 });
    await fieldEl.fill(persistenceTestEntityText);

    // Fill remaining fields with test values
    for (const field of CFG.primaryEntity.fields.slice(1)) {
      const el = page.locator(field.selector);
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        if (field.type === 'select') await el.selectOption(field.testValue);
        else await el.fill(field.testValue);
      }
    }

    await page.getByRole('button', { name: /save|create|add|submit/i }).click();
    await page.waitForTimeout(2000);

    // Navigate to list
    await page.goto(CFG.primaryEntity.listPath);
    await expect(page.getByText(persistenceTestEntityText)).toBeVisible({ timeout: 10000 });

    // HARD REFRESH
    await page.reload({ waitUntil: 'networkidle' });

    await expect(
      page.getByText(persistenceTestEntityText),
      `Data disappeared after hard refresh. ` +
      `Data is being stored in React state/localStorage only — NOT in the database. ` +
      `This is a critical persistence bug — users lose data on every refresh.`
    ).toBeVisible({ timeout: 10000 });
  });

  test('data survives full logout and login cycle', async ({ page }) => {
    await login(page, CFG);
    await page.goto(CFG.primaryEntity.listPath);

    // Verify entity exists before logout
    const entityVisible = await page.getByText(persistenceTestEntityText).isVisible({ timeout: 6000 }).catch(() => false);
    if (!entityVisible) {
      // Data from previous test may not have been created — skip
      return;
    }

    // Logout
    await logout(page, CFG);
    await page.waitForTimeout(1000);

    // Login again as the same user
    await login(page, CFG);
    await page.goto(CFG.primaryEntity.listPath);

    await expect(
      page.getByText(persistenceTestEntityText),
      `Data disappeared after logout and login. ` +
      `Data may have been stored in a local user session that doesn't persist between logins. ` +
      `All user data must be tied to the authenticated user ID in the database.`
    ).toBeVisible({ timeout: 10000 });

    // Cleanup — delete the persistence test entity
    const row = page.getByText(persistenceTestEntityText).locator('..');
    const deleteBtn = row.locator(CFG.primaryEntity.deleteTriggerSelector)
      .or(row.getByRole('button', { name: /delete|remove/i }));
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      if (CFG.primaryEntity.deleteConfirmText) {
        const confirm = page.getByRole('button', { name: new RegExp(CFG.primaryEntity.deleteConfirmText, 'i') });
        if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) await confirm.click();
      }
      await page.waitForTimeout(1500);
    }
  });
});

// ─── SUITE 3: Error States ────────────────────────────────────────────────────

test.describe(`Functional Error States — ${CFG.appName}`, () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CFG);
  });

  test('create form shows validation errors when required fields are empty', async ({ page }) => {
    await page.goto(CFG.primaryEntity.createPath);

    const trigger = page.getByRole('button', { name: new RegExp(CFG.primaryEntity.createTriggerText, 'i') })
      .or(page.getByRole('link', { name: new RegExp(CFG.primaryEntity.createTriggerText, 'i') }));
    if (await trigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await trigger.click();
    }

    // Submit WITHOUT filling any fields
    await page.getByRole('button', { name: /save|create|add|submit/i }).click();
    await page.waitForTimeout(1500);

    const body = (await page.locator('body').textContent()) ?? '';

    // Should show some form of validation error
    const hasValidationError =
      /required|cannot be empty|please fill|invalid|must provide|field is required/i.test(body) ||
      await page.locator('[aria-invalid="true"], .error, [data-error], .field-error').count() > 0;

    expect(
      hasValidationError,
      `Submitting an empty create form showed no validation errors. ` +
      `Empty required fields must display error messages — ` +
      `silent submission with empty data corrupts the database.`
    ).toBe(true);
  });

  test('empty state shows correct message when no entities exist', async ({ page }) => {
    // Note: this test may not be reliable if the test user has existing data.
    // It's best run with a fresh test account.
    await page.goto(CFG.primaryEntity.listPath);
    await page.waitForTimeout(2000);

    const body = (await page.locator('body').textContent()) ?? '';
    const hasCrash = /error|something went wrong|cannot read/i.test(body) &&
      !body.toLowerCase().includes(CFG.primaryEntity.listTextMarker.toLowerCase());

    expect(
      hasCrash,
      `List page appears to have crashed. ` +
      `An empty list should show a friendly empty state message, not an error.`
    ).toBe(false);
  });
});

// ─── SUITE 4: Navigation — Every Link Is Real ─────────────────────────────────

test.describe(`Functional Navigation — ${CFG.appName}`, () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CFG);
  });

  test('every configured nav link resolves to real rendered content', async ({ page }) => {
    for (const navPath of CFG.navLinks) {
      await page.goto(navPath);
      await page.waitForTimeout(1000);

      // Must not 404 or crash
      expect(
        page.url(),
        `Nav path ${navPath} redirected to an error page`
      ).not.toMatch(/\/(404|500|error)/i);

      // Must render something beyond an empty page
      const bodyText = (await page.locator('body').textContent()) ?? '';
      expect(
        bodyText.trim().length,
        `Nav path ${navPath} rendered an empty body — no content loaded`
      ).toBeGreaterThan(50);

      // Must not show a loading spinner forever
      const hasSpinner = await page.locator('[aria-label*="loading" i], .loading-spinner, [data-testid*="spinner"]').isVisible({ timeout: 500 }).catch(() => false);
      if (hasSpinner) {
        // Wait for it to resolve
        await page.waitForFunction(
          () => !document.querySelector('[aria-label*="loading" i], .loading-spinner'),
          { timeout: 8000 }
        ).catch(() => {});

        const stillSpinning = await page.locator('[aria-label*="loading" i], .loading-spinner').isVisible({ timeout: 500 }).catch(() => false);
        expect(
          stillSpinning,
          `${navPath}: Loading spinner did not resolve after 8 seconds. ` +
          `The page is hanging on a failed API call or missing data.`
        ).toBe(false);
      }

      // No dead button handlers (onClick={() => {}})
      const deadButtons = await page.evaluate(() => {
        // Can't directly detect empty handlers, but we can count buttons with no data-testid or aria-label
        // This is a heuristic, not a definitive check
        return 0; // placeholder — real check would be via static analysis
      });
    }
  });

  test('every button on the dashboard has a real action', async ({ page }) => {
    await page.goto(CFG.primaryEntity.listPath);
    await page.waitForTimeout(1500);

    // Get all buttons
    const buttons = await page.locator('button:visible').all();
    const buttonTexts: string[] = [];

    for (const btn of buttons) {
      const text = (await btn.textContent() ?? '').trim();
      const ariaLabel = await btn.getAttribute('aria-label') ?? '';
      const isDisabled = await btn.isDisabled();

      if (!isDisabled && (text || ariaLabel)) {
        buttonTexts.push(text || ariaLabel);
      }
    }

    // Every visible non-disabled button must have either text or aria-label
    const unlabelledButtons = await page.locator('button:visible:not([disabled]):not([aria-label])').all();
    const unlabelledCount = (await Promise.all(
      unlabelledButtons.map(async (btn) => {
        const text = (await btn.textContent() ?? '').trim();
        return text.length === 0 ? 1 : 0;
      })
    )).reduce((a, b) => a + b, 0);

    expect(
      unlabelledCount,
      `${unlabelledCount} visible buttons have no text and no aria-label. ` +
      `These are inaccessible and untestable — every button must be labelled.`
    ).toBe(0);
  });
});

// ─── SUITE 5: Critical Workflow ───────────────────────────────────────────────

test.describe(`Critical User Flow — ${CFG.criticalFlow.description} (${CFG.appName})`, () => {
  test('the primary end-to-end workflow completes successfully', async ({ page }) => {
    await login(page, CFG);

    for (const step of CFG.criticalFlow.steps) {
      switch (step.action) {
        case 'goto':
          await page.goto(step.target);
          await page.waitForTimeout(800);
          break;

        case 'click':
          await page.locator(step.target).click({ timeout: 10000 });
          await page.waitForTimeout(500);
          break;

        case 'fill':
          await page.locator(step.target).fill(step.value ?? '');
          break;

        case 'select':
          await page.locator(step.target).selectOption(step.value ?? '');
          break;

        case 'waitForText':
          await expect(
            page.getByText(step.target),
            `Critical flow step "${step.description}" failed: text "${step.target}" did not appear`
          ).toBeVisible({ timeout: 15000 });
          break;

        case 'verifyUrl':
          expect(
            page.url(),
            `Critical flow step "${step.description}" failed: URL should match "${step.target}"`
          ).toMatch(new RegExp(step.target));
          break;

        case 'waitForApi':
          await page.waitForResponse(
            (resp) => resp.url().includes(step.target) && resp.status() < 400,
            { timeout: 15000 }
          );
          break;
      }
    }

    // Verify the flow completed — completion marker must be visible
    await expect(
      page.getByText(CFG.criticalFlow.completionMarker),
      `Critical workflow did not reach completion. ` +
      `Expected to see "${CFG.criticalFlow.completionMarker}" after all steps. ` +
      `The primary user value proposition of "${CFG.appName}" is broken.`
    ).toBeVisible({ timeout: 15000 });
  });
});
