// =============================================================
// Utilitários de imagem — carregamento de arquivos com compressão
// automática (evita estourar o localStorage e melhora a performance
// do canvas). Toda a operação roda fora da thread de layout usando
// um canvas offscreen; o resultado é um data URL pronto para uso.
// =============================================================

import { comprimirAteCaber, FormatoImagem } from '../nucleo/compressaoImagem'

/** Dimensão máxima (px) após compressão de uploads */
const DIMENSAO_MAXIMA = 1600

export interface ImagemCarregada {
  url: string
  largura: number
  altura: number
}

/**
 * Lê um arquivo de imagem, redimensiona proporcionalmente se exceder
 * DIMENSAO_MAXIMA e devolve um data URL comprimido (JPEG para fotos,
 * PNG quando há transparência).
 */
export function carregarArquivoImagem(arquivo: File): Promise<ImagemCarregada> {
  return new Promise((resolver, rejeitar) => {
    if (!arquivo.type.startsWith('image/')) {
      rejeitar(new Error('O arquivo não é uma imagem'))
      return
    }
    const leitor = new FileReader()
    leitor.onerror = () => rejeitar(new Error('Falha ao ler o arquivo'))
    leitor.onload = () => {
      const origem = leitor.result as string
      const imagem = new Image()
      imagem.onerror = () => rejeitar(new Error('Falha ao decodificar a imagem'))
      imagem.onload = () => {
        const preservaTransparencia = arquivo.type === 'image/png' || arquivo.type === 'image/webp'
        resolver(comprimirImagem(imagem, preservaTransparencia))
      }
      imagem.src = origem
    }
    leitor.readAsDataURL(arquivo)
  })
}

/** Comprime/redimensiona um HTMLImageElement já carregado */
export function comprimirImagem(
  imagem: HTMLImageElement,
  preservaTransparencia: boolean,
): ImagemCarregada {
  const escalaBase = Math.min(1, DIMENSAO_MAXIMA / Math.max(imagem.width, imagem.height))

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { url: imagem.src, largura: imagem.width, altura: imagem.height }
  }

  // Dimensões da última codificação — a que vale é a que couber no teto.
  let largura = 0
  let altura = 0

  const codificar = (fator: number, formato: FormatoImagem) => {
    const escala = escalaBase * fator
    largura = Math.max(1, Math.round(imagem.width * escala))
    altura = Math.max(1, Math.round(imagem.height * escala))
    canvas.width = largura
    canvas.height = altura
    // JPEG não tem alfa: sem um fundo branco, o transparente vira preto.
    if (formato === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, largura, altura)
    } else {
      ctx.clearRect(0, 0, largura, altura)
    }
    ctx.drawImage(imagem, 0, 0, largura, altura)
    return formato === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85)
  }

  const { url } = comprimirAteCaber(codificar, preservaTransparencia)
  return { url, largura, altura }
}
