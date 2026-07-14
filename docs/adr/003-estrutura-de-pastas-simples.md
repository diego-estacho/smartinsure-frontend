# ADR-003: Estrutura de pastas simples, espelhando domínios

## Status
Aceito (dono do front)

## Contexto
A estrutura de pastas precisa ser navegável por dev e por agente. Layers aninhadas ou Feature-Sliced Design aumentam o custo de navegação; pior ainda é dois padrões convivendo "temporariamente".

Opções consideradas:
1. Feature-Sliced Design / layers aninhadas.
2. Estrutura simples espelhando os domínios do produto.

## Decisão
Estrutura simples e previsível, espelhando os domínios (`Corretoras`, `Ofertas`, `Emissao`, `Apolices`):

```
pages/            # rotas — nomes do glossário (/ofertas, /apolices)
components/
  ofertas/        # componentes do domínio (OfertaWizard.vue, CotacaoCard.vue)
  ui/             # básicos sem domínio (botão, modal, tabela)
composables/      # useOfertas(), useCotacoes() — acesso a dados por domínio
stores/           # Pinia: estado de UI apenas (ADR-002)
types/gen/        # types GERADOS do contrato OpenAPI — nunca editar à mão (ADR-004)
styles/tokens/    # design tokens (ADR-006)
```

Um domínio novo = o mesmo desenho.

### Direções de dependência permitidas

As arestas de import valem em uma direção só; o conjunto é fechado (o que não está listado é proibido) e será imposto por teste estrutural no scaffold:

- `pages/` → `components/`, `composables/`, `stores/`. É folha: **nada importa de `pages/`**.
- `components/<dominio>/` → `components/ui/`, `composables/`, `stores/`, `types/gen/`, `styles/tokens/`.
- `components/ui/` → `styles/tokens/`, `types/gen/`. **Nunca importa domínio** (componente de domínio, composable ou store) — o que mantém `ui/` reutilizável.
- `composables/` → `server/api/` (BFF, ADR-008) e `types/gen/`. É a camada de acesso a dados; **não importa componente**.
- `stores/` → `types/gen/` para forma de UI. Só estado de UI (ADR-002); **nunca dado de servidor**.
- `server/api/` (Nitro) fala com o backend externo; roda no servidor e **não importa de `components/`, `pages/` ou `stores/`**.
- `types/gen/` e `styles/tokens/` são folhas de importação: são importados, não importam.

## Consequências
- Previsibilidade reduz o custo de navegação do repositório para um agente.
- Sem FSD nem layers aninhadas; sem dois padrões coexistindo.
- Rejeitado: FSD/layers (custo de navegação sem ganho para o tamanho do time).
