<script setup lang="ts">
/**
 * SiInsurerLogo — tile branco com o logo da Seguradora, ou o monograma de 2 iniciais quando não há logo
 * (ou a URL falha ao carregar). O fallback @error é por instância. Reúne o que estava repetido no leque
 * de cotações (tabela, cards, skeletons e indisponíveis).
 * Uso: <SiInsurerLogo :name="q.name" :logo-url="q.logoUrl" :size="40" />
 */
import { initials } from '~/lib/format'

const props = withDefaults(defineProps<{
  name: string
  logoUrl?: string | null
  size?: number
}>(), {
  logoUrl: null,
  size: 30,
})

const failed = ref(false)

// Reseta o fallback quando a URL muda (mesma instância reaproveitada numa lista reordenada).
watch(() => props.logoUrl, () => { failed.value = false })

const showLogo = computed(() => Boolean(props.logoUrl) && !failed.value)

// Monograma: reusa o `initials` compartilhado; cai nas 2 primeiras letras quando não há palavras.
const monogram = computed(() => initials(props.name) || props.name.slice(0, 2).toUpperCase())

const sizeStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
</script>

<template>
  <span
    class="si-insurer-logo"
    :style="sizeStyle"
  >
    <img
      v-if="showLogo"
      :src="logoUrl!"
      :alt="name"
      class="si-insurer-logo__img"
      loading="lazy"
      @error="failed = true"
    >
    <template v-else>{{ monogram }}</template>
  </span>
</template>

<style scoped>
.si-insurer-logo {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--si-radius-sm);
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--si-cinza-claro);
  padding: 3px;
  overflow: hidden;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 10px;
  font-weight: var(--si-font-weight-bold);
}

.si-insurer-logo__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
