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
const password = ref('')
const passwordVisible = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null

  const validation = await form.value?.validate()
  if (!validation?.valid) {
    return
  }

  submitting.value = true

  try {
    await login({ email: email.value, password: password.value })
    await navigateTo('/')
  }
  catch (err) {
    const problem = (err as { data?: { data?: ProblemDetails } }).data?.data
    error.value = problem?.detail ?? 'Não foi possível entrar. Tente novamente.'
  }
  finally {
    submitting.value = false
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
        @submit.prevent="submit"
      >
        <SiTextField
          v-model="email"
          label="E-mail"
          type="email"
          :rules="[required(), emailRule()]"
          autofocus
        />

        <SiTextField
          v-model="password"
          label="Senha"
          :type="passwordVisible ? 'text' : 'password'"
          :rules="[required()]"
          :append-inner-icon="passwordVisible ? mdiEyeOffOutline : mdiEyeOutline"
          @click:append-inner="passwordVisible = !passwordVisible"
        />

        <SiAlert
          v-if="error"
          type="error"
          class="mb-4"
          :text="error"
        />

        <SiButton
          type="submit"
          block
          :loading="submitting"
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
