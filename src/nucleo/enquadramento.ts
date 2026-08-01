// =============================================================
// Enquadramento de imagem — qual pedaço da foto aparece no quadro.
//
// Até aqui a foto era esticada para as dimensões do elemento. Isso só
// fica certo enquanto o quadro tiver a proporção original: bastava
// arrastar uma alça lateral para o rosto achatar. Agora existe o modo
// `preencher`, que recorta em vez de deformar, com ponto de foco e
// aproximação.
//
// A conta é feita toda em FRAÇÕES da fonte (0 a 1), não em pixels. É o
// que permite o canvas e o exportador SVG chegarem ao mesmo resultado
// sem que o SVG precise conhecer o tamanho real do arquivo.
// =============================================================

export interface RetanguloRelativo {
  x: number
  y: number
  largura: number
  altura: number
}

export interface Foco {
  x: number
  y: number
}

/** Recorte cheio: a foto inteira, sem corte */
export const RECORTE_CHEIO: RetanguloRelativo = { x: 0, y: 0, largura: 1, altura: 1 }

const prender = (v: number, min: number, max: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min

/**
 * Janela da foto que vai aparecer no quadro, em fração da fonte.
 *
 * `proporcaoFonte` é largura/altura da imagem original. Sem ela
 * (0 ou inválida) não há como saber o que sobra, então devolve a foto
 * inteira — que é o comportamento de esticar.
 */
export function recorteRelativo(
  proporcaoFonte: number,
  quadro: { largura: number; altura: number },
  foco: Foco = { x: 0.5, y: 0.5 },
  zoom = 1,
): RetanguloRelativo {
  if (!Number.isFinite(proporcaoFonte) || proporcaoFonte <= 0) return RECORTE_CHEIO
  if (quadro.largura <= 0 || quadro.altura <= 0) return RECORTE_CHEIO

  const proporcaoQuadro = quadro.largura / quadro.altura
  const z = Math.max(1, Number.isFinite(zoom) ? zoom : 1)

  // Sobra no eixo em que a foto é mais generosa que o quadro
  let largura = 1
  let altura = 1
  if (proporcaoFonte > proporcaoQuadro) {
    // Foto mais larga: usa a altura toda e corta as laterais
    largura = proporcaoQuadro / proporcaoFonte
  } else {
    // Foto mais alta: usa a largura toda e corta em cima/embaixo
    altura = proporcaoFonte / proporcaoQuadro
  }

  largura = prender(largura / z, 0.01, 1)
  altura = prender(altura / z, 0.01, 1)

  // O foco escolhe onde a janela pousa dentro do que sobrou
  return {
    x: prender(foco.x, 0, 1) * (1 - largura),
    y: prender(foco.y, 0, 1) * (1 - altura),
    largura,
    altura,
  }
}

/** Verdadeiro quando o recorte cobre a foto inteira (nada a cortar) */
export function recorteEhCheio(r: RetanguloRelativo): boolean {
  return r.x === 0 && r.y === 0 && r.largura === 1 && r.altura === 1
}

/**
 * Onde desenhar a foto INTEIRA para que a janela do recorte caia
 * exatamente sobre o quadro. É o que o SVG precisa: ele não sabe
 * recortar a fonte, então desenha tudo, ampliado e deslocado, e
 * confina no quadro com um clip.
 */
export function desenhoParaRecorte(
  recorte: RetanguloRelativo,
  quadro: { largura: number; altura: number },
): { x: number; y: number; largura: number; altura: number } {
  const largura = quadro.largura / recorte.largura
  const altura = quadro.altura / recorte.altura
  return {
    x: -(recorte.x / recorte.largura) * quadro.largura,
    y: -(recorte.y / recorte.altura) * quadro.altura,
    largura,
    altura,
  }
}
