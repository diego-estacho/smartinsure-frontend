/**
 * Estado de UI do fluxo "nova oferta" (QuotationGroup) — só cliente (ADR-002). O rascunho ainda
 * não vem do servidor; a persistência real (POST/PUT quotation-groups) e as cotações (Quotation)
 * plugam pelos composables nos próximos incrementos (exec-plan 0015).
 *
 * `QuotationGroup` = o pedido/estudo criado no wizard (o que a UI chama de "oferta"); `Quotation`
 * = o retorno de uma seguradora (etapa 4). Nome técnico em inglês por decisão do dono; ver
 * `.grill/nova-oferta-grupo-cotacao.md` e o exec-plan 0015.
 *
 * `defineStore`/`ref`/`computed` são auto-importados (Nuxt + @pinia/nuxt) — não importar à mão.
 */
import type { Quotation, QuotationsResult } from '~/composables/useQuotations'

export type QuotationScopeMode = 'all' | 'specific'

export interface QuotationScope {
  mode: QuotationScopeMode
  /** Seguradoras escolhidas quando o modo é 'specific'. */
  insurerIds: string[]
}

/** Tomador selecionado na etapa 1 (subset consumido pela UI: card + resumo). */
export interface SelectedPolicyHolder {
  id: string
  name: string
  documentNumber: string
  mainAddress: string | null
}

/** Segurado selecionado na etapa 2 (papel `Insured` de uma Pessoa). */
export interface SelectedInsured {
  id: string
  name: string
  documentNumber: string
  socialName: string | null
  mainAddress: string | null
}

/** Dados de risco da etapa 3 (modalidade, IS, vigência e coberturas). */
export interface RiskData {
  modalityId: string | null
  /** Nome da modalidade, guardado para o resumo (evita novo fetch). */
  modalityName: string | null
  /** Importância segurada (IS), em número pronto para cálculo/envio. */
  insuredAmount: number | null
  /** Vigência em ISO (yyyy-MM-dd), padrão do backend. */
  startDate: string | null
  endDate: string | null
  coverageMulta: boolean
  coverageLabor: boolean
  /** Modalidade complementar (opcional) — UI-only por ora (contrato ainda não a persiste). */
  complementaryModalityId: string | null
}

function emptyRisk(): RiskData {
  return {
    modalityId: null,
    modalityName: null,
    insuredAmount: null,
    startDate: null,
    endDate: null,
    coverageMulta: false,
    coverageLabor: false,
    complementaryModalityId: null,
  }
}

/** Dados da emissão (etapa 5). */
export interface IssuanceData {
  contrato: string
  taxa: string
  comissaoCorretagem: string
  parcelas: string | null
  vencimento: string | null
}

function emptyIssuance(): IssuanceData {
  return { contrato: '', taxa: '', comissaoCorretagem: '', parcelas: null, vencimento: null }
}

/** 'form' = formulário; 'emitting' = processando; 'success' = apólice emitida. */
export type IssuanceState = 'form' | 'emitting' | 'success'

/** 'entry' = tela de escopo (antes do stepper); 'steps' = as 5 etapas do stepper. */
export type WizardPhase = 'entry' | 'steps'

/** Rótulos das 5 etapas (UI pt-BR); ordem do protótipo. */
export const WIZARD_STEPS = [
  { label: 'Dados do tomador' },
  { label: 'Dados do segurado' },
  { label: 'Dados de risco' },
  { label: 'Cotações' },
  { label: 'Emissão' },
] as const

export const useQuotationGroupWizardStore = defineStore('quotationGroupWizard', () => {
  const phase = ref<WizardPhase>('entry')
  const currentStep = ref(0)
  const scope = ref<QuotationScope>({ mode: 'all', insurerIds: [] })
  const policyHolder = ref<SelectedPolicyHolder | null>(null)
  const insured = ref<SelectedInsured | null>(null)
  const risk = ref<RiskData>(emptyRisk())
  // Cotação escolhida na etapa 4 (mock) — alimenta o painel de seleção, a emissão e o resumo.
  const selectedQuotation = ref<Quotation | null>(null)
  // Cotações preservadas na store (para não reprocessar sem necessidade) + assinatura para o
  // recálculo inteligente. `quotationGroupId` = id do grupo salvo (POST/PUT, hoje mock).
  const quotations = ref<QuotationsResult | null>(null)
  const quotationsGenerated = ref(false)
  const quotationSignature = ref<string | null>(null)
  const quotationGroupId = ref<string | null>(null)
  // Corretora dona das Habilitações (RN-023) — origem do fan-out/seleção/minuta. Preenchida com a
  // Corretora ativa da sessão (RN-064) na entrada da oferta; o backend valida a Habilitação ao cotar.
  const brokerageId = ref<string | null>(null)
  // Minuta (valores das tags) e cláusulas selecionadas — sincronizados entre as etapas 4 e 5.
  const minuta = ref<Record<string, string>>({})
  const clauses = ref<Record<string, boolean>>({})
  // Valores das tags próprias de cada cláusula particular (RN-062): externalId → (nome da tag → valor).
  // As cláusulas trazem placeholders [TAG_X] no texto; o corretor preenche e o valor entra na minuta.
  const clauseTags = ref<Record<string, Record<string, string>>>({})
  // Emissão (etapa 5): dados do formulário, estado do processo, apólice e o termo de aceite.
  const issuance = ref<IssuanceData>(emptyIssuance())
  const issuanceState = ref<IssuanceState>('form')
  const policyId = ref<string | null>(null)
  const termOpen = ref(false)
  const termAccepted = ref(false)

  const lastStepIndex = WIZARD_STEPS.length - 1
  const isFirstStep = computed(() => currentStep.value === 0)
  const isLastStep = computed(() => currentStep.value === lastStepIndex)

  /** Escopo específico exige ao menos uma seguradora (validação de forma, não de negócio). */
  const canStart = computed(() => scope.value.mode === 'all' || scope.value.insurerIds.length > 0)

  function startOffer(): boolean {
    if (!canStart.value) return false
    phase.value = 'steps'
    currentStep.value = 0
    return true
  }

  function goNext(): void {
    if (currentStep.value < lastStepIndex) currentStep.value++
  }

  /** Voltar é sempre livre; no primeiro passo, retorna à tela de entrada. */
  function goBack(): void {
    if (currentStep.value > 0) currentStep.value--
    else phase.value = 'entry'
  }

  /** Navegação direta só para etapas já alcançadas (espelha o `clickable` do SiStepper). */
  function goToStep(index: number): void {
    if (index >= 0 && index <= currentStep.value) currentStep.value = index
  }

  function setPolicyHolder(value: SelectedPolicyHolder | null): void {
    policyHolder.value = value
  }

  function setInsured(value: SelectedInsured | null): void {
    insured.value = value
  }

  function setSelectedQuotation(value: Quotation | null): void {
    // Trocar (ou limpar) a Cotação escolhida descarta o preenchimento da minuta da anterior: cada
    // seguradora tem a sua (RN-062); sem isso, termos/cláusulas de uma seguradora vazariam para outra.
    if (value?.id !== selectedQuotation.value?.id) {
      minuta.value = {}
      clauses.value = {}
      clauseTags.value = {}
    }
    selectedQuotation.value = value
  }

  function setQuotations(value: QuotationsResult | null): void {
    quotations.value = value
  }

  function setQuotationGroupId(id: string | null): void {
    quotationGroupId.value = id
  }

  /**
   * RN-060 — fork por mudança de dado-base num Grupo já cotado: os dados-base (tomador/segurado/risco/
   * escopo) já refletem a mudança na store; aqui só se troca para o Grupo NOVO e zera-se o estado de
   * cotação (cotações, assinatura, seleção e minuta) para a nova cotação começar limpa. O Grupo
   * anterior e suas Cotações ficam preservados no backend (não são tocados).
   */
  function resetQuotationsForFork(newGroupId: string): void {
    quotationGroupId.value = newGroupId
    quotations.value = null
    quotationsGenerated.value = false
    quotationSignature.value = null
    selectedQuotation.value = null
    minuta.value = {}
    clauses.value = {}
    clauseTags.value = {}
  }

  function setBrokerageId(id: string | null): void {
    brokerageId.value = id
  }

  /** Assinatura dos dados que alimentam o motor de cotação (base do recálculo inteligente). */
  function computeSignature(): string {
    const r = risk.value
    return JSON.stringify([
      policyHolder.value?.id ?? null,
      insured.value?.id ?? null,
      scope.value.mode,
      [...scope.value.insurerIds].sort(),
      r.modalityId,
      r.insuredAmount,
      r.startDate,
      r.endDate,
      r.coverageMulta,
      r.coverageLabor,
      r.complementaryModalityId,
    ])
  }

  /** Marca as cotações como geradas e guarda a assinatura do momento. */
  function markQuotationsGenerated(): void {
    quotationsGenerated.value = true
    quotationSignature.value = computeSignature()
  }

  /**
   * True quando algum dado que alimenta o motor mudou desde a última geração — dispara o aviso
   * nas etapas 1–3 e o recálculo (com descarte da seleção) ao voltar às cotações.
   */
  const signatureChanged = computed(() =>
    quotationsGenerated.value
    && quotationSignature.value !== null
    && quotationSignature.value !== computeSignature(),
  )

  /**
   * Validação de FORMA por etapa (não de negócio — ADR-004): decide se o rodapé pode avançar e
   * qual mensagem mostrar. Cresce a cada etapa implementada.
   */
  function validateCurrentStep(): string | null {
    if (currentStep.value === 0 && !policyHolder.value) {
      return 'Busque e selecione o tomador para continuar.'
    }
    if (currentStep.value === 1 && !insured.value) {
      return 'Busque e selecione o segurado para continuar.'
    }
    if (currentStep.value === 2) {
      const data = risk.value
      if (!data.modalityId || data.insuredAmount == null || !data.startDate || !data.endDate) {
        return 'Preencha modalidade, importância segurada e vigência para continuar.'
      }
    }
    if (currentStep.value === 3 && !selectedQuotation.value) {
      return 'Selecione uma cotação para prosseguir.'
    }
    if (currentStep.value === 4) {
      const data = issuance.value
      if (!data.contrato.trim() || !data.parcelas || !data.vencimento) {
        return 'Preencha o número do contrato e a forma de pagamento para emitir.'
      }
    }
    return null
  }

  function reset(): void {
    phase.value = 'entry'
    currentStep.value = 0
    scope.value = { mode: 'all', insurerIds: [] }
    policyHolder.value = null
    insured.value = null
    risk.value = emptyRisk()
    selectedQuotation.value = null
    quotations.value = null
    quotationsGenerated.value = false
    quotationSignature.value = null
    quotationGroupId.value = null
    brokerageId.value = null
    minuta.value = {}
    clauses.value = {}
    clauseTags.value = {}
    issuance.value = emptyIssuance()
    issuanceState.value = 'form'
    policyId.value = null
    termOpen.value = false
    termAccepted.value = false
  }

  return {
    phase,
    currentStep,
    scope,
    policyHolder,
    insured,
    risk,
    selectedQuotation,
    quotations,
    quotationsGenerated,
    quotationGroupId,
    brokerageId,
    signatureChanged,
    minuta,
    clauses,
    clauseTags,
    issuance,
    issuanceState,
    policyId,
    termOpen,
    termAccepted,
    isFirstStep,
    isLastStep,
    canStart,
    startOffer,
    goNext,
    goBack,
    goToStep,
    setPolicyHolder,
    setInsured,
    setSelectedQuotation,
    setQuotations,
    setQuotationGroupId,
    resetQuotationsForFork,
    setBrokerageId,
    markQuotationsGenerated,
    validateCurrentStep,
    reset,
  }
})
