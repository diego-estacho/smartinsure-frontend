import { mdiPower, mdiPowerOff } from '~/lib/icons'

export const modalityGroupStatuses = {
  active: 'Active',
  inactive: 'Inactive',
} as const

export type ModalityGroupStatus = typeof modalityGroupStatuses[keyof typeof modalityGroupStatuses]

type ModalityGroupStatusView = {
  label: string
  color: string
  known: boolean
}

type ModalityGroupStatusAction = {
  targetStatus: ModalityGroupStatus | null
  label: string
  shortLabel: string
  icon: string
  color: string
  successMessage: string
  disabled: boolean
}

const modalityGroupStatusViews = {
  [modalityGroupStatuses.active]: { label: 'Ativa', color: 'success' },
  [modalityGroupStatuses.inactive]: { label: 'Inativa', color: 'error' },
} as const satisfies Record<ModalityGroupStatus, Omit<ModalityGroupStatusView, 'known'>>

const disabledModalityGroupStatusAction: ModalityGroupStatusAction = {
  targetStatus: null,
  label: 'Ação indisponível',
  shortLabel: 'Indisponível',
  icon: mdiPowerOff,
  color: 'secondary',
  successMessage: '',
  disabled: true,
}

// RN-036: preservação do catálogo — nunca exclui; alterna Ativa ↔ Inativa.
const modalityGroupStatusActions = {
  [modalityGroupStatuses.active]: {
    targetStatus: modalityGroupStatuses.inactive,
    label: 'Inativar Grupo de Modalidade',
    shortLabel: 'Inativar',
    icon: mdiPowerOff,
    color: 'error',
    successMessage: 'Grupo de Modalidade inativado.',
    disabled: false,
  },
  [modalityGroupStatuses.inactive]: {
    targetStatus: modalityGroupStatuses.active,
    label: 'Ativar Grupo de Modalidade',
    shortLabel: 'Ativar',
    icon: mdiPower,
    color: 'primary',
    successMessage: 'Grupo de Modalidade ativado.',
    disabled: false,
  },
} as const satisfies Record<ModalityGroupStatus, ModalityGroupStatusAction>

// O contrato expõe includeInactive (boolean), não um filtro por situação; o valor mapeia
// direto o parâmetro do backend (ADR-004): "Somente ativas" (false) x "Todas" (true).
export const modalityGroupFilterOptions = [
  { title: 'Somente ativas', value: false },
  { title: 'Todas', value: true },
] as const

export function isModalityGroupStatus(status: string | null | undefined): status is ModalityGroupStatus {
  return status === modalityGroupStatuses.active || status === modalityGroupStatuses.inactive
}

export function getModalityGroupStatusView(status: string | null | undefined): ModalityGroupStatusView {
  if (!isModalityGroupStatus(status)) {
    return { label: 'Desconhecida', color: 'warning', known: false }
  }

  return {
    ...modalityGroupStatusViews[status],
    known: true,
  }
}

export function getModalityGroupStatusAction(status: string | null | undefined): ModalityGroupStatusAction {
  if (!isModalityGroupStatus(status)) {
    return disabledModalityGroupStatusAction
  }

  return modalityGroupStatusActions[status]
}
