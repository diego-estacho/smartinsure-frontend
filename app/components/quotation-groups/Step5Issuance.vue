<script setup lang="ts">
/**
 * Etapa 5 — Emissão (RN-500..RN-514), integrada ao servidor.
 *
 * A tela reflete, não decide: prêmio e comissão vêm da Cotação; a **taxa** é editável e, ao confirmar,
 * o servidor a submete à Seguradora e devolve prêmio/comissão/parcelamento recalculados (RN-504). O
 * parcelamento e o vencimento são escolhidos **entre as opções da Cotação** (RN-505); os documentos
 * exigidos aparecem como leitura (RN-510); o Termo vem do servidor, porque é o mesmo texto que o aceite
 * registra (RN-506). O desfecho é **emissão solicitada** — a plataforma não afirma apólice emitida, que
 * depende de confirmação junto à Seguradora (demanda própria).
 */
import type { QuotationInstallmentOption } from '~/composables/useQuotations'
import { extractApiErrorMessage } from '~/lib/apiError'
import { formatTaxPercentage, isSameTaxPercentage, parseTaxPercentage } from '~/lib/format'

const wizard = useQuotationGroupWizardStore()
const { requestIssuance, updateTax, getInsurerTerm } = useIssuance()

const error = ref<string | null>(null)
const taxError = ref<string | null>(null)
const savingTax = ref(false)
const termContent = ref<string | null>(null)
const termError = ref<string | null>(null)

const quotation = computed(() => wizard.selectedQuotation)

// RN-505: as escolhas saem das listas informadas pela Seguradora — nada é oferecido além delas.
const parcelaOptions = computed(() =>
  (quotation.value?.installmentOptions ?? []).map((option: QuotationInstallmentOption) => ({
    value: option.number,
    title: option.description?.trim()
      ? `${option.number}x — ${option.description}${option.hasInterest ? ' (com juros)' : ''}`
      : `${option.number}x de ${brl(option.value)}${option.hasInterest ? ' (com juros)' : ''}`,
  })),
)

const vencimentoOptions = computed(() =>
  (quotation.value?.possibleGracePeriodsInDays ?? []).map((days: number) => ({
    value: days,
    title: days === 0 ? 'Na emissão' : `${days} dias`,
  })),
)

const requiredDocuments = computed(() => quotation.value?.requiredDocuments ?? [])

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const premio = computed(() => quotation.value?.premio ?? null)
const comissaoPercentual = computed(() => quotation.value?.comissao ?? null)

// Comissão em valor: vem da Cotação (a Seguradora calcula, ADR-004) — a tela apenas apresenta.
const valorComissao = computed(() => {
  if (premio.value == null || comissaoPercentual.value == null) return null
  return (premio.value * comissaoPercentual.value) / 100
})

/** RN-501: exigência de Contragarantia sem assinatura é beco sem saída — dito antes do emitir. */
const ccgBlock = computed(() =>
  quotation.value?.requiresCcg && !quotation.value.ccgSigned
    ? 'A seguradora exige Contragarantia (CCG) assinada para emitir esta apólice.'
    : null,
)

const lastQuotationTax = ref('')

// RN-504: a taxa oferecida para ajuste é a VIGENTE na Cotação escolhida — deixar o campo vazio
// esconderia o valor que está valendo e faria o corretor redigitar de memória o que já veio da
// Seguradora. Segue a Cotação (inclusive após um recálculo), preservando o que ele estiver digitando.
watch(() => quotation.value?.taxa, (taxa) => {
  if (taxa == null) return
  const vigente = formatTaxPercentage(taxa)
  // Só sobrescreve o que a própria Cotação escreveu antes — o que o corretor digitou é preservado.
  if (wizard.issuance.taxa === '' || wizard.issuance.taxa === lastQuotationTax.value) {
    wizard.issuance.taxa = vigente
  }
  lastQuotationTax.value = vigente
}, { immediate: true })

/** RN-504: submete a taxa e passa a exibir o que a Seguradora devolveu. */
async function confirmTax(): Promise<void> {
  const groupId = wizard.quotationGroupId
  const parsed = parseTaxPercentage(wizard.issuance.taxa)

  taxError.value = null

  if (!groupId) {
    taxError.value = 'A oferta ainda não foi salva.'
    return
  }

  if (!Number.isFinite(parsed) || parsed <= 0) {
    taxError.value = 'Informe uma taxa maior que zero.'
    return
  }

  // RN-504 (caso limite): taxa igual à vigente não é submetida — nada mudaria, e a Seguradora não
  // precisa recalcular o que já vale. "Igual" é o que o campo mostra: a Seguradora pode devolver mais
  // casas do que a exibição, e o valor intocado voltaria numericamente diferente.
  if (quotation.value != null && isSameTaxPercentage(parsed, quotation.value.taxa)) {
    return
  }

  savingTax.value = true
  try {
    const result = await updateTax({ quotationGroupId: groupId, tax: parsed })
    // O servidor já aplicou na Cotação; espelhamos o retorno para a tela não divergir do que valeu.
    wizard.applyRecalculatedQuotation(result)
  }
  catch (err) {
    taxError.value = extractApiErrorMessage(err, 'Não foi possível ajustar a taxa agora.')
  }
  finally {
    savingTax.value = false
  }
}

/**
 * RN-506: o texto do Termo é do servidor — a tela não guarda cópia, porque é o MESMO conteúdo que o
 * aceite registra. Carregado quando o modal abre (quem abre é o rodapé do wizard, pela store), uma vez
 * por passada: reabrir não refaz a chamada.
 */
async function loadInsurerTerm(): Promise<void> {
  termError.value = null

  if (termContent.value) return

  if (!wizard.quotationGroupId) {
    termError.value = 'A oferta ainda não foi salva — volte e conclua os dados de risco.'
    return
  }

  try {
    const term = await getInsurerTerm(wizard.quotationGroupId)
    termContent.value = term.content
  }
  catch (err) {
    termError.value = extractApiErrorMessage(err, 'Não foi possível carregar o termo da seguradora.')
  }
}

watch(() => wizard.termOpen, (open) => {
  if (open) void loadInsurerTerm()
}, { immediate: true })

async function confirmIssue(): Promise<void> {
  const groupId = wizard.quotationGroupId
  wizard.termOpen = false
  error.value = null

  if (!groupId) {
    error.value = 'A oferta ainda não foi salva — volte e conclua os dados de risco.'
    return
  }

  if (wizard.issuance.parcelas == null || wizard.issuance.vencimento == null) {
    error.value = 'Escolha a forma de pagamento para emitir.'
    return
  }

  wizard.issuanceState = 'emitting'
  try {
    const result = await requestIssuance({
      quotationGroupId: groupId,
      installmentNumber: wizard.issuance.parcelas,
      gracePeriodInDays: wizard.issuance.vencimento,
      termAccepted: wizard.termAccepted,
    })
    wizard.setIssuanceRequested(result)
  }
  catch (err) {
    wizard.issuanceState = 'form'
    // RN-511: o motivo é o do servidor (portão ou veredito da Seguradora) — não reescrevemos.
    error.value = extractApiErrorMessage(err, 'Não foi possível solicitar a emissão agora.')
  }
}

defineExpose({ confirmIssue, confirmTax, loadInsurerTerm })
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
      Solicitando a emissão
    </h2>
    <p class="si-qg-emit__status-text">
      Aguarde um momento — estamos enviando o pedido de emissão à seguradora.
    </p>
  </div>

  <!-- Emissão solicitada (RN-508/RN-514): a plataforma afirma o que sabe, não "apólice emitida" -->
  <div
    v-else-if="wizard.issuanceState === 'requested'"
    class="si-qg-emit__status"
  >
    <span class="si-qg-emit__check">
      <SiIcon
        icon="check"
        :size="32"
      />
    </span>
    <h2 class="si-qg-emit__status-title">
      Emissão solicitada
    </h2>
    <p class="si-qg-emit__status-text">
      O pedido de emissão da proposta {{ wizard.issuedProposalNumber ?? wizard.policyId }} foi enviado à
      seguradora. A apólice fica disponível quando a seguradora concluir a emissão.
    </p>
    <div class="si-qg-emit__status-actions">
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

    <!-- RN-501: bloqueio explicado antes de o corretor preencher o resto -->
    <SiAlert
      v-if="ccgBlock"
      type="warning"
      title="Emissão indisponível"
      :text="ccgBlock"
      class="mb-0"
    />

    <!-- RN-510: documentos que a seguradora exige — leitura; o envio é demanda própria -->
    <section
      v-if="requiredDocuments.length"
      class="si-qg-emit__block"
    >
      <span class="si-qg-emit__block-title">Documentos exigidos pela seguradora</span>
      <ul class="si-qg-emit__docs">
        <li
          v-for="document in requiredDocuments"
          :key="document.name"
        >
          {{ document.name }}<template v-if="document.description"> — {{ document.description }}</template>
        </li>
      </ul>
    </section>

    <!-- RN-502: a minuta traz os próprios blocos e some quando a Modalidade não define Tag nem Cláusula
         ("nada a preencher"). Sem wrapper aqui: um card vazio na tela seria ruído sem conteúdo. -->
    <QuotationGroupsMinutaClauses class="si-qg-emit__minuta" />

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
          :model-value="valorComissao != null ? brl(valorComissao) : '—'"
          label="Valor da comissão"
          readonly
          density="comfortable"
        />
        <SiTextField
          :model-value="comissaoPercentual != null ? `${comissaoPercentual}` : '—'"
          label="Comissão (%)"
          readonly
          density="comfortable"
        />
      </div>

      <!-- RN-504: a taxa é o único valor editável; quem recalcula prêmio e comissão é a seguradora -->
      <div class="si-qg-emit__grid si-qg-emit__grid--2">
        <SiTextField
          v-model="wizard.issuance.taxa"
          label="Taxa aplicada (%)"
          placeholder="0,00"
          density="comfortable"
          :error-messages="taxError ? [taxError] : []"
        />
        <SiButton
          variant="outlined"
          color="secondary"
          :loading="savingTax"
          @click="confirmTax()"
        >
          Recalcular com esta taxa
        </SiButton>
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
        <SiAlert
          v-if="termError"
          type="error"
          :text="termError"
          class="mb-2"
        />
        <p class="si-qg-emit__term-text">
          {{ termContent ?? 'Carregando o termo da seguradora…' }}
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
