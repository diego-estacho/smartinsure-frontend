/**
 * Minuta da Cotação selecionada (etapa 4 — RN-062/RN-063). `getMinuta` lê as Tags do objeto (JSON) e
 * as Cláusulas particulares ativas do catálogo importado; `submitMinuta` ("Baixar minuta") envia os
 * termos preenchidos e devolve o documento gerado. Composable com `$fetch` injetável (testes sem rede).
 */
import type { components } from '~/types/gen/api'

export type QuotationMinuta = components['schemas']['QuotationMinutaResponse']
export type QuotationMinutaClause = components['schemas']['QuotationMinutaClauseResponse']
export type SubmitMinutaBody = components['schemas']['SubmitQuotationMinutaBody']
export type SubmitMinutaResult = components['schemas']['SubmitQuotationTermsResponse']

export function useQuotationMinuta(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  /** RN-062: Tags + Cláusulas particulares da Modalidade da Cotação (catálogo importado). */
  async function getMinuta(groupId: string, quotationId: string): Promise<QuotationMinuta> {
    return await api<QuotationMinuta>(
      `/api/quotation-groups/${groupId}/quotations/${quotationId}/minuta`,
      { method: 'GET' },
    )
  }

  /** RN-063: envia os termos preenchidos e devolve a minuta ("Baixar minuta"). */
  async function submitMinuta(
    groupId: string,
    quotationId: string,
    body: SubmitMinutaBody,
  ): Promise<SubmitMinutaResult> {
    return await api<SubmitMinutaResult>(
      `/api/quotation-groups/${groupId}/quotations/${quotationId}/minuta/submit`,
      { method: 'POST', body },
    )
  }

  return { getMinuta, submitMinuta }
}
