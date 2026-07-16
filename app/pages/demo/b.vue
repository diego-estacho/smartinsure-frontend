<script setup lang="ts">
// Página de demonstração — visivelmente diferente da A, para confirmar que a navegação
// troca rota E conteúdo. Rota neutra, sem termo de domínio (OPEN-01 / disciplina do glossário).
import { mdiShieldCheckOutline } from '~/lib/icons'

definePageMeta({ layout: 'shell' })
useHead({ title: 'Página B — SmartInsure' })
</script>

<template>
  <VContainer class="py-8">
    <h1 class="text-h4 mb-2">
      Página B
    </h1>
    <p class="text-body-1 text-medium-emphasis mb-6">
      Conteúdo de demonstração B. Distinto da Página A de propósito — ao alternar os itens
      do menu, tanto a rota quanto o conteúdo desta área mudam.
    </p>
    <SiCard
      :elevation="2"
      variant="outlined"
      class="pa-6"
    >
      <div
        class="d-flex align-center"
        style="gap: var(--si-space-3)"
      >
        <SiIcon
          :icon="mdiShieldCheckOutline"
          color="primary"
          size="28"
        />
        <SiChip
          color="success"
          size="small"
        >
          rota: /demo/b
        </SiChip>
      </div>
    </SiCard>
  </VContainer>
</template>
