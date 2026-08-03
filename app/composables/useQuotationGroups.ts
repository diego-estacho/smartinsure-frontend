import type { components } from '~/types/gen/api'

/**
 * QuotationGroup — persistência do "grupo de cotação" (RN-050/RN-051/RN-060) via BFF (ADR-008). POST
 * cria em Rascunho ao continuar do passo de risco; PUT `/quotation-groups/{id}` atualiza no lugar
 * (mesmo id) nas voltas **enquanto o grupo não tem Cotações**. Com Cotações, mudar dado-base não edita:
 * o chamador cria um Grupo novo (fork, RN-060) passando `existingId=null`; o backend recusa o PUT nesse
 * caso (fail-closed). Mapeia o estado do wizard para o contrato do backend (tipos gerados em `api.ts`):
 * escopo/risco achatados, `scopeMode` em nome estável (All/Specific), coberturas como 2 booleanos.
 */
type QuotationGroupBody = components['schemas']['CreateQuotationGroupRequest']
type CreateQuotationGroupResponse = components['schemas']['CreateQuotationGroupResponse']
type UpdateQuotationGroupResponse = components['schemas']['UpdateQuotationGroupResponse']
export type GetQuotationGroupResponse = components['schemas']['GetQuotationGroupResponse']

export interface QuotationGroupPayload {
  policyHolderId: string | null
  /** Filial marcada na etapa 1 (RN-102); null = estabelecimento é a matriz. */
  branchId: string | null
  insuredId: string | null
  scope: { mode: string, insurerIds: string[] }
  risk: {
    modalityId: string | null
    insuredAmount: number | null
    startDate: string | null
    endDate: string | null
    coverageMulta: boolean
    coverageLabor: boolean
  }
}

export interface SaveQuotationGroupResult {
  id: string
}

/**
 * Escopo do wizard ('all' | 'specific') → nome estável do contrato ('All' | 'Specific'), ADR-004.
 * Mapeamento exaustivo: 'specific' vira 'Specific'; 'all' (e qualquer outro) cai em 'All' como
 * padrão seguro — o wizard só produz esses dois modos.
 */
function toScopeMode(mode: string): string {
  return mode === 'specific' ? 'Specific' : 'All'
}

/**
 * Estado do wizard → contrato do backend (achata escopo/risco; enum em nome estável). O wizard
 * garante os campos obrigatórios preenchidos (`validateCurrentStep`) antes de salvar — os fallbacks
 * abaixo não disparam no fluxo real; se dispararem, o servidor recusa (validação de negócio, ADR-004).
 */
function toRequestBody(payload: QuotationGroupPayload): QuotationGroupBody {
  // IS (insuredAmount) é obrigatória (contrato do backend). O wizard já garante não-nulo no passo
  // de risco (`validateCurrentStep`); em vez de coagir silenciosamente para 0 (valor plausível que
  // mascara o dado faltante), falhamos explícito se chegar aqui vazia — não é o fluxo real.
  const insuredAmount = payload.risk.insuredAmount
  if (insuredAmount == null) {
    throw new Error('Importância segurada ausente ao salvar a oferta.')
  }

  return {
    policyHolderId: payload.policyHolderId ?? '',
    // Filial marcada na etapa 1 (RN-102) — `null` é a matriz (nenhuma Filial marcada), valor
    // real e não mais um placeholder: o wizard passa a escolha feita pelo corretor.
    branchId: payload.branchId,
    insuredId: payload.insuredId ?? '',
    modalityId: payload.risk.modalityId ?? '',
    insuredAmount,
    coverageStartDate: payload.risk.startDate ?? '',
    coverageEndDate: payload.risk.endDate ?? '',
    scopeMode: toScopeMode(payload.scope.mode),
    insurerIds: payload.scope.insurerIds,
    includesPenaltyCoverage: payload.risk.coverageMulta,
    includesLaborCoverage: payload.risk.coverageLabor,
  }
}

export function useQuotationGroups(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  /**
   * Cria (sem id) ou atualiza (com id) o grupo de cotação. Um único grupo por passada: POST no
   * primeiro salvar, PUT nas voltas — a decisão fica com quem chama, passando `existingId`.
   */
  async function saveQuotationGroup(
    payload: QuotationGroupPayload,
    existingId: string | null,
  ): Promise<SaveQuotationGroupResult> {
    const body = toRequestBody(payload)
    const result = existingId
      ? await api<UpdateQuotationGroupResponse>(
          `/api/quotation-groups/${existingId}`, { method: 'PUT', body })
      : await api<CreateQuotationGroupResponse>(
          '/api/quotation-groups', { method: 'POST', body })
    return { id: result.id }
  }

  /**
   * Lê o Grupo de Cotação salvo (GET), para reidratar o wizard ao atualizar a página com o id na rota.
   * Traz os escalares do pedido, a Cotação escolhida e o Tomador/Segurado/Modalidade já resolvidos.
   */
  async function getQuotationGroup(id: string): Promise<GetQuotationGroupResponse> {
    return await api<GetQuotationGroupResponse>(`/api/quotation-groups/${id}`, { method: 'GET' })
  }

  return { saveQuotationGroup, getQuotationGroup }
}
