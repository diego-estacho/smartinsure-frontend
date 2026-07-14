import { test, expect } from '@playwright/test'

// Smoke da jornada mínima: a landing sobe e mostra o nome do produto.
test('a landing carrega e exibe o nome do produto', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SmartInsure' })).toBeVisible()
})
