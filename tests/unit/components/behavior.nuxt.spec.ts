// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { required } from '~/lib/rules'

import SiButton from '~/components/ui/SiButton.vue'
import SiTextField from '~/components/ui/SiTextField.vue'
import SiCurrencyField from '~/components/ui/SiCurrencyField.vue'
import SiForm from '~/components/ui/SiForm.vue'

describe('SiButton — curado + passthrough (ADR-013)', () => {
  it('aplica defaults do DS: primary, rounded-md, variante flat', async () => {
    const w = await mountSuspended(SiButton, { slots: { default: () => 'Salvar' } })
    const btn = w.find('.v-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('bg-primary')
    expect(btn.classes()).toContain('rounded-md')
    expect(btn.classes()).toContain('v-btn--variant-flat')
    expect(w.text()).toContain('Salvar')
  })

  it('cor curada sobrescreve o default', async () => {
    const w = await mountSuspended(SiButton, { props: { color: 'error' }, slots: { default: () => 'X' } })
    expect(w.find('.v-btn').classes()).toContain('bg-error')
  })

  it('passthrough: atributos não-declarados vão pro VBtn (disabled)', async () => {
    const w = await mountSuspended(SiButton, { attrs: { disabled: true }, slots: { default: () => 'X' } })
    expect(w.find('.v-btn').classes()).toContain('v-btn--disabled')
  })
})

describe('SiTextField — v-model', () => {
  it('emite update:modelValue ao digitar', async () => {
    const w = await mountSuspended(SiTextField, { props: { modelValue: '' } })
    await w.find('input').setValue('corretor')
    const emitted = w.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted?.at(-1)).toEqual(['corretor'])
  })
})

describe('SiCurrencyField — BRL', () => {
  it('formata o número em BRL no input (R$ 1.240,50)', async () => {
    const w = await mountSuspended(SiCurrencyField, { props: { modelValue: 1240.5 } })
    const value = (w.find('input').element as HTMLInputElement).value
    expect(value).toContain('1.240,50')
    expect(value).toContain('R$')
  })
})

describe('SiForm — validação nativa', () => {
  it('validate() reprova quando um campo obrigatório está vazio', async () => {
    const w = await mountSuspended(SiForm, {
      slots: {
        default: () => h(SiTextField, { modelValue: '', rules: [required()] }),
      },
    })
    const exposed = (w.vm.$ as unknown as { exposed: { validate: () => Promise<{ valid: boolean }> } }).exposed
    const result = await exposed.validate()
    expect(result.valid).toBe(false)
  })
})
