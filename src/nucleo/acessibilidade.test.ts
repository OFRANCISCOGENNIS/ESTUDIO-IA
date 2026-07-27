import { describe, expect, it } from 'vitest'
import { criarForma, criarTexto } from './elementos'
import { razaoContraste, verificarContraste } from './acessibilidade'
import { Pagina } from '../tipos/projeto'

function paginaCom(elementos: Pagina['elementos'], corFundo = '#ffffff'): Pagina {
  return {
    id: 'p1',
    nome: 'Página 1',
    corFundo,
    elementos,
    notas: '',
    transicao: 'fade',
    comentarios: [],
  }
}

describe('acessibilidade', () => {
  it('razão de contraste: preto sobre branco = 21, branco/branco = 1', () => {
    expect(razaoContraste('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(razaoContraste('#ffffff', '#ffffff')).toBeCloseTo(1, 2)
  })

  it('aprova texto preto no fundo branco e reprova cinza claro', () => {
    const bom = criarTexto(100, 100, { cor: '#111111', tamanhoFonte: 16 })
    const ruim = criarTexto(100, 300, { cor: '#cccccc', tamanhoFonte: 16 })
    const avisos = verificarContraste(paginaCom([bom, ruim]))
    expect(avisos).toHaveLength(1)
    expect(avisos[0].elementoId).toBe(ruim.id)
    expect(avisos[0].minimo).toBe(4.5)
  })

  it('usa a forma atrás do texto como fundo, não a cor da página', () => {
    // Texto branco sobre retângulo escuro em página branca: OK
    const painel = criarForma('retangulo', 0, 0, {
      largura: 600,
      altura: 600,
      preenchimento: '#1a1030',
    })
    const texto = criarTexto(100, 200, { cor: '#ffffff', largura: 300, tamanhoFonte: 16 })
    const avisos = verificarContraste(paginaCom([painel, texto]))
    expect(avisos).toHaveLength(0)
  })

  it('texto grande usa o mínimo relaxado de 3:1', () => {
    // Razão ~3.45 (#8a8a8a sobre branco): reprova em 16px, aprova em 32px
    const pequeno = criarTexto(100, 100, { cor: '#8a8a8a', tamanhoFonte: 16 })
    const grande = criarTexto(100, 300, { cor: '#8a8a8a', tamanhoFonte: 32 })
    const avisos = verificarContraste(paginaCom([pequeno, grande]))
    expect(avisos.map((a) => a.elementoId)).toEqual([pequeno.id])
  })

  it('ignora textos invisíveis ou quase transparentes', () => {
    const oculto = criarTexto(0, 0, { cor: '#eeeeee', visivel: false })
    const apagado = criarTexto(0, 0, { cor: '#eeeeee', opacidade: 0.2 })
    expect(verificarContraste(paginaCom([oculto, apagado]))).toHaveLength(0)
  })
})
