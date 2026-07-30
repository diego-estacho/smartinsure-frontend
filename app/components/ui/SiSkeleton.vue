<script setup lang="ts">
/**
 * SiSkeleton — placeholder de carregamento (ADR-013). Bloco com brilho animado (shimmer) que indica
 * conteúdo ainda carregando. Tamanho por props (`width`/`height`), raio configurável e `circle` para
 * avatares. Respeita `prefers-reduced-motion`. Reutilizável em qualquer tela (ex.: fan-out de cotações,
 * listas, cards). Uso: <SiSkeleton width="55%" height="10px" /> ou <SiSkeleton circle width="40px" height="40px" />.
 */
const props = withDefaults(defineProps<{
  width?: string
  height?: string
  radius?: string
  circle?: boolean
}>(), {
  width: '100%',
  height: '1rem',
  radius: 'var(--si-radius-sm)',
  circle: false,
})

const borderRadius = computed(() => (props.circle ? '999px' : props.radius))
</script>

<template>
  <span
    class="si-skeleton"
    :style="{ width, height, borderRadius }"
    aria-hidden="true"
  />
</template>

<style scoped>
.si-skeleton {
  display: block;
  background: linear-gradient(
    100deg,
    rgba(var(--v-theme-on-surface), 0.06) 30%,
    rgba(var(--v-theme-on-surface), 0.12) 50%,
    rgba(var(--v-theme-on-surface), 0.06) 70%
  );
  background-size: 200% 100%;
  animation: si-skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes si-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .si-skeleton {
    animation: none;
  }
}
</style>
