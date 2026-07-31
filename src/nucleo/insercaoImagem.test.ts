import { describe, expect, it } from 'vitest'
import {
  cascata,
  dimensionarParaCanvas,
  nomeDeArquivo,
  posicionarEm,
  separarImagens,
} from './insercaoImagem'

const CANVAS = { largura: 1080, altura: 1080 }

describe('separarImagens', () => {
  it('aceita pelo tipo MIME', () => {
    const r = separarImagens([
      { name: 'foto.jpg', type: 'image/jpeg' },
      { name: 'logo.png', type: 'image/png' },
    ])

    expect(r.imagens).toHaveLength(2)
    expect(r.ignorados).toEqual([])
  })

  it('recusa o que não é imagem e devolve o nome para o aviso', () => {
    const r = separarImagens([
      { name: 'foto.jpg', type: 'image/jpeg' },
      { name: 'contrato.pdf', type: 'application/pdf' },
    ])

    expect(r.imagens.map((a) => a.name)).toEqual(['foto.jpg'])
    expect(r.ignorados).toEqual(['contrato.pdf'])
  })

  it('cai para a extensão quando o sistema não informa o tipo', () => {
    // Alguns gerenciadores de arquivos entregam `type` vazio no drop
    const r = separarImagens([
      { name: 'captura.PNG', type: '' },
      { name: 'notas.txt', type: '' },
    ])

    expect(r.imagens.map((a) => a.name)).toEqual(['captura.PNG'])
    expect(r.ignorados).toEqual(['notas.txt'])
  })

  it('não deixa a extensão passar por cima de um tipo declarado', () => {
    const r = separarImagens([{ name: 'malicioso.png', type: 'application/zip' }])

    expect(r.imagens).toEqual([])
  })
})

describe('dimensionarParaCanvas', () => {
  it('reduz a foto grande para caber no artboard', () => {
    // O caminho do upload comprime até 1600 px e inseria nesse tamanho,
    // estourando um canvas de 1080.
    const d = dimensionarParaCanvas({ largura: 1600, altura: 1200 }, CANVAS)

    expect(d.largura).toBe(864) // 1080 * 0.8
    expect(d.altura).toBe(648)
    expect(d.largura / d.altura).toBeCloseTo(1600 / 1200, 5)
  })

  it('nunca amplia uma imagem pequena', () => {
    expect(dimensionarParaCanvas({ largura: 120, altura: 90 }, CANVAS)).toEqual({
      largura: 120,
      altura: 90,
    })
  })

  it('respeita o lado mais apertado em canvas não quadrado', () => {
    // Story 1080x1920 com uma imagem bem larga: quem limita é a largura
    const d = dimensionarParaCanvas({ largura: 4000, altura: 1000 }, { largura: 1080, altura: 1920 })

    expect(d.largura).toBe(864)
    expect(d.altura).toBe(216)
  })

  it('sobrevive a dimensões inválidas', () => {
    expect(dimensionarParaCanvas({ largura: 0, altura: 0 }, CANVAS)).toEqual({
      largura: 1,
      altura: 1,
    })
  })
})

describe('posicionarEm', () => {
  it('centra a imagem no ponto onde foi solta', () => {
    const p = posicionarEm({ largura: 200, altura: 100 }, { x: 500, y: 400 }, CANVAS)

    expect(p).toEqual({ x: 400, y: 350 })
  })

  it('não deixa escapar pela borda superior esquerda', () => {
    const p = posicionarEm({ largura: 200, altura: 200 }, { x: 10, y: 10 }, CANVAS)

    expect(p).toEqual({ x: 0, y: 0 })
  })

  it('não deixa escapar pela borda inferior direita', () => {
    const p = posicionarEm({ largura: 200, altura: 200 }, { x: 1070, y: 1070 }, CANVAS)

    expect(p).toEqual({ x: 880, y: 880 })
  })

  it('encosta na origem quando a imagem é maior que o artboard', () => {
    const p = posicionarEm({ largura: 2000, altura: 2000 }, { x: 540, y: 540 }, CANVAS)

    expect(p).toEqual({ x: 0, y: 0 })
  })
})

describe('cascata', () => {
  it('não empilha as imagens de um lote no mesmo lugar', () => {
    expect(cascata(0)).toEqual({ x: 0, y: 0 })
    expect(cascata(2)).toEqual({ x: 56, y: 56 })
  })
})

describe('nomeDeArquivo', () => {
  it('tira a extensão', () => {
    expect(nomeDeArquivo('praia-do-forte.jpg')).toBe('praia-do-forte')
  })

  it('encurta nomes longos para o painel de camadas', () => {
    const nome = nomeDeArquivo(`${'a'.repeat(60)}.png`)

    expect(nome).toHaveLength(32)
    expect(nome.endsWith('…')).toBe(true)
  })

  it('usa o padrão quando sobra nada', () => {
    expect(nomeDeArquivo('.png')).toBe('Imagem')
    expect(nomeDeArquivo('   .jpg', 'Imagem colada')).toBe('Imagem colada')
  })
})
