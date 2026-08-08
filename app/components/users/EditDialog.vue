<script setup lang="ts">
/**
 * RN-202 — Editar usuário (§9). Corrige o cadastro preservando o histórico:
 *  - Nome: sempre editável.
 *  - E-mail: editável SÓ enquanto Pendente/Convite expirado (antes do primeiro acesso, quando ainda
 *    não é credencial — RN-005). Trocar reenvia o Convite para o novo endereço (o servidor decide);
 *    o campo some (vira read-only) quando o Usuário é Ativo/Inativo.
 *  - CPF (RN-082): imutável — sempre read-only.
 *  - Perfil de acesso: editável no vínculo de Corretora/Tomador (RN-075). No Escopo Sistema (RN-012)
 *    a concessão/revogação é outro fluxo — aqui fica read-only com atalho para Perfis.
 *
 * "Reenviar convite" no rodapé é independente de alteração (é o caminho "não recebi o convite").
 * "Salvar alterações" fica desabilitado até algo mudar. Apresentacional (ADR-018): unicidade de
 * e-mail, validação de escopo do perfil e o efeito no provedor são decisão do servidor.
 */
import type { GetUserResponse } from '~/composables/useUsers'
import type { AssignableProfile } from '~/composables/useProfiles'
import { toBrDateTime } from '~/lib/dates'
import { formatCpf } from '~/lib/documents'
import { extractApiErrorMessage } from '~/lib/apiError'
import { email as emailRule, required } from '~/lib/rules'
import { getProfileLabel, getProfileScopeView } from '~/lib/status/profiles'
import { getUserDisplayStatus } from '~/lib/status/users'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  userId: string | null
}>()

const emit = defineEmits<{
  /** Salvou: a página refaz a lista e mostra o toast (reenvio de convite quando o e-mail mudou). */
  saved: [payload: { name: string, emailResent: boolean, email: string }]
  /** Reenviou o convite (independente de alteração). */
  resent: [payload: { email: string }]
}>()

const { getUser, editUser, changeScopeProfile, resendInvitation } = useUsers()
const { listAssignableProfiles } = useProfiles()

const user = ref<GetUserResponse | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const formValid = ref(false)

// Campos editáveis + snapshot original (para detectar alteração).
const name = ref('')
const emailValue = ref('')
const profileId = ref<string | null>(null)
const original = ref({ name: '', email: '', profileId: null as string | null })

const assignable = ref<AssignableProfile[]>([])

const statusView = computed(() =>
  getUserDisplayStatus(user.value?.status, user.value?.inviteExpired ?? false))

// §9: e-mail só é editável antes do primeiro acesso (Pendente/Convite expirado = situação Pendente crua).
const emailEditable = computed(() => user.value?.status === 'Pending')
const isPending = computed(() => user.value?.status === 'Pending')

// Vínculo representativo (RN-075): o 1º de Corretora, senão o 1º de Tomador. Só aí o Perfil é editável.
const membership = computed(() =>
  user.value?.brokerageMemberships[0] ?? user.value?.policyHolderMemberships[0] ?? null)
const profileEditable = computed(() => membership.value !== null)

// RN-075/backend EnsureProfileFitsScope: perfis fixos servem a qualquer escopo; os customizados só
// ao próprio dono (o vínculo em edição). Espelha a regra do servidor para não oferecer opção inválida.
const profileOptions = computed(() => {
  const link = membership.value
  if (!link) {
    return []
  }
  const fitting = assignable.value.filter(profile =>
    profile.isFixed
    || profile.brokerageId === link.scopeId
    || profile.policyHolderId === link.scopeId)
  const options = fitting.map(profile => ({ title: getProfileLabel(profile.name), value: profile.id }))
  // Garante que o perfil atual apareça mesmo se o catálogo assinalável não o trouxer.
  if (!options.some(option => option.value === link.profileId)) {
    options.unshift({ title: `${getProfileLabel(link.profileName)} (atual)`, value: link.profileId })
  }
  return options
})

const cpfLabel = computed(() =>
  user.value?.documentNumber ? formatCpf(user.value.documentNumber) : 'Não informado')

const profileContext = computed(() => {
  const link = membership.value
  if (link) {
    return `${getProfileScopeView(link.profileScope).label} · ${link.scopeName}`
  }
  if (user.value?.profileName) {
    return `${getProfileScopeView(user.value.profileScope ?? '').label} · SmartInsure`
  }
  return null
})

const nameChanged = computed(() => name.value.trim() !== original.value.name)
const emailChanged = computed(() =>
  emailEditable.value && emailValue.value.trim().toLowerCase() !== original.value.email)
const profileChanged = computed(() =>
  profileEditable.value && profileId.value !== original.value.profileId)
const hasChanges = computed(() => nameChanged.value || emailChanged.value || profileChanged.value)
const canSave = computed(() => formValid.value && hasChanges.value && !submitting.value)

watch(open, async (isOpen) => {
  if (isOpen && props.userId) {
    await load(props.userId)
  }
})

async function load(id: string) {
  loading.value = true
  loadError.value = null
  submitError.value = null
  try {
    const [detail, profiles] = await Promise.all([getUser(id), listAssignableProfiles()])
    user.value = detail
    assignable.value = profiles
    name.value = detail.name
    emailValue.value = detail.email
    const link = detail.brokerageMemberships[0] ?? detail.policyHolderMemberships[0] ?? null
    profileId.value = link?.profileId ?? null
    original.value = { name: detail.name, email: detail.email, profileId: link?.profileId ?? null }
  }
  catch (error) {
    loadError.value = extractApiErrorMessage(error, 'Não foi possível carregar o usuário.')
    user.value = null
  }
  finally {
    loading.value = false
  }
}

async function submit() {
  const current = user.value
  if (!current || !canSave.value) {
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    if (nameChanged.value || emailChanged.value) {
      await editUser(current.id, {
        name: name.value.trim(),
        email: emailChanged.value ? emailValue.value.trim() : null,
      })
    }
    if (profileChanged.value && membership.value && profileId.value) {
      await changeScopeProfile(current.id, {
        scopeId: membership.value.scopeId,
        profileId: profileId.value,
      })
    }
    emit('saved', {
      name: name.value.trim(),
      emailResent: emailChanged.value,
      email: emailChanged.value ? emailValue.value.trim() : current.email,
    })
    open.value = false
  }
  catch (error) {
    submitError.value = extractApiErrorMessage(error, 'Não foi possível salvar as alterações.')
  }
  finally {
    submitting.value = false
  }
}

async function onResend() {
  const current = user.value
  if (!current) {
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    await resendInvitation(current.id)
    emit('resent', { email: current.email })
    open.value = false
  }
  catch (error) {
    submitError.value = extractApiErrorMessage(error, 'Não foi possível reenviar o convite.')
  }
  finally {
    submitting.value = false
  }
}

function goToProfiles() {
  open.value = false
  navigateTo('/perfis-acesso')
}
</script>

<template>
  <SiDialog
    v-model="open"
    max-width="560"
  >
    <SiCard class="si-edit">
      <h2 class="si-edit__title">
        Editar {{ user?.name ?? 'usuário' }}
      </h2>
      <p class="si-edit__hint">
        Corrija os dados de cadastro e o perfil de acesso. O histórico da pessoa é preservado.
      </p>

      <SiAlert
        v-if="loadError"
        type="error"
        class="mb-4"
        :text="loadError"
      />
      <template v-else-if="user">
        <SiAlert
          v-if="submitError"
          type="error"
          class="mb-4"
          :text="submitError"
        />

        <SiForm v-model="formValid">
          <SiTextField
            v-model="name"
            label="Nome"
            :rules="[required()]"
          />

          <SiTextField
            v-if="emailEditable"
            v-model="emailValue"
            label="E-mail"
            type="email"
            :rules="[required(), emailRule()]"
            hint="Trocar o e-mail reenvia o convite para o novo endereço; o link anterior deixa de valer."
            persistent-hint
            class="mt-3"
          />

          <SiSelect
            v-if="profileEditable"
            v-model="profileId"
            label="Perfil de acesso"
            :items="profileOptions"
            :rules="[required()]"
            :hint="`No vínculo ${membership?.scopeName}. Você pode trocar quando quiser.`"
            persistent-hint
            class="mt-3"
          />
        </SiForm>

        <!-- §9: bloco read-only — o que não se edita aqui (CPF sempre; e-mail/convite conforme situação). -->
        <div class="si-edit__readonly">
          <div class="si-edit__ro-row">
            <span class="si-edit__ro-label">CPF</span>
            <span class="si-edit__ro-value">{{ cpfLabel }}</span>
          </div>
          <div
            v-if="!emailEditable"
            class="si-edit__ro-row"
          >
            <span class="si-edit__ro-label">E-mail de acesso</span>
            <span class="si-edit__ro-value">{{ user.email }}</span>
          </div>
          <div
            v-if="emailEditable && user.invitedAt"
            class="si-edit__ro-row"
          >
            <span class="si-edit__ro-label">Convite enviado em</span>
            <span class="si-edit__ro-value">{{ toBrDateTime(user.invitedAt) }}</span>
          </div>
          <div
            v-if="!profileEditable && profileContext"
            class="si-edit__ro-row"
          >
            <span class="si-edit__ro-label">Perfil de acesso</span>
            <span class="si-edit__ro-value">
              {{ user.profileName ? getProfileLabel(user.profileName) : 'Sem perfil' }}
              <button
                type="button"
                class="si-edit__link"
                @click="goToProfiles"
              >
                gerenciar em Perfis
              </button>
            </span>
          </div>
        </div>

        <p class="si-edit__note">
          <template v-if="statusView.key === 'expired'">
            O convite expirou. Salvar um novo e-mail reenvia o convite; o link anterior deixa de valer.
          </template>
          <template v-else-if="isPending">
            Enquanto o primeiro acesso não é feito, o e-mail ainda pode ser corrigido.
          </template>
          <template v-else>
            O e-mail é a credencial de acesso e não muda por aqui — para trocar, inative e convide o novo endereço.
          </template>
        </p>
      </template>

      <div class="si-edit__footer">
        <SiButton
          variant="text"
          color="secondary"
          @click="open = false"
        >
          Cancelar
        </SiButton>
        <div class="si-edit__actions">
          <SiButton
            v-if="emailEditable && user"
            variant="outlined"
            color="secondary"
            :prepend-icon="'mail'"
            :loading="submitting"
            @click="onResend"
          >
            Reenviar convite
          </SiButton>
          <SiButton
            :prepend-icon="'check'"
            :loading="submitting"
            :disabled="!canSave"
            @click="submit"
          >
            Salvar alterações
          </SiButton>
        </div>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-edit {
  padding: var(--si-space-5);
}

.si-edit__title {
  margin: 0 0 var(--si-space-1);
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-edit__hint {
  margin: 0 0 var(--si-space-5);
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-edit__readonly {
  margin-top: var(--si-space-4);
  padding: var(--si-space-3) var(--si-space-4);
  border: 1px solid var(--si-divider);
  border-radius: var(--si-radius-lg);
  background: rgb(var(--v-theme-background));
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-edit__ro-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-edit__ro-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--si-cinza);
  font-weight: var(--si-font-weight-semibold);
}

.si-edit__ro-value {
  font-size: var(--si-fs-body-2);
  font-weight: var(--si-font-weight-medium);
  color: rgb(var(--v-theme-on-surface));
}

.si-edit__link {
  border: 0;
  background: transparent;
  padding: 0;
  margin-left: var(--si-space-2);
  color: rgb(var(--v-theme-primary));
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  cursor: pointer;
}

.si-edit__link:hover {
  text-decoration: underline;
}

.si-edit__note {
  margin: var(--si-space-3) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
}

.si-edit__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  margin-top: var(--si-space-5);
  flex-wrap: wrap;
}

.si-edit__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}
</style>
