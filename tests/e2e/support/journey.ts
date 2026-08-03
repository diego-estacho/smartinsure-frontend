/**
 * Passos compartilhados da jornada de Usuários e Perfis (RN-062..RN-074).
 *
 * O convite é criado pela UI, como o usuário faz. O token de primeiro acesso, porém, só existe em
 * dois lugares: no e-mail enviado e como hash no banco (SHA-256, one-way) — a API nunca o devolve.
 * Para seguir a jornada sem depender de caixa de e-mail, o teste substitui o hash do convite recém
 * criado pelo hash de um token que ele conhece (`forceInvitationToken`). Todo o resto do fluxo
 * permanece real: identidade no Casdoor, senha definida pelo servidor e login com a senha nova.
 */
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import {
  addCasdoorUser,
  getCasdoorUser,
  hashToken,
  setCasdoorPassword,
  sql,
  sqlLiteral,
  sqlScalar,
} from './dev-backend'

const API_BASE_URL = process.env.NUXT_BACKEND_BASE_URL ?? 'http://localhost:5158'

/** Administrador do Sistema de E2E: e-mail fixo, para a execução ser repetível. */
export const SYSTEM_ADMINISTRATOR = {
  name: 'E2E Administrador do Sistema',
  email: 'e2e.admin@teste.com.br',
  password: 'E2e@Smart2026',
}

export interface JourneyTarget {
  brokerageId: string
  brokerageName: string
  policyHolderId: string
  policyHolderName: string
}

/**
 * A jornada só roda contra a API de verdade — sem ela, o convite não cria identidade e o primeiro
 * acesso não define senha. Falha com instrução em vez de erro obscuro de rede.
 */
export async function requireRunningApi(): Promise<void> {
  let ok: boolean

  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    ok = response.ok
  }
  catch {
    ok = false
  }

  if (!ok) {
    throw new Error(
      `A API não respondeu em ${API_BASE_URL}/health. Suba o backend antes desta suíte `
      + '(dotnet run --project smartinsure-backend/src/SmartInsure.Api).',
    )
  }
}

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`
}

export function journeyEmail(role: string, suffix: string): string {
  return `e2e.${role}.${suffix}@teste.com.br`
}

/**
 * Garante um Administrador do Sistema Ativo com senha conhecida: identidade no Casdoor e registro
 * em `Users` com o Perfil fixo SystemAdministrator. Idempotente — reexecutar apenas realinha.
 */
export async function ensureSystemAdministrator(): Promise<void> {
  const { name, email, password } = SYSTEM_ADMINISTRATOR

  const existingIdentity = await getCasdoorUser(email)

  if (!existingIdentity) {
    await addCasdoorUser(name, email, password)
  }

  // Vale para os dois casos: identidade nova nasce com a senha, existente é realinhada.
  await setCasdoorPassword(email, password)

  const identity = await getCasdoorUser(email)

  if (!identity) {
    throw new Error(`Identidade de ${email} não encontrada no Casdoor após a criação.`)
  }

  const profileId = sqlScalar(
    'SELECT CAST(Id AS varchar(40)) FROM Profiles WHERE Name = \'SystemAdministrator\'',
  )

  if (!profileId) {
    throw new Error('Perfil fixo SystemAdministrator ausente no banco de dev.')
  }

  const userId = sqlScalar(
    `SELECT CAST(Id AS varchar(40)) FROM Users WHERE Email = '${sqlLiteral(email)}'`,
  )

  if (userId) {
    sql(
      `UPDATE Users SET Status = 'Active', ExternalIdentity = '${sqlLiteral(identity.id)}', `
      + `ProfileId = '${profileId}', UpdatedAt = SYSUTCDATETIME(), UpdatedBy = 'e2e' `
      + `WHERE Id = '${userId}'`,
    )

    return
  }

  sql(
    'INSERT INTO Users (Id, Name, Email, ExternalIdentity, Status, CreatedAt, CreatedBy, ProfileId) '
    + `VALUES (NEWID(), '${sqlLiteral(name)}', '${sqlLiteral(email)}', `
    + `'${sqlLiteral(identity.id)}', 'Active', SYSUTCDATETIME(), 'e2e', '${profileId}')`,
  )
}

/**
 * Corretora Ativa que tenha nomeação vigente com um Tomador — pré-condição da RN-068 (o Corretor
 * Administrador só cria Tomador Administrador para Tomador nomeado à corretora ativa).
 */
export function findBrokerageWithActiveAppointment(): JourneyTarget {
  const [row] = sql(
    'SELECT TOP 1 CAST(b.Id AS varchar(40)), b.Name, CAST(h.Id AS varchar(40)), h.Name '
    + 'FROM PolicyHolderAppointments a '
    + 'JOIN Persons b ON b.Id = a.BrokerageId '
    + 'JOIN PersonRoles br ON br.PersonId = b.Id AND br.Role = \'Broker\' AND br.Status = \'Active\' '
    + 'JOIN Persons h ON h.Id = a.PolicyHolderId '
    + 'WHERE a.Status = \'Active\' '
    + 'ORDER BY b.Name',
  )

  if (!row) {
    throw new Error(
      'Nenhuma corretora ativa com nomeação vigente no banco de dev. '
      + 'A jornada RN-068 depende dessa pré-condição.',
    )
  }

  const [brokerageId, brokerageName, policyHolderId, policyHolderName] = row
    .split('|')
    .map(column => column.trim())

  return {
    brokerageId: brokerageId!,
    brokerageName: brokerageName!,
    policyHolderId: policyHolderId!,
    policyHolderName: policyHolderName!,
  }
}

/**
 * Troca o hash do convite pendente do Usuário pelo hash de um token conhecido e devolve o token.
 * Necessário porque o token plano só vai no e-mail (ver cabeçalho do módulo).
 */
export function forceInvitationToken(email: string): string {
  const invitationId = sqlScalar(
    'SELECT TOP 1 CAST(i.Id AS varchar(40)) FROM Invitations i '
    + 'JOIN Users u ON u.Id = i.UserId '
    + `WHERE u.Email = '${sqlLiteral(email)}' AND i.ConsumedAtUtc IS NULL `
    + 'ORDER BY i.CreatedAt DESC',
  )

  if (!invitationId) {
    throw new Error(`Nenhum convite pendente para ${email} — o convite não foi criado.`)
  }

  const plainToken = `e2e-${uniqueSuffix()}-${Math.random().toString(36).slice(2)}`

  sql(
    `UPDATE Invitations SET TokenHash = '${hashToken(plainToken)}', `
    + `UpdatedAt = SYSUTCDATETIME(), UpdatedBy = 'e2e' WHERE Id = '${invitationId}'`,
  )

  return plainToken
}

export function userStatus(email: string): string | null {
  return sqlScalar(`SELECT Status FROM Users WHERE Email = '${sqlLiteral(email)}'`)
}

/**
 * Preenche o campo e confirma que o valor sobreviveu. Até a hidratação terminar (SSR + Suspense),
 * o Vue reidrata o input e descarta o que o `fill` escreveu — o formulário seguia vazio.
 */
async function fillHydrated(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector)

  await field.fill(value)
  await expect(field).toHaveValue(value, { timeout: 2_000 })
}

/**
 * Preenche e submete reintentando, mesmo motivo do `openDialog`: antes da hidratação o valor é
 * descartado e o clique cai sem handler. Cada tentativa refaz o preenchimento do zero.
 */
async function submitFormUntilLeaves(
  page: Page,
  fields: readonly (readonly [string, string])[],
  buttonName: string,
  stayedPattern: RegExp,
): Promise<void> {
  await expect(async () => {
    for (const [selector, value] of fields) {
      await fillHydrated(page, selector, value)
    }

    await page.getByRole('button', { name: buttonName }).click()
    await expect(page).not.toHaveURL(stayedPattern, { timeout: 8_000 })
  }).toPass({ timeout: 45_000 })
}

/** Login pela tela, com as credenciais reais validadas no provedor de identidade (RN-005). */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')

  // Sessão estabelecida: o servidor emitiu o acesso e o app saiu da tela de login.
  await submitFormUntilLeaves(
    page,
    [['#login-email', email], ['#login-password', password]],
    'Entrar',
    /\/login/,
  )
}

/** Primeiro acesso pela tela: o convidado define a própria senha e passa de Pendente a Ativo. */
export async function completeFirstAccess(
  page: Page,
  plainToken: string,
  password: string,
): Promise<void> {
  await page.goto(`/invite?token=${encodeURIComponent(plainToken)}`)

  // RN-065: concluída a definição, o Usuário entra direto — a tela de convite fica para trás.
  await submitFormUntilLeaves(
    page,
    [['#invite-password', password], ['#invite-password-confirmation', password]],
    'Concluir primeiro acesso',
    /\/invite/,
  )
}

/** Abre o dialog reclicando quando a hidratação ainda não anexou o handler (SSR + Suspense). */
export async function openDialog(page: Page, buttonName: string): Promise<void> {
  await expect(async () => {
    await page.getByRole('button', { name: buttonName }).click()
    await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 20_000 })
}

/** Vuetify: o wrapper `.v-field__input` intercepta o clique do input do select. */
export async function selectOption(page: Page, label: string, optionName: string | RegExp): Promise<void> {
  const dialog = page.locator('.v-dialog')

  await dialog.getByLabel(label).click({ force: true })
  await page.getByRole('option', { name: optionName }).click()
}
