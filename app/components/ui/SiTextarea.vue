<script setup lang="ts">
/**
 * SiTextarea — wrapper de VTextarea (ADR-013). Mesmo padrão do SiTextField (rótulo estático
 * acima via SiFieldShell; o `label` não vai ao VTextarea).
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<string | null>()

withDefaults(defineProps<{
  label?: string
  required?: boolean
  variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  autoGrow?: boolean
  rows?: number | string
}>(), {
  label: undefined,
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
  rows: 3,
})
</script>

<template>
  <SiFieldShell
    :label="label"
    :required="required"
  >
    <template #default="{ fieldId }">
      <VTextarea
        v-bind="$attrs"
        :id="($attrs.id as string | undefined) ?? fieldId"
        v-model="model"
        class="si-field"
        :variant="variant"
        :density="density"
        :color="color"
        :auto-grow="autoGrow"
        :rows="rows"
      >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </VTextarea>
    </template>
  </SiFieldShell>
</template>
