import { describe, it, expect } from 'vitest'
import { coresBase, temaClaro } from '../../app/assets/styles/tokens/tokens'

// ADR-006: os design tokens são a fonte única visual. Este teste trava a paleta base.
describe('design tokens (ADR-006)', () => {
  it('expõe a paleta base completa em hex para o tema Vuetify', () => {
    const obrigatorias = [
      'primary', 'secondary', 'accent', 'surface', 'background',
      'info', 'success', 'warning', 'error',
    ] as const
    for (const nome of obrigatorias) {
      expect(coresBase[nome], `cor '${nome}'`).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('monta o tema claro a partir das cores base', () => {
    expect(temaClaro.dark).toBe(false)
    expect(temaClaro.colors.primary).toBe(coresBase.primary)
  })
})
