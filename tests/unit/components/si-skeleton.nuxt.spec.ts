// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SiSkeleton from '~/components/ui/SiSkeleton.vue'

describe('SiSkeleton — placeholder de carregamento (ADR-013)', () => {
  it('renderiza o bloco com largura/altura vindas das props', async () => {
    const w = await mountSuspended(SiSkeleton, { props: { width: '55%', height: '10px' } })
    const el = w.find('.si-skeleton')
    expect(el.exists()).toBe(true)
    const style = el.attributes('style') ?? ''
    expect(style).toContain('width: 55%')
    expect(style).toContain('height: 10px')
  })

  it('circle deixa o raio totalmente arredondado', async () => {
    const w = await mountSuspended(SiSkeleton, { props: { circle: true, width: '40px', height: '40px' } })
    const style = w.find('.si-skeleton').attributes('style') ?? ''
    expect(style).toContain('border-radius: 999px')
  })
})
