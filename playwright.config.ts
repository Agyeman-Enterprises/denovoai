import { defineConfig, devices } from '@playwright/test'

const nodeExe = process.execPath
const nextBin = 'C:\\DEV\\denovoai\\node_modules\\next\\dist\\bin\\next'
const studioDir = 'apps/studio'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  webServer: {
    command: `"${nodeExe}" "${nextBin}" dev -p 3004`,
    cwd: studioDir,
    port: 3004,
    timeout: 120_000,
    reuseExistingServer: true,
    env: {
      ...process.env as Record<string, string>,
      NODE_ENV: 'development',
    },
  },
  use: {
    baseURL: process.env.E2E_URL ?? 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  timeout: 30_000,
})
