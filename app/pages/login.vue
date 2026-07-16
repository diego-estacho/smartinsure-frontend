<script setup lang="ts">
import { mdiLoginVariant, mdiEyeOutline, mdiEyeOffOutline } from '~/lib/icons'
import { required, email as emailRule } from '~/lib/rules'

// RN-005: o front valida forma; credenciais, situação do Usuário e validade da
// sessão são decisão do servidor (SECURITY do produto).
const { login } = useAuth()

interface ProblemDetails {
  detail?: string
}

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const email = ref('')
const senha = ref('')
const senhaVisivel = ref(false)
const enviando = ref(false)
const erro = ref<string | null>(null)

async function entrar() {
  erro.value = null

  const validation = await form.value?.validate()
  if (!validation?.valid) {
    return
  }

  enviando.value = true

  try {
    await login({ email: email.value, password: senha.value })
    await navigateTo('/')
  }
  catch (error) {
    const problem = (error as { data?: { data?: ProblemDetails } }).data?.data
    erro.value = problem?.detail ?? 'Não foi possível entrar. Tente novamente.'
  }
  finally {
    enviando.value = false
  }
}
</script>

<template>
  <VContainer class="container-narrow">
    <h1 class="text-h5 mb-4">
      Entrar
    </h1>

    <SiForm
      ref="form"
      @submit.prevent="entrar"
    >
      <SiTextField
        v-model="email"
        label="E-mail"
        type="email"
        :rules="[required(), emailRule()]"
        autofocus
      />

      <SiTextField
        v-model="senha"
        label="Senha"
        :type="senhaVisivel ? 'text' : 'password'"
        :rules="[required()]"
        :append-inner-icon="senhaVisivel ? mdiEyeOffOutline : mdiEyeOutline"
        @click:append-inner="senhaVisivel = !senhaVisivel"
      />

      <SiAlert
        v-if="erro"
        type="error"
        class="mb-4"
        :text="erro"
      />

      <SiButton
        type="submit"
        :loading="enviando"
        :prepend-icon="mdiLoginVariant"
      >
        Entrar
      </SiButton>
    </SiForm>
  </VContainer>
</template>

<style scoped>
.container-narrow {
  max-width: var(--si-container-narrow);
}
</style>
