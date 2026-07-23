/**
 * Preferências de UI do shell, persistidas no cliente (exec-plan 0014).
 *
 * Hoje guarda só o estado **recolhido** (rail) do menu lateral no desktop, em
 * `localStorage['si-shell-collapsed']` (mesma chave do protótipo). É preferência de UI —
 * não sessão: token/segredo NUNCA vão pro localStorage (ADR-007); estado de UI pode.
 *
 * SSR-safe: o servidor renderiza o default (expandido) e o valor salvo é lido só no
 * cliente, após o mount (`loadCollapsed`), evitando mismatch de hidratação.
 */
const STORAGE_KEY = 'si-shell-collapsed'

export function useShellPreferences() {
  const collapsed = useState<boolean>(STORAGE_KEY, () => false)

  /** Lê a preferência salva. Chamar no `onMounted` do shell (roda só no cliente). */
  function loadCollapsed(): void {
    if (!import.meta.client) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) collapsed.value = saved === '1'
    }
    catch {
      // localStorage indisponível (modo privado / bloqueado) — mantém o default.
    }
  }

  function setCollapsed(value: boolean): void {
    collapsed.value = value
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    }
    catch {
      // Persistência é best-effort — ignora falha de escrita.
    }
  }

  function toggleCollapsed(): void {
    setCollapsed(!collapsed.value)
  }

  return { collapsed, loadCollapsed, setCollapsed, toggleCollapsed }
}
