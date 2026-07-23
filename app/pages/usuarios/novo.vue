<script setup lang="ts">
import { required, email as emailRule } from '~/lib/rules'
import { userStatusLabels } from '~/lib/status/users'

// RN-001: o front valida forma (obrigatório, formato); unicidade, identidade e
// situação são decisão do servidor (SECURITY do produto).
const { createUser } = useUsers()

const name = ref('')
const email = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

async function submit() {
  error.value = null
  success.value = null
  submitting.value = true

  try {
    const user = await createUser({ name: name.value, email: email.value })
    const statusLabel = userStatusLabels[user.status ?? ''] ?? user.status
    success.value = `Usuário ${user.name} criado. Situação: ${statusLabel}.`
    name.value = ''
    email.value = ''
  }
  catch {
    error.value = 'Não foi possível criar o usuário. Verifique os dados e tente novamente.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <VContainer class="container-narrow">
    <h1 class="text-h5 mb-4">
      Novo usuário
    </h1>

    <SiForm @submit.prevent="submit">
      <SiTextField
        v-model="name"
        label="Nome"
        :rules="[required()]"
        autofocus
      />

      <SiTextField
        v-model="email"
        label="E-mail"
        type="email"
        :rules="[required(), emailRule()]"
      />

      <SiAlert
        v-if="error"
        type="error"
        class="mb-4"
        :text="error"
      />

      <SiAlert
        v-if="success"
        type="success"
        class="mb-4"
        :text="success"
      />

      <SiButton
        type="submit"
        :loading="submitting"
        :prepend-icon="'userPlus'"
      >
        Criar usuário
      </SiButton>
    </SiForm>
  </VContainer>
</template>

<style scoped>
.container-narrow {
  max-width: var(--si-container-narrow);
}
</style>
