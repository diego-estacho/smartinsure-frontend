/**
 * Estado de UI apenas (ADR-002). Pinia NÃO guarda dado de servidor — isso vem por
 * composable. Store de exemplo que estabelece o padrão; sem termo de domínio.
 *
 * `defineStore` e `ref` são auto-importados (Nuxt + @pinia/nuxt) — não importar à mão.
 */
export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  return { sidebarOpen, toggleSidebar }
})
