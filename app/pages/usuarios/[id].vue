<script setup lang="ts">
import type { GetUserResponse } from '~/composables/useUsers'
import { toBrDateTime } from '~/lib/dates'
import { formatCpf } from '~/lib/documents'
import { extractApiErrorMessage } from '~/lib/apiError'
import { getProfileLabel, getProfileScopeView, profileScopes } from '~/lib/status/profiles'
import { getUserDisplayStatus } from '~/lib/status/users'

/**
 * Detalhe do Usuário (§11). Mesma página, rota por guid. Cabeçalho com avatar + situação + ação
 * principal por situação; à esquerda os Perfis de acesso (RN-064) e a Atividade; à direita os
 * Dados do acesso + inativar/reativar (RN-076). Reenviar/inativar/reativar são decididos no
 * servidor (RN-065/RN-076). Situação de exibição "Convite expirado" derivada do flag do contrato.
 *
 * NOTA (fatia): CPF (Fatia B), Editar usuário (C), Enviar redefinição de senha (D), Último acesso
 * (E) e os chips de área + contagem de permissões (F) entram nas suas fatias.
 */
definePageMeta({ layout: 'shell' })

const route = useRoute()
const { getUser, resendInvitation, inactivateUser, reactivateUser, requestPasswordReset } = useUsers()

const user = ref<GetUserResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const toast = ref('')
const acting = ref(false)
const confirmInactivate = ref(false)
const editOpen = ref(false)

const statusView = computed(() =>
  getUserDisplayStatus(user.value?.status, user.value?.inviteExpired ?? false))

function scopeLabel(scope: string | null | undefined): string {
  return scope ? getProfileScopeView(scope).label : '—'
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : ''
  return (first + last).toUpperCase() || '?'
}

// Perfis de acesso do Usuário (RN-064): o de Sistema (RN-012) e os de cada Vínculo.
const accessProfiles = computed(() => {
  const current = user.value
  if (!current) {
    return []
  }
  const list: {
    key: string
    name: string
    scope: string
    origin: string
    profileId: string | null
    link: string
  }[] = []

  if (current.profileId && current.profileName) {
    list.push({
      key: 'system',
      name: getProfileLabel(current.profileName),
      scope: scopeLabel(current.profileScope),
      origin: current.profileIsFixed ? 'Fixo' : 'Customizado',
      profileId: current.profileId,
      link: 'SmartInsure',
    })
  }
  for (const membership of current.brokerageMemberships) {
    list.push({
      key: `brokerage-${membership.id}`,
      name: getProfileLabel(membership.profileName),
      scope: scopeLabel(membership.profileScope),
      origin: membership.profileIsFixed ? 'Fixo' : 'Customizado',
      profileId: membership.profileId,
      link: membership.scopeName,
    })
  }
  for (const membership of current.policyHolderMemberships) {
    list.push({
      key: `policy-holder-${membership.id}`,
      name: getProfileLabel(membership.profileName),
      scope: scopeLabel(membership.profileScope),
      origin: membership.profileIsFixed ? 'Fixo' : 'Customizado',
      profileId: membership.profileId,
      link: membership.scopeName,
    })
  }
  return list
})

// Vínculo/Escopo representativos para "Dados do acesso": o Sistema quando houver, senão o 1º Vínculo.
const access = computed(() => {
  const current = user.value
  if (!current) {
    return { scope: '—', link: '—' }
  }
  if (current.profileScope === profileScopes.system) {
    return { scope: 'Sistema', link: 'SmartInsure' }
  }
  const brokerage = current.brokerageMemberships[0]
  if (brokerage) {
    return { scope: 'Corretora', link: brokerage.scopeName }
  }
  const policyHolder = current.policyHolderMemberships[0]
  if (policyHolder) {
    return { scope: 'Tomador', link: policyHolder.scopeName }
  }
  return { scope: '—', link: '—' }
})

await refresh()

async function refresh() {
  loading.value = true
  error.value = null
  try {
    user.value = await getUser(String(route.params.id))
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível carregar o usuário.')
    user.value = null
  }
  finally {
    loading.value = false
  }
}

async function onResend() {
  if (!user.value) {
    return
  }
  acting.value = true
  try {
    await resendInvitation(user.value.id)
    toast.value = `Novo link de primeiro acesso enviado para ${user.value.email}. O link anterior deixa de valer.`
    await refresh()
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível reenviar o convite.')
  }
  finally {
    acting.value = false
  }
}

async function onReactivate() {
  if (!user.value) {
    return
  }
  acting.value = true
  try {
    await reactivateUser(user.value.id)
    toast.value = `${user.value.name} foi reativado.`
    await refresh()
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível reativar o usuário.')
  }
  finally {
    acting.value = false
  }
}

async function onInactivateConfirmed() {
  if (!user.value) {
    return
  }
  acting.value = true
  try {
    await inactivateUser(user.value.id)
    toast.value = `${user.value.name} foi inativado.`
    confirmInactivate.value = false
    await refresh()
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível inativar o usuário.')
  }
  finally {
    acting.value = false
  }
}

// §9/RN-202: editar usuário. O modal busca o detalhe pelo id; ao salvar, refazemos o detalhe.
async function onEdited(payload: { name: string, emailResent: boolean, email: string }) {
  toast.value = payload.emailResent
    ? `Dados atualizados. Convite reenviado para ${payload.email}.`
    : 'Dados atualizados.'
  await refresh()
}

async function onEditResent(payload: { email: string }) {
  toast.value = `Novo link de primeiro acesso enviado para ${payload.email}. O link anterior deixa de valer.`
  await refresh()
}

// RN-203: redefinição de senha do Usuário Ativo (o servidor gera o link e envia por e-mail).
async function onResetPassword() {
  if (!user.value) {
    return
  }
  acting.value = true
  try {
    await requestPasswordReset(user.value.id)
    toast.value = `Link de redefinição de senha enviado para ${user.value.email}.`
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível enviar a redefinição de senha.')
  }
  finally {
    acting.value = false
  }
}

// Ação principal do cabeçalho por situação (§11): reenviar (pendente/expirado), reativar (inativo)
// e enviar redefinição de senha (ativo, RN-203).
const isInactive = computed(() => user.value?.status === 'Inactive')
const isPending = computed(() => user.value?.status === 'Pending')
const isActive = computed(() => user.value?.status === 'Active')
</script>

<template>
  <div class="si-user-detail">
    <header class="si-user-detail__hero">
      <VContainer class="si-user-detail__hero-inner">
        <SiPageBack
          to="/usuarios"
          parent-label="Usuários"
          :current="user?.name ?? 'Usuário'"
        />

        <SiAlert
          v-if="error"
          type="error"
          class="mt-4"
          :text="error"
        />

        <div
          v-if="user"
          class="si-user-detail__hero-row"
        >
          <div class="si-user-detail__identity">
            <SiAvatar :size="56">
              {{ initials(user.name) }}
            </SiAvatar>
            <div class="si-user-detail__identity-text">
              <div class="si-user-detail__title">
                <h1 class="si-user-detail__h1">
                  {{ user.name }}
                </h1>
                <SiChip
                  :color="statusView.color"
                  size="small"
                  dot
                >
                  {{ statusView.longLabel }}
                </SiChip>
              </div>
              <p class="si-user-detail__email">
                {{ user.email }}
              </p>
            </div>
          </div>

          <div class="si-user-detail__hero-actions">
            <SiButton
              variant="outlined"
              color="secondary"
              :prepend-icon="'pencil'"
              @click="editOpen = true"
            >
              Editar usuário
            </SiButton>
            <SiButton
              v-if="isPending"
              :prepend-icon="'mail'"
              :loading="acting"
              @click="onResend"
            >
              Reenviar convite
            </SiButton>
            <SiButton
              v-else-if="isActive"
              :prepend-icon="'keyRound'"
              :loading="acting"
              @click="onResetPassword"
            >
              Enviar redefinição de senha
            </SiButton>
            <SiButton
              v-else-if="isInactive"
              :prepend-icon="'userCheck'"
              :loading="acting"
              @click="onReactivate"
            >
              Reativar usuário
            </SiButton>
          </div>
        </div>
      </VContainer>
    </header>

    <VContainer
      v-if="user"
      class="si-user-detail__content"
    >
      <div class="si-user-detail__grid">
        <div class="si-user-detail__main">
          <!-- Perfil de acesso (RN-064): Sistema e/ou Vínculos, cada um com Escopo e origem. -->
          <SiCard
            variant="outlined"
            class="si-user-detail__card"
          >
            <div class="si-user-detail__card-head">
              <span class="si-user-detail__eyebrow">Perfil de acesso</span>
            </div>
            <div class="si-user-detail__card-body">
              <p
                v-if="accessProfiles.length === 0"
                class="si-user-detail__empty"
              >
                Sem perfil de acesso — usuário comum.
              </p>
              <div
                v-for="profile in accessProfiles"
                v-else
                :key="profile.key"
                class="si-user-detail__profile"
              >
                <div class="si-user-detail__profile-info">
                  <span class="si-user-detail__profile-name">{{ profile.name }}</span>
                  <span class="si-user-detail__profile-sub">
                    {{ profile.scope }} · {{ profile.origin }} · {{ profile.link }}
                  </span>
                </div>
                <NuxtLink
                  v-if="profile.profileId"
                  :to="`/perfis-acesso/${profile.profileId}`"
                  class="si-user-detail__link"
                >
                  Abrir perfil
                </NuxtLink>
              </div>
            </div>
          </SiCard>

          <!-- Atividade (§11): eventos do acesso. Último acesso real entra na Fatia E. -->
          <SiCard
            variant="outlined"
            class="si-user-detail__card"
          >
            <div class="si-user-detail__card-head">
              <span class="si-user-detail__eyebrow">Atividade</span>
            </div>
            <div class="si-user-detail__card-body">
              <div class="si-user-detail__activity">
                <div
                  v-if="user.invitedAt"
                  class="si-user-detail__event"
                >
                  <span class="si-user-detail__event-when">{{ toBrDateTime(user.invitedAt) }}</span>
                  <span class="si-user-detail__event-what">Convite de primeiro acesso enviado</span>
                </div>
                <div
                  v-if="user.inviteExpired && user.inviteExpiresAt"
                  class="si-user-detail__event"
                >
                  <span class="si-user-detail__event-when">{{ toBrDateTime(user.inviteExpiresAt) }}</span>
                  <span class="si-user-detail__event-what">Convite expirou — reenvie para renovar o link</span>
                </div>
                <div class="si-user-detail__event">
                  <span class="si-user-detail__event-when">—</span>
                  <span class="si-user-detail__event-what">
                    {{ isPending ? 'Ainda não fez o primeiro acesso' : isInactive ? 'Acesso inativado' : 'Primeiro acesso concluído' }}
                  </span>
                </div>
              </div>
            </div>
          </SiCard>
        </div>

        <aside class="si-user-detail__aside">
          <SiCard
            variant="outlined"
            class="si-user-detail__card"
          >
            <div class="si-user-detail__card-head">
              <span class="si-user-detail__eyebrow">Dados do acesso</span>
            </div>
            <div class="si-user-detail__facts">
              <div
                v-if="user.documentNumber"
                class="si-user-detail__fact"
              >
                <span class="si-user-detail__fact-label">CPF</span>
                <span class="si-user-detail__fact-value">{{ formatCpf(user.documentNumber) }}</span>
              </div>
              <div class="si-user-detail__fact">
                <span class="si-user-detail__fact-label">Vínculo</span>
                <span class="si-user-detail__fact-value">{{ access.link }}</span>
              </div>
              <div class="si-user-detail__fact">
                <span class="si-user-detail__fact-label">Escopo</span>
                <span class="si-user-detail__fact-value">{{ access.scope }}</span>
              </div>
              <div class="si-user-detail__fact">
                <span class="si-user-detail__fact-label">Cadastrado em</span>
                <span class="si-user-detail__fact-value">{{ toBrDateTime(user.createdAt) }}</span>
              </div>
              <div class="si-user-detail__fact">
                <span class="si-user-detail__fact-label">Último acesso</span>
                <span class="si-user-detail__fact-value">
                  {{ user.lastAccessAtUtc ? toBrDateTime(user.lastAccessAtUtc) : 'Nunca' }}
                </span>
              </div>
            </div>
            <div class="si-user-detail__aside-action">
              <SiButton
                v-if="isInactive"
                variant="outlined"
                color="secondary"
                block
                :prepend-icon="'userCheck'"
                :loading="acting"
                @click="onReactivate"
              >
                Reativar acesso
              </SiButton>
              <SiButton
                v-else
                variant="outlined"
                color="error"
                block
                :prepend-icon="'userX'"
                @click="confirmInactivate = true"
              >
                Inativar acesso
              </SiButton>
            </div>
          </SiCard>
        </aside>
      </div>
    </VContainer>

    <!-- Confirmação de inativação (§10). -->
    <SiDialog
      :model-value="confirmInactivate"
      :max-width="440"
      @update:model-value="(open: boolean | undefined) => { confirmInactivate = Boolean(open) }"
    >
      <SiCard variant="flat">
        <template #title>
          Inativar {{ user?.name }}?
        </template>
        <template #text>
          A pessoa perde o acesso imediatamente, mas o histórico dela na plataforma continua
          preservado. Você pode reativar quando quiser.
        </template>
        <template #actions>
          <VSpacer />
          <SiButton
            variant="text"
            color="secondary"
            @click="confirmInactivate = false"
          >
            Cancelar
          </SiButton>
          <SiButton
            color="error"
            :loading="acting"
            @click="onInactivateConfirmed"
          >
            Inativar usuário
          </SiButton>
        </template>
      </SiCard>
    </SiDialog>

    <UsersEditDialog
      v-model="editOpen"
      :user-id="user?.id ?? null"
      @saved="onEdited"
      @resent="onEditResent"
    />

    <SiSnackbar
      :model-value="Boolean(toast)"
      :timeout="3800"
      @update:model-value="(open: boolean | undefined) => { if (!open) toast = '' }"
    >
      {{ toast }}
    </SiSnackbar>
  </div>
</template>

<style scoped>
.si-user-detail__hero {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-user-detail__hero-inner,
.si-user-detail__content {
  max-width: var(--si-container-wide);
}

.si-user-detail__hero-inner {
  padding-block: var(--si-space-5);
}

.si-user-detail__hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-top: var(--si-space-4);
}

.si-user-detail__identity {
  display: flex;
  align-items: center;
  gap: var(--si-space-4);
  min-width: 0;
}

.si-user-detail__identity-text {
  min-width: 0;
}

.si-user-detail__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-3);
}

.si-user-detail__h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: var(--si-font-weight-semibold);
}

.si-user-detail__email {
  margin: var(--si-space-1) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-user-detail__hero-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
}

.si-user-detail__content {
  padding-block: var(--si-space-5);
}

.si-user-detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--si-space-4);
  align-items: start;
}

.si-user-detail__main {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-4);
  min-width: 0;
}

.si-user-detail__card-head {
  padding: var(--si-space-4) var(--si-space-4) 0;
}

.si-user-detail__eyebrow {
  font-size: 11.5px;
  font-weight: var(--si-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--si-cinza);
}

.si-user-detail__card-body {
  padding: var(--si-space-3) var(--si-space-4) var(--si-space-4);
}

.si-user-detail__empty {
  margin: 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-user-detail__profile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  padding-block: var(--si-space-3);
}

.si-user-detail__profile + .si-user-detail__profile {
  border-top: 1px solid var(--si-divider);
}

.si-user-detail__profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.si-user-detail__profile-name {
  font-size: var(--si-fs-body-1);
  font-weight: var(--si-font-weight-semibold);
}

.si-user-detail__profile-sub {
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}

.si-user-detail__link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-size: var(--si-fs-small);
  flex-shrink: 0;
}

.si-user-detail__link:hover {
  text-decoration: underline;
}

.si-user-detail__activity {
  display: flex;
  flex-direction: column;
}

.si-user-detail__event {
  display: flex;
  gap: var(--si-space-3);
  padding-block: var(--si-space-3);
}

.si-user-detail__event + .si-user-detail__event {
  border-top: 1px solid var(--si-divider);
}

.si-user-detail__event-when {
  flex: 0 0 116px;
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

.si-user-detail__event-what {
  font-size: var(--si-fs-body-2);
  color: rgb(var(--v-theme-on-surface));
}

.si-user-detail__facts {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3) var(--si-space-4);
}

.si-user-detail__fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-user-detail__fact-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--si-cinza);
  font-weight: var(--si-font-weight-semibold);
}

.si-user-detail__fact-value {
  font-size: var(--si-fs-body-2);
  font-weight: var(--si-font-weight-medium);
  color: rgb(var(--v-theme-on-surface));
}

.si-user-detail__aside-action {
  padding: 0 var(--si-space-4) var(--si-space-4);
}

@media (max-width: 1023.98px) {
  .si-user-detail__grid {
    grid-template-columns: 1fr;
  }

  .si-user-detail__hero-row {
    flex-direction: column;
    align-items: stretch;
  }

  .si-user-detail__hero-actions > * {
    flex: 1;
  }
}
</style>
