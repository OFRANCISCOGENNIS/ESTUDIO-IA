// =============================================================
// Testes do módulo puro de filtros/ajustes de imagem.
// Ambiente node — não exercita os filtros de pixel (dependem de
// ImageData/canvas), apenas a lógica de resolução e o catálogo.
// =============================================================

import { describe, it, expect } from 'vitest'
import { FILTROS, resolverAjustes, temEfeito, raioDesfoque } from './filtros'
import { AJUSTES_NEUTROS } from '../tipos/projeto'

describe('filtros', () => {
  it('oferece pelo menos 20 filtros predefinidos, incluindo "nenhum"', () => {
    expect(FILTROS.length).toBeGreaterThanOrEqual(21)
    expect(FILTROS[0].id).toBe('nenhum')
    // Ids únicos
    const ids = new Set(FILTROS.map((f) => f.id))
    expect(ids.size).toBe(FILTROS.length)
  })

  it('filtro "nenhum" sem ajustes manuais resulta em ajustes neutros', () => {
    const r = resolverAjustes('nenhum', 1, { ...AJUSTES_NEUTROS })
    expect(r).toEqual(AJUSTES_NEUTROS)
  })

  it('escala o preset pela intensidade', () => {
    const cheio = resolverAjustes('clarendon', 1, { ...AJUSTES_NEUTROS })
    const meio = resolverAjustes('clarendon', 0.5, { ...AJUSTES_NEUTROS })
    expect(meio.contraste).toBeCloseTo(cheio.contraste / 2)
    expect(meio.saturacao).toBeCloseTo(cheio.saturacao / 2)
  })

  it('soma os ajustes manuais ao preset', () => {
    const r = resolverAjustes('nenhum', 1, { ...AJUSTES_NEUTROS, brilho: 30 })
    expect(r.brilho).toBe(30)
  })

  it('respeita os limites (clamp) de cada ajuste', () => {
    const r = resolverAjustes('clarendon', 1, { ...AJUSTES_NEUTROS, saturacao: 100 })
    // saturacao do preset (35) + 100 seria 135, mas o limite é 100
    expect(r.saturacao).toBe(100)
    const frio = resolverAjustes('frio', 1, { ...AJUSTES_NEUTROS, temperatura: -100 })
    expect(frio.temperatura).toBe(-100)
  })

  it('temEfeito distingue ajustes neutros de ativos', () => {
    expect(temEfeito({ ...AJUSTES_NEUTROS })).toBe(false)
    expect(temEfeito({ ...AJUSTES_NEUTROS, vinheta: 10 })).toBe(true)
  })

  it('raioDesfoque converte 0..100 em pixels de blur', () => {
    expect(raioDesfoque(0)).toBe(0)
    expect(raioDesfoque(100)).toBe(40)
    expect(raioDesfoque(50)).toBe(20)
  })
})
