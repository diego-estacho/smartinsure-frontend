<script setup lang="ts">
/**
 * Etapa 3 — Dados de risco (exec-plan 0015). Modalidade (catálogo real via `useModalities`),
 * importância segurada (IS), vigência (início/fim) e prazo em dias, coberturas adicionais e
 * modalidade complementar. Fidelidade ao protótipo: IS/início/fim/prazo numa linha só; coberturas
 * horizontais; modalidade complementar opcional.
 *
 * Prazo é BIDIRECIONAL com a vigência: início+fim => prazo (dias entre as datas); início+prazo
 * (prazo editado) => fim = início + prazo. Modalidade complementar é UI-only por ora (o contrato
 * ainda não a persiste — TODO backend).
 */
import type { ModalityListItem } from '~/composables/useModalities'
import { fromIsoDate, toIsoDate } from '~/lib/dates'
import { extractApiErrorMessage } from '~/lib/apiError'

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

const prazo = ref<number | null>(null)

function diffDays(startIso: string, endIso: string): number | null {
  const start = fromIsoDate(startIso)
  const end = fromIsoDate(endIso)
  if (!start || !end) return null
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

function addDaysIso(startIso: string, days: number): string | null {
  const start = fromIsoDate(startIso)
  if (!start) return null
  return toIsoDate(new Date(start.getTime() + days * 86_400_000))
}

// Vigência (início + fim) => prazo.
watch(
  [() => wizard.risk.startDate, () => wizard.risk.endDate],
  ([start, end]) => {
    if (start && end) {
      const days = diffDays(start, end)
      prazo.value = days != null && days > 0 ? days : null
    }
  },
  { immediate: true },
)

// Prazo editado (+ início preenchido) => fim de vigência.
function onPrazoInput(value: string | number | null | undefined): void {
  const days = typeof value === 'number' ? value : Number(value)
  prazo.value = Number.isFinite(days) && days > 0 ? Math.trunc(days) : null
  if (prazo.value && wizard.risk.startDate) {
    wizard.risk.endDate = addDaysIso(wizard.risk.startDate, prazo.value)
  }
}

onMounted(async () => {
  loadingModalities.value = true
  try {
    const response = await listModalities()
    modalities.value = response.items
  }
  catch (err) {
    modalitiesError.value = extractApiErrorMessage(err, 'Não foi possível carregar as modalidades.')
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

    <SiSelect
      v-model="modalityId"
      label="Modalidade"
      required
      :items="modalities"
      item-title="name"
      item-value="id"
      :loading="loadingModalities"
      placeholder="Selecione a modalidade"
    />

    <div class="si-qg-step3__row">
      <SiCurrencyField
        v-model="wizard.risk.insuredAmount"
        label="Importância segurada (IS)"
        required
      />
      <SiDateField
        v-model="wizard.risk.startDate"
        label="Início de vigência"
        required
        prepend-icon=""
        prepend-inner-icon="$calendar"
      />
      <SiDateField
        v-model="wizard.risk.endDate"
        label="Fim de vigência"
        required
        prepend-icon=""
        prepend-inner-icon="$calendar"
      />
      <SiTextField
        :model-value="prazo"
        label="Prazo em dias"
        required
        type="number"
        min="0"
        placeholder="0"
        hint="Calculado pela vigência"
        persistent-hint
        @update:model-value="onPrazoInput"
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
      <div class="si-qg-step3__coverages-row">
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
      </div>
    </fieldset>

    <SiSelect
      v-model="wizard.risk.complementaryModalityId"
      label="Modalidade complementar (opcional)"
      :items="modalities"
      item-title="name"
      item-value="id"
      :loading="loadingModalities"
      placeholder="Nenhuma"
      clearable
      class="si-qg-step3__complementary"
    />
  </div>
</template>

<style scoped>
.si-qg-step3__hint {
  margin: var(--si-space-2) 0 var(--si-space-5);
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-qg-step3__row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--si-space-4);
  margin-top: var(--si-space-4);
  align-items: start;
}

.si-qg-step3__coverages {
  margin: var(--si-space-5) 0 0;
  padding: 0;
  border: 0;
}

.si-qg-step3__coverages-legend {
  padding: 0;
  margin-bottom: var(--si-space-3);
  font-size: var(--si-fs-body);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step3__coverages-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-6);
}

.si-qg-step3__complementary {
  margin-top: var(--si-space-5);
  max-width: 520px;
}

@media (max-width: 1023.98px) {
  .si-qg-step3__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599.98px) {
  .si-qg-step3__row {
    grid-template-columns: 1fr;
  }
}
</style>
