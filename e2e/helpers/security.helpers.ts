/**
 * Security Header & Configuration Helpers
 *
 * Checks OWASP-recommended security headers and hygiene for every AE app.
 * HIPAA Technical Safeguard basis: 45 CFR §164.312(c)(2) — Transmission integrity.
 */

import type { Page, Response } from '@playwright/test';

// ─── Header Check Types ───────────────────────────────────────────────────────

export interface HeaderCheckResult {
  header: string;
  present: boolean;
  value: string | null;
  compliant: boolean;
  issue: string | null;
}

// ─── Required Header Assertions ───────────────────────────────────────────────

/**
 * Assert that a response does NOT include X-Powered-By.
 * This header fingerprints the framework (Next.js, Express, etc.).
 */
export function assertNoPoweredByHeader(response: Response): void {
  const val = response.headers()['x-powered-by'];
  if (val) {
    throw new Error(
      `X-Powered-By: "${val}" exposes the tech stack. ` +
      'Disable in next.config.ts: poweredByHeader: false'
    );
  }
}

/**
 * Assert X-Content-Type-Options: nosniff is present.
 * Without this, browsers may MIME-sniff responses and execute arbitrary scripts.
 */
export function assertContentTypeOptions(response: Response): void {
  const val = response.headers()['x-content-type-options'];
  if (val?.toLowerCase() !== 'nosniff') {
    throw new Error(
      `X-Content-Type-Options is "${val ?? 'missing'}" — must be "nosniff". ` +
      'Add via Next.js headers() config or middleware.'
    );
  }
}

/**
 * Assert Referrer-Policy is set. Missing this header causes sensitive URL fragments
 * (including auth tokens and PHI-containing paths) to leak via the HTTP Referer header
 * to any third-party resource loaded on the page.
 */
export function assertReferrerPolicy(response: Response): void {
  const val = response.headers()['referrer-policy'];
  if (!val) {
    throw new Error(
      'Referrer-Policy header missing. ' +
      'PHI or auth tokens in URLs can leak to third-party analytics/CDN via HTTP Referer. ' +
      'Recommended: "strict-origin-when-cross-origin"'
    );
  }
}

/**
 * Run the full security header audit on a response.
 * Returns a report; use assertAllHeadersPass() to throw on any failure.
 */
export function auditSecurityHeaders(response: Response): HeaderCheckResult[] {
  const h = response.headers();

  return [
    {
      header: 'x-content-type-options',
      present: !!h['x-content-type-options'],
      value: h['x-content-type-options'] ?? null,
      compliant: h['x-content-type-options']?.toLowerCase() === 'nosniff',
      issue: h['x-content-type-options']?.toLowerCase() !== 'nosniff'
        ? 'Must be "nosniff" — prevents MIME-type sniffing attacks'
        : null,
    },
    {
      header: 'referrer-policy',
      present: !!h['referrer-policy'],
      value: h['referrer-policy'] ?? null,
      compliant: !!h['referrer-policy'],
      issue: !h['referrer-policy']
        ? 'Missing — PHI in URLs leaks to third-party origins via HTTP Referer'
        : null,
    },
    {
      header: 'x-powered-by',
      present: !!h['x-powered-by'],
      value: h['x-powered-by'] ?? null,
      // Compliant when ABSENT
      compliant: !h['x-powered-by'],
      issue: h['x-powered-by']
        ? `Should be removed — exposes "${h['x-powered-by']}" to attackers`
        : null,
    },
    {
      header: 'x-frame-options',
      present: !!h['x-frame-options'],
      value: h['x-frame-options'] ?? null,
      compliant: !h['x-frame-options'] || /^(DENY|SAMEORIGIN)$/i.test(h['x-frame-options']),
      issue: h['x-frame-options'] && !/^(DENY|SAMEORIGIN)$/i.test(h['x-frame-options'])
        ? `Invalid value "${h['x-frame-options']}" — use DENY or SAMEORIGIN`
        : null,
    },
    {
      header: 'strict-transport-security',
      present: !!h['strict-transport-security'],
      value: h['strict-transport-security'] ?? null,
      compliant: !h['strict-transport-security'] || h['strict-transport-security'].includes('max-age='),
      issue: h['strict-transport-security'] && !h['strict-transport-security'].includes('max-age=')
        ? `Malformed HSTS: "${h['strict-transport-security']}"`
        : null,
    },
  ];
}

// ─── CORS Checks ─────────────────────────────────────────────────────────────

/**
 * Assert wildcard CORS is not set on authenticated endpoints.
 * Access-Control-Allow-Origin: * on an auth'd API allows any site to read user data.
 */
export function assertNoWildcardCors(response: Response): void {
  const cors = response.headers()['access-control-allow-origin'];
  if (cors === '*') {
    throw new Error(
      `CRITICAL CORS misconfiguration: Access-Control-Allow-Origin: * on ${response.url()}. ` +
      'Wildcard CORS on authenticated endpoints allows any origin to read user data. ' +
      'Restrict to specific allowed origins.'
    );
  }
}

// ─── JS Bundle Scanner ────────────────────────────────────────────────────────

/**
 * Collect all JS bundle URLs currently referenced by the page.
 */
export async function collectJsBundleUrls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src]'))
      .map((s) => (s as HTMLScriptElement).src)
      .filter((src) => src && !src.includes('analytics') && !src.includes('gtm'))
  );
}

/**
 * Fetch a JS bundle and scan for secret key patterns using hardcoded literals.
 * Does NOT use dynamic RegExp construction (ReDoS-safe).
 */
export async function scanBundleForSecretFragments(
  page: Page,
  bundleUrl: string
): Promise<string[]> {
  const response = await page.request.get(bundleUrl);
  if (!response.ok()) return [];

  const content = await response.text();
  const violations: string[] = [];

  // Hardcoded prefix checks — not constructed from arguments
  const FORBIDDEN_PREFIXES = [
    'sk_live_',
    'whsec_',
    'BEGIN RSA PRIVATE KEY',
    'BEGIN EC PRIVATE KEY',
    'BEGIN PRIVATE KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'RESEND_API_KEY',
  ];

  for (const prefix of FORBIDDEN_PREFIXES) {
    if (content.includes(prefix)) {
      violations.push(`Secret fragment "${prefix}" found in bundle: ${bundleUrl}`);
    }
  }

  // Service role JWT detection: presence of "service_role" with JWT structure
  if (content.includes('service_role') && content.includes('eyJ')) {
    violations.push(`Possible service role JWT (service_role + eyJ) in bundle: ${bundleUrl}`);
  }

  return violations;
}

// ─── Sensitive Path Checks ────────────────────────────────────────────────────

/**
 * Verify that sensitive static paths are blocked (return non-200 status).
 */
export async function checkSensitivePathsBlocked(
  page: Page,
  baseUrl: string
): Promise<Array<{ path: string; status: number; violation: string | null }>> {
  const BLOCKED_PATHS = [
    '/.env',
    '/.env.local',
    '/.env.production',
    '/.env.development',
    '/.git/config',
    '/.git/HEAD',
    '/wp-admin',
    '/phpinfo.php',
  ];

  const results = [];
  for (const path of BLOCKED_PATHS) {
    const response = await page.request.get(`${baseUrl}${path}`);
    const status = response.status();
    results.push({
      path,
      status,
      violation: status === 200
        ? `CRITICAL: ${path} is publicly accessible (HTTP 200) — may expose secrets or server config`
        : null,
    });
  }
  return results;
}
