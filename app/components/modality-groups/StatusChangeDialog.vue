<script setup lang="ts">
/**
 * Dialog de confirmação de mudança de situação do Grupo de Modalidade (ativar/inativar).
 * Apresentacional (ADR-018): recebe o grupo selecionado, emite `confirm`; a decisão e a
 * chamada ao backend ficam na página/composable. A situação-alvo vem do mapa de status por
 * nome estável (ADR-004), nunca por posição ordinal. Sem opção de excluir (RN-036).
 */
import type { ModalityGroupListItem } from '~/composables/useModalityGroups'
import { getModalityGroupStatusAction } from '~/lib/status/modality-groups'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  group: ModalityGroupListItem | null
  loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const action = computed(() =>
  props.group ? getModalityGroupStatusAction(props.group.status) : null,
)

const title = computed(() => action.value?.label ?? 'Alterar situação do Grupo de Modalidade')
</script>

<template>
  <SiDialog v-model="open">
    <SiCard class="si-modality-group-status-dialog">
      <h2 class="text-h6 mb-3">
        {{ title }}
      </h2>

      <p class="mb-5">
        {{ group?.name }}
      </p>

      <div class="si-modality-group-status-dialog__actions">
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
.si-modality-group-status-dialog {
  padding: var(--si-space-5);
}

.si-modality-group-status-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
