<script setup lang="ts">
/**
 * Editar dados complementares da Corretora (RN-054): nome fantasia, e-mail, telefone e responsável.
 * Não toca os dados da Receita (razão social, natureza jurídica, endereço), que são import-once.
 */
import type { GetBrokerageResponse } from '~/composables/useBrokerages'

const props = defineProps<{ brokerage: GetBrokerageResponse }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ updated: [GetBrokerageResponse] }>()

const { updateBrokerage } = useBrokerages()

const form = reactive({
  socialName: '',
  contactEmail: '',
  contactPhone: '',
  responsibleName: '',
})
const saving = ref(false)
const error = ref<string | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) return
  form.socialName = props.brokerage.socialName ?? ''
  form.contactEmail = props.brokerage.contactEmail ?? ''
  form.contactPhone = props.brokerage.contactPhone ?? ''
  form.responsibleName = props.brokerage.responsibleName ?? ''
  error.value = null
})

async function save() {
  saving.value = true
  error.value = null
  try {
    const updated = await updateBrokerage(props.brokerage.id, {
      socialName: form.socialName || null,
      contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null,
      responsibleName: form.responsibleName || null,
    })
    emit('updated', updated)
    open.value = false
  }
  catch {
    error.value = 'Não foi possível salvar os dados. Confira o e-mail informado.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <SiDialog
    v-model="open"
    :max-width="560"
  >
    <SiCard class="pa-5">
      <h2 class="text-h6 mb-1">
        Editar dados cadastrais
      </h2>
      <p class="si-edit__sub">
        Dados complementares da corretora. Os dados da Receita não são editáveis.
      </p>

      <div class="si-edit__grid">
        <SiTextField
          v-model="form.socialName"
          label="Nome fantasia"
          density="compact"
        />
        <SiTextField
          v-model="form.contactEmail"
          label="E-mail de contato"
          type="email"
          density="compact"
        />
        <SiTextField
          v-model="form.contactPhone"
          label="Telefone"
          density="compact"
        />
        <SiTextField
          v-model="form.responsibleName"
          label="Responsável"
          density="compact"
        />
      </div>

      <SiAlert
        v-if="error"
        type="error"
        class="mt-3"
        :text="error"
      />

      <div class="si-edit__actions">
        <SiButton
          variant="text"
          @click="open = false"
        >
          Cancelar
        </SiButton>
        <SiButton
          :prepend-icon="'check'"
          :loading="saving"
          @click="save"
        >
          Salvar
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-edit__sub {
  margin: 0 0 var(--si-space-4);
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-edit__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-3);
}

.si-edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-5);
}

@media (max-width: 560px) {
  .si-edit__grid {
    grid-template-columns: 1fr;
  }
}
</style>
