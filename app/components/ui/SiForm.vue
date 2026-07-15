<script setup lang="ts">
/**
 * SiForm — wrapper de VForm (ADR-013 §6). O "formulário" é composição dos campos `Si`;
 * a validação usa `rules` nativo do Vuetify. v-model = validade; expõe validate/reset.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean | null>()
const formRef = ref()

defineExpose({
  validate: () => formRef.value?.validate(),
  reset: () => formRef.value?.reset(),
  resetValidation: () => formRef.value?.resetValidation(),
})
</script>

<template>
  <v-form ref="formRef" v-bind="$attrs" v-model="model">
    <slot />
  </v-form>
</template>
