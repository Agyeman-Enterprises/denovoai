import { Page } from '@playwright/test'

export async function createRun(page: Page, prompt: string): Promise<void> {
  await page.getByTestId('run-prompt-input').fill(prompt)
  await page.getByTestId('create-primary').click()
  // Wait for loading state to settle
  await page.waitForTimeout(500)
}

export async function searchRuns(page: Page, query: string): Promise<void> {
  const input = page.getByTestId('search-primary')
  await input.fill(query)
}

// Generic aliases for contract compatibility
export const createItem = createRun

export const deleteItem = async (_page: Page, _name: string): Promise<void> => {
  // denovoai has no delete UI — no-op per contract
}
