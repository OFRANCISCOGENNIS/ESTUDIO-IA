// Testes do exportador SVG (função pura).

import { describe, it, expect } from 'vitest'
import { paginaParaSvg } from './svg'
import { criarForma, criarImagem, criarTexto } from '../elementos'
import { Pagina } from '../../tipos/projeto'

function paginaDe(): Pagina {
  const retangulo = criarForma('retangulo', 10, 10, {
    largura: 100,
    altura: 50,
    gradiente: {
      tipo: 'linear',
      angulo: 90,
      paradas: [
        { deslocamento: 0, cor: '#7c4dff' },
        { deslocamento: 1, cor: '#ec4899' },
      ],
    },
  })
  const texto = criarTexto(20, 80, { texto: 'Linha 1\nLinha 2', alinhamento: 'center' })
  const imagem = criarImagem('data:image/png;base64,AAAA', 0, 0, 120, 120, { mascara: 'circulo' })
  return {
    id: 'p1',
    nome: 'Página 1',
    corFundo: '#101820',
    elementos: [retangulo, texto, imagem],
    notas: '',
    transicao: 'fade',
  }
}

describe('paginaParaSvg', () => {
  it('gera um documento SVG com o tamanho e o fundo corretos', () => {
    const svg = paginaParaSvg(paginaDe(), 1080, 1080)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('width="1080"')
    expect(svg).toContain('fill="#101820"') // retângulo de fundo
    expect(svg.endsWith('</svg>')).toBe(true)
  })

  it('inclui formas, gradiente, texto multilinha e imagem com máscara', () => {
    const svg = paginaParaSvg(paginaDe(), 1080, 1080)
    expect(svg).toContain('<rect')
    expect(svg).toContain('linearGradient')
    expect(svg).toContain('url(#g0)')
    expect(svg).toContain('<text')
    expect((svg.match(/<tspan/g) ?? []).length).toBe(2) // duas linhas
    expect(svg).toContain('<image')
    expect(svg).toContain('clipPath')
  })

  it('escapa caracteres especiais no texto', () => {
    const pagina = paginaDe()
    pagina.elementos[1] = criarTexto(0, 0, { texto: 'A & B < C' })
    const svg = paginaParaSvg(pagina, 100, 100)
    expect(svg).toContain('A &amp; B &lt; C')
  })
})
