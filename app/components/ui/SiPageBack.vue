<script setup lang="ts">
/**
 * SiPageBack — padrão "voltar" das telas de detalhe do DS: seta discreta + breadcrumb clicável.
 * Reutilizável em qualquer detalhe (ADR-022). A seta volta no histórico (preserva o estado da
 * lista); o link do breadcrumb leva à rota-pai. Escopado sob `.si-page-back*` (ADR-015).
 */
const props = withDefaults(defineProps<{
  to: string
  parentLabel: string
  current?: string
}>(), { current: '' })

const router = useRouter()

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  navigateTo(props.to)
}
</script>

<template>
  <nav
    class="si-page-back"
    aria-label="Trilha de navegação"
  >
    <button
      class="si-page-back__arrow"
      type="button"
      aria-label="Voltar"
      @click="goBack"
    >
      <SiIcon
        icon="arrowLeft"
        :size="18"
      />
    </button>
    <NuxtLink
      :to="to"
      class="si-page-back__parent"
    >
      {{ parentLabel }}
    </NuxtLink>
    <template v-if="current">
      <span
        class="si-page-back__sep"
        aria-hidden="true"
      >/</span>
      <span class="si-page-back__current">{{ current }}</span>
    </template>
  </nav>
</template>

<style scoped>
.si-page-back {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: var(--si-fs-body-2);
  color: var(--si-cinza);
}

.si-page-back__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 28px;
  block-size: 28px;
  border: 0;
  border-radius: var(--si-radius-sm);
  background: transparent;
  color: var(--si-cinza);
  cursor: pointer;
  transition:
    background var(--si-dur-fast) var(--si-ease-out),
    color var(--si-dur-fast) var(--si-ease-out);
}

.si-page-back__arrow:hover {
  background: var(--si-cinza-claro);
  color: rgb(var(--v-theme-on-surface));
}

.si-page-back__arrow:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.si-page-back__parent {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.si-page-back__parent:hover {
  text-decoration: underline;
}

.si-page-back__sep {
  color: var(--si-cinza-claro);
}

.si-page-back__current {
  color: rgb(var(--v-theme-on-surface));
  font-weight: var(--si-font-weight-medium);
}
</style>
