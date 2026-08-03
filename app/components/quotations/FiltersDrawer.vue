<script setup lang="ts">
/**
 * Drawer "Filtros avançados" da Listagem de Cotações (RN-077) — filtros secundários sem poluir a tela.
 * Mantém um rascunho local; "Ver N resultados" aplica e fecha. Vira bottom sheet no mobile. As opções
 * de Seguradora e Modalidade são os distintos presentes no livro (Q10), vindas da resposta do servidor.
 */
export type QuotationFilters = {
  insurerId: string | null
  modalityId: string | null
  premiumMin: number | null
  premiumMax: number | null
  insuredAmountMin: number | null
  insuredAmountMax: number | null
  createdFrom: string | null
  createdTo: string | null
  coverageStartFrom: string | null
  coverageStartTo: string | null
}

const props = defineProps<{
  modelValue: boolean
  filters: QuotationFilters
  resultCount: number
  insurers: { title: string, value: string }[]
  modalities: { title: string, value: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  'apply': [filters: QuotationFilters]
  'clear': []
}>()

const { isMobile } = useIsMobile()

const draft = ref<QuotationFilters>({ ...props.filters })

// Ressincroniza o rascunho a cada abertura e liga o Esc-para-fechar enquanto aberto (a11y —
// o VNavigationDrawer não trata Esc nativamente como o VDialog).
watch(() => props.modelValue, (open) => {
  if (open) {
    draft.value = { ...props.filters }
  }
  if (!import.meta.client) {
    return
  }
  if (open) {
    window.addEventListener('keydown', onKeydown)
  }
  else {
    window.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
  }
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

function close() {
  emit('update:modelValue', false)
}

function apply() {
  emit('apply', { ...draft.value })
  close()
}

function clear() {
  emit('clear')
  close()
}
</script>

<template>
  <SiNavigationDrawer
    :model-value="modelValue"
    :location="isMobile ? 'bottom' : 'right'"
    temporary
    :width="isMobile ? undefined : 400"
    :height="isMobile ? 'auto' : undefined"
    :class="['si-quotation-filters', { 'si-quotation-filters--sheet': isMobile }]"
    @update:model-value="(v) => emit('update:modelValue', Boolean(v))"
  >
    <div class="si-quotation-filters__header">
      <h2 class="text-subtitle-1">
        Filtros avançados
      </h2>
      <SiIconButton
        icon="close"
        aria-label="Fechar filtros"
        @click="close"
      />
    </div>

    <div class="si-quotation-filters__body">
      <div class="si-quotation-filters__group">
        <span class="si-quotation-filters__group-label">Seguradora</span>
        <SiSelect
          v-model="draft.insurerId"
          :items="[{ title: 'Todas as seguradoras', value: null }, ...insurers]"
          density="compact"
        />
      </div>

      <div class="si-quotation-filters__group">
        <span class="si-quotation-filters__group-label">Modalidade</span>
        <SiSelect
          v-model="draft.modalityId"
          :items="[{ title: 'Todas as modalidades', value: null }, ...modalities]"
          density="compact"
        />
      </div>

      <div class="si-quotation-filters__group">
        <span class="si-quotation-filters__group-label">Valor do prêmio (R$)</span>
        <div class="si-quotation-filters__range-fields">
          <SiCurrencyField
            v-model="draft.premiumMin"
            placeholder="Mín."
            density="compact"
          />
          <SiCurrencyField
            v-model="draft.premiumMax"
            placeholder="Máx."
            density="compact"
          />
        </div>
      </div>

      <div class="si-quotation-filters__group">
        <span class="si-quotation-filters__group-label">Importância segurada (R$)</span>
        <div class="si-quotation-filters__range-fields">
          <SiCurrencyField
            v-model="draft.insuredAmountMin"
            placeholder="Mín."
            density="compact"
          />
          <SiCurrencyField
            v-model="draft.insuredAmountMax"
            placeholder="Máx."
            density="compact"
          />
        </div>
      </div>

      <div class="si-quotation-filters__group">
        <span class="si-quotation-filters__group-label">Período de criação</span>
        <div class="si-quotation-filters__range-fields">
          <SiDateField
            v-model="draft.createdFrom"
            label="De"
            density="compact"
            clearable
          />
          <SiDateField
            v-model="draft.createdTo"
            label="Até"
            density="compact"
            clearable
          />
        </div>
      </div>

      <div class="si-quotation-filters__group">
        <span class="si-quotation-filters__group-label">Início da vigência</span>
        <div class="si-quotation-filters__range-fields">
          <SiDateField
            v-model="draft.coverageStartFrom"
            label="De"
            density="compact"
            clearable
          />
          <SiDateField
            v-model="draft.coverageStartTo"
            label="Até"
            density="compact"
            clearable
          />
        </div>
      </div>

      <p class="si-quotation-filters__note">
        Para achar por número da cotação, tomador ou segurado, use o campo de busca da listagem — ele procura por esses três.
      </p>
    </div>

    <div class="si-quotation-filters__footer">
      <SiButton
        variant="outlined"
        color="secondary"
        class="si-quotation-filters__clear"
        @click="clear"
      >
        Limpar
      </SiButton>
      <SiButton
        class="si-quotation-filters__apply"
        @click="apply"
      >
        Aplicar filtros
      </SiButton>
    </div>
  </SiNavigationDrawer>
</template>

<style scoped>
.si-quotation-filters__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--si-space-5) var(--si-space-5) var(--si-space-3);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-quotation-filters__header h2 {
  margin: 0;
}

.si-quotation-filters__body {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-4);
  padding: var(--si-space-5);
  overflow-y: auto;
}

/* Rótulo de grupo do drawer = fieldLabel do protótipo: caixa alta, tracking, 11px, cinza. */
.si-quotation-filters__group-label {
  display: block;
  margin-bottom: var(--si-space-2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-quotation-filters__range-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-3);
}

.si-quotation-filters__note {
  margin: 0;
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}

.si-quotation-filters__footer {
  display: flex;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
  border-top: 1px solid var(--si-cinza-claro);
  margin-top: auto;
}

.si-quotation-filters__clear {
  flex: 1;
}

.si-quotation-filters__apply {
  flex: 1;
}

/* Mobile: bottom sheet (location="bottom") — topo arredondado, altura limitada, corpo rolável. */
.si-quotation-filters--sheet {
  border-radius: var(--si-radius-lg) var(--si-radius-lg) 0 0;
  max-height: 85dvh;
}

.si-quotation-filters--sheet :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}
</style>
