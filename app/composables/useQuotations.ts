/**
 * Cotações (Quotation) da etapa 4 — **API real** (exec-plan 0013, RN-056..059). Substitui o mock
 * "espera → lote" pelo modelo real: `runQuotations` dispara o fan-out (202) e `listQuotations` lê o
 * leque persistido (polling barato, ADR-051). A classificação estável (Automatic/Analysis/Unavailable/
 * Unrecognized), a esteira, os motivos e o CCG vêm da ACL do backend (ADR-064). `selectQuotation`
 * marca a escolhida (RN-059). Composable com `$fetch` injetável (testes mockam sem rede).
 */
import type { components } from '~/types/gen/api'

type ListResponse = components['schemas']['ListQuotationsResponse']
type ItemResponse = components['schemas']['QuotationListItemResponse']
type RunResponse = components['schemas']['RunQuotationsResponse']
type SelectResponse = components['schemas']['SelectQuotationResponse']

/** Classes seguíveis exibidas com chip próprio; as demais caem em "indisponíveis". */
export type QuotationStatus = 'auto' | 'analise'

export interface Quotation {
  /** Id da Cotação (Quotation) — chave de seleção. */
  id: string
  insurerId: string
  name: string
  /** Logo da Seguradora (URL), quando cadastrado; null cai no monograma. */
  logoUrl: string | null
  /** Prêmio em reais (0 quando não Automática). */
  premio: number
  /** Comissão em pontos percentuais. */
  comissao: number
  /** Limite disponível em reais; null quando a seguradora não informou (distinto de um limite real de 0). */
  limite: number | null
  status: QuotationStatus
  /** Taxa aplicada. */
  taxa: number
  /** Compat com a minuta antiga; a minuta real vem do endpoint próprio (RN-062). */
  tags: string[]
  /** Classificação estável do backend (ADR-064): 'Automatic' | 'Analysis'. */
  result: string
  /** Esteira específica quando em Análise (RN-058). */
  analysisTrack: string | null
  /** RN-059: só Automática ou Análise de subscrição são selecionáveis. */
  isFollowable: boolean
  /** CCG (ortogonal à classificação — ADR-064). */
  requiresCcg: boolean
  ccgSigned: boolean
  ccgMaxLimitWithoutNeed: number | null
}

export interface UnavailableQuotation {
  id: string
  insurerId: string
  name: string
  /** Logo da Seguradora (URL), quando cadastrado; null cai no monograma. */
  logoUrl: string | null
  /** Primeiro motivo (para a linha colapsada). */
  reason: string
  /** Todos os motivos (RN-058). */
  reasons: string[]
}

/** Seguradora ainda cotando (ProcessingStatus=Requested) — vira um skeleton nomeado (logo + nome) na tela. */
export interface PendingQuotation {
  id: string
  insurerId: string
  name: string
  logoUrl: string | null
}

export interface QuotationsResult {
  available: Quotation[]
  unavailable: UnavailableQuotation[]
  /** Seguradoras ainda cotando (skeletons nomeados). Vazio = fan-out concluído (para o polling). */
  pending: PendingQuotation[]
  /** Cotação escolhida do Grupo (RN-059), quando houver. */
  selectedQuotationId: string | null
}

/** Rótulo/cor do status seguível por nome estável (ADR-004). */
export const quotationStatusView: Record<QuotationStatus, { label: string, color: string }> = {
  auto: { label: 'Emissão automática', color: 'success' },
  analise: { label: 'Requer análise de subscrição', color: 'warning' },
}

/** Esteira (EAnalysisTrack) → rótulo pt-BR (RN-058). */
export const analysisTrackLabel: Record<string, string> = {
  Underwriting: 'Análise de subscrição',
  Credit: 'Análise de crédito',
  Pep: 'Análise de PEP',
  Reinsurance: 'Análise de resseguro',
  Registration: 'Análise de cadastro',
}

/** Números do contrato podem vir como `number | string` (openapi-typescript, Format:double). */
function num(value: number | string | null | undefined): number {
  if (value == null) return 0
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

function numOrNull(value: number | string | null | undefined): number | null {
  if (value == null) return null
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : null
}

function toAvailable(item: ItemResponse): Quotation {
  return {
    id: item.quotationId,
    insurerId: item.insurerId,
    name: item.insurerName,
    logoUrl: item.insurerLogoUrl,
    premio: num(item.premium),
    comissao: num(item.commissionPercentage),
    limite: numOrNull(item.availableLimit),
    status: item.result === 'Automatic' ? 'auto' : 'analise',
    taxa: num(item.tax),
    tags: [],
    result: item.result ?? '',
    analysisTrack: item.analysisTrack,
    isFollowable: item.isFollowable,
    requiresCcg: item.requiresCcg,
    ccgSigned: item.ccgSigned,
    ccgMaxLimitWithoutNeed: numOrNull(item.ccgMaxLimitWithoutNeed),
  }
}

function toUnavailable(item: ItemResponse): UnavailableQuotation {
  const reasons = item.reasons ?? []
  const fallback = item.result === 'Unrecognized'
    ? 'Retorno não reconhecido da seguradora.'
    : 'Indisponível para este risco.'
  return {
    id: item.quotationId,
    insurerId: item.insurerId,
    name: item.insurerName,
    logoUrl: item.insurerLogoUrl,
    reason: reasons[0] ?? fallback,
    reasons,
  }
}

/** Traduz o leque do backend para o modelo da tela: Automática/Análise → disponíveis; o resto → indisponíveis. */
export function mapQuotations(response: ListResponse): QuotationsResult {
  const available: Quotation[] = []
  const unavailable: UnavailableQuotation[] = []
  const pending: PendingQuotation[] = []

  for (const item of response.quotations) {
    if (item.processingStatus === 'Requested') {
      // Ainda cotando: já sabemos a Seguradora (nome + logo) — vira skeleton nomeado.
      pending.push({
        id: item.quotationId,
        insurerId: item.insurerId,
        name: item.insurerName,
        logoUrl: item.insurerLogoUrl,
      })
      continue
    }

    if (item.result === 'Automatic' || item.result === 'Analysis') {
      available.push(toAvailable(item))
    }
    else {
      // Unavailable, Unrecognized ou falha de processamento (Failed) → indisponível com motivos (RN-058).
      unavailable.push(toUnavailable(item))
    }
  }

  return {
    available,
    unavailable,
    pending,
    selectedQuotationId: response.selectedQuotationId,
  }
}

export function useQuotations(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  /** RN-056/057: dispara a cotação de todas as Seguradoras do escopo (fan-out, 202). */
  async function runQuotations(groupId: string, brokerageId: string): Promise<RunResponse> {
    return await api<RunResponse>(`/api/quotation-groups/${groupId}/quotations`, {
      method: 'POST',
      body: { brokerageId },
    })
  }

  /** RN-057/058: lê o leque persistido (para o polling). Traduz para o modelo da tela. */
  async function listQuotations(groupId: string): Promise<QuotationsResult> {
    const response = await api<ListResponse>(`/api/quotation-groups/${groupId}/quotations`, {
      method: 'GET',
    })
    return mapQuotations(response)
  }

  /** RN-059: marca a Cotação escolhida do Grupo. */
  async function selectQuotation(groupId: string, quotationId: string): Promise<SelectResponse> {
    return await api<SelectResponse>(
      `/api/quotation-groups/${groupId}/quotations/${quotationId}/select`,
      { method: 'POST' },
    )
  }

  return { runQuotations, listQuotations, selectQuotation }
}
