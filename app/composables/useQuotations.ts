/**
 * Cotações (Quotation) da etapa 4 — **MOCK** (exec-plan 0015). Fixtures do handoff; simula o
 * modelo real "espera → lote": uma única espera (~1,5s) e então o conjunto de retornos. A
 * assincronicidade real das seguradoras fica escondida atrás do backend agregador.
 *
 * Esta é a costura isolada: quando o backend existir, troca-se só `fetchQuotations` por
 * `POST cotacao/motor { tomador, segurado, risco, escopo }` — a tela não muda.
 * TODO(backend): ligar o motor real (OPEN-07) e remover o mock.
 */
export type QuotationStatus = 'auto' | 'analise'

export interface Quotation {
  id: string
  name: string
  /** Prêmio em reais. */
  premio: number
  /** Comissão em pontos percentuais. */
  comissao: number
  /** Limite em reais. */
  limite: number
  status: QuotationStatus
  /** Taxa aplicada (% ao mês). */
  taxa: number
  /** Tags da minuta exigidas por esta seguradora (chaves de MINUTA_TAG_DEFS). Vazio = sem minuta. */
  tags: string[]
}

export interface UnavailableQuotation {
  id: string
  name: string
  reason: string
}

export interface QuotationsResult {
  available: Quotation[]
  unavailable: UnavailableQuotation[]
}

/** Rótulo/cor do status por nome estável (ADR-004): mapa único de domínio. */
export const quotationStatusView: Record<QuotationStatus, { label: string, color: string }> = {
  auto: { label: 'Emissão automática', color: 'success' },
  analise: { label: 'Requer análise de subscrição', color: 'warning' },
}

// MOCK: fixtures do handoff. Nomes de seguradora são reais (fluxo atual); sem logotipos.
const MOCK_AVAILABLE: Quotation[] = [
  { id: 'newe', name: 'Newe Seguros', premio: 300, comissao: 25, limite: 1_928_991, status: 'auto', taxa: 0.42, tags: [] },
  { id: 'sancor', name: 'Sancor Seguros', premio: 250, comissao: 20, limite: 10_000_000, status: 'auto', taxa: 0.36, tags: ['objeto', 'edital', 'orgao', 'contratoPrincipal'] },
  { id: 'mitsui', name: 'Mitsui Sumitomo', premio: 410, comissao: 18, limite: 850_000, status: 'analise', taxa: 0.58, tags: ['objeto', 'edital', 'orgao'] },
]

const MOCK_UNAVAILABLE: UnavailableQuotation[] = [
  { id: 'essor', name: 'Essor Seguros', reason: 'Produto não disponível para este tomador.' },
  { id: 'sombrero', name: 'Sombrero Seguros', reason: 'Tomador inadimplente junto à seguradora.' },
  { id: 'axa', name: 'AXA Seguros', reason: 'Produto não disponível para este tomador.' },
  { id: 'berkley', name: 'Berkley', reason: 'Não foi possível calcular os limites/taxas para este tomador.' },
]

/** Atraso do mock (ms); exportado para os testes controlarem sem esperar de verdade. */
export const MOCK_QUOTE_DELAY_MS = 1500

export function useQuotations() {
  /**
   * Dispara a busca de cotações. MOCK: espera → lote. `delayMs` permite 0 nos testes.
   * TODO(backend): substituir por `POST cotacao/motor` mantendo esta assinatura.
   */
  async function fetchQuotations(options: { delayMs?: number } = {}): Promise<QuotationsResult> {
    const delay = options.delayMs ?? MOCK_QUOTE_DELAY_MS
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
    return {
      available: MOCK_AVAILABLE.map(q => ({ ...q })),
      unavailable: MOCK_UNAVAILABLE.map(q => ({ ...q })),
    }
  }

  return { fetchQuotations }
}
