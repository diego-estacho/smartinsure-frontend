/**
 * Jornada de Emissão da Apólice contra o ambiente de dev real — RN-500..RN-514.
 *
 * Nada é mockado: login no Casdoor, fan-out de Cotações no PlugV2 e pedido de emissão de verdade.
 * É o único jeito de provar a cadeia inteira do Passo 5 — os testes de unidade cobrem a regra, mas
 * não provam que o provedor aceita o payload.
 *
 * O cenário é montado no `beforeAll`: identidade no Casdoor, Usuário vinculado à Corretora que tem
 * Habilitações ativas e nomeação com o Tomador, e Segurado com endereço (a base de dev não tinha
 * nenhuma Pessoa com papel Insured). Os registros ficam no ambiente de dev, com prefixo `e2e.`.
 *
 * Pré-requisitos: API em NUXT_BACKEND_BASE_URL (padrão http://localhost:5158) e o catálogo de
 * Modalidades populado (o dev estava zerado; ver o roteiro da atividade).
 */
import { expect, test } from '@playwright/test'
import {
  addCasdoorUser,
  getCasdoorUser,
  setCasdoorPassword,
  sql,
  sqlLiteral,
  sqlScalar,
} from './support/dev-backend'
import { loginViaUi, requireRunningApi, uniqueSuffix } from './support/journey'

const suffix = uniqueSuffix()

/**
 * Cenário conhecido do gateway de QA: este Tomador, nesta Modalidade e nesta faixa de valor, tem
 * histórico de ofertas aceitas no ambiente. Sem isso o leque volta todo indisponível por regra de
 * crédito da Seguradora — veredito legítimo, mas que não exercita a emissão.
 */
const POLICY_HOLDER_DOCUMENT = '01294872000172'
const MODALITY_NAME = 'Licitante'
/** R$ 10.000,00: o campo monta o valor inteiro a partir dos dígitos digitados (não são centavos). */
const INSURED_AMOUNT_KEYSTROKES = '10000'

const corretor = {
  name: 'E2E Emissao Corretor',
  email: `e2e.emissao-${suffix}@teste.com.br`,
  password: 'E2e@Emissao2026',
}

/** Preenchido no setup: Corretora com Habilitação ativa + nomeação, e o par Tomador/Segurado. */
const cenario = {
  brokerageId: '',
  brokerageName: '',
  policyHolderName: '',
  policyHolderDocument: '',
  insuredDocument: '76417005000186',
}

/**
 * Corretora que consegue cotar de verdade: precisa de Habilitação ativa (senão o fan-out não tem a
 * quem pedir) E de nomeação vigente com um Tomador (senão o Tomador não aparece para o corretor).
 */
function resolveCenario(): void {
  // Duas condições que o ambiente de dev não garante sozinho:
  // - a Habilitação tem de apontar para o PlugV2 (`/plugv2`); havia Habilitações apontando para
  //   `/qa/garantia/api`, que responde 404 em /Cotation e derruba o leque inteiro;
  // - o Tomador tem de passar nas regras de crédito da Seguradora, senão tudo volta indisponível.
  //   O CNPJ do cenário é conhecido do QA (histórico de ofertas aceitas).
  const query = [
    'SELECT TOP 1 CAST(a.BrokerageId AS varchar(40))',
    "+ '|' + pb.Name + '|' + pt.Name + '|' + pt.DocumentNumber",
    'FROM PolicyHolderAppointments a',
    'JOIN Persons pb ON pb.Id = a.BrokerageId',
    'JOIN Persons pt ON pt.Id = a.PolicyHolderId',
    `WHERE pt.DocumentNumber = '${POLICY_HOLDER_DOCUMENT}'`,
    "AND EXISTS (SELECT 1 FROM BrokerageInsurerEnablements e",
    "            WHERE e.BrokerageId = a.BrokerageId AND e.Status = 'Active'",
    "              AND e.ConnectionParameters LIKE '%plugv2%')",
  ].join(' ')

  const row = sql(query)[0]

  if (!row) {
    throw new Error(
      `Cenário ausente no dev: nenhuma Corretora com Habilitação ativa apontando para o PlugV2 e `
      + `nomeação com o Tomador ${POLICY_HOLDER_DOCUMENT}. Sem isso o fan-out não tem a quem pedir.`,
    )
  }

  const [brokerageId, brokerageName, policyHolderName, policyHolderDocument] = row.split('|')
  Object.assign(cenario, { brokerageId, brokerageName, policyHolderName, policyHolderDocument })
}

/** Usuário real: identidade no Casdoor + Usuário Ativo vinculado à Corretora do cenário. */
async function ensureCorretor(): Promise<void> {
  if (!await getCasdoorUser(corretor.email)) {
    await addCasdoorUser(corretor.name, corretor.email, corretor.password)
  }

  await setCasdoorPassword(corretor.email, corretor.password)

  const identity = await getCasdoorUser(corretor.email)
  if (!identity) throw new Error(`Identidade de ${corretor.email} não criada no Casdoor.`)

  const profileId = sqlScalar(
    'SELECT CAST(Id AS varchar(40)) FROM Profiles WHERE Name = \'BrokerageAdministrator\'',
  )
  if (!profileId) throw new Error('Perfil fixo BrokerageAdministrator ausente no banco de dev.')

  sql(
    'INSERT INTO Users (Id, Name, Email, ExternalIdentity, Status, CreatedAt, CreatedBy, ProfileId) '
    + `VALUES (NEWID(), '${sqlLiteral(corretor.name)}', '${sqlLiteral(corretor.email)}', `
    + `'${sqlLiteral(identity.id)}', 'Active', SYSUTCDATETIME(), 'e2e-emissao', '${profileId}')`,
  )

  const userId = sqlScalar(
    `SELECT CAST(Id AS varchar(40)) FROM Users WHERE Email = '${sqlLiteral(corretor.email)}'`,
  )

  sql(
    'INSERT INTO UserBrokerageMemberships (Id, UserId, BrokerageId, ProfileId, CreatedAt, CreatedBy) '
    + `VALUES (NEWID(), '${userId}', '${cenario.brokerageId}', '${profileId}', SYSUTCDATETIME(), 'e2e-emissao')`,
  )
}

test.describe.configure({ mode: 'serial' })

test.describe('Jornada de Emissão da Apólice (RN-500..RN-514)', () => {
  test.beforeAll(async () => {
    await requireRunningApi()
    resolveCenario()
    await ensureCorretor()
  })

  test('RN-500/RN-514: cotar de verdade e solicitar a emissão da Cotação escolhida', async ({ page }) => {
    test.setTimeout(900_000)

    await loginViaUi(page, corretor.email, corretor.password)

    await page.goto('/ofertas/nova')
    await page.waitForLoadState('networkidle')

    // Escopo: cotar todas as Seguradoras habilitadas (padrão recomendado — RN-056).
    await page.getByRole('button', { name: 'Iniciar oferta' }).click()

    // Passo 1 — Tomador nomeado à Corretora ativa.
    await page.getByLabel('CNPJ ou razão social').fill(cenario.policyHolderDocument)
    await page.getByRole('button', { name: 'Buscar' }).click()
    // O nome aparece no card E no resumo lateral: ancora no card do passo para não ficar ambíguo.
    await expect(page.locator('.si-qg-step1__card-name')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Passo 2 — Segurado + escolha do endereço da oferta (RN-503).
    await page.getByLabel('CNPJ ou razão social do segurado').fill(cenario.insuredDocument)
    await page.getByRole('button', { name: 'Buscar' }).click()
    await expect(page.locator('.si-qg-step2__name')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('input[type="radio"]').first()).toBeVisible()
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Passo 3 — dados de risco. A vigência começa amanhã para não cair em retroatividade (RN-511).
    const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const fim = new Date(inicio.getTime() + 365 * 24 * 60 * 60 * 1000)
    // A tela mostra data em dd/MM/yyyy e a IS tem máscara de moeda: digita como o corretor digita.
    const br = (date: Date): string =>
      `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`

    // `exact` separa "Modalidade" de "Modalidade complementar (opcional)".
    await page.getByRole('combobox', { name: 'Modalidade', exact: true }).click({ force: true })
    await page.getByRole('combobox', { name: 'Modalidade', exact: true }).fill(MODALITY_NAME)
    await page.getByRole('option', { name: MODALITY_NAME, exact: true }).click()

    await page.getByLabel('Importância segurada (IS)').pressSequentially(INSURED_AMOUNT_KEYSTROKES)
    await page.getByLabel('Início de vigência').pressSequentially(br(inicio))
    await page.getByLabel('Fim de vigência').pressSequentially(br(fim))

    // Sem avançar às cegas: o rodapé só libera quando o passo está válido (validação de forma).
    await expect(page.getByText('Preencha modalidade, importância segurada e vigência para continuar.'))
      .toHaveCount(0, { timeout: 10_000 })

    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByText(/Consultando|Cotações da oferta|seguradora/i).first())
      .toBeVisible({ timeout: 90_000 })

    // Passo 4 — fan-out real: o leque preenche por polling (ADR-051).
    await expect(page.getByText(/Cotações|Consultando/i).first()).toBeVisible({ timeout: 60_000 })

    // O leque preenche por polling (RN-057/ADR-051) e a lentidão de UMA Seguradora não bloqueia as
    // outras: esperar que ninguém esteja mais "Cotando…" reprovava por uma Seguradora pendurada.
    // O que interessa ao corretor é a primeira Cotação seguível aparecer.
    const seguivel = page.getByRole('button', { name: 'Selecionar', exact: true }).first()

    await expect(page.getByText('Consultando seguradoras…')).toHaveCount(0, { timeout: 300_000 })
    await seguivel.waitFor({ state: 'visible', timeout: 300_000 }).catch(() => undefined)

    const leque = await page.locator('body').innerText()

    console.log('[E2E] Passo 4 — leque obtido:', leque.slice(0, 1500))

    const temSeguivel = await seguivel.isVisible().catch(() => false)

    if (!temSeguivel) {
      // Sem Cotação seguível não há o que emitir: o teste registra o veredito real das Seguradoras
      // em vez de fingir sucesso — é informação de integração, não defeito do Passo 5.
      throw new Error(
        'Nenhuma Cotação seguível voltou do provedor neste cenário. Veredito das Seguradoras:\n'
        + leque.slice(0, 2000),
      )
    }

    // A escolha tem de estar registrada antes de avançar: o botão vira "Selecionada" (RN-059). O leque
    // re-renderiza durante o polling e engole cliques, então reclica até a marcação pegar — mesmo
    // padrão que o E2E de jornada usa para hidratação.
    await expect(async () => {
      await seguivel.click({ force: true })
      await expect(page.getByRole('button', { name: 'Selecionada' }).first())
        .toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 90_000 })

    await page.getByRole('button', { name: 'Continuar' }).click()

    // Passo 5 — emissão. Se não abrir, o motivo está na tela (validação de forma ou confirmação de
    // subscrição): mostra o texto em vez de estourar um timeout mudo.
    const passo5 = page.getByText('Prêmio e comissão')

    if (!await passo5.isVisible().catch(() => false)) {
      await page.waitForTimeout(3_000)
    }

    if (!await passo5.isVisible().catch(() => false)) {
      throw new Error(`Passo 5 não abriu após escolher a Cotação. Tela:
${(await page.locator('body').innerText()).slice(0, 1200)}`)
    }

    await expect(passo5).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Número do contrato')).toHaveCount(0)

    await page.getByRole('combobox', { name: /Número de parcelas/ }).click({ force: true })
    await page.getByRole('option').first().click()
    await page.getByRole('combobox', { name: /Vencimento da 1ª parcela/ }).click({ force: true })
    await page.getByRole('option').first().click()

    // Estado antes do pedido: é a linha de base das asserções de RN-507/RN-511 no banco.
    const policiesAntes = Number(sqlScalar('SELECT CAST(COUNT(*) AS varchar(10)) FROM Policies'))
    const aceitesAntes = Number(sqlScalar('SELECT CAST(COUNT(*) AS varchar(10)) FROM TermAcceptances'))
    const grupoId = sqlScalar(
      'SELECT TOP 1 CAST(Id AS varchar(40)) FROM QuotationGroups ORDER BY CreatedAt DESC',
    )

    await page.getByRole('button', { name: 'Emitir' }).click()

    // RN-506: o Termo vem do servidor e o aceite é obrigatório.
    await expect(page.getByText('Termo e declaração')).toBeVisible({ timeout: 30_000 })
    await page.getByLabel('Li e aceito o termo e a declaração acima.').check()
    await page.getByRole('button', { name: 'Emitir apólice' }).click()

    // RN-508/RN-514: o desfecho é "Emissão solicitada" — nunca "Apólice emitida".
    await expect(page.getByText(/Emissão solicitada|Falha ao processar a emissão/))
      .toBeVisible({ timeout: 300_000 })

    const desfecho = await page.locator('body').innerText()
     
    console.log('[E2E] Passo 5 — desfecho:', desfecho.slice(0, 1200))

    const emitiu = await page.getByText('Emissão solicitada').isVisible().catch(() => false)

    if (!emitiu) {
      // A Seguradora recusou. Antes de falhar, prova que a plataforma se comportou: recusa NÃO registra
      // Apólice e mantém a oferta Cotada (RN-511), e o aceite do Termo fica registrado porque aconteceu
      // de verdade (RN-506). Assim a reprovação aponta o ambiente, não um defeito silencioso nosso.
      expect(Number(sqlScalar('SELECT CAST(COUNT(*) AS varchar(10)) FROM Policies'))).toBe(policiesAntes)
      expect(sqlScalar(
        `SELECT CAST(Status AS varchar(30)) FROM QuotationGroups WHERE Id = '${grupoId}'`,
      )).toBe('Quoted')
      expect(Number(sqlScalar('SELECT CAST(COUNT(*) AS varchar(10)) FROM TermAcceptances')))
        .toBeGreaterThan(aceitesAntes)

      throw new Error(
        'A Seguradora não concluiu a emissão neste ambiente. A plataforma reagiu conforme a RN-511 '
        + '(nenhuma Apólice registrada, oferta segue Cotada) e a RN-506 (aceite registrado). '
        + `Motivo do provedor na tela: ${desfecho.slice(0, 800)}`,
      )
    }

    await expect(page.getByText('Apólice emitida')).toHaveCount(0)

    // RN-507/RN-514: uma Apólice por Cotação, registrada com o pedido aceito.
    expect(Number(sqlScalar('SELECT CAST(COUNT(*) AS varchar(10)) FROM Policies')))
      .toBe(policiesAntes + 1)
    expect(sqlScalar(
      `SELECT CAST(Status AS varchar(30)) FROM QuotationGroups WHERE Id = '${grupoId}'`,
    )).toBe('EmissionRequested')
  })
})
