/**
 * RN-030: Status mapping for credit inquiry results by Insurer.
 * Maps the status enum value (from backend) to label and color token.
 * Never ordinal — always keyed by the actual string value.
 */

export const creditInquiryInsurerStatuses = {
  available: 'Available',
  unavailable: 'Unavailable',
} as const

export type CreditInquiryInsurerStatus = typeof creditInquiryInsurerStatuses[keyof typeof creditInquiryInsurerStatuses]

type CreditInquiryInsurerStatusView = {
  label: string
  color: string
  known: boolean
}

const creditInquiryInsurerStatusViews = {
  [creditInquiryInsurerStatuses.available]: { label: 'Disponível', color: 'success' },
  [creditInquiryInsurerStatuses.unavailable]: { label: 'Indisponível', color: 'error' },
} as const satisfies Record<CreditInquiryInsurerStatus, Omit<CreditInquiryInsurerStatusView, 'known'>>

export function isCreditInquiryInsurerStatus(status: string | null | undefined): status is CreditInquiryInsurerStatus {
  return status === creditInquiryInsurerStatuses.available || status === creditInquiryInsurerStatuses.unavailable
}

export function getCreditInquiryInsurerStatusView(status: string | null | undefined): CreditInquiryInsurerStatusView {
  if (!isCreditInquiryInsurerStatus(status)) {
    return { label: 'Desconhecido', color: 'warning', known: false }
  }

  return {
    ...creditInquiryInsurerStatusViews[status],
    known: true,
  }
}
