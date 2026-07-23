<script setup lang="ts">
/**
 * SiFieldShell — moldura de campo do DS (TextField.jsx §rótulo·campo·dica). O DS mostra o
 * rótulo ESTÁTICO ACIMA da caixa (12px semibold), não o rótulo flutuante do Vuetify que sobe
 * ao focar. Esta moldura desenha esse rótulo e expõe um `id` estável para associá-lo (via
 * `for`) ao input do controle Vuetify no slot — que, por sua vez, NÃO recebe mais `label`
 * (usa `placeholder` por dentro). Usada por SiTextField/Select/Textarea/Currency/Doc/DateField.
 *
 * Estado desabilitado: o Vuetify esmaece o próprio controle; aqui esmaecemos só o rótulo
 * quando o controle está desabilitado (detectado por `:has(.v-input--disabled)` no skin/estilo).
 */
defineProps<{
  label?: string
  required?: boolean
}>()

// id estável no SSR (Nuxt) para casar <label for> ↔ input do controle.
const fieldId = useId()
</script>

<template>
  <div class="si-field-shell">
    <label
      v-if="label"
      :for="fieldId"
      class="si-field-shell__label"
    >
      {{ label }}<span
        v-if="required"
        class="si-field-shell__req"
        aria-hidden="true"
      >*</span>
    </label>

    <slot v-bind="{ fieldId }" />
  </div>
</template>

<style scoped>
.si-field-shell {
  display: block;
}

.si-field-shell__label {
  display: block;
  margin-block-end: var(--si-space-2);
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
}

.si-field-shell__req {
  margin-inline-start: 2px;
  color: rgb(var(--v-theme-error));
}

/* Desabilitado: o Vuetify esmaece o controle; acompanhamos o rótulo (DS: opacity .5). */
.si-field-shell:has(.v-input--disabled) .si-field-shell__label {
  opacity: 0.5;
}
</style>
