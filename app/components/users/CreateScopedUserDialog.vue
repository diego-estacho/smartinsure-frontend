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
 */
import type { AssignableProfile } from '~/composables/useProfiles'
import type { PolicyHolderListItem } from '~/composables/usePolicyHolders'
import { formatCnpj } from '~/lib/documents'
import { describeRequestError } from '~/lib/errors'
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
    loadError.value = describeRequestError(error, 'Não foi possível carregar perfis e tomadores.')
    profiles.value = []
    policyHolders.value = []
  }
  finally {
    loading.value = false
  }
}

function submit() {
  if (!canSubmit.value || !profileId.value) {
    return
  }

  emit('confirm', {
    name: name.value.trim(),
    email: email.value.trim(),
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
    <SiCard class="si-create-scoped-user">
      <h2 class="text-h6 mb-1">
        Novo usuário
      </h2>

      <p class="si-create-scoped-user__hint mb-5">
        O convidado recebe um e-mail com link de primeiro acesso e define a própria senha. Perfis de
        tomador exigem escolher o tomador — ele precisa ter nomeação vigente com a corretora ativa.
      </p>

      <SiAlert
        v-if="loadError"
        type="error"
        class="mb-4"
        :text="loadError"
      />

      <SiAlert
        v-else-if="!loading && !profiles.length"
        type="warning"
        class="mb-4"
        text="Nenhum perfil disponível para atribuir no escopo atual."
      />

      <SiForm v-model="formValid">
        <SiTextField
          v-model="name"
          label="Nome"
          :rules="[required()]"
          class="mb-3"
        />

        <SiTextField
          v-model="email"
          label="E-mail"
          type="email"
          :rules="[required(), emailRule()]"
          class="mb-3"
        />

        <SiSelect
          v-model="profileId"
          label="Perfil"
          :items="profileOptions"
          :loading="loading"
          :rules="[required()]"
          class="mb-3"
        />

        <SiSelect
          v-if="requiresPolicyHolder"
          v-model="policyHolderId"
          label="Tomador"
          :items="policyHolderOptions"
          :loading="loading"
          :rules="[required()]"
        />
      </SiForm>

      <div class="si-create-scoped-user__actions">
        <SiButton
          variant="text"
          size="small"
          @click="open = false"
        >
          Cancelar
        </SiButton>

        <SiButton
          :prepend-icon="'userPlus'"
          :loading="props.submitting"
          :disabled="!canSubmit"
          size="small"
          @click="submit"
        >
          Enviar convite
        </SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-create-scoped-user {
  padding: var(--si-space-5);
}

.si-create-scoped-user__hint {
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-create-scoped-user__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-5);
}
</style>
