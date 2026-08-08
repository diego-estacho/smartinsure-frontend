<script setup lang="ts">
import type { GetUserResponse } from '~/composables/useUsers'
import { toBrDateTime } from '~/lib/dates'
import { formatCnpj } from '~/lib/documents'
import { extractApiErrorMessage } from '~/lib/apiError'
import { getProfileLabel } from '~/lib/status/profiles'
import { getUserStatusView } from '~/lib/status/users'

definePageMeta({ layout: 'shell' })

const route = useRoute()
const { getUser } = useUsers()

const user = ref<GetUserResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const statusView = computed(() => getUserStatusView(user.value?.status))

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
</script>

<template>
  <div class="si-user-detail">
    <header class="si-user-detail__hero">
      <VContainer class="si-user-detail__hero-inner">
        <nav
          class="si-user-detail__breadcrumb"
          aria-label="Trilha de navegação"
        >
          <NuxtLink to="/usuarios">
            Usuários
          </NuxtLink>
          <span aria-hidden="true">/</span>
          <span>Detalhe</span>
        </nav>

        <div class="si-user-detail__hero-row">
          <div class="si-user-detail__identity">
            <div class="si-user-detail__title">
              <h1 class="text-h5">
                {{ user?.name ?? 'Usuário' }}
              </h1>

              <SiChip
                v-if="user"
                size="small"
                :color="statusView.color"
              >
                {{ statusView.label }}
              </SiChip>
            </div>

            <p
              v-if="user"
              class="si-user-detail__facts"
            >
              <span>{{ user.email }}</span>
              <span
                aria-hidden="true"
                class="si-user-detail__facts-separator"
              >·</span>
              <span>Cadastro em {{ toBrDateTime(user.createdAt) }}</span>
            </p>
          </div>

          <div class="si-user-detail__hero-actions">
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

    <VContainer class="si-user-detail__content">
      <SiAlert
        v-if="error"
        type="error"
        class="mb-4"
        :text="error"
      />

      <template v-if="user">
        <!-- RN-012: Perfil de Escopo Sistema; sem Perfil = usuário comum. -->
        <SiCard
          variant="outlined"
          class="si-user-detail__card"
        >
          <template #title>
            Perfil do sistema
          </template>

          <div class="si-user-detail__card-body">
            <p
              v-if="!user.profileName"
              class="si-user-detail__empty"
            >
              Sem perfil de sistema — usuário comum.
            </p>

            <NuxtLink
              v-else-if="user.profileId"
              :to="`/perfis-acesso/${user.profileId}`"
              class="si-user-detail__profile-link"
            >
              {{ getProfileLabel(user.profileName) }}
            </NuxtLink>

            <span v-else>{{ getProfileLabel(user.profileName) }}</span>
          </div>
        </SiCard>

        <!-- RN-064: vínculos do Usuário com Corretoras e Tomadores, cada um com seu Perfil. -->
        <SiCard
          variant="outlined"
          class="si-user-detail__card"
        >
          <template #title>
            Corretoras vinculadas
          </template>

          <div class="si-user-detail__card-body">
            <p
              v-if="!user.brokerageMemberships.length"
              class="si-user-detail__empty"
            >
              Nenhuma corretora vinculada.
            </p>

            <SiList v-else>
              <SiListItem
                v-for="membership in user.brokerageMemberships"
                :key="membership.id"
                :title="membership.scopeName"
                :subtitle="`${formatCnpj(membership.scopeDocumentNumber)} · ${getProfileLabel(membership.profileName)}`"
              />
            </SiList>
          </div>
        </SiCard>

        <SiCard
          variant="outlined"
          class="si-user-detail__card"
        >
          <template #title>
            Tomadores vinculados
          </template>

          <div class="si-user-detail__card-body">
            <p
              v-if="!user.policyHolderMemberships.length"
              class="si-user-detail__empty"
            >
              Nenhum tomador vinculado.
            </p>

            <SiList v-else>
              <SiListItem
                v-for="membership in user.policyHolderMemberships"
                :key="membership.id"
                :title="membership.scopeName"
                :subtitle="`${formatCnpj(membership.scopeDocumentNumber)} · ${getProfileLabel(membership.profileName)}`"
              />
            </SiList>
          </div>
        </SiCard>
      </template>
    </VContainer>
  </div>
</template>

<style scoped>
/* Faixa de contexto: fundo de superfície + hairline inferior (padrão do detalhe de Tomador). */
.si-user-detail__hero {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-user-detail__hero-inner,
.si-user-detail__content {
  max-width: var(--si-container-wide);
}

.si-user-detail__hero-inner {
  padding-block: var(--si-space-4);
}

.si-user-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  margin-bottom: var(--si-space-3);
}

.si-user-detail__breadcrumb a,
.si-user-detail__profile-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.si-user-detail__breadcrumb a:hover,
.si-user-detail__profile-link:hover {
  text-decoration: underline;
}

.si-user-detail__hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-user-detail__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-3);
}

.si-user-detail__title h1 {
  margin: 0;
}

.si-user-detail__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  margin: var(--si-space-2) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-user-detail__facts-separator {
  color: var(--si-cinza-claro);
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

.si-user-detail__card + .si-user-detail__card {
  margin-top: var(--si-space-4);
}

.si-user-detail__card-body {
  padding: 0 var(--si-space-4) var(--si-space-4);
}

.si-user-detail__empty {
  margin: 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

@media (max-width: 700px) {
  .si-user-detail__hero-row {
    flex-direction: column;
    align-items: stretch;
  }

  .si-user-detail__hero-actions {
    justify-content: stretch;
  }

  .si-user-detail__hero-actions > :first-child {
    flex: 1;
  }
}
</style>
