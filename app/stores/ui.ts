/**
 * Estado de UI apenas (ADR-002). Pinia NÃO guarda dado de servidor — isso vem por
 * composable. Store de exemplo que estabelece o padrão; sem termo de domínio.
 *
 * `defineStore` e `ref` são auto-importados (Nuxt + @pinia/nuxt) — não importar à mão.
 */
export const useUiStore = defineStore('ui', () => {
  const sidebarAberta = ref(false)

  function alternarSidebar() {
    sidebarAberta.value = !sidebarAberta.value
  }

  return { sidebarAberta, alternarSidebar }
})
