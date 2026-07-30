<script setup lang="ts">
/**
 * Primeiro acesso por Convite (RN-065): o link do e-mail traz o token; o Usuário define a própria
 * senha e passa de Pendente a Ativo. Rota pública (o token é a credencial) — ver `auth.global.ts`.
 * O front valida só forma (senha mínima, confirmação igual); validade do token, uso único e
 * transição de situação são decisão do servidor (SECURITY do produto).
 * Concluído, já entra na plataforma com a senha recém-definida — "obtém acesso" da RN-065.
 */
import { required, minLength } from '~/lib/rules'

definePageMeta({ layout: false })

interface ProblemDetails {
  detail?: string
}

const route = useRoute()
const { acceptInvitation } = useInvitations()
const { login } = useAuth()

const token = computed(() => String(route.query.token ?? ''))

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const password = ref('')
const passwordConfirmation = ref('')
const passwordVisible = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const done = ref(false)

/** Confirmação é forma, não regra: compara com a senha digitada nesta tela. */
function matchesPassword(value: string) {
  return value === password.value || 'As senhas não conferem'
}

async function submit() {
  error.value = null

  if (!token.value) {
    error.value = 'Link de convite inválido: token ausente. Solicite um novo convite.'
    return
  }

  const validation = await form.value?.validate()
  if (!validation?.valid) {
    return
  }

  submitting.value = true

  try {
    const accepted = await acceptInvitation({ token: token.value, password: password.value })
    done.value = true

    // RN-065: concluída a definição, o Usuário está Ativo — entra direto, sem digitar de novo.
    try {
      await login({ email: accepted.email, password: password.value })
      await navigateTo('/')
    }
    catch {
      await navigateTo('/login')
    }
  }
  catch (submitError) {
    const problem = (submitError as { data?: { data?: ProblemDetails } }).data?.data
    error.value = problem?.detail
      ?? 'Não foi possível concluir o primeiro acesso. O link pode ter expirado ou já ter sido usado.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="si-invite">
    <AuthBrandPanel
      title="Bem-vindo ao SmartInsure."
      subtitle="Defina sua senha para concluir o primeiro acesso."
    />

    <main class="si-invite__panel">
      <div class="si-invite__form-wrap">
        <header class="si-invite__form-head">
          <h1 class="si-invite__title">
            Defina sua senha
          </h1>
          <p class="si-invite__subtitle">
            Escolha uma senha de pelo menos 8 caracteres para acessar a plataforma.
          </p>
        </header>

        <SiAlert
          v-if="!token"
          type="warning"
          class="mb-4"
          text="Link de convite sem token. Abra o link recebido por e-mail ou solicite um novo convite."
        />

        <SiForm
          ref="form"
          @submit.prevent="submit"
        >
          <div class="si-invite__field">
            <label
              class="si-invite__label"
              for="invite-password"
            >Senha:</label>
            <SiTextField
              id="invite-password"
              v-model="password"
              density="default"
              :type="passwordVisible ? 'text' : 'password'"
              :prepend-inner-icon="'lock'"
              :append-inner-icon="passwordVisible ? 'eyeOff' : 'eye'"
              :rules="[required(), minLength(8)]"
              autofocus
              @click:append-inner="passwordVisible = !passwordVisible"
            />
          </div>

          <div class="si-invite__field">
            <label
              class="si-invite__label"
              for="invite-password-confirmation"
            >Confirme a senha:</label>
            <SiTextField
              id="invite-password-confirmation"
              v-model="passwordConfirmation"
              density="default"
              :type="passwordVisible ? 'text' : 'password'"
              :prepend-inner-icon="'lock'"
              :rules="[required(), matchesPassword]"
            />
          </div>

          <SiAlert
            v-if="error"
            type="error"
            class="mb-4"
            :text="error"
          />

          <SiAlert
            v-if="done && !error"
            type="success"
            class="mb-4"
            text="Senha definida. Entrando na plataforma…"
          />

          <SiButton
            type="submit"
            block
            size="large"
            :loading="submitting"
            :disabled="!token"
          >
            Concluir primeiro acesso
          </SiButton>

          <div class="si-invite__back">
            <NuxtLink
              to="/login"
              class="si-invite__back-link"
            >
              Já tenho senha — ir para o login
            </NuxtLink>
          </div>
        </SiForm>
      </div>
    </main>
  </div>
</template>

<style scoped>
.si-invite {
  display: flex;
  min-height: 100dvh;
}

.si-invite__panel {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--si-space-8);
  background: rgb(var(--v-theme-background));
}

.si-invite__form-wrap {
  width: min(100%, 440px);
}

.si-invite__form-head {
  margin-bottom: var(--si-space-8);
}

.si-invite__title {
  font-size: var(--si-fs-h3);
  line-height: var(--si-lh-h3);
  letter-spacing: var(--si-ls-h3);
  font-weight: var(--si-font-weight-semibold);
  margin-bottom: var(--si-space-2);
}

.si-invite__subtitle {
  font-size: var(--si-fs-small);
  color: rgb(var(--v-theme-secondary));
  margin-bottom: 0;
}

.si-invite__field {
  margin-bottom: var(--si-space-4);
}

.si-invite__label {
  display: block;
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-medium);
  margin-bottom: var(--si-space-2);
}

/* Inputs no modelo do login: raio md (10px); altura vem de density="default". */
.si-invite :deep(.si-field .v-field) {
  border-radius: var(--si-radius-md);
}

.si-invite__back {
  display: flex;
  justify-content: center;
  margin-top: var(--si-space-4);
}

.si-invite__back-link {
  color: rgb(var(--v-theme-primary));
  font-weight: var(--si-font-weight-semibold);
  text-decoration: none;
}

.si-invite__back-link:hover {
  text-decoration: underline;
}
</style>
