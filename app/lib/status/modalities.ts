import type { AppIconName } from '~/lib/icons'

export const modalityStatuses = {
  active: 'Active',
  inactive: 'Inactive',
} as const

export type ModalityStatus = typeof modalityStatuses[keyof typeof modalityStatuses]

type ModalityStatusView = {
  label: string
  color: string
  known: boolean
}

type ModalityStatusAction = {
  targetStatus: ModalityStatus | null
  label: string
  shortLabel: string
  icon: AppIconName
  color: string
  successMessage: string
  disabled: boolean
}

const modalityStatusViews = {
  [modalityStatuses.active]: { label: 'Ativa', color: 'success' },
  [modalityStatuses.inactive]: { label: 'Inativa', color: 'error' },
} as const satisfies Record<ModalityStatus, Omit<ModalityStatusView, 'known'>>

const disabledModalityStatusAction: ModalityStatusAction = {
  targetStatus: null,
  label: 'Ação indisponível',
  shortLabel: 'Indisponível',
  icon: 'powerOff',
  color: 'secondary',
  successMessage: '',
  disabled: true,
}

// RN-039: preservação do catálogo — nunca exclui; alterna Ativa ↔ Inativa.
const modalityStatusActions = {
  [modalityStatuses.active]: {
    targetStatus: modalityStatuses.inactive,
    label: 'Inativar Modalidade',
    shortLabel: 'Inativar',
    icon: 'powerOff',
    color: 'error',
    successMessage: 'Modalidade inativada.',
    disabled: false,
  },
  [modalityStatuses.inactive]: {
    targetStatus: modalityStatuses.active,
    label: 'Ativar Modalidade',
    shortLabel: 'Ativar',
    icon: 'power',
    color: 'primary',
    successMessage: 'Modalidade ativada.',
    disabled: false,
  },
} as const satisfies Record<ModalityStatus, ModalityStatusAction>

// O contrato expõe includeInactive (boolean), não um filtro por situação; o valor mapeia
// direto o parâmetro do backend (ADR-004): "Somente ativas" (false) x "Todas" (true).
export const modalityFilterOptions = [
  { title: 'Somente ativas', value: false },
  { title: 'Todas', value: true },
] as const

export function isModalityStatus(status: string | null | undefined): status is ModalityStatus {
  return status === modalityStatuses.active || status === modalityStatuses.inactive
}

export function getModalityStatusView(status: string | null | undefined): ModalityStatusView {
  if (!isModalityStatus(status)) {
    return { label: 'Desconhecida', color: 'warning', known: false }
  }

  return {
    ...modalityStatusViews[status],
    known: true,
  }
}

export function getModalityStatusAction(status: string | null | undefined): ModalityStatusAction {
  if (!isModalityStatus(status)) {
    return disabledModalityStatusAction
  }

  return modalityStatusActions[status]
}
