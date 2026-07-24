<script setup lang="ts">
/**
 * Dialog de cadastro/edição de Cobertura Adicional canônica (RN-040: catálogo curado pelo
 * Administrador do Sistema; nome único). Apresentacional (ADR-018): mantém o estado do formulário
 * e valida a FORMA (obrigatório, tamanho); a decisão (unicidade do nome, permissão) e a chamada ao
 * backend ficam na página/composable/servidor. A situação NÃO é editada aqui — o ciclo Ativa/Inativa
 * é a ação de situação (RN-040/RN-044). A Cobertura Adicional canônica tem só nome (RN-040).
 */
import type { CanonicalCoverageItem } from '~/composables/useAdditionalCoverageMap'
import { maxLength, required } from '~/lib/rules'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  coverage: CanonicalCoverageItem | null
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { name: string }]
}>()

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const form = reactive({
  name: '',
})

const isEditing = computed(() => props.coverage !== null)
const title = computed(() => (isEditing.value ? 'Editar Cobertura Adicional' : 'Nova Cobertura Adicional'))

// Reidrata o formulário sempre que abre: prefill na edição, limpo na criação.
watch(open, (isOpen) => {
  if (!isOpen) return

  form.name = props.coverage?.name ?? ''
})

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  emit('submit', {
    name: form.name.trim(),
  })
}
</script>

<template>
  <SiDialog v-model="open">
    <SiCard class="pa-5">
      <h2 class="text-h6 mb-4">
        {{ title }}
      </h2>

      <SiForm ref="formRef">
        <SiTextField
          v-model="form.name"
          label="Nome"
          :rules="[required('Informe o nome'), maxLength(200)]"
          class="mb-3"
        />
      </SiForm>

      <div class="si-additional-coverage-form__actions">
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
          Salvar
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-additional-coverage-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
