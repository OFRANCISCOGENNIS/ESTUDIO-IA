// =============================================================
// Testes da quantização de cores (paleta automática — núcleo puro).
// =============================================================

import { describe, it, expect } from 'vitest'
import { quantizarCores } from './quantizarPaleta'

/** Repete um pixel RGB n vezes num array plano */
function repetir(rgb: [number, number, number], n: number): number[] {
  const saida: number[] = []
  for (let i = 0; i < n; i++) saida.push(rgb[0], rgb[1], rgb[2])
  return saida
}

describe('quantizarCores', () => {
  it('extrai a cor única de uma imagem sólida', () => {
    const pixels = repetir([255, 0, 0], 50)
    expect(quantizarCores(pixels, 4)).toEqual(['#ff0000'])
  })

  it('retorna as cores dominantes na ordem de frequência', () => {
    const pixels = [...repetir([255, 0, 0], 30), ...repetir([0, 0, 255], 10)]
    const paleta = quantizarCores(pixels, 2)
    expect(paleta).toHaveLength(2)
    expect(paleta[0]).toBe('#ff0000') // vermelho é mais frequente
    expect(paleta).toContain('#0000ff')
  })

  it('respeita o limite de quantidade', () => {
    const pixels = [
      ...repetir([255, 0, 0], 8),
      ...repetir([0, 255, 0], 6),
      ...repetir([0, 0, 255], 4),
      ...repetir([255, 255, 0], 2),
    ]
    expect(quantizarCores(pixels, 2)).toHaveLength(2)
  })

  it('lida com lista vazia sem quebrar', () => {
    expect(quantizarCores([], 4)).toEqual([])
  })
})
