// =============================================================
// Testes do adaptador de IA local (partes sem DOM: geração de texto,
// texto para design e sugestão de estilo). Remoção de fundo e extração
// de paleta dependem de canvas e são cobertas em smoke tests do editor.
// =============================================================

import { describe, it, expect } from 'vitest'
import { adaptadorLocal } from './adaptadorLocal'

describe('adaptadorLocal', () => {
  it('gera variações de texto para cada tipo', async () => {
    const titulos = await adaptadorLocal.gerarTextos('titulo', 'cafeteria', 'ousado')
    expect(titulos.length).toBeGreaterThan(0)
    expect(titulos.every((t) => typeof t === 'string' && t.length > 0)).toBe(true)

    const ctas = await adaptadorLocal.gerarTextos('cta', 'cafeteria', 'profissional')
    expect(ctas.length).toBeGreaterThan(0)
  })

  it('gera 4 opções de design, todas com elementos', async () => {
    const opcoes = await adaptadorLocal.gerarDesign('post de hamburgueria, fundo escuro')
    expect(opcoes).toHaveLength(4)
    for (const op of opcoes) {
      expect(op.corFundo).toMatch(/^#/)
      expect(op.coresPreview).toHaveLength(3)
      const elementos = op.gerarElementos(1080, 1080)
      expect(elementos.length).toBeGreaterThan(0)
      // deve conter ao menos um texto (título) e uma forma
      expect(elementos.some((e) => e.tipo === 'texto')).toBe(true)
    }
  })

  it('sugere paleta e par de fontes a partir da descrição', async () => {
    const sug = await adaptadorLocal.sugerirEstilo('festa infantil colorida')
    expect(sug.paleta.length).toBeGreaterThan(0)
    expect(sug.parFonte.titulo).toBeTruthy()
    expect(sug.parFonte.corpo).toBeTruthy()
  })
})
