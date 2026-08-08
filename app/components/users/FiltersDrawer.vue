<script setup lang="ts">
/**
 * Drawer "Filtros avançados" da Listagem de Usuários (§4) — filtros secundários sem poluir a tela.
 * Mantém um rascunho local; "Aplicar filtros" aplica e fecha. Vira bottom sheet no mobile.
 * Nenhum campo repete o que a busca já cobre (nome/e-mail/perfil).
 *
 * NOTA (fatia): "Último acesso" é dado da Fatia E — entra aqui junto com a coluna.
 */
import { profileScopes } from '~/lib/status/profiles'

export type UsersFilters = {
  profileId: string | null
  scope: string | null
  linkId: string | null
  registeredFrom: string | null
  registeredTo: string | null
}

const props = defineProps<{
  modelValue: boolean
  filters: UsersFilters
  /** Perfis presentes na base (título + id). */
  profiles: { title: string, value: string }[]
  /** Vínculos (Corretoras) presentes na base (título + id). */
  links: { title: string, value: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  'apply': [filters: UsersFilters]
  'clear': []
}>()

const { isMobile } = useIsMobile()

const scopeOptions = [
  { title: 'Todos os escopos', value: null },
  { title: 'Sistema', value: profileScopes.system },
  { title: 'Corretora', value: profileScopes.brokerage },
  { title: 'Tomador', value: profileScopes.policyHolder },
]

const draft = ref<UsersFilters>({ ...props.filters })

// Ressincroniza o rascunho a cada abertura e liga o Esc-para-fechar enquanto aberto (a11y —
// o VNavigationDrawer não trata Esc nativamente como o VDialog).
watch(() => props.modelValue, (open) => {
  if (open) {
    draft.value = { ...props.filters }
  }
  if (!import.meta.client) {
    return
  }
  if (open) {
    window.addEventListener('keydown', onKeydown)
  }
  else {
    window.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
  }
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

function close() {
  emit('update:modelValue', false)
}

function apply() {
  emit('apply', { ...draft.value })
  close()
}

function clear() {
  emit('clear')
  close()
}
</script>

<template>
  <SiNavigationDrawer
    :model-value="modelValue"
    :location="isMobile ? 'bottom' : 'right'"
    temporary
    :width="isMobile ? undefined : 400"
    :height="isMobile ? 'auto' : undefined"
    :class="['si-users-filters', { 'si-users-filters--sheet': isMobile }]"
    @update:model-value="(v) => emit('update:modelValue', Boolean(v))"
  >
    <div class="si-users-filters__header">
      <h2 class="text-subtitle-1">
        Filtros avançados
      </h2>
      <SiIconButton
        icon="close"
        aria-label="Fechar filtros"
        @click="close"
      />
    </div>

    <div class="si-users-filters__body">
      <div class="si-users-filters__group">
        <span class="si-users-filters__group-label">Perfil de acesso</span>
        <SiSelect
          v-model="draft.profileId"
          :items="[{ title: 'Todos os perfis', value: null }, ...props.profiles]"
          density="compact"
        />
      </div>

      <div class="si-users-filters__group">
        <span class="si-users-filters__group-label">Escopo</span>
        <SiSelect
          v-model="draft.scope"
          :items="scopeOptions"
          density="compact"
        />
      </div>

      <div class="si-users-filters__group">
        <span class="si-users-filters__group-label">Vínculo</span>
        <SiSelect
          v-model="draft.linkId"
          :items="[{ title: 'Todos os vínculos', value: null }, ...props.links]"
          density="compact"
        />
      </div>

      <div class="si-users-filters__group">
        <span class="si-users-filters__group-label">Data de cadastro</span>
        <div class="si-users-filters__range-fields">
          <SiDateField
            v-model="draft.registeredFrom"
            label="De"
            density="compact"
            clearable
          />
          <SiDateField
            v-model="draft.registeredTo"
            label="Até"
            density="compact"
            clearable
          />
        </div>
      </div>

      <p class="si-users-filters__note">
        Para achar por nome, e-mail ou perfil, use o campo de busca da listagem — ela procura por esses três.
      </p>
    </div>

    <div class="si-users-filters__footer">
      <SiButton
        variant="outlined"
        color="secondary"
        class="si-users-filters__clear"
        @click="clear"
      >
        Limpar
      </SiButton>
      <SiButton
        class="si-users-filters__apply"
        @click="apply"
      >
        Aplicar filtros
      </SiButton>
    </div>
  </SiNavigationDrawer>
</template>

<style scoped>
.si-users-filters__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--si-space-5) var(--si-space-5) var(--si-space-3);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-users-filters__header h2 {
  margin: 0;
}

.si-users-filters__body {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-4);
  padding: var(--si-space-5);
  overflow-y: auto;
}

.si-users-filters__group-label {
  display: block;
  margin-bottom: var(--si-space-2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-users-filters__range-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-3);
}

.si-users-filters__note {
  margin: 0;
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}

.si-users-filters__footer {
  display: flex;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
  border-top: 1px solid var(--si-cinza-claro);
  margin-top: auto;
}

.si-users-filters__clear {
  flex: 1;
}

.si-users-filters__apply {
  flex: 1;
}

.si-users-filters--sheet {
  border-radius: var(--si-radius-lg) var(--si-radius-lg) 0 0;
  max-height: 85dvh;
}

.si-users-filters--sheet :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}
</style>
