// =============================================================
// Redimensionamento mágico — adapta um conjunto de elementos de um
// tamanho de canvas para outro, reorganizando com inteligência:
//  - o TAMANHO dos elementos escala de forma UNIFORME (min dos fatores),
//    evitando distorção quando a proporção muda;
//  - a POSIÇÃO é remapeada pelo centro relativo, preservando o layout;
//  - elementos que cobrem quase todo o canvas são tratados como FUNDO
//    e passam a cobrir o novo canvas por inteiro.
// Função PURA — testável sem DOM.
// =============================================================

import { Elemento } from '../../tipos/projeto'

/** Dimensões (sem rotação) de um elemento, para posicionamento */
function dimensoes(elemento: Elemento): { largura: number; altura: number } {
  switch (elemento.tipo) {
    case 'linha':
    case 'caminho': {
      const xs = elemento.pontos.filter((_, i) => i % 2 === 0)
      const ys = elemento.pontos.filter((_, i) => i % 2 === 1)
      return {
        largura: Math.max(...xs) - Math.min(...xs),
        altura: Math.max(...ys) - Math.min(...ys),
      }
    }
    case 'texto':
      return { largura: elemento.largura, altura: elemento.tamanhoFonte * elemento.alturaLinha }
    default:
      return { largura: elemento.largura, altura: elemento.altura }
  }
}

/** Escala as dimensões internas de um elemento por um fator */
function escalar(elemento: Elemento, s: number): Elemento {
  switch (elemento.tipo) {
    case 'texto':
      return {
        ...elemento,
        largura: Math.max(1, elemento.largura * s),
        tamanhoFonte: Math.max(1, elemento.tamanhoFonte * s),
      }
    case 'linha':
      return {
        ...elemento,
        pontos: elemento.pontos.map((p) => p * s),
        espessura: Math.max(1, elemento.espessura * s),
      }
    case 'caminho':
      return {
        ...elemento,
        pontos: elemento.pontos.map((p) => p * s),
        espessuraBorda: elemento.espessuraBorda * s,
      }
    case 'imagem':
      return {
        ...elemento,
        largura: Math.max(1, elemento.largura * s),
        altura: Math.max(1, elemento.altura * s),
        raioCanto: elemento.raioCanto * s,
      }
    case 'grafico':
    case 'tabela':
      return {
        ...elemento,
        largura: Math.max(1, elemento.largura * s),
        altura: Math.max(1, elemento.altura * s),
      }
    default:
      return {
        ...elemento,
        largura: Math.max(1, elemento.largura * s),
        altura: Math.max(1, elemento.altura * s),
        raioCanto: elemento.raioCanto * s,
        espessuraBorda: elemento.espessuraBorda * s,
      }
  }
}

/** Um elemento é "fundo" se cobre praticamente todo o canvas antigo */
function ehFundo(elemento: Elemento, lOld: number, aOld: number): boolean {
  if (elemento.tipo !== 'retangulo' && elemento.tipo !== 'imagem') return false
  const d = dimensoes(elemento)
  return (
    elemento.x <= lOld * 0.02 &&
    elemento.y <= aOld * 0.02 &&
    d.largura >= lOld * 0.96 &&
    d.altura >= aOld * 0.96
  )
}

/**
 * Reposiciona e redimensiona os elementos para um novo tamanho de canvas.
 * Não muta a entrada (retorna novos objetos).
 */
export function redimensionarElementos(
  elementos: Elemento[],
  lOld: number,
  aOld: number,
  lNew: number,
  aNew: number,
): Elemento[] {
  if (lOld <= 0 || aOld <= 0) return elementos
  const s = Math.min(lNew / lOld, aNew / aOld)

  return elementos.map((elemento) => {
    if (ehFundo(elemento, lOld, aOld)) {
      return { ...elemento, x: 0, y: 0, largura: lNew, altura: aNew }
    }
    const d = dimensoes(elemento)
    const centroRelX = (elemento.x + d.largura / 2) / lOld
    const centroRelY = (elemento.y + d.altura / 2) / aOld
    const escalado = escalar(elemento, s)
    const nd = dimensoes(escalado)
    return {
      ...escalado,
      x: centroRelX * lNew - nd.largura / 2,
      y: centroRelY * aNew - nd.altura / 2,
    }
  })
}
