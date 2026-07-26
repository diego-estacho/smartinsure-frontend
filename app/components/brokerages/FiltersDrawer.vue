<script setup lang="ts">
/**
 * Drawer "Filtros avançados" (RN-018) — filtros secundários sem poluir a tela. Mantém um
 * rascunho local; "Ver N resultados" aplica e fecha. Vira bottom sheet no mobile.
 */
import {
  brokerageSituationTabs,
  brokerageSectorOptions,
  calculationEngineOptions,
} from '~/lib/status/brokerages'

export type BrokerageFilters = {
  situation: string | null
  insurerId: string | null
  calculationEngine: string | null
  sector: string | null
  registeredFrom: string | null
  registeredTo: string | null
}

const props = defineProps<{
  modelValue: boolean
  filters: BrokerageFilters
  resultCount: number
  insurers: { title: string, value: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  'apply': [filters: BrokerageFilters]
  'clear': []
}>()

const { isMobile } = useIsMobile()

const draft = ref<BrokerageFilters>({ ...props.filters })

// Ressincroniza o rascunho a cada abertura e liga o Esc-para-fechar enquanto aberto
// (o VNavigationDrawer não trata Esc nativamente como o VDialog; a11y).
watch(() => props.modelValue, (open) => {
  if (open) draft.value = { ...props.filters }
  if (!import.meta.client) return
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('keydown', onKeydown)
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

const situationOptions = brokerageSituationTabs.map(tab => ({ title: tab.label, value: tab.value }))

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
    :width="isMobile ? undefined : 420"
    :height="isMobile ? 'auto' : undefined"
    :class="['si-brokerage-filters', { 'si-brokerage-filters--sheet': isMobile }]"
    @update:model-value="(v) => emit('update:modelValue', Boolean(v))"
  >
    <div class="si-brokerage-filters__header">
      <h2 class="text-subtitle-1">
        Filtros avançados
      </h2>
      <SiIconButton
        icon="close"
        aria-label="Fechar filtros"
        @click="close"
      />
    </div>

    <div class="si-brokerage-filters__body">
      <SiSelect
        v-model="draft.situation"
        label="Situação"
        :items="situationOptions"
        density="compact"
      />
      <SiSelect
        v-model="draft.insurerId"
        label="Seguradora habilitada"
        :items="[{ title: 'Todas', value: null }, ...insurers]"
        density="compact"
      />
      <SiSelect
        v-model="draft.calculationEngine"
        label="Motor de cálculo"
        :items="calculationEngineOptions"
        density="compact"
      />
      <SiSelect
        v-model="draft.sector"
        label="Setor"
        :items="brokerageSectorOptions"
        density="compact"
      />

      <div class="si-brokerage-filters__period">
        <span class="si-brokerage-filters__period-label">Período de cadastro</span>
        <div class="si-brokerage-filters__period-fields">
          <SiDateField
            v-model="draft.registeredFrom"
            label="De"
            density="compact"
            clearable
          />
          <SiDateField
            v-model="draft.registeredTo"
            label="Até"
            density="compact"
            clearable
          />
        </div>
      </div>
    </div>

    <div class="si-brokerage-filters__footer">
      <SiButton
        variant="outlined"
        color="secondary"
        class="si-brokerage-filters__clear"
        @click="clear"
      >
        Limpar
      </SiButton>
      <SiButton
        class="si-brokerage-filters__apply"
        @click="apply"
      >
        Ver {{ resultCount }} resultado{{ resultCount === 1 ? '' : 's' }}
      </SiButton>
    </div>
  </SiNavigationDrawer>
</template>

<style scoped>
.si-brokerage-filters__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--si-space-5) var(--si-space-5) var(--si-space-3);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-brokerage-filters__header h2 {
  margin: 0;
}

.si-brokerage-filters__body {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-4);
  padding: var(--si-space-5);
  overflow-y: auto;
}

.si-brokerage-filters__period-label {
  display: block;
  margin-bottom: var(--si-space-2);
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
}

.si-brokerage-filters__period-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-3);
}

.si-brokerage-filters__footer {
  display: flex;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
  border-top: 1px solid var(--si-cinza-claro);
  margin-top: auto;
}

.si-brokerage-filters__clear {
  flex: 1;
}

.si-brokerage-filters__apply {
  flex: 2;
}

/* Mobile: o drawer vira bottom sheet (location="bottom") — topo arredondado, altura
 * limitada e corpo rolável, com o rodapé "Ver N resultados" fixo. */
.si-brokerage-filters--sheet {
  border-radius: var(--si-radius-lg) var(--si-radius-lg) 0 0;
  max-height: 85dvh;
}

.si-brokerage-filters--sheet :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}
</style>
