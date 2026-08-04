import type { components } from '~/types/gen/api'

/**
 * Emissão da Apólice (Passo 5) — integração real via BFF (ADR-008), RN-500..RN-514.
 *
 * Três operações, todas do servidor: solicitar a emissão (portão de verificações + sequência), ajustar
 * a taxa (a Seguradora recalcula prêmio/comissão/parcelamento) e ler o Termo vigente. Nada de dinheiro,
 * regra ou situação é decidido aqui (ADR-004): o cliente monta o pedido e exibe o que voltou.
 *
 * O desfecho é **emissão solicitada** — número da apólice, arquivo e boletos vêm da confirmação junto à
 * Seguradora, que é demanda própria (OPEN-07).
 */
type IssuanceResponse = components['schemas']['RequestPolicyIssuanceResponse']
type TaxResponse = components['schemas']['UpdateQuotationTaxResponse']
type InsurerTermResponse = components['schemas']['GetInsurerTermResponse']

export interface RequestIssuanceInput {
  quotationGroupId: string
  /** RN-505: parcelamento escolhido entre os informados pela Seguradora na Cotação. */
  installmentNumber: number
  /** RN-505: dias para o vencimento da primeira parcela, entre os informados. */
  gracePeriodInDays: number
  /** RN-506: aceite explícito do Termo — o servidor recusa sem ele. */
  termAccepted: boolean
}

export interface UpdateTaxInput {
  quotationGroupId: string
  tax: number
}

export function useIssuance(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  /** RN-500/RN-514: pede a emissão; erro do servidor (portão ou Seguradora) sobe para a tela. */
  async function requestIssuance(input: RequestIssuanceInput): Promise<IssuanceResponse> {
    return await api<IssuanceResponse>(`/api/quotation-groups/${input.quotationGroupId}/policy`, {
      method: 'POST',
      body: {
        installmentNumber: input.installmentNumber,
        gracePeriodInDays: input.gracePeriodInDays,
        termAccepted: input.termAccepted,
      },
    })
  }

  /** RN-504: submete a taxa; o retorno são os valores que a Seguradora recalculou. */
  async function updateTax(input: UpdateTaxInput): Promise<TaxResponse> {
    return await api<TaxResponse>(
      `/api/quotation-groups/${input.quotationGroupId}/quotations/selected-tax`,
      { method: 'POST', body: { tax: input.tax } },
    )
  }

  /** RN-506: texto vigente do Termo da Seguradora da Cotação escolhida. */
  async function getInsurerTerm(quotationGroupId: string): Promise<InsurerTermResponse> {
    return await api<InsurerTermResponse>(`/api/quotation-groups/${quotationGroupId}/insurer-term`)
  }

  return { requestIssuance, updateTax, getInsurerTerm }
}
