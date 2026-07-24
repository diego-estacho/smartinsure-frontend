<script setup lang="ts">
/**
 * Dialog de Ignorar (RN-043): confirma retirar a Cobertura Adicional Importada da lista de
 * pendências sem vinculá-la nem excluí-la. Fica registrada e pode ser reavaliada depois (Reativar).
 * Apresentacional (ADR-018): recebe a pendência, emite `confirm`; a decisão e a chamada ao backend
 * ficam na página/composable.
 */
import type { PendingCoverageItem } from '~/composables/useAdditionalCoverageMap'

const open = defineModel<boolean>({ required: true })

defineProps<{
  pending: PendingCoverageItem | null
  loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <SiDialog v-model="open">
    <SiCard class="si-coverage-ignore-dialog">
      <h2 class="text-h6 mb-3">
        Ignorar Cobertura Adicional Importada
      </h2>

      <p class="mb-2">
        <strong>{{ pending?.coverageName }}</strong>
        <template v-if="pending"> — {{ pending.insurerName }}</template>
      </p>

      <p class="si-coverage-ignore-dialog__hint mb-5">
        A Cobertura Adicional Importada sai da lista de pendências de mapeamento sem ser vinculada,
        mas fica registrada e pode ser reavaliada depois.
      </p>

      <div class="si-coverage-ignore-dialog__actions">
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
.si-coverage-ignore-dialog {
  padding: var(--si-space-5);
}

.si-coverage-ignore-dialog__hint {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.si-coverage-ignore-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
