<script setup lang="ts">
/**
 * Dialog de cadastro/edição de Modalidade (RN-032: catálogo importado e curado).
 * Apresentacional (ADR-018): mantém o estado do formulário e valida a FORMA (obrigatório);
 * a decisão e a chamada ao backend ficam na página/composable. A situação NÃO é editada aqui
 * — o ciclo Ativa/Inativa é a ação de situação (RN-039). Não há Grupo de Modalidade no lado
 * Smart (ADR-061): a Modalidade tem só nome e descrição.
 */
import type { ModalityListItem } from '~/composables/useModalities'
import { maxLength, required } from '~/lib/rules'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  modality: ModalityListItem | null
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { name: string, description: string | null }]
}>()

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const form = reactive({
  name: '',
  description: '',
})

const isEditing = computed(() => props.modality !== null)
const title = computed(() => (isEditing.value ? 'Editar Modalidade' : 'Nova Modalidade'))

// Reidrata o formulário sempre que abre: prefill na edição, limpo na criação.
watch(open, (isOpen) => {
  if (!isOpen) return

  form.name = props.modality?.name ?? ''
  form.description = props.modality?.description ?? ''
})

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim() === '' ? null : form.description.trim(),
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

        <SiTextarea
          v-model="form.description"
          label="Descrição"
          :rules="[maxLength(1000)]"
          class="mb-3"
        />
      </SiForm>

      <div class="si-modality-form__actions">
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
.si-modality-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
