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
    <!-- Painel de marca (esquerda) -->
    <aside class="si-login__hero">
      <div class="si-login__brand">
        <img
          src="/brand/symbol.png"
          alt="SmartInsure"
          class="si-login__symbol"
          width="44"
          height="44"
        >
        <span class="si-login__wordmark">
          <span class="si-login__wordmark-smart">smart</span><span class="si-login__wordmark-insure">insure</span>
        </span>
      </div>

      <div class="si-login__hero-content">
        <h2 class="si-login__hero-title">
          Seguro garantia,<br>
          do jeito que o corretor precisa.
        </h2>
        <p class="si-login__hero-subtitle">
          Cotação multi-seguradora, emissão e gestão de apólices numa só plataforma.
        </p>
      </div>

      <p class="si-login__hero-footer">
        © SmartInsure
      </p>
    </aside>

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

/* ---------- Painel de marca (esquerda) — espelha o hero do QA ---------- */
.si-login__hero {
  position: relative;
  flex: 0 0 44%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--si-space-12) var(--si-space-10);
  overflow: hidden;
  color: rgb(var(--v-theme-on-charcoal));
  background:
    radial-gradient(120% 90% at 85% 8%, rgba(var(--v-theme-primary), 0.22), transparent 55%),
    radial-gradient(80% 70% at 10% 100%, rgba(var(--v-theme-primary), 0.10), transparent 60%),
    rgb(var(--v-theme-charcoal));
}

/* Marca-d'água sutil do símbolo no canto (identidade da marca) — igual ao QA. */
.si-login__hero::after {
  content: '';
  position: absolute;
  right: -120px;
  bottom: -120px;
  width: 420px;
  height: 420px;
  background: url('/brand/symbol.png') no-repeat center / contain;
  opacity: 0.05;
  pointer-events: none;
}

.si-login__hero > * {
  position: relative;
  z-index: 1;
}

.si-login__brand {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-login__symbol {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.si-login__wordmark {
  font-weight: var(--si-font-weight-semibold);
  font-size: var(--si-fs-h3);
  letter-spacing: var(--si-ls-h2);
}

.si-login__wordmark-smart {
  color: rgb(var(--v-theme-primary));
}

.si-login__wordmark-insure {
  color: rgb(var(--v-theme-on-charcoal));
}

.si-login__hero-content {
  max-width: 460px;
}

.si-login__hero-title {
  font-size: var(--si-fs-h1);
  line-height: var(--si-lh-h1);
  letter-spacing: var(--si-ls-h1);
  font-weight: var(--si-font-weight-semibold);
  margin-bottom: var(--si-space-5);
}

.si-login__hero-subtitle {
  font-size: var(--si-fs-h4);
  line-height: var(--si-lh-h4);
  color: rgba(var(--v-theme-on-charcoal), 0.7);
  margin-bottom: 0;
}

.si-login__hero-footer {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-charcoal), 0.45);
  margin-bottom: 0;
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

/* ---------- Responsivo: painel de marca some no mobile (igual ao QA) ---------- */
@media (max-width: 960px) {
  .si-login__hero {
    display: none;
  }
}
</style>
