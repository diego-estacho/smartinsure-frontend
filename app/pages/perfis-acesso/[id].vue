<script setup lang="ts">
/**
 * Detalhe do Perfil (handoff §10). Hero + faixa de perfil fixo + grid de permissões por área
 * (marcadas E não-marcadas — o que o perfil NÃO pode fazer é informação de auditoria) + "Quem usa
 * este perfil" + ações (duplicar / editar / excluir conforme a origem). Reusa o editor e o fluxo
 * de exclusão-com-migração da listagem.
 */
import type { GetProfileResponse } from '~/composables/useProfiles'
import type { EditorConfirmPayload, EditorMode, EditorProfile } from '~/components/profiles-access/EditorDialog.vue'
import type { DeleteProfileTarget } from '~/components/profiles-access/DeleteDialog.vue'
import { extractApiErrorMessage } from '~/lib/apiError'
import { getProfileLabel, getProfileScopeView } from '~/lib/status/profiles'

definePageMeta({ layout: 'shell' })

const route = useRoute()
const profileId = computed(() => String(route.params.id))

const { getProfile, listProfiles, createProfile, updateProfile, deleteProfile } = useProfiles()
const { catalog, load: loadCatalog } = usePermissionsCatalog()

const profile = ref<GetProfileResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const others = ref<{ id: string, name: string, scope: string }[]>([])

const num = (value: number | string | null | undefined) => Number(value ?? 0)

await Promise.all([refresh(), loadCatalog().catch(() => {})])

async function refresh() {
  loading.value = true
  error.value = null
  try {
    profile.value = await getProfile(profileId.value)
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível carregar o perfil de acesso.')
    profile.value = null
  }
  finally {
    loading.value = false
  }
}

const scopeView = computed(() => getProfileScopeView(profile.value?.scope))
const markedCodes = computed(() => new Set((profile.value?.permissions ?? []).map(p => p.code)))
const linkedUsers = computed(() => profile.value?.linkedUsers ?? [])
const linkedUserCount = computed(() => num(profile.value?.linkedUserCount))

/** Áreas do catálogo que têm ao menos uma permissão (para o grid de auditoria). */
const areas = computed(() => catalog.value?.areas ?? [])

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('')
}

// ---- Ações (editor + exclusão) reaproveitados ----
const editorOpen = ref(false)
const editorMode = ref<EditorMode>('editar')
const editorProfile = ref<EditorProfile | null>(null)
const editorSubmitting = ref(false)
const editorError = ref<string | null>(null)

function currentEditorProfile(): EditorProfile | null {
  if (!profile.value) {
    return null
  }
  return {
    id: profile.value.id,
    name: profile.value.name,
    scope: profile.value.scope,
    description: profile.value.description,
    permissionCodes: profile.value.permissions.map(p => p.code),
  }
}

async function openEditor(mode: EditorMode) {
  editorError.value = null
  editorProfile.value = currentEditorProfile()
  editorMode.value = mode
  await loadCatalog().catch(() => {})
  editorOpen.value = true
}

async function confirmEditor(payload: EditorConfirmPayload) {
  editorSubmitting.value = true
  editorError.value = null
  try {
    if (editorMode.value === 'editar' && profile.value) {
      await updateProfile(profile.value.id, payload)
      success.value = `Perfil ${payload.name} atualizado com ${payload.permissionCodes.length} permissões.`
      editorOpen.value = false
      await refresh()
    }
    else {
      // duplicar → cria um novo; navega para ele.
      const created = await createProfile(payload)
      editorOpen.value = false
      await navigateTo(`/perfis-acesso/${created.id}`)
    }
  }
  catch (requestError) {
    editorError.value = extractApiErrorMessage(requestError, 'Não foi possível salvar o perfil.')
  }
  finally {
    editorSubmitting.value = false
  }
}

const deleteOpen = ref(false)
const deleteSubmitting = ref(false)
const deleteError = ref<string | null>(null)

const deleteTarget = computed<DeleteProfileTarget | null>(() => profile.value
  ? { id: profile.value.id, name: profile.value.name, userCount: linkedUserCount.value }
  : null)

const migrationOptions = computed(() => others.value
  .filter(other => other.id !== profile.value?.id && other.scope === profile.value?.scope)
  .map(other => ({ title: getProfileLabel(other.name), value: other.id })))

async function requestDelete() {
  if (!profile.value || profile.value.isFixed) {
    return
  }
  deleteError.value = null
  if (others.value.length === 0) {
    try {
      const response = await listProfiles({ page: 1, pageSize: 200 })
      others.value = response.items.map(item => ({ id: item.id, name: item.name, scope: item.scope }))
    }
    catch { /* migração fica sem opções; o servidor ainda valida */ }
  }
  deleteOpen.value = true
}

async function confirmDelete(payload: { migrateToProfileId?: string }) {
  if (!profile.value) {
    return
  }
  deleteSubmitting.value = true
  deleteError.value = null
  try {
    await deleteProfile(profile.value.id, payload.migrateToProfileId)
    await navigateTo('/perfis-acesso')
  }
  catch (requestError) {
    deleteError.value = extractApiErrorMessage(requestError, 'Não foi possível remover o perfil.')
  }
  finally {
    deleteSubmitting.value = false
  }
}
</script>

<template>
  <VContainer class="si-profile">
    <SiPageBack
      to="/perfis-acesso"
      parent-label="Perfis de acesso"
      :current="profile ? getProfileLabel(profile.name) : 'Detalhe'"
    />

    <SiAlert
      v-if="success"
      type="success"
      class="mb-4"
      closable
      :text="success"
      @click:close="success = null"
    />
    <SiAlert
      v-if="error"
      type="error"
      class="mb-4"
      :text="error"
    />

    <template v-if="profile">
      <!-- Hero -->
      <header class="si-profile__hero">
        <span class="si-profile__badge">
          <SiIcon
            icon="keyRound"
            :size="26"
          />
        </span>
        <div class="si-profile__ident">
          <div class="si-profile__title-row">
            <h1 class="si-profile__title">
              {{ getProfileLabel(profile.name) }}
            </h1>
            <SiChip
              size="small"
              :color="scopeView.color"
            >
              {{ scopeView.label }}
            </SiChip>
            <SiChip
              size="small"
              color="secondary"
            >
              {{ profile.isFixed ? 'Fixo da plataforma' : 'Customizado' }}
            </SiChip>
          </div>
          <p
            v-if="profile.description"
            class="si-profile__desc"
          >
            {{ profile.description }}
          </p>
        </div>
        <div class="si-profile__hero-actions">
          <SiButton
            v-if="!profile.isFixed"
            variant="outlined"
            color="secondary"
            size="small"
            :prepend-icon="'copy'"
            @click="openEditor('duplicar')"
          >
            Duplicar
          </SiButton>
          <SiButton
            size="small"
            :prepend-icon="profile.isFixed ? 'copy' : 'pencil'"
            @click="openEditor(profile.isFixed ? 'duplicar' : 'editar')"
          >
            {{ profile.isFixed ? 'Duplicar e editar' : 'Editar permissões' }}
          </SiButton>
        </div>
      </header>

      <!-- Faixa de perfil fixo (§10) -->
      <div
        v-if="profile.isFixed"
        class="si-profile__fixed-banner"
      >
        <SiIcon
          icon="lock"
          :size="18"
        />
        <span>
          Perfil fixo da plataforma. As permissões não podem ser alteradas — duplique para criar uma
          versão sua e ajustar o que precisar.
        </span>
      </div>

      <div class="si-profile__grid">
        <!-- Permissões por área (marcadas e não-marcadas) -->
        <div class="si-profile__perms">
          <p
            v-if="areas.length === 0"
            class="si-profile__empty"
          >
            Catálogo de permissões indisponível.
          </p>
          <SiCard
            v-for="area in areas"
            :key="area.key"
            variant="outlined"
            class="si-profile__area"
          >
            <div class="si-profile__area-head">
              <span class="si-profile__area-name">{{ area.label }}</span>
              <span class="si-profile__area-count">
                {{ area.permissions.filter(p => markedCodes.has(p.code)).length }} de {{ area.permissions.length }}
              </span>
            </div>
            <ul class="si-profile__perm-list">
              <li
                v-for="permission in area.permissions"
                :key="permission.code"
                :class="['si-profile__perm', { 'si-profile__perm--on': markedCodes.has(permission.code) }]"
              >
                <span class="si-profile__perm-box">
                  <SiIcon
                    :icon="markedCodes.has(permission.code) ? 'check' : 'minus'"
                    :size="13"
                  />
                </span>
                {{ permission.label }}
              </li>
            </ul>
          </SiCard>
        </div>

        <!-- Quem usa este perfil -->
        <aside class="si-profile__side">
          <SiCard
            variant="outlined"
            class="si-profile__users-card"
          >
            <h2 class="si-profile__side-title">
              Quem usa este perfil
            </h2>
            <template v-if="linkedUserCount > 0">
              <div
                v-for="user in linkedUsers"
                :key="user.id"
                class="si-profile__user"
              >
                <SiAvatar size="sm">
                  {{ initials(user.name) }}
                </SiAvatar>
                <span class="si-profile__user-text">
                  <span class="si-profile__user-name">{{ user.name }}</span>
                  <span class="si-profile__user-email">{{ user.email }}</span>
                </span>
              </div>
              <NuxtLink
                class="si-profile__users-link"
                :to="`/usuarios?perfil=${profile.id}`"
              >
                Ver os {{ linkedUserCount }} usuários deste perfil
              </NuxtLink>
            </template>
            <p
              v-else
              class="si-profile__side-empty"
            >
              Nenhum usuário usa este perfil hoje. Ele fica disponível na hora de convidar alguém.
            </p>
          </SiCard>

          <SiButton
            v-if="!profile.isFixed"
            block
            variant="outlined"
            color="error"
            :prepend-icon="'trash'"
            class="si-profile__delete"
            @click="requestDelete"
          >
            Excluir perfil
          </SiButton>
          <p
            v-if="!profile.isFixed && linkedUserCount > 0"
            class="si-profile__delete-note"
          >
            Para excluir, você vai escolher para qual perfil migrar os usuários.
          </p>
          <p
            v-if="profile.isFixed"
            class="si-profile__delete-note si-profile__delete-note--sep"
          >
            Perfis fixos da plataforma não podem ser excluídos.
          </p>
        </aside>
      </div>
    </template>

    <ProfilesAccessEditorDialog
      v-if="catalog"
      v-model="editorOpen"
      :mode="editorMode"
      :catalog="catalog"
      :profile="editorProfile"
      :submitting="editorSubmitting"
      :error="editorError"
      @confirm="confirmEditor"
    />

    <ProfilesAccessDeleteDialog
      v-model="deleteOpen"
      :profile="deleteTarget"
      :migration-options="migrationOptions"
      :submitting="deleteSubmitting"
      :error="deleteError"
      @confirm="confirmDelete"
    />
  </VContainer>
</template>

<style scoped>
.si-profile {
  max-width: var(--si-container-wide, 1200px);
}

.si-profile__hero {
  display: flex;
  align-items: flex-start;
  gap: var(--si-space-4);
  margin-block: var(--si-space-4) var(--si-space-4);
  flex-wrap: wrap;
}

.si-profile__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--si-radius-lg);
  background: var(--si-verde-100);
  color: var(--si-verde-800);
  flex-shrink: 0;
}

.si-profile__ident {
  flex: 1;
  min-width: 220px;
}

.si-profile__title-row {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-wrap: wrap;
}

.si-profile__title {
  margin: 0;
  font-size: 24px;
  font-weight: var(--si-font-weight-semibold);
}

.si-profile__desc {
  margin: var(--si-space-2) 0 0;
  color: var(--si-cinza);
  font-size: 13.5px;
  max-width: 620px;
}

.si-profile__hero-actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-profile__fixed-banner {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  background: var(--si-cinza-suave);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  padding: var(--si-space-3) var(--si-space-4);
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
  margin-bottom: var(--si-space-4);
}

.si-profile__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--si-space-4);
  align-items: start;
}

.si-profile__perms {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-profile__area-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--si-space-3) var(--si-space-4);
  background: rgb(var(--v-theme-background));
  border-bottom: 1px solid var(--si-divider);
}

.si-profile__area-name {
  font-size: 11.5px;
  font-weight: var(--si-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--si-cinza);
}

.si-profile__area-count {
  font-size: 12px;
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

.si-profile__perm-list {
  list-style: none;
  margin: 0;
  padding: var(--si-space-3) var(--si-space-4);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--si-space-2);
}

.si-profile__perm {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: 13.5px;
  color: var(--si-border-strong);
}

.si-profile__perm--on {
  color: var(--si-carvao-800);
}

.si-profile__perm-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--si-radius-sm);
  background: var(--si-cinza-suave);
  color: var(--si-border-strong);
  flex-shrink: 0;
}

.si-profile__perm--on .si-profile__perm-box {
  background: var(--si-verde-100);
  color: var(--si-verde-800);
}

.si-profile__side {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-profile__users-card {
  padding: var(--si-space-4);
}

.si-profile__side-title {
  margin: 0 0 var(--si-space-3);
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-profile__user {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-profile__user-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.si-profile__user-name {
  font-size: 13.5px;
  font-weight: var(--si-font-weight-semibold);
}

.si-profile__user-email {
  font-size: 11.5px;
  color: var(--si-border-strong);
}

.si-profile__users-link {
  color: rgb(var(--v-theme-primary));
  font-size: var(--si-fs-small);
  text-decoration: none;
}

.si-profile__users-link:hover {
  text-decoration: underline;
}

.si-profile__side-empty {
  margin: 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-profile__delete :deep(.v-btn) {
  border-color: var(--si-danger-border);
}

.si-profile__delete-note {
  margin: 0;
  font-size: 12px;
  color: var(--si-cinza);
}

.si-profile__delete-note--sep {
  border-top: 1px solid var(--si-divider);
  padding-top: var(--si-space-3);
}

@media (max-width: 1023px) {
  .si-profile__grid {
    grid-template-columns: 1fr;
  }
}
</style>
