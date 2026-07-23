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
      <button
        type="button"
        class="si-pagination__arrow"
        :disabled="page <= 1"
        aria-label="Página anterior"
        @click="goTo(page - 1)"
      >
        <SiIcon icon="chevronLeft" :size="16" />
      </button>

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

      <button
        type="button"
        class="si-pagination__arrow"
        :disabled="page >= pageCount"
        aria-label="Próxima página"
        @click="goTo(page + 1)"
      >
        <SiIcon icon="chevronRight" :size="16" />
      </button>
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

/* Botões numéricos — DS (components/Pagination.jsx): caixa 34px, raio sm, borda hairline,
 * superfície branca, número em tabular-nums; ativo preenchido de verde com texto branco. */
.si-pagination__page,
.si-pagination__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 34px;
  block-size: 34px;
  padding-inline: var(--si-space-2);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-sm);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: var(--si-fs-small);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition:
    background-color var(--si-dur-fast) var(--si-ease-out),
    border-color var(--si-dur-fast) var(--si-ease-out);
}

.si-pagination__page:hover,
.si-pagination__arrow:not(:disabled):hover {
  background: var(--si-cinza-suave);
}

.si-pagination__page--active,
.si-pagination__page--active:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: var(--si-font-weight-semibold);
}

/* Setas: ícone discreto (cinza); desabilitadas nas pontas. */
.si-pagination__arrow {
  color: var(--si-cinza);
}

.si-pagination__arrow:disabled {
  color: var(--si-border-strong);
  cursor: not-allowed;
}

.si-pagination__ellipsis {
  color: var(--si-cinza);
  padding-inline: var(--si-space-1);
}
</style>
