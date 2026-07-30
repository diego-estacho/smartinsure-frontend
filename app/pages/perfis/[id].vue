<script setup lang="ts">
import type { GetProfileResponse } from '~/composables/useProfiles'
import { describeRequestError } from '~/lib/errors'
import { getProfileLabel, getProfileScopeView } from '~/lib/status/profiles'

definePageMeta({ layout: 'shell' })

const route = useRoute()
const { getProfile } = useProfiles()

const profile = ref<GetProfileResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const scopeView = computed(() => getProfileScopeView(profile.value?.scope))

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    profile.value = await getProfile(String(route.params.id))
  }
  catch (requestError) {
    error.value = describeRequestError(requestError, 'Não foi possível carregar o perfil de acesso.')
    profile.value = null
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="si-profile-detail">
    <header class="si-profile-detail__hero">
      <VContainer class="si-profile-detail__hero-inner">
        <nav
          class="si-profile-detail__breadcrumb"
          aria-label="Trilha de navegação"
        >
          <NuxtLink to="/perfis">
            Perfis de acesso
          </NuxtLink>
          <span aria-hidden="true">/</span>
          <span>Detalhe</span>
        </nav>

        <div class="si-profile-detail__hero-row">
          <div class="si-profile-detail__identity">
            <div class="si-profile-detail__title">
              <h1 class="text-h5">
                {{ profile ? getProfileLabel(profile.name) : 'Perfil de acesso' }}
              </h1>

              <SiChip
                v-if="profile"
                size="small"
                :color="scopeView.color"
              >
                {{ scopeView.label }}
              </SiChip>
            </div>

            <p
              v-if="profile"
              class="si-profile-detail__facts"
            >
              <span>{{ profile.isFixed ? 'Perfil fixo da plataforma' : 'Perfil customizado' }}</span>
              <span
                aria-hidden="true"
                class="si-profile-detail__facts-separator"
              >·</span>
              <span>Nome técnico: {{ profile.name }}</span>
            </p>
          </div>

          <div class="si-profile-detail__hero-actions">
            <SiButton
              :prepend-icon="'refresh'"
              variant="tonal"
              :loading="loading"
              @click="refresh"
            >
              Atualizar
            </SiButton>
          </div>
        </div>
      </VContainer>
    </header>

    <VContainer class="si-profile-detail__content">
      <SiAlert
        v-if="error"
        type="error"
        class="mb-4"
        :text="error"
      />

      <!-- RN-063: as Permissões vêm do catálogo fixo da plataforma; perfil sem permissão é válido. -->
      <SiCard
        v-if="profile"
        variant="outlined"
      >
        <template #title>
          Permissões
        </template>

        <div class="si-profile-detail__card-body">
          <p
            v-if="!profile.permissions.length"
            class="si-profile-detail__empty"
          >
            Nenhuma permissão marcada. O catálogo de permissões da plataforma ainda não foi
            declarado, então nenhum perfil tem permissão marcada nesta fase.
          </p>

          <SiList v-else>
            <SiListItem
              v-for="permission in profile.permissions"
              :key="permission.id"
              :title="permission.code"
              :subtitle="permission.description ?? undefined"
            />
          </SiList>
        </div>
      </SiCard>
    </VContainer>
  </div>
</template>

<style scoped>
.si-profile-detail__hero {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-profile-detail__hero-inner,
.si-profile-detail__content {
  max-width: var(--si-container-wide);
}

.si-profile-detail__hero-inner {
  padding-block: var(--si-space-4);
}

.si-profile-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  margin-bottom: var(--si-space-3);
}

.si-profile-detail__breadcrumb a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.si-profile-detail__breadcrumb a:hover {
  text-decoration: underline;
}

.si-profile-detail__hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-profile-detail__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-3);
}

.si-profile-detail__title h1 {
  margin: 0;
}

.si-profile-detail__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  margin: var(--si-space-2) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-profile-detail__facts-separator {
  color: var(--si-cinza-claro);
}

.si-profile-detail__hero-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
}

.si-profile-detail__content {
  padding-block: var(--si-space-5);
}

.si-profile-detail__card-body {
  padding: 0 var(--si-space-4) var(--si-space-4);
}

.si-profile-detail__empty {
  margin: 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

@media (max-width: 700px) {
  .si-profile-detail__hero-row {
    flex-direction: column;
    align-items: stretch;
  }

  .si-profile-detail__hero-actions {
    justify-content: stretch;
  }

  .si-profile-detail__hero-actions > :first-child {
    flex: 1;
  }
}
</style>
