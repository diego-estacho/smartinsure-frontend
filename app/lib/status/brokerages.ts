import type { AppIconName } from '~/lib/icons'

export const brokerageStatuses = {
  active: 'Active',
  inactive: 'Inactive',
} as const

export type BrokerageStatus = typeof brokerageStatuses[keyof typeof brokerageStatuses]

type BrokerageStatusView = {
  label: string
  color: string
  known: boolean
}

type BrokerageStatusAction = {
  targetStatus: BrokerageStatus | null
  label: string
  shortLabel: string
  icon: AppIconName
  color: string
  successMessage: string
  disabled: boolean
}

const brokerageStatusViews = {
  [brokerageStatuses.active]: { label: 'Ativa', color: 'success' },
  [brokerageStatuses.inactive]: { label: 'Inativa', color: 'error' },
} as const satisfies Record<BrokerageStatus, Omit<BrokerageStatusView, 'known'>>

const disabledBrokerageStatusAction: BrokerageStatusAction = {
  targetStatus: null,
  label: 'Ação indisponível',
  shortLabel: 'Indisponível',
  icon: 'powerOff',
  color: 'secondary',
  successMessage: '',
  disabled: true,
}

const brokerageStatusActions = {
  [brokerageStatuses.active]: {
    targetStatus: brokerageStatuses.inactive,
    label: 'Inativar corretora',
    shortLabel: 'Inativar',
    icon: 'powerOff',
    color: 'error',
    successMessage: 'Corretora inativada.',
    disabled: false,
  },
  [brokerageStatuses.inactive]: {
    targetStatus: brokerageStatuses.active,
    label: 'Ativar corretora',
    shortLabel: 'Ativar',
    icon: 'power',
    color: 'primary',
    successMessage: 'Corretora ativada.',
    disabled: false,
  },
} as const satisfies Record<BrokerageStatus, BrokerageStatusAction>

export const brokerageStatusOptions = [
  { title: 'Todas', value: null },
  { title: 'Ativas', value: brokerageStatuses.active },
  { title: 'Inativas', value: brokerageStatuses.inactive },
] as const

export function isBrokerageStatus(status: string | null | undefined): status is BrokerageStatus {
  return status === brokerageStatuses.active || status === brokerageStatuses.inactive
}

export function getBrokerageStatusView(status: string | null | undefined): BrokerageStatusView {
  if (!isBrokerageStatus(status)) {
    return { label: 'Desconhecida', color: 'warning', known: false }
  }

  return {
    ...brokerageStatusViews[status],
    known: true,
  }
}

export function getBrokerageStatusAction(status: string | null | undefined): BrokerageStatusAction {
  if (!isBrokerageStatus(status)) {
    return disabledBrokerageStatusAction
  }

  return brokerageStatusActions[status]
}
