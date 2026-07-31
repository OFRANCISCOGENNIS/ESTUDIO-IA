// =============================================================
// Regras de inserção de imagem no artboard — puras, sem DOM.
//
// Vale para os três caminhos que trazem uma imagem para dentro:
// soltar arquivos no canvas, colar do sistema e o envio pelo painel
// de uploads. Antes cada um decidia tamanho e posição por conta
// própria, e o envio inseria a imagem no tamanho comprimido (até
// 1600 px), que estoura um artboard de 1080.
// =============================================================

export interface Dimensao {
  largura: number
  altura: number
}

export interface Ponto {
  x: number
  y: number
}

/** Fração do artboard que uma imagem recém-inserida ocupa, no máximo */
export const OCUPACAO_MAXIMA = 0.8

/** Distância entre cópias quando vários arquivos entram de uma vez */
export const PASSO_CASCATA = 28

const EXTENSOES = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.bmp', '.svg']

/** O mínimo que precisamos saber de um arquivo para classificá-lo */
export interface ArquivoSolto {
  name: string
  type: string
}

/**
 * Separa o que dá para inserir do que não dá. O tipo MIME é a fonte
 * principal, mas arquivos vindos de alguns gerenciadores chegam com
 * `type` vazio — nesses a extensão decide.
 */
export function separarImagens<T extends ArquivoSolto>(
  arquivos: T[],
): { imagens: T[]; ignorados: string[] } {
  const imagens: T[] = []
  const ignorados: string[] = []
  for (const arquivo of arquivos) {
    if (ehImagem(arquivo)) imagens.push(arquivo)
    else ignorados.push(arquivo.name)
  }
  return { imagens, ignorados }
}

function ehImagem(arquivo: ArquivoSolto): boolean {
  if (arquivo.type.startsWith('image/')) return true
  if (arquivo.type !== '') return false
  const nome = arquivo.name.toLowerCase()
  return EXTENSOES.some((ext) => nome.endsWith(ext))
}

/**
 * Reduz a imagem até caber na fração pedida do artboard, mantendo a
 * proporção. Nunca amplia: uma foto pequena entra no tamanho original.
 */
export function dimensionarParaCanvas(
  natural: Dimensao,
  canvas: Dimensao,
  ocupacao = OCUPACAO_MAXIMA,
): Dimensao {
  if (natural.largura <= 0 || natural.altura <= 0) return { largura: 1, altura: 1 }
  const escala = Math.min(
    1,
    (canvas.largura * ocupacao) / natural.largura,
    (canvas.altura * ocupacao) / natural.altura,
  )
  return {
    largura: Math.max(1, Math.round(natural.largura * escala)),
    altura: Math.max(1, Math.round(natural.altura * escala)),
  }
}

/**
 * Canto superior esquerdo para que a imagem fique centrada no ponto
 * pedido sem escapar do artboard — quem solta perto da borda ainda vê
 * a imagem inteira.
 */
export function posicionarEm(dimensao: Dimensao, alvo: Ponto, canvas: Dimensao): Ponto {
  return {
    x: Math.round(prender(alvo.x - dimensao.largura / 2, canvas.largura - dimensao.largura)),
    y: Math.round(prender(alvo.y - dimensao.altura / 2, canvas.altura - dimensao.altura)),
  }
}

/** Prende entre 0 e `maximo`; com máximo negativo (imagem maior que o
 *  artboard) encosta em 0 em vez de inverter os limites. */
function prender(valor: number, maximo: number): number {
  if (maximo <= 0) return 0
  return Math.max(0, Math.min(valor, maximo))
}

/** Deslocamento da n-ésima imagem de um lote, para não empilharem */
export function cascata(indice: number): Ponto {
  return { x: indice * PASSO_CASCATA, y: indice * PASSO_CASCATA }
}

/** Nome de camada a partir do nome do arquivo (sem extensão, curto) */
export function nomeDeArquivo(nome: string, padrao = 'Imagem'): string {
  const semCaminho = nome.split(/[\\/]/).pop() ?? nome
  const semExtensao = semCaminho.replace(/\.[^.]+$/, '').trim()
  if (semExtensao === '') return padrao
  return semExtensao.length > 32 ? `${semExtensao.slice(0, 31)}…` : semExtensao
}
