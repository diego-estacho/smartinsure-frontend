<script setup lang="ts">
/**
 * Dialog de Ignorar (RN-037): confirma marcar a Modalidade Importada como Ignorada — não é
 * oferecida e não volta à Fila nas próximas importações, mas fica registrada (pode ser reavaliada
 * depois). Apresentacional (ADR-018): recebe a pendência, emite `confirm`; a decisão e a chamada
 * ao backend ficam na página/composable. Sem exclusão (RN-039).
 */
import type { PendingImportedModality } from '~/composables/useModalityMap'

const open = defineModel<boolean>({ required: true })

defineProps<{
  pending: PendingImportedModality | null
  loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <SiDialog v-model="open">
    <SiCard class="si-ignore-dialog">
      <h2 class="text-h6 mb-3">
        Ignorar Modalidade Importada
      </h2>

      <p class="mb-2">
        <strong>{{ pending?.originName }}</strong>
        <template v-if="pending"> — {{ pending.insurerName }}</template>
      </p>

      <p class="si-ignore-dialog__hint mb-5">
        A Modalidade Importada não será oferecida e não voltará à Fila de Revisão nas próximas
        importações, mas fica registrada e pode ser reavaliada depois.
      </p>

      <div class="si-ignore-dialog__actions">
        <SiButton
          variant="text"
          size="small"
          @click="open = false"
        >
          Cancelar
        </SiButton>

        <SiButton
          color="secondary"
          size="small"
          :loading="loading"
          @click="emit('confirm')"
        >
          Confirmar
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-ignore-dialog {
  padding: var(--si-space-5);
}

.si-ignore-dialog__hint {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.si-ignore-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
