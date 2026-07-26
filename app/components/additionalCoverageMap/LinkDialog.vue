<script setup lang="ts">
/**
 * Dialog de Vincular (RN-043): escolhe uma Cobertura Adicional canônica para vincular manualmente a
 * Cobertura Adicional Importada selecionada. O mesmo fluxo serve para vincular e reatribuir (o
 * backend usa o endpoint de link para ambos). Apresentacional (ADR-018): valida a FORMA
 * (obrigatório) e emite `confirm` com o id da canônica escolhida; a decisão e a chamada ficam no
 * servidor — nenhuma regra de negócio no cliente. As canônicas vêm do catálogo (RN-040).
 */
import type { CanonicalCoverageItem, PendingCoverageItem } from '~/composables/useAdditionalCoverageMap'
import { required } from '~/lib/rules'

const open = defineModel<boolean>({ required: true })

defineProps<{
  pending: PendingCoverageItem | null
  coverages: CanonicalCoverageItem[]
  saving?: boolean
}>()

const emit = defineEmits<{
  confirm: [additionalCoverageId: string]
}>()

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const selectedCoverageId = ref<string | null>(null)

// Reidrata a seleção sempre que abre.
watch(open, (isOpen) => {
  if (isOpen) selectedCoverageId.value = null
})

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid || !selectedCoverageId.value) return

  emit('confirm', selectedCoverageId.value)
}
</script>

<template>
  <SiDialog v-model="open">
    <SiCard class="si-coverage-link-dialog">
      <h2 class="text-h6 mb-3">
        Vincular Cobertura Adicional Importada
      </h2>

      <p
        v-if="pending"
        class="si-coverage-link-dialog__origin mb-4"
      >
        <strong>{{ pending.coverageName }}</strong>
        — {{ pending.insurerName }} · {{ pending.modalityName }}
      </p>

      <SiForm ref="formRef">
        <SiSelect
          v-model="selectedCoverageId"
          label="Cobertura Adicional"
          :items="coverages"
          item-title="name"
          item-value="id"
          :rules="[required('Selecione a Cobertura Adicional')]"
        />
      </SiForm>

      <div class="si-coverage-link-dialog__actions">
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
          Confirmar vínculo
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-coverage-link-dialog {
  padding: var(--si-space-5);
}

.si-coverage-link-dialog__origin {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.si-coverage-link-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-4);
}
</style>
