import { defineConfig, devices } from '@playwright/test'

const nodeExe = process.execPath
const nextBin = 'C:\\DEV\\denovoai\\node_modules\\next\\dist\\bin\\next'
const studioDir = 'apps/studio'

export default defineConfig({
  testDir: './e2e/specs',
  globalSetup: './e2e/global.setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  webServer: {
    command: `"${nodeExe}" "${nextBin}" dev -p 3004`,
    cwd: studioDir,
    port: 3004,
    timeout: 120_000,
    reuseExistingServer: true,
    env: {
      ...(process.env as Record<string, string>),
      NODE_ENV: 'development',
    },
  },
  use: {
    baseURL: process.env.E2E_URL ?? 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
    { name: 'mobile',  use: { ...devices['iPhone 13'] } },
  ],
  timeout: 30_000,
})
