// =============================================================
// Testes dos utilitários puros de exportação e do registro do
// exportador. Ambiente node — NÃO cobrimos baixarDataUrl (DOM).
// =============================================================

import { describe, it, expect, afterEach } from 'vitest'
import {
  nomeArquivoExportacao,
  mimeDoFormato,
  exportarDataUrl,
  registrarExportador,
  OpcoesExportacao,
} from './exportacao'

// Garante isolamento: nenhum teste vaza o exportador para o seguinte.
afterEach(() => {
  registrarExportador(null)
})

describe('nomeArquivoExportacao', () => {
  it('(a) higieniza o nome e aplica o sufixo do formato', () => {
    // Remove acentos e mantém a estrutura em minúsculas com hifens.
    expect(nomeArquivoExportacao('Ação', 'png')).toBe('acao.png')
    // Espaços viram hífen; pontuação é removida.
    expect(nomeArquivoExportacao('Olá Mundo!', 'png')).toBe('ola-mundo.png')
    // Múltiplos espaços colapsam em um único hífen.
    expect(nomeArquivoExportacao('Meu   Design', 'jpg')).toBe('meu-design.jpg')
    // Caracteres especiais são descartados.
    expect(nomeArquivoExportacao('Post #1 @Insta', 'png')).toBe('post-1-insta.png')
    // Nome vazio vira 'design'.
    expect(nomeArquivoExportacao('', 'jpg')).toBe('design.jpg')
    // Apenas espaços/pontuação também caem no padrão 'design'.
    expect(nomeArquivoExportacao('   ', 'png')).toBe('design.png')
    expect(nomeArquivoExportacao('!!!', 'png')).toBe('design.png')
  })
})

describe('mimeDoFormato', () => {
  it('(b) mapeia o formato para o tipo MIME correto', () => {
    expect(mimeDoFormato('png')).toBe('image/png')
    expect(mimeDoFormato('jpg')).toBe('image/jpeg')
  })
})

describe('exportarDataUrl', () => {
  it('(c) retorna null quando nenhum exportador está registrado', () => {
    registrarExportador(null)
    expect(exportarDataUrl({ formato: 'png', escala: 1 })).toBeNull()
  })

  it('(d) repassa as opções e devolve o valor do exportador registrado', () => {
    let recebido: OpcoesExportacao | null = null
    const dataUrlFalso = 'data:image/png;base64,AAAA'
    registrarExportador((opcoes) => {
      recebido = opcoes
      return dataUrlFalso
    })

    const opcoes: OpcoesExportacao = { formato: 'jpg', escala: 2 }
    const resultado = exportarDataUrl(opcoes)

    // O valor retornado é exatamente o do exportador.
    expect(resultado).toBe(dataUrlFalso)
    // As opções chegaram intactas ao exportador.
    expect(recebido).toEqual(opcoes)
  })
})
