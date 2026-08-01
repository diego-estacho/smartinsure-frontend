// Setup global dos testes unitários/componente (ADR-005) — roda antes de cada arquivo, em
// qualquer ambiente (happy-dom padrão, ou `nuxt` por arquivo via `// @vitest-environment nuxt`).

// O VOverlay do Vuetify (base do SiDialog) lê o global `visualViewport` ao abrir para recalcular
// posição; a referência é direta (não via `window.`), então em ambiente sem esse global (happy-dom)
// vira ReferenceError antes mesmo de montar. Sem isso, qualquer teste que abra um SiDialog quebra —
// polyfill único aqui em vez de repetido em cada spec que monta um SiDialog.
if (typeof globalThis.visualViewport === 'undefined') {
  (globalThis as unknown as { visualViewport?: VisualViewport }).visualViewport = undefined
}
