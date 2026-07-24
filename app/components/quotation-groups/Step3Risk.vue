<script setup lang="ts">
/**
 * Etapa 3 — Dados de risco (exec-plan 0015, incremento 3). Modalidade (catálogo real via
 * `useModalities`), importância segurada (IS), vigência (início/fim) com prazo derivado, e
 * coberturas adicionais. Os dados ficam na store para o resumo e para a assinatura de recálculo.
 *
 * O "salvar" do QuotationGroup no avanço do passo (POST/PUT) depende de contrato inexistente
 * (backend-primeiro / PR-0) — por ora a etapa só coleta os dados; a persistência entra quando o
 * endpoint existir. Coberturas usam os rótulos do handoff enquanto `GET coberturas` (ab-0003) não
 * é publicado. TODO(backend): trocar por contrato quando disponível.
 */
import type { ModalityListItem } from '~/composables/useModalities'

const wizard = useQuotationGroupWizardStore()
const { listModalities } = useModalities()

const modalities = ref<ModalityListItem[]>([])
const loadingModalities = ref(false)
const modalitiesError = ref<string | null>(null)

const modalityId = computed<string | null>({
  get: () => wizard.risk.modalityId,
  set: (id) => {
    wizard.risk.modalityId = id
    wizard.risk.modalityName = modalities.value.find(m => m.id === id)?.name ?? null
  },
})

const prazoDias = computed<number | null>(() => {
  const { startDate, endDate } = wizard.risk
  if (!startDate || !endDate) return null
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  const days = Math.round((end - start) / 86_400_000)
  return days > 0 ? days : null
})

const prazoDisplay = computed(() => (prazoDias.value == null ? '' : `${prazoDias.value} dias`))

onMounted(async () => {
  loadingModalities.value = true
  try {
    const response = await listModalities()
    modalities.value = response.items
  }
  catch {
    modalitiesError.value = 'Não foi possível carregar as modalidades.'
  }
  finally {
    loadingModalities.value = false
  }
})
</script>

<template>
  <div class="si-qg-step3">
    <p class="si-qg-step3__hint">
      Modalidade, importância segurada e vigência definem a cotação.
    </p>

    <div class="si-qg-step3__grid">
      <SiSelect
        v-model="modalityId"
        label="Modalidade"
        required
        :items="modalities"
        item-title="name"
        item-value="id"
        :loading="loadingModalities"
        placeholder="Selecione a modalidade"
        class="si-qg-step3__full"
      />

      <SiCurrencyField
        v-model="wizard.risk.insuredAmount"
        label="Importância segurada"
        required
        class="si-qg-step3__full"
      />

      <SiDateField
        v-model="wizard.risk.startDate"
        label="Início da vigência"
        required
      />

      <SiDateField
        v-model="wizard.risk.endDate"
        label="Fim da vigência"
        required
      />

      <SiTextField
        :model-value="prazoDisplay"
        label="Prazo"
        readonly
        placeholder="—"
      />
    </div>

    <SiAlert
      v-if="modalitiesError"
      type="error"
      class="mt-2 mb-0"
      :text="modalitiesError"
    />

    <fieldset class="si-qg-step3__coverages">
      <legend class="si-qg-step3__coverages-legend">
        Coberturas adicionais
      </legend>
      <SiCheckbox
        v-model="wizard.risk.coverageMulta"
        label="Multa"
        hide-details
      />
      <SiCheckbox
        v-model="wizard.risk.coverageLabor"
        label="Trabalhista e previdenciária"
        hide-details
      />
    </fieldset>
  </div>
</template>

<style scoped>
.si-qg-step3__hint {
  margin: var(--si-space-4) 0 var(--si-space-4);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.si-qg-step3__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--si-space-3) var(--si-space-4);
}

.si-qg-step3__full {
  grid-column: 1 / -1;
}

.si-qg-step3__coverages {
  margin: var(--si-space-5) 0 0;
  padding: 0;
  border: 0;
}

.si-qg-step3__coverages-legend {
  padding: 0;
  margin-bottom: var(--si-space-2);
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

@media (max-width: 599.98px) {
  .si-qg-step3__grid {
    grid-template-columns: 1fr;
  }
}
</style>
