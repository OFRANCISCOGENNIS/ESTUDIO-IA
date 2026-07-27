import { describe, expect, it } from 'vitest'
import { criarForma, criarTexto } from './elementos'
import { coresDoDesign, luminancia, mapaParaTema, recolorirDesign } from './recolorir'
import { Elemento } from '../tipos/projeto'

describe('recolorir', () => {
  it('extrai a paleta do design ignorando transparentes, ordenada por luminância', () => {
    const elementos: Elemento[] = [
      criarForma('retangulo', 0, 0, { preenchimento: '#000000', corBorda: '#00000000' }),
      criarTexto(0, 0, { cor: '#ffffff' }),
      criarForma('elipse', 0, 0, { preenchimento: '#ff0000', corBorda: 'transparent' }),
    ]
    const cores = coresDoDesign(elementos, '#808080')
    // Transparentes (#00000000, transparent) ficam de fora
    expect(cores).not.toContain('#00000000')
    expect(cores).not.toContain('transparent')
    expect(cores).toContain('#000000')
    expect(cores).toContain('#ffffff')
    // Ordenada da mais escura para a mais clara
    expect(cores[0]).toBe('#000000')
    expect(cores[cores.length - 1]).toBe('#ffffff')
  })

  it('mapeia preto→escuro e branco→claro do tema', () => {
    const mapa = mapaParaTema(['#000000', '#ffffff'], ['#111111', '#eeeeee'])
    expect(luminancia(mapa['#000000'])).toBeLessThan(luminancia(mapa['#ffffff']))
    expect(mapa['#000000']).toBe('#111111')
    expect(mapa['#ffffff']).toBe('#eeeeee')
  })

  it('recolore um design inteiro preservando transparência', () => {
    const elementos: Elemento[] = [
      criarForma('retangulo', 0, 0, { preenchimento: '#000000', corBorda: '#00000000' }),
      criarTexto(0, 0, { cor: '#ffffff' }),
    ]
    const r = recolorirDesign(elementos, '#000000', ['#0a0a0a', '#f5f5f5'])
    const forma = r.elementos[0] as Extract<Elemento, { tipo: 'retangulo' }>
    const texto = r.elementos[1] as Extract<Elemento, { tipo: 'texto' }>
    expect(forma.preenchimento).toBe('#0a0a0a')
    expect(forma.corBorda).toBe('#00000000') // transparente intacto
    expect(texto.cor).toBe('#f5f5f5')
    expect(r.corFundo).toBe('#0a0a0a')
  })

  it('lida com tema vazio sem quebrar (mapa vazio = design intacto)', () => {
    const elementos: Elemento[] = [criarForma('retangulo', 0, 0, { preenchimento: '#123456' })]
    const r = recolorirDesign(elementos, '#ffffff', [])
    const forma = r.elementos[0] as Extract<Elemento, { tipo: 'retangulo' }>
    expect(forma.preenchimento).toBe('#123456')
    expect(r.corFundo).toBe('#ffffff')
  })
})
