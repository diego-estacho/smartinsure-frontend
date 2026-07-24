<script setup lang="ts">
/**
 * Dialog de confirmação de mudança de situação da Cobertura Adicional canônica (ativar/inativar).
 * Apresentacional (ADR-018): recebe a Cobertura selecionada, emite `confirm`; a decisão e a chamada
 * ao backend ficam na página/composable. A situação-alvo vem do mapa de status por nome estável
 * (ADR-004), nunca por posição ordinal. Sem opção de excluir (RN-040/RN-044).
 */
import type { CanonicalCoverageItem } from '~/composables/useAdditionalCoverageMap'
import { getAdditionalCoverageStatusAction } from '~/lib/status/additionalCoverages'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  coverage: CanonicalCoverageItem | null
  loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const action = computed(() =>
  props.coverage ? getAdditionalCoverageStatusAction(props.coverage.status) : null,
)

const title = computed(() => action.value?.label ?? 'Alterar situação da Cobertura Adicional')
</script>

<template>
  <SiDialog v-model="open">
    <SiCard class="si-additional-coverage-status-dialog">
      <h2 class="text-h6 mb-3">
        {{ title }}
      </h2>

      <p class="mb-5">
        {{ coverage?.name }}
      </p>

      <div class="si-additional-coverage-status-dialog__actions">
        <SiButton
          variant="text"
          size="small"
          @click="open = false"
        >
          Cancelar
        </SiButton>

        <SiButton
          :prepend-icon="action?.icon"
          :color="action?.color"
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
.si-additional-coverage-status-dialog {
  padding: var(--si-space-5);
}

.si-additional-coverage-status-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
