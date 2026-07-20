<script setup lang="ts">
/**
 * Dialog de confirmação de mudança de situação da corretora (habilitar/desabilitar).
 * Apresentacional (ADR-018): recebe a corretora selecionada, emite `confirm`; a decisão
 * e a chamada ao backend ficam na página/composable. A situação-alvo vem do mapa de
 * status por nome estável (ADR-004), nunca por posição ordinal.
 */
import type { BrokerageListItem } from '~/composables/useBrokerages'
import { getBrokerageStatusAction } from '~/lib/status/brokerages'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  brokerage: BrokerageListItem | null
  loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const action = computed(() =>
  props.brokerage ? getBrokerageStatusAction(props.brokerage.status) : null,
)

const title = computed(() => action.value?.label ?? 'Alterar situação da corretora')
</script>

<template>
  <SiDialog v-model="open">
    <SiCard class="si-brokerage-status-dialog">
      <h2 class="text-h6 mb-3">
        {{ title }}
      </h2>

      <p class="mb-5">
        {{ brokerage?.name }}
      </p>

      <div class="si-brokerage-status-dialog__actions">
        <SiButton
          variant="text"
          size="small"
          @click="open = false"
        >
          Cancelar
        </SiButton>

        <SiButton
          :prepend-icon="action?.icon"
          :loading="loading"
          :disabled="action?.disabled"
          size="small"
          @click="emit('confirm')"
        >
          Confirmar
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-brokerage-status-dialog {
  padding: var(--si-space-5);
}

.si-brokerage-status-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
