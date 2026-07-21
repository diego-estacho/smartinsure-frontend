<template>
  <!--
    Barra de carregamento de rota (feedback de navegação). Várias páginas suspendem a
    navegação com `await` no topo do <script setup> (ex.: /corretoras busca dados antes de
    renderizar) — sem sinal, a tela anterior fica congelada até o dado chegar. O
    <NuxtLoadingIndicator> mostra o progresso no topo durante toda a transição (inclui o
    tempo do Suspense). Cor pela marca via token (ADR-006); sem hex. Exec-plan 0011.
  -->
  <NuxtLoadingIndicator color="rgb(var(--v-theme-primary))" />
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>
