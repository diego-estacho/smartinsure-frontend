/**
 * Detecta o modo mobile do shell pelo breakpoint único do Design System (< 1024px), via
 * `matchMedia('(max-width: 1023px)')` — o mesmo mecanismo do protótipo (exec-plan 0014).
 *
 * Por que não `useDisplay()` do Vuetify aqui: no SSR deste projeto (vuetify-nuxt-module), a
 * largura do `useDisplay` vem de client-hints e não reconcilia com o viewport real — o menu
 * caía em modo mobile mesmo no desktop. O matchMedia lê o viewport de fato, sem ambiguidade.
 *
 * SSR-safe: o servidor renderiza desktop (default `false`); o cliente reconcilia no `onMounted`
 * e passa a acompanhar o breakpoint via listener de `change`.
 */
export function useIsMobile() {
  const isMobile = useState<boolean>('si-shell-is-mobile', () => false)

  let mql: MediaQueryList | null = null
  function onChange(event: MediaQueryListEvent | MediaQueryList) {
    isMobile.value = event.matches
  }

  onMounted(() => {
    mql = window.matchMedia('(max-width: 1023px)')
    isMobile.value = mql.matches
    mql.addEventListener('change', onChange)
  })
  onBeforeUnmount(() => {
    mql?.removeEventListener('change', onChange)
  })

  return { isMobile }
}
