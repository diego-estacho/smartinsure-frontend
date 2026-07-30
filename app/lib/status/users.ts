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
