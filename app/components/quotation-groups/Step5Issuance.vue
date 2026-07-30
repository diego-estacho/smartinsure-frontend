<script setup lang="ts">
/**
 * Etapa 5 — Emissão (exec-plan 0015, incremento 5) — **MOCK**. Formulário (número do contrato,
 * minuta/cláusulas sincronizadas com a etapa 4, prêmio/comissão, forma de pagamento), modal de
 * "Termo e declaração" com aceite obrigatório, e estados de processamento e sucesso.
 *
 * A emissão real depende de contrato inexistente — `useIssuance` é mock isolado. TODO(backend):
 * `POST emissao { ofertaId, contrato, clausulas, minuta, pagamento, aceite }`.
 */
import { extractApiErrorMessage } from '~/lib/apiError'

const wizard = useQuotationGroupWizardStore()
const { issue } = useIssuance()

const error = ref<string | null>(null)

const parcelaOptions = Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1), title: `${i + 1}x` }))
const vencimentoOptions = [
  { value: '7', title: '7 dias' },
  { value: '15', title: '15 dias' },
  { value: '30', title: '30 dias' },
]

const TERM_TEXT = 'O tomador, por meio próprio ou por seu corretor de seguros, declara ter lido, compreendido e estar de acordo com as condições aqui estabelecidas, incluindo as condições contratuais deste seguro, autorizando a emissão da apólice oriunda desta proposta por meio deste pedido de emissão digital de Seguro Garantia.'

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const premio = computed(() => wizard.selectedQuotation?.premio ?? null)

// Valor da comissão (derivado): prêmio × comissão de corretagem (%). Só forma, não decisão (ADR-004).
const valorComissao = computed(() => {
  const rate = Number(wizard.issuance.comissaoCorretagem.replace(',', '.'))
  if (premio.value == null || Number.isNaN(rate)) return null
  return (premio.value * rate) / 100
})

async function confirmIssue(): Promise<void> {
  wizard.termOpen = false
  wizard.issuanceState = 'emitting'
  error.value = null
  try {
    const result = await issue()
    wizard.policyId = result.policyId
    wizard.issuanceState = 'success'
  }
  catch (err) {
    wizard.issuanceState = 'form'
    error.value = extractApiErrorMessage(err, 'Não foi possível emitir a apólice agora. Tente novamente em alguns minutos.')
  }
}
</script>

<template>
  <!-- Processando -->
  <div
    v-if="wizard.issuanceState === 'emitting'"
    class="si-qg-emit__status"
  >
    <SiProgressCircular
      indeterminate
      :size="52"
      :width="4"
    />
    <h2 class="si-qg-emit__status-title">
      Emitindo apólice
    </h2>
    <p class="si-qg-emit__status-text">
      Aguarde um momento — estamos salvando as informações e preparando a apólice.
    </p>
  </div>

  <!-- Sucesso -->
  <div
    v-else-if="wizard.issuanceState === 'success'"
    class="si-qg-emit__status"
  >
    <span class="si-qg-emit__check">
      <SiIcon
        icon="check"
        :size="32"
      />
    </span>
    <h2 class="si-qg-emit__status-title">
      Apólice emitida
    </h2>
    <p class="si-qg-emit__status-text">
      A apólice do contrato {{ wizard.issuance.contrato }} foi emitida com sucesso. Você pode baixá-la ou iniciar uma nova oferta.
    </p>
    <div class="si-qg-emit__status-actions">
      <SiButton :prepend-icon="'download'">
        Baixar apólice
      </SiButton>
      <SiButton
        variant="outlined"
        color="secondary"
        @click="wizard.reset()"
      >
        Nova oferta
      </SiButton>
    </div>
  </div>

  <!-- Formulário -->
  <div
    v-else
    class="si-qg-emit"
  >
    <SiAlert
      v-if="error"
      type="error"
      title="Falha ao processar a emissão"
      :text="error"
      class="mb-0"
    />

    <section class="si-qg-emit__block">
      <span class="si-qg-emit__block-title">Contrato</span>
      <SiTextField
        v-model="wizard.issuance.contrato"
        label="Número do contrato"
        required
        placeholder="Ex.: 2026/0481-SP"
        density="comfortable"
        class="si-qg-emit__contrato"
      />
    </section>

    <section class="si-qg-emit__block">
      <QuotationGroupsMinutaClauses class="si-qg-emit__minuta" />
    </section>

    <section class="si-qg-emit__block">
      <span class="si-qg-emit__block-title">Prêmio e comissão</span>
      <div class="si-qg-emit__grid">
        <SiTextField
          :model-value="premio != null ? brl(premio) : '—'"
          label="Valor do prêmio"
          readonly
          density="comfortable"
        />
        <SiTextField
          v-model="wizard.issuance.taxa"
          label="Taxa aplicada (%)"
          placeholder="0,00"
          density="comfortable"
        />
        <SiTextField
          :model-value="valorComissao != null ? brl(valorComissao) : '—'"
          label="Valor da comissão"
          readonly
          density="comfortable"
        />
        <SiTextField
          v-model="wizard.issuance.comissaoCorretagem"
          label="Comissão de corretagem (%)"
          placeholder="0"
          density="comfortable"
        />
      </div>
    </section>

    <section class="si-qg-emit__block">
      <span class="si-qg-emit__block-title">Forma de pagamento</span>
      <div class="si-qg-emit__grid si-qg-emit__grid--2">
        <SiSelect
          v-model="wizard.issuance.parcelas"
          label="Número de parcelas"
          required
          placeholder="Selecione"
          :items="parcelaOptions"
          item-title="title"
          item-value="value"
        />
        <SiSelect
          v-model="wizard.issuance.vencimento"
          label="Vencimento da 1ª parcela"
          required
          placeholder="Selecione"
          :items="vencimentoOptions"
          item-title="title"
          item-value="value"
        />
      </div>
    </section>

    <!-- Modal: termo e declaração (aceite obrigatório antes de emitir). -->
    <SiDialog
      v-model="wizard.termOpen"
      :max-width="560"
    >
      <SiCard class="si-qg-emit__term">
        <h3 class="text-subtitle-1 si-qg-emit__term-title">
          Termo e declaração
        </h3>
        <p class="si-qg-emit__term-text">
          {{ TERM_TEXT }}
        </p>
        <SiCheckbox
          v-model="wizard.termAccepted"
          label="Li e aceito o termo e a declaração acima."
          hide-details
        />
        <div class="si-qg-emit__term-actions">
          <SiButton
            variant="text"
            color="secondary"
            @click="wizard.termOpen = false"
          >
            Cancelar
          </SiButton>
          <SiButton
            :disabled="!wizard.termAccepted"
            @click="confirmIssue"
          >
            Emitir apólice
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>
  </div>
</template>

<style scoped>
.si-qg-emit {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
  margin-top: var(--si-space-4);
}

.si-qg-emit__block {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-5);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  background: rgb(var(--v-theme-surface));
}

.si-qg-emit__block-title {
  font-size: var(--si-fs-caption);
  text-transform: uppercase;
  letter-spacing: var(--si-ls-eyebrow);
  font-weight: var(--si-font-weight-semibold);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-qg-emit__contrato {
  max-width: 420px;
}

/* O bloco de minuta traz a própria borda superior; aqui removemos a duplicação. */
.si-qg-emit__minuta {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.si-qg-emit__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--si-space-3);
}

.si-qg-emit__grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* ── Estados (processando / sucesso) ── */
.si-qg-emit__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--si-space-3);
  padding: var(--si-space-10) var(--si-space-5);
}

.si-qg-emit__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: var(--si-radius-pill);
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.si-qg-emit__status-title {
  margin: 0;
  font-size: var(--si-fs-h3);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-emit__status-text {
  margin: 0;
  max-width: 420px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
  line-height: var(--si-lh-body);
}

.si-qg-emit__status-actions {
  display: flex;
  gap: var(--si-space-3);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--si-space-2);
}

/* ── Modal do termo ── */
.si-qg-emit__term {
  padding: var(--si-space-5);
}

.si-qg-emit__term-title {
  margin: 0 0 var(--si-space-3);
}

.si-qg-emit__term-text {
  margin: 0 0 var(--si-space-4);
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
  line-height: var(--si-lh-body);
}

.si-qg-emit__term-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-5);
}

@media (max-width: 720px) {
  .si-qg-emit__grid,
  .si-qg-emit__grid--2 {
    grid-template-columns: 1fr;
  }
}
</style>
