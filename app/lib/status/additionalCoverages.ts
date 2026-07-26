import type { AppIconName } from '~/lib/icons'

export const additionalCoverageStatuses = {
  active: 'Active',
  inactive: 'Inactive',
} as const

export type AdditionalCoverageStatus = typeof additionalCoverageStatuses[keyof typeof additionalCoverageStatuses]

type AdditionalCoverageStatusView = {
  label: string
  color: string
  known: boolean
}

type AdditionalCoverageStatusAction = {
  targetStatus: AdditionalCoverageStatus | null
  label: string
  shortLabel: string
  icon: AppIconName
  color: string
  successMessage: string
  disabled: boolean
}

const additionalCoverageStatusViews = {
  [additionalCoverageStatuses.active]: { label: 'Ativa', color: 'success' },
  [additionalCoverageStatuses.inactive]: { label: 'Inativa', color: 'error' },
} as const satisfies Record<AdditionalCoverageStatus, Omit<AdditionalCoverageStatusView, 'known'>>

const disabledAdditionalCoverageStatusAction: AdditionalCoverageStatusAction = {
  targetStatus: null,
  label: 'Ação indisponível',
  shortLabel: 'Indisponível',
  icon: 'powerOff',
  color: 'secondary',
  successMessage: '',
  disabled: true,
}

// RN-040/RN-044: a Cobertura Adicional canônica nunca é excluída — sai de operação por Inativação;
// o ciclo alterna Ativa ↔ Inativa. A reconciliação da importação nunca a desativa (RN-044).
const additionalCoverageStatusActions = {
  [additionalCoverageStatuses.active]: {
    targetStatus: additionalCoverageStatuses.inactive,
    label: 'Inativar Cobertura Adicional',
    shortLabel: 'Inativar',
    icon: 'powerOff',
    color: 'error',
    successMessage: 'Cobertura Adicional inativada.',
    disabled: false,
  },
  [additionalCoverageStatuses.inactive]: {
    targetStatus: additionalCoverageStatuses.active,
    label: 'Ativar Cobertura Adicional',
    shortLabel: 'Ativar',
    icon: 'power',
    color: 'primary',
    successMessage: 'Cobertura Adicional ativada.',
    disabled: false,
  },
} as const satisfies Record<AdditionalCoverageStatus, AdditionalCoverageStatusAction>

export function isAdditionalCoverageStatus(
  status: string | null | undefined,
): status is AdditionalCoverageStatus {
  return status === additionalCoverageStatuses.active || status === additionalCoverageStatuses.inactive
}

export function getAdditionalCoverageStatusView(
  status: string | null | undefined,
): AdditionalCoverageStatusView {
  if (!isAdditionalCoverageStatus(status)) {
    return { label: 'Desconhecida', color: 'warning', known: false }
  }

  return {
    ...additionalCoverageStatusViews[status],
    known: true,
  }
}

export function getAdditionalCoverageStatusAction(
  status: string | null | undefined,
): AdditionalCoverageStatusAction {
  if (!isAdditionalCoverageStatus(status)) {
    return disabledAdditionalCoverageStatusAction
  }

  return additionalCoverageStatusActions[status]
}
