// =============================================================
// Caixa envolvente de um elemento — uma implementação só.
//
// Alinhar, distribuir, as guias de encaixe e o retângulo de seleção
// precisam da mesma resposta: onde este elemento realmente começa e
// termina. Havia duas cópias de uma versão simplificada (store e
// canvas), ambas erradas nos mesmos três pontos:
//
//   - texto de várias linhas media uma linha só;
//   - linha e caminho ignoravam o deslocamento dos pontos em relação
//     à origem, então a caixa ficava fora do desenho;
//   - rotação era ignorada — um retângulo girado 45° alinhava pela
//     caixa de antes de girar.
//
// A altura real de um texto depende da quebra de linha, que só o
// canvas sabe fazer. Ele registra um medidor aqui (mesmo padrão do
// exportador); sem canvas montado, caímos na contagem de quebras
// explícitas — pior, mas nunca ausente.
// =============================================================

import { Elemento } from '../tipos/projeto'

export interface Caixa {
  x: number
  y: number
  largura: number
  altura: number
}

/** Medição real de um elemento renderizado, em coordenadas locais */
export type MedidorElemento = (id: string) => { largura: number; altura: number } | null

let medidor: MedidorElemento | null = null

/** O canvas registra aqui como medir um nó já desenhado */
export function registrarMedidor(fn: MedidorElemento | null): void {
  medidor = fn
}

/** Caixa local (relativa à origem do elemento), antes da rotação */
function caixaLocal(elemento: Elemento): Caixa {
  if (elemento.tipo === 'linha' || elemento.tipo === 'caminho') {
    const xs = elemento.pontos.filter((_, i) => i % 2 === 0)
    const ys = elemento.pontos.filter((_, i) => i % 2 === 1)
    if (xs.length === 0 || ys.length === 0) return { x: 0, y: 0, largura: 0, altura: 0 }
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    // Os pontos são relativos à origem: um caminho que começa em
    // (40, 10) tem a caixa deslocada, não colada na origem.
    return {
      x: minX,
      y: minY,
      largura: Math.max(...xs) - minX,
      altura: Math.max(...ys) - minY,
    }
  }

  if (elemento.tipo === 'texto') {
    const medida = medidor?.(elemento.id)
    if (medida) return { x: 0, y: 0, largura: medida.largura, altura: medida.altura }
    // Sem canvas: ao menos conta as quebras explícitas. Não enxerga a
    // quebra automática, então subestima textos longos.
    const linhas = elemento.texto.split('\n').length
    return {
      x: 0,
      y: 0,
      largura: elemento.largura,
      altura: linhas * elemento.tamanhoFonte * elemento.alturaLinha,
    }
  }

  return { x: 0, y: 0, largura: elemento.largura, altura: elemento.altura }
}

/**
 * Caixa envolvente no espaço do canvas, já com a rotação aplicada.
 * O Konva gira em torno da origem do elemento (x, y).
 */
export function caixaDe(elemento: Elemento): Caixa {
  const local = caixaLocal(elemento)
  const graus = elemento.rotacao % 360

  if (graus === 0) {
    return {
      x: elemento.x + local.x,
      y: elemento.y + local.y,
      largura: local.largura,
      altura: local.altura,
    }
  }

  const rad = (graus * Math.PI) / 180
  const cos = Math.cos(rad)
  const sen = Math.sin(rad)
  const cantos = [
    { x: local.x, y: local.y },
    { x: local.x + local.largura, y: local.y },
    { x: local.x + local.largura, y: local.y + local.altura },
    { x: local.x, y: local.y + local.altura },
  ].map((p) => ({ x: p.x * cos - p.y * sen, y: p.x * sen + p.y * cos }))

  const xs = cantos.map((p) => p.x)
  const ys = cantos.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return {
    x: elemento.x + minX,
    y: elemento.y + minY,
    largura: Math.max(...xs) - minX,
    altura: Math.max(...ys) - minY,
  }
}

/**
 * Quanto somar em `x`/`y` do elemento para que a borda pedida da caixa
 * caia em `alvo`. Alinhar mexe na origem, não na caixa — e as duas só
 * coincidem quando não há rotação nem deslocamento de pontos.
 */
export function deslocamentoPara(
  caixa: Caixa,
  eixo: 'x' | 'y',
  borda: 'inicio' | 'centro' | 'fim',
  alvo: number,
): number {
  const inicio = eixo === 'x' ? caixa.x : caixa.y
  const tamanho = eixo === 'x' ? caixa.largura : caixa.altura
  const atual = borda === 'inicio' ? inicio : borda === 'centro' ? inicio + tamanho / 2 : inicio + tamanho
  return alvo - atual
}
