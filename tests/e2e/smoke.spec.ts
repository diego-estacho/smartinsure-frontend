import { test, expect } from '@playwright/test'

// Smoke da jornada mínima: com sessão (dev-auth, ADR-009), a landing sobe e
// mostra o nome do produto. Sem sessão, a guarda de rota manda pro login (RN-005).
test('a landing carrega e exibe o nome do produto', async ({ page }) => {
  const response = await page.request.post('/api/auth/dev-login')
  expect(response.ok()).toBeTruthy()

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SmartInsure' })).toBeVisible()
})
