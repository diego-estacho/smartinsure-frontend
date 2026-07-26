<script setup lang="ts">
/**
 * Dialog de Reatribuir (RN-037): escolhe uma Modalidade para definir manualmente o vínculo da
 * Modalidade Importada selecionada (override — preservado na reimportação, RN-035/ADR-061).
 * Apresentacional (ADR-018): valida a FORMA (obrigatório) e emite `confirm` com o id escolhido; a
 * decisão e a chamada ficam no servidor — nenhuma regra de negócio no cliente. As Modalidades vêm
 * do cadastro (RN-032).
 */
import type { ModalityListItem } from '~/composables/useModalities'
import type { PendingImportedModality } from '~/composables/useModalityMap'
import { getSuretyBranchView } from '~/lib/status/suretyBranches'
import { required } from '~/lib/rules'

const open = defineModel<boolean>({ required: true })

defineProps<{
  pending: PendingImportedModality | null
  modalities: ModalityListItem[]
  saving?: boolean
}>()

const emit = defineEmits<{
  confirm: [modalityId: string]
}>()

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const selectedModalityId = ref<string | null>(null)

// Reidrata a seleção sempre que abre.
watch(open, (isOpen) => {
  if (isOpen) selectedModalityId.value = null
})

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid || !selectedModalityId.value) return

  emit('confirm', selectedModalityId.value)
}
</script>

<template>
  <SiDialog v-model="open">
    <SiCard class="si-reassign-dialog">
      <h2 class="text-h6 mb-3">
        Reatribuir Modalidade Importada
      </h2>

      <p
        v-if="pending"
        class="si-reassign-dialog__origin mb-4"
      >
        <strong>{{ pending.originName }}</strong>
        — {{ pending.insurerName }}
        <SiChip
          :color="getSuretyBranchView(pending.branch).color"
          size="x-small"
          variant="tonal"
          class="ml-1"
        >
          {{ getSuretyBranchView(pending.branch).label }}
        </SiChip>
      </p>

      <SiForm ref="formRef">
        <SiSelect
          v-model="selectedModalityId"
          label="Modalidade"
          :items="modalities"
          item-title="name"
          item-value="id"
          :rules="[required('Selecione a Modalidade')]"
        />
      </SiForm>

      <div class="si-reassign-dialog__actions">
        <SiButton
          variant="text"
          @click="open = false"
        >
          Cancelar
        </SiButton>

        <SiButton
          :loading="saving"
          @click="submit"
        >
          Confirmar reatribuição
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-reassign-dialog {
  padding: var(--si-space-5);
}

.si-reassign-dialog__origin {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.si-reassign-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-4);
}
</style>
