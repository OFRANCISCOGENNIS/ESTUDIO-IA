// =============================================================
// Motor de recoloração — troca a paleta inteira de um design com um
// clique (temas de cor / aplicar Kit de Marca), no estilo "Estilos" do
// Canva. Extrai as cores usadas, ordena por luminância e mapeia para a
// paleta-alvo preservando a relação claro↔escuro (fundo continua fundo,
// destaque continua destaque). Cores transparentes são preservadas.
// =============================================================

import { Elemento } from '../tipos/projeto'

/** Converte hex (#rgb, #rrggbb, #rrggbbaa) em componentes; null se opaco não-hex */
function analisarHex(cor: string): { r: number; g: number; b: number; a: number } | null {
  const s = cor.trim().toLowerCase()
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s)
  if (m3) {
    return {
      r: parseInt(m3[1] + m3[1], 16),
      g: parseInt(m3[2] + m3[2], 16),
      b: parseInt(m3[3] + m3[3], 16),
      a: 255,
    }
  }
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/.exec(s)
  if (m6) {
    return {
      r: parseInt(m6[1], 16),
      g: parseInt(m6[2], 16),
      b: parseInt(m6[3], 16),
      a: m6[4] === undefined ? 255 : parseInt(m6[4], 16),
    }
  }
  return null
}

/** Uma cor conta para recoloração? (opaca, hex, e não "transparent") */
export function corRecolorivel(cor: string): boolean {
  if (!cor || cor === 'transparent') return false
  const c = analisarHex(cor)
  return c !== null && c.a > 8
}

/** Luminância relativa perceptual (0 = preto, 1 = branco) */
export function luminancia(cor: string): number {
  const c = analisarHex(cor)
  if (!c) return 0
  const lin = (v: number) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
}

/** Cores (hex) que cada elemento pinta, para extração da paleta */
function coresDoElemento(el: Elemento): string[] {
  switch (el.tipo) {
    case 'retangulo':
    case 'elipse':
    case 'triangulo':
    case 'estrela':
      return [el.preenchimento, el.corBorda, ...(el.gradiente?.paradas.map((p) => p.cor) ?? [])]
    case 'texto':
      return [el.cor]
    case 'linha':
      return [el.cor]
    case 'caminho':
      return [el.preenchimento, el.corBorda]
    case 'grafico':
      return [...el.cores, el.corTexto]
    case 'tabela':
      return [el.corCabecalho, el.corCabecalhoTexto, el.corTexto, el.corLinha]
    case 'imagem':
      return []
  }
}

/**
 * Paleta única do design (cores recoloríveis), incluindo o fundo da
 * página, deduplicadas em minúsculas e ordenadas da mais escura à mais
 * clara — a ordem que o mapeamento de tema usa.
 */
export function coresDoDesign(elementos: Elemento[], corFundo: string): string[] {
  const conjunto = new Set<string>()
  const considerar = (c: string) => {
    if (corRecolorivel(c)) conjunto.add(c.toLowerCase())
  }
  considerar(corFundo)
  for (const el of elementos) coresDoElemento(el).forEach(considerar)
  return [...conjunto].sort((a, b) => luminancia(a) - luminancia(b))
}

/**
 * Mapa cor-de-origem → cor-de-tema. Ambas as paletas são ordenadas por
 * luminância e o design é distribuído sobre o tema, então o tom mais
 * escuro do design vira o mais escuro do tema, e assim por diante.
 */
export function mapaParaTema(coresDesign: string[], tema: string[]): Record<string, string> {
  const origem = [...new Set(coresDesign.map((c) => c.toLowerCase()).filter(corRecolorivel))].sort(
    (a, b) => luminancia(a) - luminancia(b),
  )
  const alvo = [...new Set(tema.map((c) => c.toLowerCase()).filter(corRecolorivel))].sort(
    (a, b) => luminancia(a) - luminancia(b),
  )
  const mapa: Record<string, string> = {}
  if (origem.length === 0 || alvo.length === 0) return mapa
  const n = origem.length
  const m = alvo.length
  for (let i = 0; i < n; i++) {
    const frac = n === 1 ? 0 : i / (n - 1)
    mapa[origem[i]] = alvo[Math.round(frac * (m - 1))]
  }
  return mapa
}

/** Aplica o mapa a uma cor (mantém a original se não estiver mapeada) */
function trocar(cor: string, mapa: Record<string, string>): string {
  return mapa[cor?.toLowerCase()] ?? cor
}

/** Devolve um elemento com todas as cores remapeadas pelo mapa */
export function recolorirElemento(el: Elemento, mapa: Record<string, string>): Elemento {
  switch (el.tipo) {
    case 'retangulo':
    case 'elipse':
    case 'triangulo':
    case 'estrela':
      return {
        ...el,
        preenchimento: trocar(el.preenchimento, mapa),
        corBorda: trocar(el.corBorda, mapa),
        gradiente: el.gradiente
          ? {
              ...el.gradiente,
              paradas: el.gradiente.paradas.map((p) => ({ ...p, cor: trocar(p.cor, mapa) })),
            }
          : el.gradiente,
      }
    case 'texto':
      return { ...el, cor: trocar(el.cor, mapa) }
    case 'linha':
      return { ...el, cor: trocar(el.cor, mapa) }
    case 'caminho':
      return { ...el, preenchimento: trocar(el.preenchimento, mapa), corBorda: trocar(el.corBorda, mapa) }
    case 'grafico':
      return { ...el, cores: el.cores.map((c) => trocar(c, mapa)), corTexto: trocar(el.corTexto, mapa) }
    case 'tabela':
      return {
        ...el,
        corCabecalho: trocar(el.corCabecalho, mapa),
        corCabecalhoTexto: trocar(el.corCabecalhoTexto, mapa),
        corTexto: trocar(el.corTexto, mapa),
        corLinha: trocar(el.corLinha, mapa),
      }
    case 'imagem':
      return el
  }
}

/**
 * Recolore um design inteiro para uma paleta-alvo. Retorna os novos
 * elementos e a nova cor de fundo. Função pura (sem efeitos colaterais).
 */
export function recolorirDesign(
  elementos: Elemento[],
  corFundo: string,
  tema: string[],
): { elementos: Elemento[]; corFundo: string } {
  const paleta = coresDoDesign(elementos, corFundo)
  const mapa = mapaParaTema(paleta, tema)
  return {
    elementos: elementos.map((el) => recolorirElemento(el, mapa)),
    corFundo: trocar(corFundo, mapa),
  }
}
