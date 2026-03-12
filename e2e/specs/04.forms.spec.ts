import { test, expect } from '@playwright/test'
import { APP_CONTRACT } from '../contracts/app.contract'

test.describe('forms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_CONTRACT.routes.root)
  })

  test('create-run-form is present', async ({ page }) => {
    await expect(page.getByTestId(APP_CONTRACT.testIds.createRunForm)).toBeVisible()
  })

  test('run-prompt-input accepts text', async ({ page }) => {
    const input = page.getByTestId(APP_CONTRACT.testIds.runPromptInput)
    await input.fill('Test prompt for a todo app')
    await expect(input).toHaveValue('Test prompt for a todo app')
  })

  test('submit button is disabled when prompt is empty', async ({ page }) => {
    await expect(page.getByTestId(APP_CONTRACT.testIds.createPrimary)).toBeDisabled()
  })

  test('submit button is enabled when prompt is filled', async ({ page }) => {
    await page.getByTestId(APP_CONTRACT.testIds.runPromptInput).fill('Build a task app')
    await expect(page.getByTestId(APP_CONTRACT.testIds.createPrimary)).toBeEnabled()
  })

  test('prompt input has correct placeholder', async ({ page }) => {
    const input = page.getByTestId(APP_CONTRACT.testIds.runPromptInput)
    await expect(input).toHaveAttribute('placeholder', /describe/i)
  })

  test('form has correct aria label on input', async ({ page }) => {
    const input = page.getByLabel('Run prompt')
    await expect(input).toBeVisible()
  })

  test('search input has correct aria label', async ({ page }) => {
    const input = page.getByLabel('Search runs')
    await expect(input).toBeVisible()
  })
})
