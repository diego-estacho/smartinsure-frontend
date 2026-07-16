<script setup lang="ts">
import { mdiLoginVariant, mdiEyeOutline, mdiEyeOffOutline, mdiShieldCheckOutline } from '~/lib/icons'
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
  <div class="login-screen">
    <SiCard
      class="login-card"
      :elevation="2"
      rounded="xl"
    >
      <div class="login-brand">
        <SiIcon
          :icon="mdiShieldCheckOutline"
          color="primary"
          size="40"
        />
        <h1 class="text-h5 mt-2">
          SmartInsure
        </h1>
        <p class="text-body-2 text-medium-emphasis">
          Entre com seu e-mail e senha
        </p>
      </div>

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
          block
          :loading="enviando"
          :prepend-icon="mdiLoginVariant"
        >
          Entrar
        </SiButton>
      </SiForm>
    </SiCard>
  </div>
</template>

<style scoped>
.login-screen {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--si-space-4);
}

.login-card {
  width: min(100%, calc(var(--si-container-narrow) / 1.6));
  padding: var(--si-space-8);
}

.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--si-space-6);
}
</style>
