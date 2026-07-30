<script setup lang="ts">
/**
 * Painel de marca das telas sem sessão (login RN-005 e primeiro acesso RN-065).
 * Apresentacional: só marca e mensagem — nenhuma decisão. Nasceu extraído do `pages/login.vue`
 * quando a segunda tela sem sessão apareceu, para o visual não ser copiado em dois lugares
 * (ADR-022: componente que falta entra no kit/compartilhado, nunca como acabamento na página).
 * Cores e espaços só por token (ADR-006); classes sob `si-*` (ADR-015).
 */
withDefaults(defineProps<{
  title?: string
  subtitle?: string
}>(), {
  title: 'Seguro garantia, do jeito que o corretor precisa.',
  subtitle: 'Cotação multi-seguradora, emissão e gestão de apólices numa só plataforma.',
})
</script>

<template>
  <aside class="si-brand-panel">
    <div class="si-brand-panel__brand">
      <img
        src="/brand/symbol.png"
        alt="SmartInsure"
        class="si-brand-panel__symbol"
        width="44"
        height="44"
      >
      <span class="si-brand-panel__wordmark">
        <span class="si-brand-panel__wordmark-smart">smart</span><span class="si-brand-panel__wordmark-insure">insure</span>
      </span>
    </div>

    <div class="si-brand-panel__content">
      <h2 class="si-brand-panel__title">
        {{ title }}
      </h2>
      <p class="si-brand-panel__subtitle">
        {{ subtitle }}
      </p>
    </div>

    <p class="si-brand-panel__footer">
      © SmartInsure
    </p>
  </aside>
</template>

<style scoped>
.si-brand-panel {
  position: relative;
  flex: 0 0 44%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--si-space-12) var(--si-space-10);
  overflow: hidden;
  color: rgb(var(--v-theme-on-charcoal));
  background:
    radial-gradient(120% 90% at 85% 8%, rgba(var(--v-theme-primary), 0.22), transparent 55%),
    radial-gradient(80% 70% at 10% 100%, rgba(var(--v-theme-primary), 0.10), transparent 60%),
    rgb(var(--v-theme-charcoal));
}

/* Marca-d'água sutil do símbolo no canto (identidade da marca). */
.si-brand-panel::after {
  content: '';
  position: absolute;
  right: -120px;
  bottom: -120px;
  width: 420px;
  height: 420px;
  background: url('/brand/symbol.png') no-repeat center / contain;
  opacity: 0.05;
  pointer-events: none;
}

.si-brand-panel > * {
  position: relative;
  z-index: 1;
}

.si-brand-panel__brand {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-brand-panel__symbol {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.si-brand-panel__wordmark {
  font-weight: var(--si-font-weight-semibold);
  font-size: var(--si-fs-h3);
  letter-spacing: var(--si-ls-h2);
}

.si-brand-panel__wordmark-smart {
  color: rgb(var(--v-theme-primary));
}

.si-brand-panel__wordmark-insure {
  color: rgb(var(--v-theme-on-charcoal));
}

.si-brand-panel__content {
  max-width: 460px;
}

.si-brand-panel__title {
  font-size: var(--si-fs-h1);
  line-height: var(--si-lh-h1);
  letter-spacing: var(--si-ls-h1);
  font-weight: var(--si-font-weight-semibold);
  margin-bottom: var(--si-space-5);
}

.si-brand-panel__subtitle {
  font-size: var(--si-fs-h4);
  line-height: var(--si-lh-h4);
  color: rgba(var(--v-theme-on-charcoal), 0.7);
  margin-bottom: 0;
}

.si-brand-panel__footer {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-charcoal), 0.45);
  margin-bottom: 0;
}

/* Responsivo: o painel de marca some no mobile (igual ao QA). */
@media (max-width: 960px) {
  .si-brand-panel {
    display: none;
  }
}
</style>
