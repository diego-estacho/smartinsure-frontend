/**
 * Ciclo de acompanhamento do fan-out de cotações (etapa 4 — RN-057, ADR-051): dono do timer, do teardown,
 * do timeout e do estado terminal (pendências = 0). Lê o leque persistido por polling barato (GET) e
 * atualiza a store; encerra quando nenhuma seguradora está mais cotando. Reutilizável pelo Step4 e pelo
 * restore do deep-link (nova.vue). O `$fetch` é injetável via useQuotations (testes sem rede).
 */
const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 120_000

export function useQuotationPolling() {
  const wizard = useQuotationGroupWizardStore()
  const { listQuotations } = useQuotations()

  // Estourou o tempo ainda com seguradoras cotando (evita skeletons "Cotando…" presos).
  const timedOut = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const pendingCount = computed(() => wizard.quotations?.pending.length ?? 0)

  function stop(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  /** Lê o leque persistido, atualiza a store, reflete a escolhida (RN-059) e encerra ao zerar pendências. */
  async function refresh(): Promise<void> {
    const groupId = wizard.quotationGroupId
    if (!groupId) return
    const result = await listQuotations(groupId)
    wizard.setQuotations(result)

    if (result.selectedQuotationId && !wizard.selectedQuotation) {
      const selected = result.available.find(quotation => quotation.id === result.selectedQuotationId)
      if (selected) wizard.setSelectedQuotation(selected)
    }

    if (result.pending.length === 0) {
      stop()
      wizard.markQuotationsGenerated()
    }
  }

  function start(): void {
    stop()
    timedOut.value = false
    const startedAt = Date.now()
    timer = setInterval(() => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        // Timeout com pendências: para e sinaliza (o corretor pode retomar) em vez de deixar preso.
        stop()
        if (pendingCount.value > 0) timedOut.value = true
        return
      }
      void refresh().catch(() => {})
    }, POLL_INTERVAL_MS)
  }

  /** Retoma após um timeout: reconsulta e, se ainda houver pendências, volta a acompanhar. */
  async function resume(): Promise<void> {
    timedOut.value = false
    await refresh().catch(() => {})
    if (pendingCount.value > 0) start()
  }

  /**
   * Restaura o leque salvo no deep-link/F5: igual ao refresh, mas SEMPRE fixa a assinatura
   * (signatureChanged = false) mesmo com pendências, para o Step4 preservar o resultado (não recotar) —
   * ele retoma o acompanhamento ao montar. NÃO liga o timer aqui.
   */
  async function restore(): Promise<void> {
    // refresh já fixa a assinatura quando pending==0; aqui garantimos sempre (mesmo com pendências).
    await refresh()
    wizard.markQuotationsGenerated()
  }

  onBeforeUnmount(stop)

  return { timedOut, start, refresh, resume, restore }
}
