# ADR-004: Consumo do contrato — status por nome estável, dados por composable

## Status
Aceito (dono do front)

## Contexto
O contrato OpenAPI e a geração de types (proibido escrever type de API à mão; o CI falha em drift) já são decididos na camada de produto (ADR-001 do produto). Falta a política de **consumo** no front: como renderizar status e como acessar dados.

Status renderizado por posição ordinal do enum quebra silenciosamente quando o backend reordena ou insere um valor.

Opções consideradas (renderização de status):
1. Por posição ordinal do enum.
2. Por nome estável vindo do contrato, com mapa `nome→label/cor` por domínio.

## Decisão
- Status renderizado pelo **nome estável** do contrato; a tradução `nome→label/cor` vive num único mapa por domínio (`components/<dominio>/status.ts`). Nunca por posição ordinal.
- Chamada à API **só por composable de domínio** — componente nunca faz fetch direto.
- Types de API sempre gerados do contrato (ADR-001 do produto); nenhum type de API escrito à mão.

## Consequências
- Reordenar ou inserir valor no enum do backend não quebra a UI.
- Um único ponto de tradução de status por domínio.
- Rejeitado: status por posição ordinal (frágil a mudança de contrato).
