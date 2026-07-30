<script setup lang="ts">
/**
 * Tela de login (RN-005) — layout split: painel de marca (esquerda) + formulário (direita).
 * Espelha o design do SmartInsure em QA (InsurePoint-Front): tamanhos por token (idênticos
 * ao QA), marca-d'água do símbolo no painel escuro, inputs em densidade default.
 * O front valida forma; credenciais, situação do Usuário e validade da sessão são decisão
 * do servidor (SECURITY do produto). Cores/espacos por token (ADR-006); wrappers Si (ADR-013).
 */
import { required, email as emailRule } from '~/lib/rules'

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
const notice = ref<string | null>(null)

// Fluxo de recuperação de senha ainda não existe (rota/serviço a definir). Até lá, o link
// existe visualmente (design QA) mas informa a indisponibilidade em vez de levar a lugar nenhum.
function onForgotPassword() {
  notice.value = 'Recuperação de senha ainda não disponível. Fale com o administrador.'
}

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
  <div class="si-login">
    <!-- Painel de marca (esquerda) — compartilhado com o primeiro acesso (RN-065). -->
    <AuthBrandPanel />

    <!-- Formulário (direita) -->
    <main class="si-login__panel">
      <div class="si-login__form-wrap">
        <header class="si-login__form-head">
          <h1 class="si-login__title">
            Faça seu login
          </h1>
          <p class="si-login__subtitle">
            Acesse com seu e-mail e senha.
          </p>
        </header>

        <SiForm
          ref="form"
          @submit.prevent="submit"
        >
          <div class="si-login__field">
            <label
              class="si-login__label"
              for="login-email"
            >Email:</label>
            <SiTextField
              id="login-email"
              v-model="email"
              type="email"
              density="default"
              :prepend-inner-icon="'user'"
              :rules="[required(), emailRule()]"
              autofocus
            />
          </div>

          <div class="si-login__field">
            <label
              class="si-login__label"
              for="login-password"
            >Senha:</label>
            <SiTextField
              id="login-password"
              v-model="password"
              density="default"
              :type="passwordVisible ? 'text' : 'password'"
              :prepend-inner-icon="'lock'"
              :append-inner-icon="passwordVisible ? 'eyeOff' : 'eye'"
              :rules="[required()]"
              @click:append-inner="passwordVisible = !passwordVisible"
            />
          </div>

          <SiAlert
            v-if="error"
            type="error"
            class="mb-4"
            :text="error"
          />

          <SiAlert
            v-if="notice"
            type="info"
            class="mb-4"
            :text="notice"
          />

          <SiButton
            type="submit"
            block
            size="large"
            :loading="submitting"
          >
            Entrar
          </SiButton>

          <div class="si-login__forgot">
            <button
              type="button"
              class="si-login__forgot-link"
              @click="onForgotPassword"
            >
              Esqueceu a senha?
            </button>
          </div>
        </SiForm>
      </div>
    </main>
  </div>
</template>

<style scoped>
.si-login {
  display: flex;
  min-height: 100dvh;
}

/* ---------- Formulário (direita) ---------- */
.si-login__panel {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--si-space-8);
  background: rgb(var(--v-theme-background));
}

.si-login__form-wrap {
  width: min(100%, 440px);
}

.si-login__form-head {
  margin-bottom: var(--si-space-8);
}

.si-login__title {
  font-size: var(--si-fs-h3);
  line-height: var(--si-lh-h3);
  letter-spacing: var(--si-ls-h3);
  font-weight: var(--si-font-weight-semibold);
  margin-bottom: var(--si-space-2);
}

.si-login__subtitle {
  font-size: var(--si-fs-small);
  color: rgb(var(--v-theme-secondary));
  margin-bottom: 0;
}

.si-login__field {
  margin-bottom: var(--si-space-4);
}

.si-login__label {
  display: block;
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-medium);
  margin-bottom: var(--si-space-2);
}

/* Inputs no modelo do QA: raio md (10px) — a altura vem de density="default". */
.si-login :deep(.si-field .v-field) {
  border-radius: var(--si-radius-md);
}

.si-login__forgot {
  display: flex;
  justify-content: center;
  margin-top: var(--si-space-4);
}

.si-login__forgot-link {
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font: inherit;
  font-weight: var(--si-font-weight-semibold);
  cursor: pointer;
}

.si-login__forgot-link:hover {
  text-decoration: underline;
}

</style>
