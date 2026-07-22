<script setup lang="ts">
/**
 * Dialog de cadastro/edição de Grupo de Modalidade (RN-029: catálogo curado).
 * Apresentacional (ADR-018): mantém o estado do formulário e valida a FORMA (obrigatório,
 * inteiro); a decisão e a chamada ao backend ficam na página/composable. A situação NÃO é
 * editada aqui — o ciclo Ativa/Inativa é a ação de situação (RN-036). Campos: Nome,
 * Descrição, Ordem de exibição.
 */
import type { ModalityGroupListItem } from '~/composables/useModalityGroups'
import { integer, maxLength, minValue, required } from '~/lib/rules'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  group: ModalityGroupListItem | null
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { name: string, description: string | null, displayOrder: number }]
}>()

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const form = reactive({
  name: '',
  description: '',
  displayOrder: 0 as number | string,
})

const isEditing = computed(() => props.group !== null)
const title = computed(() => (isEditing.value ? 'Editar Grupo de Modalidade' : 'Novo Grupo de Modalidade'))

// Reidrata o formulário sempre que abre: prefill na edição, limpo na criação.
watch(open, (isOpen) => {
  if (!isOpen) return

  form.name = props.group?.name ?? ''
  form.description = props.group?.description ?? ''
  form.displayOrder = props.group?.displayOrder ?? 0
})

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim() === '' ? null : form.description.trim(),
    displayOrder: Number(form.displayOrder),
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

        <SiTextField
          v-model="form.displayOrder"
          label="Ordem de exibição"
          type="number"
          :rules="[required('Informe a ordem de exibição'), integer(), minValue(0)]"
          class="mb-3"
        />
      </SiForm>

      <div class="si-modality-group-form__actions">
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
.si-modality-group-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
