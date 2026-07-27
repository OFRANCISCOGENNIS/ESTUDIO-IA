// =============================================================
// Exportador SVG — serializa uma página em SVG vetorial a partir do
// modelo de elementos (formas, texto, imagem, linha, gradientes,
// rotação, opacidade e mesclagem). Puro e testável.
// Observação: ajustes de imagem (filtros) não são reproduzidos no SVG;
// a exportação em PNG/JPG (via Konva) é a fiel a esses efeitos.
// =============================================================

import { Elemento, Gradiente, Pagina } from '../../tipos/projeto'

function escaparTexto(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escaparAtributo(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

const n = (v: number) => Number(v.toFixed(2))

function pontosEstrela(w: number, h: number, pontas: number): string {
  const cx = w / 2
  const cy = h / 2
  const externo = Math.min(w, h) / 2
  const interno = externo * 0.5
  const p: string[] = []
  for (let i = 0; i < pontas * 2; i++) {
    const r = i % 2 === 0 ? externo : interno
    const a = -Math.PI / 2 + (i * Math.PI) / pontas
    p.push(`${n(cx + r * Math.cos(a))},${n(cy + r * Math.sin(a))}`)
  }
  return p.join(' ')
}

/** Cria a definição de gradiente e devolve o id de referência */
function definirGradiente(
  gradiente: Gradiente,
  w: number,
  h: number,
  id: string,
  defs: string[],
): string {
  const stops = gradiente.paradas
    .map((p) => `<stop offset="${n(p.deslocamento)}" stop-color="${escaparAtributo(p.cor)}"/>`)
    .join('')
  if (gradiente.tipo === 'radial') {
    defs.push(
      `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(w / 2)}" cy="${n(h / 2)}" r="${n(Math.max(w, h) / 2)}">${stops}</radialGradient>`,
    )
  } else {
    const rad = (gradiente.angulo * Math.PI) / 180
    const dx = Math.cos(rad)
    const dy = Math.sin(rad)
    defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(w / 2 - (dx * w) / 2)}" y1="${n(h / 2 - (dy * h) / 2)}" x2="${n(w / 2 + (dx * w) / 2)}" y2="${n(h / 2 + (dy * h) / 2)}">${stops}</linearGradient>`,
    )
  }
  return `url(#${id})`
}

function preenchimentoForma(
  el: Extract<Elemento, { tipo: 'retangulo' | 'elipse' | 'triangulo' | 'estrela' }>,
  id: string,
  defs: string[],
): string {
  if (el.gradiente && el.gradiente.paradas.length >= 2) {
    return definirGradiente(el.gradiente, el.largura, el.altura, id, defs)
  }
  return escaparAtributo(el.preenchimento)
}

function atributosBorda(corBorda: string, espessura: number): string {
  return espessura > 0
    ? ` stroke="${escaparAtributo(corBorda)}" stroke-width="${n(espessura)}"`
    : ''
}

/** Serializa uma página inteira como um documento SVG.
 *  `janela` (opcional) recorta a visualização — usado nas miniaturas
 *  de elemento do painel de camadas. */
export function paginaParaSvg(
  pagina: Pagina,
  largura: number,
  altura: number,
  janela?: { x: number; y: number; largura: number; altura: number },
): string {
  const defs: string[] = []
  const corpo: string[] = []

  pagina.elementos.forEach((el, indice) => {
    if (!el.visivel) return
    const idGrad = `g${indice}`
    const idClip = `c${indice}`
    const abreG =
      `<g transform="translate(${n(el.x)} ${n(el.y)}) rotate(${n(el.rotacao)})" opacity="${n(el.opacidade)}"` +
      (el.mistura !== 'normal' ? ` style="mix-blend-mode:${el.mistura}"` : '') +
      '>'
    let interno = ''

    switch (el.tipo) {
      case 'retangulo':
        interno = `<rect width="${n(el.largura)}" height="${n(el.altura)}" rx="${n(el.raioCanto)}" fill="${preenchimentoForma(el, idGrad, defs)}"${atributosBorda(el.corBorda, el.espessuraBorda)}/>`
        break
      case 'elipse':
        interno = `<ellipse cx="${n(el.largura / 2)}" cy="${n(el.altura / 2)}" rx="${n(el.largura / 2)}" ry="${n(el.altura / 2)}" fill="${preenchimentoForma(el, idGrad, defs)}"${atributosBorda(el.corBorda, el.espessuraBorda)}/>`
        break
      case 'triangulo':
        interno = `<polygon points="${n(el.largura / 2)},0 ${n(el.largura)},${n(el.altura)} 0,${n(el.altura)}" fill="${preenchimentoForma(el, idGrad, defs)}"${atributosBorda(el.corBorda, el.espessuraBorda)}/>`
        break
      case 'estrela':
        interno = `<polygon points="${pontosEstrela(el.largura, el.altura, Math.max(3, el.pontas))}" fill="${preenchimentoForma(el, idGrad, defs)}"${atributosBorda(el.corBorda, el.espessuraBorda)}/>`
        break
      case 'linha': {
        const pts: string[] = []
        for (let i = 0; i + 1 < el.pontos.length; i += 2) pts.push(`${n(el.pontos[i])},${n(el.pontos[i + 1])}`)
        const traco = el.tracejada ? ` stroke-dasharray="${n(el.espessura * 3)} ${n(el.espessura * 2)}"` : ''
        interno = `<polyline points="${pts.join(' ')}" fill="none" stroke="${escaparAtributo(el.cor)}" stroke-width="${n(el.espessura)}" stroke-linecap="round"${traco}/>`
        break
      }
      case 'caminho': {
        const pts: string[] = []
        for (let i = 0; i + 1 < el.pontos.length; i += 2) pts.push(`${n(el.pontos[i])},${n(el.pontos[i + 1])}`)
        const preenche = el.fechado && el.preenchimento !== 'transparent' ? escaparAtributo(el.preenchimento) : 'none'
        const tag = el.fechado ? 'polygon' : 'polyline'
        interno = `<${tag} points="${pts.join(' ')}" fill="${preenche}" stroke="${escaparAtributo(el.corBorda)}" stroke-width="${n(el.espessuraBorda)}" stroke-linecap="round" stroke-linejoin="round"/>`
        break
      }
      case 'texto': {
        const ancora = el.alinhamento === 'center' ? 'middle' : el.alinhamento === 'right' ? 'end' : 'start'
        const xAncora = el.alinhamento === 'center' ? el.largura / 2 : el.alinhamento === 'right' ? el.largura : 0
        const linhas = el.texto.split('\n')
        const tspans = linhas
          .map((linha, i) => `<tspan x="${n(xAncora)}" dy="${i === 0 ? n(el.tamanhoFonte) : n(el.tamanhoFonte * el.alturaLinha)}">${escaparTexto(linha) || ' '}</tspan>`)
          .join('')
        interno =
          `<text text-anchor="${ancora}" font-family="${escaparAtributo(el.fonte)}, sans-serif" font-size="${n(el.tamanhoFonte)}"` +
          ` font-weight="${el.negrito ? 700 : 400}" font-style="${el.italico ? 'italic' : 'normal'}"` +
          (el.sublinhado ? ' text-decoration="underline"' : '') +
          ` letter-spacing="${n(el.espacamentoLetras)}" fill="${escaparAtributo(el.cor)}">${tspans}</text>`
        break
      }
      case 'imagem': {
        let clip = ''
        if (el.mascara === 'circulo') {
          defs.push(`<clipPath id="${idClip}"><ellipse cx="${n(el.largura / 2)}" cy="${n(el.altura / 2)}" rx="${n(el.largura / 2)}" ry="${n(el.altura / 2)}"/></clipPath>`)
          clip = ` clip-path="url(#${idClip})"`
        } else if (el.raioCanto > 0 || el.mascara === 'arredondado') {
          const r = el.mascara === 'arredondado' ? Math.min(el.largura, el.altura) * 0.15 : el.raioCanto
          defs.push(`<clipPath id="${idClip}"><rect width="${n(el.largura)}" height="${n(el.altura)}" rx="${n(r)}"/></clipPath>`)
          clip = ` clip-path="url(#${idClip})"`
        } else if (el.mascara === 'triangulo') {
          defs.push(`<clipPath id="${idClip}"><polygon points="${n(el.largura / 2)},0 ${n(el.largura)},${n(el.altura)} 0,${n(el.altura)}"/></clipPath>`)
          clip = ` clip-path="url(#${idClip})"`
        } else if (el.mascara === 'estrela') {
          defs.push(`<clipPath id="${idClip}"><polygon points="${pontosEstrela(el.largura, el.altura, 5)}"/></clipPath>`)
          clip = ` clip-path="url(#${idClip})"`
        }
        interno = `<image href="${escaparAtributo(el.url)}" width="${n(el.largura)}" height="${n(el.altura)}" preserveAspectRatio="none"${clip}/>`
        break
      }
    }
    corpo.push(abreG + interno + '</g>')
  })

  const vb = janela
    ? `${n(janela.x)} ${n(janela.y)} ${n(janela.largura)} ${n(janela.altura)}`
    : `0 0 ${largura} ${altura}`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="${vb}">` +
    (defs.length ? `<defs>${defs.join('')}</defs>` : '') +
    `<rect width="${largura}" height="${altura}" fill="${escaparAtributo(pagina.corFundo)}"/>` +
    corpo.join('') +
    '</svg>'
  )
}
