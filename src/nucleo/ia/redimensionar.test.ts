// =============================================================
// Testes do redimensionamento mágico (função pura, sem DOM).
// =============================================================

import { describe, it, expect } from 'vitest'
import { redimensionarElementos } from './redimensionar'
import { criarForma } from '../elementos'

describe('redimensionarElementos', () => {
  it('escala uniformemente e preserva o centro relativo', () => {
    // Elemento centralizado em um canvas 1000×1000
    const el = criarForma('retangulo', 400, 400, { largura: 200, altura: 200 })
    const [novo] = redimensionarElementos([el], 1000, 1000, 500, 500)
    expect(novo.tipo).toBe('retangulo')
    if (novo.tipo === 'retangulo') {
      // fator uniforme = 0,5
      expect(novo.largura).toBeCloseTo(100)
      expect(novo.altura).toBeCloseTo(100)
      // continua centralizado
      expect(novo.x).toBeCloseTo(200)
      expect(novo.y).toBeCloseTo(200)
    }
  })

  it('trata elemento que cobre o canvas como fundo (cobre o novo canvas)', () => {
    const fundo = criarForma('retangulo', 0, 0, { largura: 1000, altura: 1000 })
    const [novo] = redimensionarElementos([fundo], 1000, 1000, 500, 800)
    if (novo.tipo === 'retangulo') {
      expect(novo.x).toBe(0)
      expect(novo.y).toBe(0)
      expect(novo.largura).toBe(500)
      expect(novo.altura).toBe(800)
    }
  })

  it('reposiciona pelo centro relativo ao mudar a proporção', () => {
    const el = criarForma('retangulo', 400, 400, { largura: 200, altura: 200 })
    // 1000×1000 → 1000×2000: fator uniforme = min(1, 2) = 1
    const [novo] = redimensionarElementos([el], 1000, 1000, 1000, 2000)
    if (novo.tipo === 'retangulo') {
      expect(novo.largura).toBeCloseTo(200)
      // centro relativo (0,5; 0,5) → novo centro (500, 1000)
      expect(novo.x).toBeCloseTo(400)
      expect(novo.y).toBeCloseTo(900)
    }
  })

  it('não muta os elementos de entrada', () => {
    const el = criarForma('retangulo', 100, 100, { largura: 200, altura: 200 })
    const copia = { ...el }
    redimensionarElementos([el], 1000, 1000, 500, 500)
    expect(el).toEqual(copia)
  })
})
