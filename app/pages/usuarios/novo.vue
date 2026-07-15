<script setup lang="ts">
import { mdiAccountPlusOutline } from '~/lib/icons'

// RN-001: o front valida forma (obrigatório, formato); unicidade, identidade e
// situação são decisão do servidor (SECURITY do produto).
const { createUser } = useUsers()

// Status por nome estável do contrato → label pt-BR (ADR-004): mapa único do domínio.
const statusLabels: Record<string, string> = {
  Pending: 'Pendente',
  Active: 'Ativo',
}

const nome = ref('')
const email = ref('')
const enviando = ref(false)
const erro = ref<string | null>(null)
const sucesso = ref<string | null>(null)

const obrigatorio = (valor: string) => !!valor.trim() || 'Campo obrigatório.'
const emailValido = (valor: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) || 'E-mail inválido.'

async function enviar() {
  erro.value = null
  sucesso.value = null
  enviando.value = true

  try {
    const usuario = await createUser({ name: nome.value, email: email.value })
    const situacao = statusLabels[usuario.status ?? ''] ?? usuario.status
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
  <v-container max-width="640">
    <h1 class="text-h5 mb-4">
      Novo usuário
    </h1>

    <v-form @submit.prevent="enviar">
      <v-text-field
        v-model="nome"
        label="Nome"
        :rules="[obrigatorio]"
        autofocus
      />

      <v-text-field
        v-model="email"
        label="E-mail"
        type="email"
        :rules="[obrigatorio, emailValido]"
      />

      <v-alert
        v-if="erro"
        type="error"
        class="mb-4"
        :text="erro"
      />

      <v-alert
        v-if="sucesso"
        type="success"
        class="mb-4"
        :text="sucesso"
      />

      <v-btn
        type="submit"
        color="primary"
        :loading="enviando"
        :prepend-icon="mdiAccountPlusOutline"
      >
        Criar usuário
      </v-btn>
    </v-form>
  </v-container>
</template>
