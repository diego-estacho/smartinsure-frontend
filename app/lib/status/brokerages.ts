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

/* ─────────────────────────────────────────────────────────────────────────
 * Situação apresentada da Corretora (RN-053): valor derivado no servidor —
 * Ativa / Incompleta / Inativa. A pill e as abas usam a situação; a ação de
 * ativar/inativar (RN-021) deriva dela para o status armazenado.
 * ───────────────────────────────────────────────────────────────────────── */

export const brokerageSituations = {
  active: 'Active',
  incomplete: 'Incomplete',
  inactive: 'Inactive',
} as const

export type BrokerageSituation = typeof brokerageSituations[keyof typeof brokerageSituations]

type BrokerageSituationView = { label: string, color: string, known: boolean }

const brokerageSituationViews = {
  [brokerageSituations.active]: { label: 'Ativa', color: 'success' },
  [brokerageSituations.incomplete]: { label: 'Incompleta', color: 'warning' },
  [brokerageSituations.inactive]: { label: 'Inativa', color: 'secondary' },
} as const satisfies Record<BrokerageSituation, Omit<BrokerageSituationView, 'known'>>

export function getBrokerageSituationView(situation: string | null | undefined): BrokerageSituationView {
  if (situation === brokerageSituations.active
    || situation === brokerageSituations.incomplete
    || situation === brokerageSituations.inactive) {
    return { ...brokerageSituationViews[situation], known: true }
  }

  return { label: 'Desconhecida', color: 'warning', known: false }
}

type BrokerageSituationAction = {
  targetStatus: BrokerageStatus
  label: string
  icon: AppIconName
  color: string
  successMessage: string
  confirmTitle: string
  confirmText: string
}

/** RN-021: Ativas/Incompletas podem ser inativadas; Inativas podem ser ativadas. */
export function getBrokerageSituationAction(
  situation: string | null | undefined,
): BrokerageSituationAction {
  if (situation === brokerageSituations.inactive) {
    return {
      targetStatus: brokerageStatuses.active,
      label: 'Ativar corretora',
      icon: 'power',
      color: 'primary',
      successMessage: 'Corretora ativada.',
      confirmTitle: 'Ativar corretora',
      confirmText: 'A corretora volta a aparecer para cotação.',
    }
  }

  return {
    targetStatus: brokerageStatuses.inactive,
    label: 'Inativar corretora',
    icon: 'powerOff',
    color: 'error',
    successMessage: 'Corretora inativada.',
    confirmTitle: 'Inativar corretora',
    confirmText: 'A corretora deixa de aparecer para cotação e os usuários vinculados perdem o acesso. As apólices já emitidas continuam válidas.',
  }
}

/** Abas de situação (RN-018): `value: null` = Todas. */
export const brokerageSituationTabs = [
  { key: 'all', label: 'Todas', value: null },
  { key: 'active', label: 'Ativas', value: brokerageSituations.active },
  { key: 'incomplete', label: 'Incompletas', value: brokerageSituations.incomplete },
  { key: 'inactive', label: 'Inativas', value: brokerageSituations.inactive },
] as const

/** Chave de contagem por situação no envelope da listagem. */
export type BrokerageSituationCountKey = 'all' | 'active' | 'incomplete' | 'inactive'

export const brokerageSectorOptions = [
  { title: 'Todos', value: null },
  { title: 'Privado', value: 'Private' },
  { title: 'Público', value: 'Public' },
] as const

export const calculationEngineOptions = [
  { title: 'Todos', value: null },
  { title: 'PlugV2', value: 'PlugV2' },
] as const
