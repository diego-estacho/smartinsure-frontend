<script setup lang="ts">
/**
 * SiPagination — barra de paginação (resumo + itens-por-página + navegação numérica),
 * recuperando o layout validado do InsurePoint (IpPagination) nos tokens do DS.
 * Composição em `ui/` (ADR-013); CSS escopado sob `.si-*` (ADR-015).
 *
 * Standalone e desacoplado da tabela: dirigido por `page` / `itemsPerPage` (v-model) +
 * `total`. Serve tabela server-side (o caso real: 2.313 resultados) ou client-side —
 * o consumidor usa `<SiDataTable hide-default-footer>` e pluga esta barra embaixo.
 */
const page = defineModel<number>('page', { default: 1 })
const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 })

const props = withDefaults(defineProps<{
  total: number
  perPageOptions?: number[]
}>(), {
  perPageOptions: () => [5, 10, 20, 50],
})

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / itemsPerPage.value)))

/** Último item exibido na página atual — "Mostrando {N} de {total}". */
const shownUpTo = computed(() => Math.min(page.value * itemsPerPage.value, props.total))

function goTo(p: number) {
  if (p >= 1 && p <= pageCount.value) page.value = p
}

/** Janela de páginas com reticências: [1, …, atual±1, …, total] (mesma regra do InsurePoint). */
const pages = computed<(number | string)[]>(() => {
  const total = pageCount.value
  const current = page.value
  const delta = 1
  const maxVisible = 2 * delta + 5
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1)

  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)
  const out: (number | string)[] = [1]
  if (left > 2) out.push('…')
  for (let i = left; i <= right; i++) out.push(i)
  if (right < total - 1) out.push('…')
  out.push(total)
  return out
})

// Trocar itens-por-página não pode deixar a página fora do novo total.
watch(itemsPerPage, () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})
</script>

<template>
  <div class="si-pagination d-flex justify-space-between align-center">
    <span class="si-pagination__info">
      Mostrando {{ shownUpTo }} de {{ total }} resultados
    </span>

    <div class="si-pagination__perpage d-flex align-center">
      <VSelect
        v-model="itemsPerPage"
        class="si-pagination__select"
        :items="perPageOptions"
        variant="outlined"
        density="comfortable"
        hide-details
      />
      <span class="si-pagination__perpage-label">Itens por página</span>
    </div>

    <nav class="si-pagination__nav d-flex align-center" aria-label="Paginação">
      <template v-for="(p, idx) in pages" :key="`${p}-${idx}`">
        <button
          v-if="typeof p === 'number'"
          type="button"
          class="si-pagination__page"
          :class="{ 'si-pagination__page--active': page === p }"
          :aria-current="page === p ? 'page' : undefined"
          @click="goTo(p)"
        >
          {{ p }}
        </button>
        <span v-else class="si-pagination__ellipsis">…</span>
      </template>
    </nav>
  </div>
</template>

<style scoped>
/* Classes autorais com prefixo `si-` (ADR-015). */
.si-pagination {
  flex-wrap: wrap;
  gap: var(--si-space-3) var(--si-space-4);
  padding: var(--si-space-3) var(--si-space-4);
  white-space: nowrap;
}

.si-pagination__info,
.si-pagination__perpage-label {
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-pagination__perpage-label {
  margin-inline-start: var(--si-space-2);
}

.si-pagination__select {
  max-inline-size: 96px;
}

.si-pagination__nav {
  gap: var(--si-space-2);
}

.si-pagination__page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 36px;
  block-size: 36px;
  padding-inline: var(--si-space-2);
  border: 1px solid transparent;
  border-radius: var(--si-radius-sm);
  background: transparent;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
  cursor: pointer;
  transition: background-color var(--si-dur-fast) var(--si-ease-out);
}

.si-pagination__page:hover {
  background: var(--si-cinza-suave);
}

.si-pagination__page--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-weight: var(--si-font-weight-semibold);
}

.si-pagination__ellipsis {
  color: var(--si-cinza);
  padding-inline: var(--si-space-1);
}
</style>
