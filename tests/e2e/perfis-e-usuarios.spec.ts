/**
 * Jornada de Perfis e Usuários contra o ambiente de dev real — RN-062..RN-074.
 *
 * Diferente dos outros E2E desta pasta, aqui nada é mockado: o convite cria identidade no Casdoor,
 * o primeiro acesso define a senha de verdade e o login seguinte usa essa senha. É o único jeito de
 * cobrir a cadeia inteira, onde estão os defeitos de integração.
 *
 * A ordem importa: cada etapa usa o Usuário que a anterior ativou. Por isso `describe.serial` e
 * estado no módulo. Os registros criados ficam no ambiente de dev (sem teardown), com prefixo
 * `e2e.` no e-mail e sufixo aleatório por execução.
 *
 * Pré-requisito: a API rodando em NUXT_BACKEND_BASE_URL (padrão http://localhost:5158).
 */
import { expect, test } from '@playwright/test'
import {
  SYSTEM_ADMINISTRATOR,
  completeFirstAccess,
  ensureSystemAdministrator,
  findBrokerageWithActiveAppointment,
  forceInvitationToken,
  journeyEmail,
  loginViaUi,
  openDialog,
  requireRunningApi,
  selectOption,
  uniqueSuffix,
  userStatus,
} from './support/journey'

const suffix = uniqueSuffix()

const brokerageAdministrator = {
  name: 'E2E Corretor Administrador',
  email: journeyEmail('corretor-admin', suffix),
  password: 'E2e@Corretor2026',
}

const brokerageUser = {
  name: 'E2E Corretor',
  email: journeyEmail('corretor', suffix),
}

const policyHolderAdministrator = {
  name: 'E2E Tomador Administrador',
  email: journeyEmail('tomador-admin', suffix),
  password: 'E2e@Tomador2026',
}

const policyHolderUser = {
  name: 'E2E Usuario Tomador',
  email: journeyEmail('tomador', suffix),
}

const brokerageProfileName = `E2E Perfil Corretora ${suffix}`
const policyHolderProfileName = `E2E Perfil Tomador ${suffix}`

let target: ReturnType<typeof findBrokerageWithActiveAppointment>

test.describe.configure({ mode: 'serial' })

test.describe('Jornada de Perfis e Usuários (RN-062..RN-074)', () => {
  test.beforeAll(async () => {
    await requireRunningApi()
    await ensureSystemAdministrator()
    target = findBrokerageWithActiveAppointment()
  })

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('RN-066: Administrador do Sistema convida Corretor Administrador', async ({ page }) => {
    await loginViaUi(page, SYSTEM_ADMINISTRATOR.email, SYSTEM_ADMINISTRATOR.password)

    await page.goto('/usuarios')
    await page.waitForLoadState('networkidle')
    await openDialog(page, 'Convidar corretor administrador')

    const dialog = page.locator('.v-dialog')
    await dialog.getByLabel('Nome').fill(brokerageAdministrator.name)
    await dialog.getByLabel('E-mail').fill(brokerageAdministrator.email)
    await selectOption(page, 'Corretoras', target.brokerageName)
    // O select é múltiplo: fecha o menu antes de submeter.
    await page.keyboard.press('Escape')
    await dialog.getByRole('button', { name: 'Enviar convite' }).click()

    await expect(page.getByText(`Convite enviado para ${brokerageAdministrator.email}`))
      .toBeVisible({ timeout: 30_000 })

    // RN-065: nasce Pendente e só o primeiro acesso o ativa.
    expect(userStatus(brokerageAdministrator.email)).toBe('Pending')
  })

  test('RN-065: Corretor Administrador define a senha no primeiro acesso e entra', async ({ page }) => {
    const token = forceInvitationToken(brokerageAdministrator.email)

    await completeFirstAccess(page, token, brokerageAdministrator.password)

    expect(userStatus(brokerageAdministrator.email)).toBe('Active')

    // A senha recém-definida vale no provedor de identidade: novo login, sem o convite.
    await page.context().clearCookies()
    await loginViaUi(page, brokerageAdministrator.email, brokerageAdministrator.password)
    await expect(page).toHaveURL('/')
  })

  test('RN-065: convite é de uso único — reabrir o link recusa', async ({ page }) => {
    const consumedToken = forceInvitationToken(brokerageAdministrator.email)

    await page.goto(`/invite?token=${encodeURIComponent(consumedToken)}`)
    await page.locator('#invite-password').fill('OutraSenha@2026')
    await page.locator('#invite-password-confirmation').fill('OutraSenha@2026')
    await page.getByRole('button', { name: 'Concluir primeiro acesso' }).click()

    await expect(page.getByText(/expirado|já foi aceito|já ter sido usado/i))
      .toBeVisible({ timeout: 30_000 })
    await expect(page).toHaveURL(/\/invite/)
  })

  test('RN-069: Corretor Administrador cria Perfil no contexto da Corretora', async ({ page }) => {
    await loginViaUi(page, brokerageAdministrator.email, brokerageAdministrator.password)

    await page.goto('/perfis')
    await page.waitForLoadState('networkidle')
    await openDialog(page, 'Novo perfil')

    const dialog = page.locator('.v-dialog')
    await dialog.getByLabel('Nome do perfil').fill(brokerageProfileName)
    await dialog.getByRole('button', { name: 'Criar perfil' }).click()

    await expect(page.getByText(`Perfil ${brokerageProfileName} criado.`))
      .toBeVisible({ timeout: 30_000 })

    // O escopo não é escolhido no formulário: o servidor o deriva do contexto ativo (RN-069).
    await page.getByPlaceholder('Buscar por nome do perfil').fill(brokerageProfileName)
    await page.waitForLoadState('networkidle')

    const row = page.getByRole('row', { name: new RegExp(brokerageProfileName) })
    await expect(row.getByText('Corretora')).toBeVisible()
    await expect(row.getByText('Customizado')).toBeVisible()
  })

  test('RN-069/RN-072: Corretor Administrador cria Usuário da Corretora com o Perfil novo', async ({ page }) => {
    await loginViaUi(page, brokerageAdministrator.email, brokerageAdministrator.password)

    await page.goto('/usuarios')
    await page.waitForLoadState('networkidle')
    await openDialog(page, 'Novo usuário')

    const dialog = page.locator('.v-dialog')
    await dialog.getByLabel('Nome').fill(brokerageUser.name)
    await dialog.getByLabel('E-mail').fill(brokerageUser.email)
    await selectOption(page, 'Perfil', brokerageProfileName)

    // Perfil de escopo Corretora não pede Tomador.
    await expect(dialog.getByLabel('Tomador')).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Enviar convite' }).click()

    await expect(page.getByText(`Convite enviado para ${brokerageUser.email}`))
      .toBeVisible({ timeout: 30_000 })
    expect(userStatus(brokerageUser.email)).toBe('Pending')
  })

  test('RN-072: o Corretor Administrador nunca oferece o próprio Perfil', async ({ page }) => {
    await loginViaUi(page, brokerageAdministrator.email, brokerageAdministrator.password)

    await page.goto('/usuarios')
    await page.waitForLoadState('networkidle')
    await openDialog(page, 'Novo usuário')

    const dialog = page.locator('.v-dialog')
    await dialog.getByLabel('Perfil').click({ force: true })

    // RN-069: quem concede Corretor Administrador é o Administrador do Sistema (RN-066).
    await expect(page.getByRole('option', { name: 'Corretor Administrador', exact: true }))
      .toHaveCount(0)
    // RN-068: o Tomador Administrador está entre os oferecidos.
    await expect(page.getByRole('option', { name: 'Tomador Administrador' })).toBeVisible()
  })

  test('RN-068: Corretor Administrador convida Tomador Administrador do Tomador nomeado', async ({ page }) => {
    await loginViaUi(page, brokerageAdministrator.email, brokerageAdministrator.password)

    await page.goto('/usuarios')
    await page.waitForLoadState('networkidle')
    await openDialog(page, 'Novo usuário')

    const dialog = page.locator('.v-dialog')
    await dialog.getByLabel('Nome').fill(policyHolderAdministrator.name)
    await dialog.getByLabel('E-mail').fill(policyHolderAdministrator.email)
    await selectOption(page, 'Perfil', 'Tomador Administrador')

    // Perfil de escopo Tomador exige escolher o Tomador — ele precisa ter nomeação vigente.
    await selectOption(page, 'Tomador', new RegExp(target.policyHolderName.slice(0, 20)))
    await dialog.getByRole('button', { name: 'Enviar convite' }).click()

    await expect(page.getByText(`Convite enviado para ${policyHolderAdministrator.email}`))
      .toBeVisible({ timeout: 30_000 })
    expect(userStatus(policyHolderAdministrator.email)).toBe('Pending')
  })

  test('RN-065: Tomador Administrador faz o primeiro acesso e entra', async ({ page }) => {
    const token = forceInvitationToken(policyHolderAdministrator.email)

    await completeFirstAccess(page, token, policyHolderAdministrator.password)

    expect(userStatus(policyHolderAdministrator.email)).toBe('Active')

    await page.context().clearCookies()
    await loginViaUi(page, policyHolderAdministrator.email, policyHolderAdministrator.password)
    await expect(page).toHaveURL('/')
  })

  test('RN-070: Tomador Administrador cria Perfil no contexto do Tomador', async ({ page }) => {
    await loginViaUi(page, policyHolderAdministrator.email, policyHolderAdministrator.password)

    await page.goto('/perfis')
    await page.waitForLoadState('networkidle')
    await openDialog(page, 'Novo perfil')

    const dialog = page.locator('.v-dialog')
    await dialog.getByLabel('Nome do perfil').fill(policyHolderProfileName)
    await dialog.getByRole('button', { name: 'Criar perfil' }).click()

    await expect(page.getByText(`Perfil ${policyHolderProfileName} criado.`))
      .toBeVisible({ timeout: 30_000 })

    // Mesmo formulário, contexto diferente: o escopo derivado agora é Tomador.
    await page.getByPlaceholder('Buscar por nome do perfil').fill(policyHolderProfileName)
    await page.waitForLoadState('networkidle')

    const row = page.getByRole('row', { name: new RegExp(policyHolderProfileName) })
    await expect(row.getByText('Tomador')).toBeVisible()
    await expect(row.getByText('Customizado')).toBeVisible()
  })

  test('RN-070/RN-072: Tomador Administrador cria Usuário do Tomador ativo', async ({ page }) => {
    await loginViaUi(page, policyHolderAdministrator.email, policyHolderAdministrator.password)

    await page.goto('/usuarios')
    await page.waitForLoadState('networkidle')
    await openDialog(page, 'Novo usuário')

    const dialog = page.locator('.v-dialog')
    await dialog.getByLabel('Nome').fill(policyHolderUser.name)
    await dialog.getByLabel('E-mail').fill(policyHolderUser.email)
    await selectOption(page, 'Perfil', policyHolderProfileName)

    // RN-070: para o Tomador Administrador o Tomador é o ativo dele — não há escolha.
    await expect(dialog.getByLabel('Tomador')).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Enviar convite' }).click()

    await expect(page.getByText(`Convite enviado para ${policyHolderUser.email}`))
      .toBeVisible({ timeout: 30_000 })
    expect(userStatus(policyHolderUser.email)).toBe('Pending')
  })

  test('RN-072: o Tomador Administrador nunca oferece o próprio Perfil', async ({ page }) => {
    await loginViaUi(page, policyHolderAdministrator.email, policyHolderAdministrator.password)

    await page.goto('/usuarios')
    await page.waitForLoadState('networkidle')
    await openDialog(page, 'Novo usuário')

    await page.locator('.v-dialog').getByLabel('Perfil').click({ force: true })

    await expect(page.getByRole('option', { name: 'Tomador Administrador' })).toHaveCount(0)
    // Perfil fixo do escopo continua oferecido — a lista nunca fica vazia por si só.
    await expect(page.getByRole('option', { name: 'Tomador' })).toBeVisible()
  })
})
