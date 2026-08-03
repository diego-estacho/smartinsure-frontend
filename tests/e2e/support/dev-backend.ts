/**
 * Acesso ao ambiente de dev real (banco da VPS + Casdoor) para o E2E de jornada.
 *
 * Os E2E de tela usam `page.route` e dev-auth (ADR-009) — não tocam o backend. A jornada de
 * Usuários e Perfis não pode fazer isso: convite, primeiro acesso e login passam pelo provedor de
 * identidade, e é justamente aí que os defeitos aparecem. Então este módulo fala com o que existe:
 * `sqlcmd` para o banco (o projeto não usa Flyway nem driver Node) e a API de gestão do Casdoor.
 *
 * Credenciais: `appsettings.Development.Local.json` do backend (não versionado), com override por
 * variável de ambiente. Nada é escrito em disco por aqui.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BACKEND_ROOT = resolve(process.cwd(), '../smartinsure-backend/src/SmartInsure.Api')
const LOCAL_SETTINGS = resolve(BACKEND_ROOT, 'appsettings.Development.Local.json')
const DEV_SETTINGS = resolve(BACKEND_ROOT, 'appsettings.Development.json')

interface LocalSettings {
  ConnectionStrings?: { SqlServer?: string }
  SSO?: {
    Domain?: string
    ClientId?: string
    Secret?: string
    OrganizationName?: string
    AppName?: string
    EnviromentUserCasdoor?: string
  }
}

interface SqlConnection {
  server: string
  database: string
  user: string
  password: string
}

export interface CasdoorConfig {
  domain: string
  clientId: string
  secret: string
  organization: string
  application: string
  environmentPrefix: string
}

function readJson<T>(path: string): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  }
  catch (error) {
    throw new Error(
      `Não foi possível ler ${path}. O E2E de jornada precisa das configurações de dev do backend. `
      + `Detalhe: ${(error as Error).message}`,
      { cause: error },
    )
  }
}

/** Aceita a connection string do ADO.NET no formato `Chave=valor;...`. */
function parseConnectionString(connectionString: string): SqlConnection {
  const parts = new Map<string, string>()

  for (const segment of connectionString.split(';')) {
    const separator = segment.indexOf('=')

    if (separator > 0) {
      parts.set(segment.slice(0, separator).trim().toLowerCase(), segment.slice(separator + 1).trim())
    }
  }

  const server = parts.get('server') ?? parts.get('data source')
  const database = parts.get('database') ?? parts.get('initial catalog')
  const user = parts.get('user id') ?? parts.get('uid')
  const password = parts.get('password') ?? parts.get('pwd')

  if (!server || !database || !user || !password) {
    throw new Error('Connection string de dev incompleta (server/database/user/password).')
  }

  return { server, database, user, password }
}

let cachedSql: SqlConnection | null = null
let cachedCasdoor: CasdoorConfig | null = null

function sqlConnection(): SqlConnection {
  if (cachedSql) {
    return cachedSql
  }

  const fromEnv = process.env.E2E_SQL_CONNECTION_STRING

  cachedSql = parseConnectionString(
    fromEnv ?? readJson<LocalSettings>(LOCAL_SETTINGS).ConnectionStrings?.SqlServer ?? '',
  )

  return cachedSql
}

export function casdoorConfig(): CasdoorConfig {
  if (cachedCasdoor) {
    return cachedCasdoor
  }

  const local = readJson<LocalSettings>(LOCAL_SETTINGS).SSO ?? {}
  // AppName/prefixo podem estar no appsettings versionado; o Local sobrescreve quando presente.
  const shared = (() => {
    try {
      return readJson<LocalSettings>(DEV_SETTINGS).SSO ?? {}
    }
    catch {
      return {}
    }
  })()

  const domain = local.Domain ?? shared.Domain
  const clientId = local.ClientId ?? shared.ClientId
  const secret = local.Secret ?? shared.Secret
  const organization = local.OrganizationName ?? shared.OrganizationName
  const application = local.AppName ?? shared.AppName
  const environmentPrefix = local.EnviromentUserCasdoor ?? shared.EnviromentUserCasdoor

  if (!domain || !clientId || !secret || !organization || !application || !environmentPrefix) {
    throw new Error('Configuração SSO de dev incompleta para o E2E de jornada.')
  }

  cachedCasdoor = { domain, clientId, secret, organization, application, environmentPrefix }

  return cachedCasdoor
}

/**
 * Executa uma consulta com `sqlcmd`. `-I` é obrigatório no projeto (QUOTED_IDENTIFIER ON) e `-b`
 * aborta em erro, para a falha não passar como sucesso silencioso.
 */
export function sql(query: string): string[] {
  const connection = sqlConnection()

  const output = execFileSync(
    'sqlcmd',
    [
      '-S', connection.server,
      '-d', connection.database,
      '-U', connection.user,
      '-P', connection.password,
      '-C', '-N', '-b', '-I',
      '-h', '-1', '-W', '-s', '|',
      '-Q', `SET NOCOUNT ON; ${query}`,
    ],
    { encoding: 'utf8', windowsHide: true },
  )

  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !/^\(\d+ rows affected\)$/i.test(line))
}

/** Primeira coluna da primeira linha, ou null quando a consulta não devolveu nada. */
export function sqlScalar(query: string): string | null {
  const [first] = sql(query)

  return first ? (first.split('|')[0]?.trim() ?? null) : null
}

export function sqlLiteral(value: string): string {
  return value.replace(/'/g, '\'\'')
}

/** Mesmo hash do `Invitation`/`AcceptInvitationUseCase`: SHA-256 em hexadecimal maiúsculo. */
export function hashToken(plainToken: string): string {
  return createHash('sha256').update(plainToken, 'utf8').digest('hex').toUpperCase()
}

/**
 * Mesma derivação do `CasdoorIdentityProvider.GetUsername`: prefixo de ambiente + e-mail com
 * não-alfanuméricos como underline, limitado a 39 caracteres, sem underline final, em minúsculas.
 */
export function casdoorUsername(email: string): string {
  const { environmentPrefix } = casdoorConfig()
  let username = `${environmentPrefix}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`

  if (username.length > 39) {
    username = username.slice(0, 39)
  }

  if (username.endsWith('_')) {
    username = `${username.slice(0, -1)}0`
  }

  return username.toLowerCase()
}

interface CasdoorUser {
  id: string
  owner: string
  name: string
  email: string
  needUpdatePassword?: boolean
}

interface CasdoorResponse<T> {
  status: string
  msg?: string
  data?: T | null
}

async function casdoorRequest<T>(
  path: string,
  init?: { method?: string, body?: string, contentType?: string },
): Promise<CasdoorResponse<T>> {
  const { domain, clientId, secret } = casdoorConfig()
  const authorization = `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`

  const response = await fetch(`${domain}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: authorization,
      ...(init?.body ? { 'Content-Type': init.contentType ?? 'application/json' } : {}),
    },
    body: init?.body,
  })

  const text = await response.text()

  try {
    return JSON.parse(text) as CasdoorResponse<T>
  }
  catch {
    throw new Error(`Casdoor respondeu conteúdo não-JSON em ${path}: ${text.slice(0, 200)}`)
  }
}

/**
 * Busca pelo par `owner/name`. O Casdoor também aceita `userId` (UUID) e `email`, mas a busca por
 * e-mail logo após a criação pode não achar a identidade ainda.
 */
export async function getCasdoorUser(email: string): Promise<CasdoorUser | null> {
  const { organization } = casdoorConfig()
  const id = `${organization}/${casdoorUsername(email)}`
  const response = await casdoorRequest<CasdoorUser>(`/api/get-user?id=${encodeURIComponent(id)}`)

  return response.data ?? null
}

export async function addCasdoorUser(name: string, email: string, password: string): Promise<void> {
  const { organization, application } = casdoorConfig()

  const response = await casdoorRequest<string>('/api/add-user', {
    method: 'POST',
    body: JSON.stringify({
      owner: organization,
      name: casdoorUsername(email),
      displayName: name,
      email,
      password,
      signupApplication: application,
      needUpdatePassword: false,
    }),
  })

  if (response.status !== 'ok') {
    throw new Error(`Casdoor recusou criar a identidade de ${email}: ${response.msg}`)
  }
}

/**
 * Endpoint dedicado do Casdoor. `update-user` com `password` no corpo responde `ok` sem gravar a
 * credencial (nem com `columns=password`), e o grant seguinte falharia.
 */
export async function setCasdoorPassword(email: string, newPassword: string): Promise<void> {
  const { organization } = casdoorConfig()

  const form = new URLSearchParams({
    userOwner: organization,
    userName: casdoorUsername(email),
    newPassword,
  }).toString()

  const response = await casdoorRequest<unknown>('/api/set-password', {
    method: 'POST',
    body: form,
    contentType: 'application/x-www-form-urlencoded',
  })

  if (response.status !== 'ok') {
    throw new Error(`Casdoor recusou definir a senha de ${email}: ${response.msg}`)
  }
}
