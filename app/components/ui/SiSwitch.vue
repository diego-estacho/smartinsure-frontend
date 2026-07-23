<script setup lang="ts">
/**
 * SiSwitch — wrapper de VSwitch (ADR-013). v-model via defineModel; `label` por $attrs.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean | unknown[] | null>()

withDefaults(defineProps<{
  color?: string
  density?: 'default' | 'comfortable' | 'compact'
  inset?: boolean
}>(), {
  color: 'primary',
  density: 'comfortable',
})
</script>

<template>
  <VSwitch v-bind="$attrs" v-model="model" class="si-switch" :color="color" :density="density" :inset="inset">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VSwitch>
</template>
