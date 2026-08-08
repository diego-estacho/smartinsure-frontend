<script setup lang="ts">
/**
 * RN-068/RN-069 — o Corretor Administrador cria Usuários no seu escopo: Tomador Administrador
 * (para um Tomador nomeado à corretora ativa) ou Usuário da própria corretora com um dos perfis
 * oferecidos (RN-072).
 *
 * Apresentacional (ADR-018): coleta nome, e-mail, perfil e — quando o perfil é Tomador
 * Administrador — o Tomador; emite `confirm`. A lista de perfis vem do servidor (`/api/profiles/
 * assignable`), a de tomadores da listagem de Tomadores. Nomeação vigente, unicidade de e-mail e
 * autorização são decisão do servidor (SECURITY do produto); aqui só se valida forma.
 *
 * NOTA (fatia): a criação inline de perfil (§8 passo 2 / Fatia F) entra depois — até lá o atalho
 * "Criar perfil de acesso" leva à tela de Perfis.
 */
import type { AssignableProfile } from '~/composables/useProfiles'
import type { PolicyHolderListItem } from '~/composables/usePolicyHolders'
import { formatCnpj, isValidCpf } from '~/lib/documents'
import { extractApiErrorMessage } from '~/lib/apiError'
import { email as emailRule, required } from '~/lib/rules'
import { getProfileLabel, profileScopes } from '~/lib/status/profiles'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{
  confirm: [payload: {
    name: string
    email: string
    /** CPF em dígitos (RN-082). */
    documentNumber: string
    profileId: string
    policyHolderId: string | null
    /** Escopo do perfil escolhido — a página usa para saber qual fluxo chamar (RN-069/RN-070). */
    profileScope: string
  }]
}>()

const { listAssignableProfiles } = useProfiles()
const { listPolicyHolders } = usePolicyHolders()
// RN-068 x RN-070: quem tem corretora ativa está criando pela corretora (e escolhe o Tomador);
// sem corretora ativa, o ator é o Tomador Administrador e o Tomador é o ativo dele.
const { context } = useWorkspaces()

const name = ref('')
const email = ref('')
const cpf = ref<string | null>(null)
const profileId = ref<string | null>(null)
const policyHolderId = ref<string | null>(null)
const profiles = ref<AssignableProfile[]>([])
const policyHolders = ref<PolicyHolderListItem[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)
const formValid = ref(false)

const selectedProfile = computed(
  () => profiles.value.find(profile => profile.id === profileId.value) ?? null,
)

// §1: sem nenhum perfil disponível, o modal não mostra um select vazio — vira estado explicativo.
const hasNoProfiles = computed(() => !loading.value && !loadError.value && profiles.value.length === 0)

/**
 * Perfil de escopo Tomador só pede o Tomador quando quem cria é o Corretor Administrador
 * (RN-068 — exige nomeação vigente na corretora ativa). Para o Tomador Administrador, o Tomador
 * é o ativo dele e não há escolha (RN-070).
 */
const requiresPolicyHolder = computed(
  () => selectedProfile.value?.scope === profileScopes.policyHolder
    && Boolean(context.value?.activeBrokerageId),
)

const profileOptions = computed(() =>
  profiles.value.map(profile => ({
    title: getProfileLabel(profile.name),
    value: profile.id,
  })),
)

const policyHolderOptions = computed(() =>
  policyHolders.value.map(policyHolder => ({
    title: `${policyHolder.name} — ${formatCnpj(policyHolder.documentNumber)}`,
    value: policyHolder.id,
  })),
)

const canSubmit = computed(() =>
  formValid.value
  && Boolean(profileId.value)
  && (!requiresPolicyHolder.value || Boolean(policyHolderId.value)),
)

watch(open, async (isOpen) => {
  if (!isOpen) {
    return
  }

  name.value = ''
  email.value = ''
  cpf.value = null
  profileId.value = null
  policyHolderId.value = null
  await load()
})

// Trocar para um perfil que não é de Tomador limpa o Tomador escolhido.
watch(requiresPolicyHolder, (requires) => {
  if (!requires) {
    policyHolderId.value = null
  }
})

async function load() {
  loading.value = true
  loadError.value = null

  try {
    const [assignable, holders] = await Promise.all([
      listAssignableProfiles(),
      listPolicyHolders({ page: 1, pageSize: 100 }),
    ])
    profiles.value = assignable
    policyHolders.value = holders.items
  }
  catch (error) {
    loadError.value = extractApiErrorMessage(error, 'Não foi possível carregar perfis e tomadores.')
    profiles.value = []
    policyHolders.value = []
  }
  finally {
    loading.value = false
  }
}

// §8 passo 2 (Fatia F): a criação inline entra depois; por ora o atalho leva à tela de Perfis.
function goToCreateProfile() {
  open.value = false
  navigateTo('/perfis')
}

// RN-082: valida forma do CPF (dígitos verificadores); o servidor decide unicidade/imutabilidade.
function cpfRule(value: string | null): true | string {
  return isValidCpf(value ?? '') || 'CPF inválido.'
}

function submit() {
  if (!canSubmit.value || !profileId.value) {
    return
  }

  emit('confirm', {
    name: name.value.trim(),
    email: email.value.trim(),
    documentNumber: (cpf.value ?? '').replace(/\D/g, ''),
    profileId: profileId.value,
    policyHolderId: policyHolderId.value,
    profileScope: selectedProfile.value?.scope ?? '',
  })
}
</script>

<template>
  <SiDialog
    v-model="open"
    max-width="560"
  >
    <SiCard class="si-invite">
      <h2 class="si-invite__title">
        Novo usuário
      </h2>
      <p class="si-invite__hint">
        O convidado recebe um e-mail com link de primeiro acesso e define a própria senha. Ele fica
        na situação Pendente até entrar pela primeira vez.
      </p>

      <SiAlert
        v-if="loadError"
        type="error"
        class="mb-4"
        :text="loadError"
      />

      <!-- §1/§8 "Estado sem perfis": sem select vazio — bloco explicativo com criação de perfil. -->
      <div
        v-else-if="hasNoProfiles"
        class="si-invite__empty"
      >
        <div class="si-invite__empty-icon">
          <SiIcon icon="keyRound" />
        </div>
        <h3 class="si-invite__empty-title">
          Crie um perfil de acesso primeiro
        </h3>
        <p class="si-invite__empty-text">
          O perfil define o que a pessoa pode fazer na plataforma. Sem ele o convite criaria um
          acesso que não autoriza operação alguma.
        </p>
      </div>

      <SiForm
        v-else
        v-model="formValid"
      >
        <div class="si-invite__grid">
          <SiTextField
            v-model="name"
            label="Nome"
            :rules="[required()]"
          />
          <SiDocField
            v-model="cpf"
            tipo="cpf"
            label="CPF"
            :rules="[required(), cpfRule]"
          />
        </div>

        <SiTextField
          v-model="email"
          label="E-mail"
          type="email"
          :rules="[required(), emailRule()]"
          class="mb-3 mt-3"
        />

        <SiSelect
          v-model="profileId"
          label="Perfil de acesso"
          :items="profileOptions"
          :loading="loading"
          :rules="[required()]"
          hint="Define o que a pessoa pode fazer. Você pode trocar depois."
          persistent-hint
        />

        <p class="si-invite__shortcut">
          Nenhum perfil serve para esta pessoa?
          <button
            type="button"
            class="si-invite__link"
            @click="goToCreateProfile"
          >
            Criar perfil de acesso
          </button>
        </p>

        <SiSelect
          v-if="requiresPolicyHolder"
          v-model="policyHolderId"
          label="Tomador"
          :items="policyHolderOptions"
          :loading="loading"
          :rules="[required()]"
          class="mt-2"
        />
      </SiForm>

      <div class="si-invite__footer">
        <span class="si-invite__note">O usuário é criado só quando você envia o convite.</span>
        <div class="si-invite__actions">
          <SiButton
            variant="text"
            color="secondary"
            @click="open = false"
          >
            Cancelar
          </SiButton>
          <SiButton
            v-if="hasNoProfiles"
            :prepend-icon="'keyRound'"
            @click="goToCreateProfile"
          >
            Criar perfil de acesso
          </SiButton>
          <SiButton
            v-else
            :prepend-icon="'userPlus'"
            :loading="props.submitting"
            :disabled="!canSubmit"
            @click="submit"
          >
            Enviar convite
          </SiButton>
        </div>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-invite {
  padding: var(--si-space-5);
}

/* §8: Nome e CPF lado a lado (empilham no mobile). */
.si-invite__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--si-space-4);
}

.si-invite__title {
  margin: 0 0 var(--si-space-1);
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-invite__hint {
  margin: 0 0 var(--si-space-5);
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-invite__shortcut {
  margin: var(--si-space-2) 0 0;
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}

.si-invite__link {
  border: 0;
  background: transparent;
  padding: 0;
  color: rgb(var(--v-theme-primary));
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  cursor: pointer;
}

.si-invite__link:hover {
  text-decoration: underline;
}

.si-invite__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-2);
  padding: var(--si-space-6) var(--si-space-5);
  border: 1px dashed var(--si-border-strong, var(--si-cinza));
  border-radius: var(--si-radius-lg);
  background: rgb(var(--v-theme-background));
}

.si-invite__empty-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--si-radius-pill);
  background: var(--si-cinza-claro);
  color: var(--si-cinza);
}

.si-invite__empty-title {
  margin: 0;
  font-size: var(--si-fs-body-1);
  font-weight: var(--si-font-weight-semibold);
}

.si-invite__empty-text {
  margin: 0;
  max-width: 360px;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-invite__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  margin-top: var(--si-space-5);
  flex-wrap: wrap;
}

.si-invite__note {
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
}

.si-invite__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}
</style>
