# ADR-018: Página fina + componentes de domínio

## Status
Aceito (ratificado pelo time, 2026-07-20).

## Contexto
O ADR-003 define as **pastas** (`pages/`, `components/<domínio>/`, `components/ui/`, `composables/`), mas não a **regra de responsabilidade**. Na prática o `corretoras/index.vue` acumulou tabela + filtro por situação + dialog de mudança de situação + estado de tela + orquestração de dados num único arquivo (~310 linhas) — difícil de ler, manter e testar, e ruim para navegação por IA. Precisamos de arquitetura **mínima e escalável**, sem criar complexidade especulativa.

## Decisão

1. **Página = orquestradora fina.** A página (`pages/**`) declara o layout (`definePageMeta`), instancia o composable de dados, mantém o estado de tela e **compõe** componentes. Ela não contém markup denso de tabela/dialog/formulário.

2. **Uma responsabilidade = um componente de domínio.** Cada bloco visual/interativo distinto vira um componente em `components/<domínio-inglês>/` (ex.: `components/brokerages/`), nome técnico em inglês (ADR-058). O auto-import do Nuxt compõe pasta + arquivo: `components/brokerages/Table.vue` → `<BrokeragesTable>`.

3. **Compor o kit `Si`, nunca Vuetify tematizável direto** (ADR-013). Componentes de domínio são montados a partir dos `Si*`.

4. **Contrato explícito: props (entrada) + emits (saída).** O componente de apresentação é "burro" por padrão: recebe dados por prop e comunica intenção por emit. Regra de negócio, chamada de dados e navegação de fluxo ficam na página/composable.

5. **Dado de servidor só por composable** (ADR-002/ADR-004). Componente não busca dado sozinho — recebe por prop; isso o mantém testável e desacoplado da fonte.

6. **Arquitetura mínima.** Extrai-se quando há responsabilidade distinta e reuso/tamanho justificam — não se cria camada/abstração antecipada. O objetivo é código limpo e escalável, não indireção.

## Consequências
- `corretoras/index.vue` é refatorado como **referência**: `BrokeragesTable`, `BrokeragesStatusFilter`, `BrokeragesStatusChangeDialog`; a página só orquestra estado + composable.
- Teste por componente fica simples (props → render; ação → emit), facilitando o gate de 80% (ADR-005).
- Arquivos pequenos e de responsabilidade única melhoram a navegação por IA e a manutenção.
- A variação responsiva (ADR-017) mora no componente (ex.: `BrokeragesTable` decide tabela vs cards).
- Consome ADR-003 (pastas), ADR-013 (kit `Si`), ADR-002/004 (dados por composable), ADR-058 (idioma).
- Rejeitado: página-monólito; componente que busca os próprios dados (acopla à fonte, dificulta teste); abstração especulativa "para o futuro".
