<script setup lang="ts">
/**
 * Aba Histórico da Corretora (RN-055) — linha do tempo real derivada da auditoria. O tipo do
 * evento (nome estável) vira rótulo pt-BR aqui; a cor do ponto segue o tipo (DS).
 */
import type { BrokerageHistoryEvent } from '~/composables/useBrokerages'
import { extractApiErrorMessage } from '~/lib/apiError'

const props = defineProps<{ brokerageId: string }>()

const { getBrokerageHistory } = useBrokerages()

const events = ref<BrokerageHistoryEvent[]>([])
const error = ref<string | null>(null)

await load()

async function load() {
  error.value = null
  try {
    const response = await getBrokerageHistory(props.brokerageId)
    events.value = response.events
  }
  catch (err) {
    error.value = extractApiErrorMessage(err, 'Não foi possível carregar o histórico.')
  }
}

const eventMeta: Record<string, { tone: 'created' | 'enable' | 'edit', label: (subject?: string | null) => string }> = {
  'created': { tone: 'created', label: () => 'Corretora criada' },
  'insurer-enabled': { tone: 'enable', label: subject => `${subject ?? 'Seguradora'} habilitada` },
  'insurer-enablement-updated': { tone: 'enable', label: subject => `Habilitação de ${subject ?? 'seguradora'} atualizada` },
  'updated': { tone: 'edit', label: () => 'Cadastro atualizado' },
}

function titleOf(event: BrokerageHistoryEvent) {
  return eventMeta[event.type]?.label(event.subject) ?? event.type
}

function toneOf(event: BrokerageHistoryEvent) {
  return eventMeta[event.type]?.tone ?? 'edit'
}

function formatWhen(iso: string) {
  const date = new Date(iso)
  const day = date.toLocaleDateString('pt-BR')
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${day} às ${time}`
}
</script>

<template>
  <div class="si-history">
    <SiAlert
      v-if="error"
      type="error"
      :text="error"
    />
    <ol
      v-else
      class="si-history__list"
    >
      <li
        v-for="(event, index) in events"
        :key="index"
        class="si-history__item"
      >
        <span
          class="si-history__dot"
          :class="`si-history__dot--${toneOf(event)}`"
        />
        <div class="si-history__body">
          <span class="si-history__title">{{ titleOf(event) }}</span>
          <span class="si-history__meta">{{ formatWhen(event.occurredAt) }} · {{ event.author }}</span>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.si-history__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.si-history__item {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: var(--si-space-3);
  padding-bottom: var(--si-space-5);
  position: relative;
}

.si-history__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 16px;
  bottom: 0;
  width: 2px;
  background: var(--si-cinza-claro);
}

.si-history__dot {
  inline-size: 10px;
  block-size: 10px;
  border-radius: var(--si-radius-pill);
  margin-top: 5px;
  z-index: 1;
}

.si-history__dot--created {
  background: rgb(var(--v-theme-charcoal));
}

.si-history__dot--enable {
  background: rgb(var(--v-theme-primary));
}

.si-history__dot--edit {
  background: var(--si-cinza);
}

.si-history__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-history__title {
  font-size: var(--si-fs-body-2);
  font-weight: var(--si-font-weight-semibold);
}

.si-history__meta {
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}
</style>
