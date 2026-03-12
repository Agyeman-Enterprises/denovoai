import { FullConfig, chromium } from '@playwright/test'

async function globalSetup(_config: FullConfig) {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  const baseURL = process.env.E2E_URL ?? 'http://localhost:3004'

  if (!email || !password) {
    console.log('ℹ️  Global setup: no E2E credentials — auth tests will be skipped')
    return
  }

  console.log(`🔐 Global setup: pre-authenticating ${email}`)

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(`${baseURL}/login`, { timeout: 30_000 })
    await page.getByTestId('email-input').fill(email)
    await page.getByTestId('password-input').fill(password)
    await page.getByTestId('submit-auth').click()
    await page.waitForURL(`${baseURL}/`, { timeout: 15_000 })
    console.log('✅ Global setup: authenticated successfully')
  } catch (err) {
    console.warn('⚠️  Global setup: auth failed — auth tests may fail', err)
  } finally {
    await browser.close()
  }
}

export default globalSetup
