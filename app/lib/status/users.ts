/**
 * Mapa de labels de status do domínio Usuário (ADR-004): status por nome estável do
 * contrato, label em português. Módulo único por domínio, nunca duplicado em componentes.
 */
export const userStatusLabels: Record<string, string> = {
  Pending: 'Pendente',
  Active: 'Ativo',
  Inactive: 'Inativo',
}

export const userStatuses = {
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
} as const

export type UserStatus = typeof userStatuses[keyof typeof userStatuses]

type UserStatusView = {
  label: string
  color: string
  known: boolean
}

const userStatusViews = {
  [userStatuses.pending]: { label: 'Pendente', color: 'warning' },
  [userStatuses.active]: { label: 'Ativo', color: 'success' },
  [userStatuses.inactive]: { label: 'Inativo', color: 'secondary' },
} as const satisfies Record<UserStatus, Omit<UserStatusView, 'known'>>

export function isUserStatus(status: string | null | undefined): status is UserStatus {
  return status === userStatuses.pending
    || status === userStatuses.active
    || status === userStatuses.inactive
}

export function getUserStatusView(status: string | null | undefined): UserStatusView {
  if (!isUserStatus(status)) {
    return { label: 'Desconhecida', color: 'warning', known: false }
  }

  return { ...userStatusViews[status], known: true }
}

/** Filtro de situação da listagem: `value: null` = todas. */
export const userStatusOptions = [
  { title: 'Todas', value: null },
  { title: 'Pendentes', value: userStatuses.pending },
  { title: 'Ativos', value: userStatuses.active },
  { title: 'Inativos', value: userStatuses.inactive },
] as const

export type UserDisplayStatusKey = 'active' | 'pending' | 'expired' | 'inactive'

export type UserDisplayStatusView = {
  key: UserDisplayStatusKey
  /** Rótulo curto (aba e pill). */
  label: string
  /** Rótulo longo (detalhe): "Convite expirado" para o expirado; igual ao curto nos demais. */
  longLabel: string
  color: 'success' | 'warning' | 'error'
}

const userDisplayStatusViews: Record<UserDisplayStatusKey, Omit<UserDisplayStatusView, 'key'>> = {
  active: { label: 'Ativo', longLabel: 'Ativo', color: 'success' },
  pending: { label: 'Pendente', longLabel: 'Pendente', color: 'warning' },
  expired: { label: 'Expirado', longLabel: 'Convite expirado', color: 'error' },
  inactive: { label: 'Inativo', longLabel: 'Inativo', color: 'error' },
}

/**
 * Situação de EXIBIÇÃO (§5 do handoff): "Convite expirado" é o Usuário Pendente cujo Convite
 * venceu (RN-065) — não é enum novo, é derivação do flag `inviteExpired` que vem do contrato.
 * A situação crua (`status`) continua vindo por nome estável (ADR-004).
 */
export function getUserDisplayStatus(
  status: string | null | undefined,
  inviteExpired = false,
): UserDisplayStatusView {
  if (status === userStatuses.active) {
    return { key: 'active', ...userDisplayStatusViews.active }
  }
  if (status === userStatuses.inactive) {
    return { key: 'inactive', ...userDisplayStatusViews.inactive }
  }
  if (status === userStatuses.pending) {
    const key: UserDisplayStatusKey = inviteExpired ? 'expired' : 'pending'
    return { key, ...userDisplayStatusViews[key] }
  }
  return { key: 'pending', label: 'Desconhecida', longLabel: 'Desconhecida', color: 'warning' }
}

/** Abas de situação da listagem (§4): vocabulário fechado + o filtro estável enviado ao backend. */
export type UserStatusTabKey = 'todos' | 'ativo' | 'pendente' | 'expirado' | 'inativo'

export type UserStatusCountKey = 'all' | 'active' | 'pending' | 'expired' | 'inactive'

export const userStatusTabs: {
  key: UserStatusTabKey
  label: string
  /** Valor do filtro enviado ao backend; `null` = todas. "Expired" = Pendente com Convite vencido. */
  filter: string | null
  /** Chave da contagem no envelope `counts` da listagem. */
  countKey: UserStatusCountKey
}[] = [
  { key: 'todos', label: 'Todos', filter: null, countKey: 'all' },
  { key: 'ativo', label: 'Ativo', filter: userStatuses.active, countKey: 'active' },
  { key: 'pendente', label: 'Pendente', filter: userStatuses.pending, countKey: 'pending' },
  { key: 'expirado', label: 'Expirado', filter: 'Expired', countKey: 'expired' },
  { key: 'inativo', label: 'Inativo', filter: userStatuses.inactive, countKey: 'inactive' },
]
