/**
 * Shim de tipos para os ícones Lucide importados por subpath (ADR-021).
 *
 * O barril `lucide-vue-next` declara 1000+ ícones num único .d.ts; carregá-lo inflava o
 * grafo de tipos a ponto de estourar a profundidade do tsc na tipagem de rotas do `$fetch`
 * (TS2321) em composables/plugins não relacionados. Importamos cada ícone por
 * `lucide-vue-next/dist/esm/icons/<nome>` (esses módulos não têm .d.ts próprio) e os tipamos
 * aqui, de forma leve, como `Component` — sem nunca tocar o barril. Ver lib/icons.ts.
 */
declare module 'lucide-vue-next/dist/esm/icons/*' {
  import type { Component } from 'vue'
  const icon: Component
  export default icon
}
