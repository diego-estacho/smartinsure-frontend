# ADR-007: Estratégia de sessão — cookie httpOnly, sem localStorage

## Status
Aceito (dono do front)

## Contexto
Token de acesso em `localStorage` é legível por qualquer script na página (XSS) — inaceitável para dado de seguro. O **provedor** de identidade ainda é decisão de produto em aberto (jornada de login), mas a estratégia de armazenamento e de guarda de rota pode ser fixada agora.

## Decisão
- Token **nunca** em `localStorage` — cookie httpOnly com refresh no servidor.
- Guarda de rota em **middleware global**.
- Permissão exibida na UI é cortesia; a garantia é do servidor (SECURITY do produto).

## Consequências
- A superfície de XSS para roubo de token é eliminada.
- O provedor de identidade permanece decisão de produto em aberto — ver [open-decisions.md](../../../smartinsure-backend/docs/product-specs/open-decisions.md).
- Rejeitado: token em `localStorage` (exposto a XSS).
