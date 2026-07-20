import { mdiPower, mdiPowerOff } from '~/lib/icons'

export const enablementStatuses = {
  active: 'Active',
  inactive: 'Inactive',
} as const

export type EnablementStatus = typeof enablementStatuses[keyof typeof enablementStatuses]

type EnablementStatusView = {
  label: string
  color: string
  known: boolean
}

type EnablementStatusAction = {
  targetStatus: EnablementStatus | null
  label: string
  shortLabel: string
  icon: string
  color: string
  successMessage: string
  disabled: boolean
}

const enablementStatusViews = {
  [enablementStatuses.active]: { label: 'Ativa', color: 'success' },
  [enablementStatuses.inactive]: { label: 'Inativa', color: 'error' },
} as const satisfies Record<EnablementStatus, Omit<EnablementStatusView, 'known'>>

const disabledEnablementStatusAction: EnablementStatusAction = {
  targetStatus: null,
  label: 'Ação indisponível',
  shortLabel: 'Indisponível',
  icon: mdiPowerOff,
  color: 'secondary',
  successMessage: '',
  disabled: true,
}

const enablementStatusActions = {
  [enablementStatuses.active]: {
    targetStatus: enablementStatuses.inactive,
    label: 'Inativar habilitação',
    shortLabel: 'Inativar',
    icon: mdiPowerOff,
    color: 'error',
    successMessage: 'Habilitação inativada.',
    disabled: false,
  },
  [enablementStatuses.inactive]: {
    targetStatus: enablementStatuses.active,
    label: 'Ativar habilitação',
    shortLabel: 'Ativar',
    icon: mdiPower,
    color: 'primary',
    successMessage: 'Habilitação ativada.',
    disabled: false,
  },
} as const satisfies Record<EnablementStatus, EnablementStatusAction>

export function isEnablementStatus(status: string | null | undefined): status is EnablementStatus {
  return status === enablementStatuses.active || status === enablementStatuses.inactive
}

export function getEnablementStatusView(status: string | null | undefined): EnablementStatusView {
  if (!isEnablementStatus(status)) {
    return { label: 'Desconhecida', color: 'warning', known: false }
  }

  return {
    ...enablementStatusViews[status],
    known: true,
  }
}

export function getEnablementStatusAction(status: string | null | undefined): EnablementStatusAction {
  if (!isEnablementStatus(status)) {
    return disabledEnablementStatusAction
  }

  return enablementStatusActions[status]
}
