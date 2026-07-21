
export const policyHolderAppointmentStatuses = {
  active: 'Active',
  ended: 'Ended',
} as const

export type PolicyHolderAppointmentStatus = typeof policyHolderAppointmentStatuses[keyof typeof policyHolderAppointmentStatuses]

type PolicyHolderAppointmentStatusView = {
  label: string
  color: string
  known: boolean
}

const policyHolderAppointmentStatusViews = {
  [policyHolderAppointmentStatuses.active]: { label: 'Vigente', color: 'success' },
  [policyHolderAppointmentStatuses.ended]: { label: 'Encerrada', color: 'error' },
} as const satisfies Record<PolicyHolderAppointmentStatus, Omit<PolicyHolderAppointmentStatusView, 'known'>>

export function isPolicyHolderAppointmentStatus(
  status: string | null | undefined,
): status is PolicyHolderAppointmentStatus {
  return (
    status === policyHolderAppointmentStatuses.active
    || status === policyHolderAppointmentStatuses.ended
  )
}

export function getPolicyHolderAppointmentStatusView(
  status: string | null | undefined,
): PolicyHolderAppointmentStatusView {
  if (!isPolicyHolderAppointmentStatus(status)) {
    return { label: 'Desconhecida', color: 'warning', known: false }
  }

  return {
    ...policyHolderAppointmentStatusViews[status],
    known: true,
  }
}

export function canEndPolicyHolderAppointment(status: string | null | undefined): boolean {
  return isPolicyHolderAppointmentStatus(status)
    && status === policyHolderAppointmentStatuses.active
}
