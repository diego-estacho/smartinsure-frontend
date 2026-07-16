import { test, expect } from '@playwright/test'

// RN-005 — jornada de autenticação (guarda de rota e tela de login).
test.describe('RN-005 autenticação', () => {
  test('sem sessão, a landing redireciona para a tela de login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  })

  test('a tela de login valida forma antes de enviar', async ({ page }) => {
    await page.goto('/login')
    // Interage após a hidratação — clique nativo pré-Vue faria submit de verdade.
    await page.waitForLoadState('networkidle')
    await page.getByLabel('E-mail').fill('nao-e-email')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('E-mail inválido')).toBeVisible()
    await expect(page.getByText('Campo obrigatório')).toBeVisible()
  })

  test('com sessão (dev-auth, ADR-009), a landing carrega', async ({ page }) => {
    const response = await page.request.post('/api/auth/dev-login')
    expect(response.ok()).toBeTruthy()

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'SmartInsure' })).toBeVisible()
  })
})
