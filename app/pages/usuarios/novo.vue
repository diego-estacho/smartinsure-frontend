<script setup lang="ts">
import { mdiAccountPlusOutline } from '~/lib/icons'
import { required, email as emailRule } from '~/lib/rules'
import { userStatusLabels } from '~/lib/status/users'

// RN-001: o front valida forma (obrigatório, formato); unicidade, identidade e
// situação são decisão do servidor (SECURITY do produto).
const { createUser } = useUsers()

const nome = ref('')
const email = ref('')
const enviando = ref(false)
const erro = ref<string | null>(null)
const sucesso = ref<string | null>(null)

async function enviar() {
  erro.value = null
  sucesso.value = null
  enviando.value = true

  try {
    const usuario = await createUser({ name: nome.value, email: email.value })
    const situacao = userStatusLabels[usuario.status ?? ''] ?? usuario.status
    sucesso.value = `Usuário ${usuario.name} criado. Situação: ${situacao}.`
    nome.value = ''
    email.value = ''
  }
  catch {
    erro.value = 'Não foi possível criar o usuário. Verifique os dados e tente novamente.'
  }
  finally {
    enviando.value = false
  }
}
</script>

<template>
  <VContainer class="container-narrow">
    <h1 class="text-h5 mb-4">
      Novo usuário
    </h1>

    <SiForm @submit.prevent="enviar">
      <SiTextField
        v-model="nome"
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
        v-if="erro"
        type="error"
        class="mb-4"
        :text="erro"
      />

      <SiAlert
        v-if="sucesso"
        type="success"
        class="mb-4"
        :text="sucesso"
      />

      <SiButton
        type="submit"
        :loading="enviando"
        :prepend-icon="mdiAccountPlusOutline"
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
