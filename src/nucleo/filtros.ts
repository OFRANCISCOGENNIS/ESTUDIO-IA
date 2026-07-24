// =============================================================
// Filtros e ajustes de imagem.
// Módulo PURO (sem dependência de runtime do Konva — usa apenas
// `import type`), portanto testável em ambiente Node. Fornece:
//  - presets no estilo Instagram (20+), com intensidade ajustável
//  - resolução dos ajustes efetivos (preset × intensidade + manuais)
//  - funções de filtro por pixel usadas como filtros customizados do
//    Konva (brilho/contraste/saturação/temperatura/vinheta e nitidez)
// =============================================================

import type Konva from 'konva'
import { AjustesImagem, AJUSTES_NEUTROS } from '../tipos/projeto'

export interface PresetFiltro {
  id: string
  nome: string
  /** Ajustes base (antes de escalar pela intensidade) */
  ajustes: Partial<AjustesImagem>
}

/** Catálogo de filtros predefinidos (o primeiro é "sem filtro") */
export const FILTROS: PresetFiltro[] = [
  { id: 'nenhum', nome: 'Original', ajustes: {} },
  { id: 'clarendon', nome: 'Clarendon', ajustes: { contraste: 20, saturacao: 35 } },
  { id: 'gingham', nome: 'Gingham', ajustes: { brilho: 12, saturacao: -18, temperatura: -10 } },
  { id: 'moon', nome: 'Moon', ajustes: { saturacao: -100, brilho: 10, contraste: 15 } },
  { id: 'lark', nome: 'Lark', ajustes: { brilho: 14, saturacao: -8, contraste: 8 } },
  { id: 'reyes', nome: 'Reyes', ajustes: { brilho: 16, contraste: -12, saturacao: -20 } },
  { id: 'juno', nome: 'Juno', ajustes: { saturacao: 30, temperatura: 25 } },
  { id: 'slumber', nome: 'Slumber', ajustes: { brilho: -8, saturacao: -25, temperatura: 12 } },
  { id: 'crema', nome: 'Crema', ajustes: { contraste: -10, temperatura: 18, saturacao: -8 } },
  { id: 'ludwig', nome: 'Ludwig', ajustes: { brilho: 10, saturacao: -12, contraste: 10 } },
  { id: 'aden', nome: 'Aden', ajustes: { temperatura: 22, saturacao: -20, brilho: 8 } },
  { id: 'perpetua', nome: 'Perpetua', ajustes: { saturacao: 20, brilho: 10, temperatura: -12 } },
  { id: 'amaro', nome: 'Amaro', ajustes: { brilho: 18, saturacao: 20, contraste: 8 } },
  { id: 'mayfair', nome: 'Mayfair', ajustes: { contraste: 15, saturacao: 20, vinheta: 30 } },
  { id: 'rise', nome: 'Rise', ajustes: { brilho: 14, temperatura: 20, vinheta: 20 } },
  { id: 'hudson', nome: 'Hudson', ajustes: { temperatura: -30, brilho: 12, contraste: 10 } },
  { id: 'valencia', nome: 'Valencia', ajustes: { temperatura: 20, brilho: 10, contraste: -8 } },
  { id: 'xproii', nome: 'X-Pro II', ajustes: { contraste: 30, saturacao: 25, vinheta: 45 } },
  { id: 'sierra', nome: 'Sierra', ajustes: { contraste: -12, brilho: -6, vinheta: 25 } },
  { id: 'willow', nome: 'Willow', ajustes: { saturacao: -100, contraste: 12, brilho: 8 } },
  { id: 'lofi', nome: 'Lo-Fi', ajustes: { contraste: 33, saturacao: 40, vinheta: 15 } },
  { id: 'inkwell', nome: 'Inkwell', ajustes: { saturacao: -100, contraste: 18 } },
  { id: 'nashville', nome: 'Nashville', ajustes: { temperatura: 28, contraste: -10, brilho: 10 } },
  { id: 'frio', nome: 'Frio', ajustes: { temperatura: -60, saturacao: 8 } },
  { id: 'quente', nome: 'Quente', ajustes: { temperatura: 60, saturacao: 8 } },
  { id: 'vivido', nome: 'Vívido', ajustes: { saturacao: 45, contraste: 18, nitidez: 20 } },
  { id: 'vintage', nome: 'Vintage', ajustes: { saturacao: -22, temperatura: 22, vinheta: 30, contraste: -6 } },
  { id: 'dramatico', nome: 'Dramático', ajustes: { contraste: 40, saturacao: -10, vinheta: 35, nitidez: 25 } },
]

const LIMITES: Record<keyof AjustesImagem, [number, number]> = {
  brilho: [-100, 100],
  contraste: [-100, 100],
  saturacao: [-100, 100],
  temperatura: [-100, 100],
  nitidez: [0, 100],
  desfoque: [0, 100],
  vinheta: [0, 100],
}

function limitar(valor: number, [min, max]: [number, number]): number {
  return Math.max(min, Math.min(max, valor))
}

/**
 * Resolve os ajustes EFETIVOS: aplica o preset (escalado pela
 * intensidade 0..1) e soma os ajustes manuais, respeitando os limites.
 */
export function resolverAjustes(
  filtroId: string,
  intensidade: number,
  manuais: AjustesImagem,
): AjustesImagem {
  const preset = FILTROS.find((f) => f.id === filtroId)?.ajustes ?? {}
  const escala = Math.max(0, Math.min(1, intensidade))
  const resultado = { ...AJUSTES_NEUTROS }
  ;(Object.keys(LIMITES) as (keyof AjustesImagem)[]).forEach((chave) => {
    const base = (preset[chave] ?? 0) * escala
    resultado[chave] = limitar(base + manuais[chave], LIMITES[chave])
  })
  return resultado
}

/** Indica se algum ajuste tem efeito (evita cache desnecessário no Konva) */
export function temEfeito(ajustes: AjustesImagem): boolean {
  return (Object.keys(LIMITES) as (keyof AjustesImagem)[]).some(
    (chave) => ajustes[chave] !== 0,
  )
}

/** Converte desfoque (0..100) para raio de blur em pixels */
export function raioDesfoque(desfoque: number): number {
  return (desfoque / 100) * 40
}

// -------------------------------------------------------------
// Filtros customizados do Konva (assinatura (this: Node, ImageData))
// Leem os ajustes efetivos do atributo `ajustesDSP` do nó.
// -------------------------------------------------------------

/**
 * Aplica brilho, contraste, saturação, temperatura e vinheta numa
 * única passagem de pixels (eficiente). Neutro quando não há efeito.
 */
export function filtroAjustesDSP(this: Konva.Node, imageData: ImageData): void {
  const ajustes = this.getAttr('ajustesDSP') as AjustesImagem | undefined
  if (!ajustes) return

  const { brilho, contraste, saturacao, temperatura, vinheta } = ajustes
  const dados = imageData.data
  const largura = imageData.width
  const altura = imageData.height

  const somaBrilho = (brilho / 100) * 120
  const c = (contraste / 100) * 255
  const fatorContraste = (259 * (c + 255)) / (255 * (259 - c))
  const fatorSaturacao = 1 + saturacao / 100
  const deslocaR = (temperatura / 100) * 40
  const deslocaB = -(temperatura / 100) * 40

  const usaVinheta = vinheta > 0
  const forcaVinheta = vinheta / 100
  const cx = largura / 2
  const cy = altura / 2
  const distMax = Math.sqrt(cx * cx + cy * cy) || 1

  for (let i = 0; i < dados.length; i += 4) {
    let r = dados[i]
    let g = dados[i + 1]
    let b = dados[i + 2]

    // Brilho
    if (somaBrilho !== 0) {
      r += somaBrilho
      g += somaBrilho
      b += somaBrilho
    }
    // Contraste
    if (fatorContraste !== 1) {
      r = fatorContraste * (r - 128) + 128
      g = fatorContraste * (g - 128) + 128
      b = fatorContraste * (b - 128) + 128
    }
    // Saturação
    if (fatorSaturacao !== 1) {
      const cinza = 0.299 * r + 0.587 * g + 0.114 * b
      r = cinza + (r - cinza) * fatorSaturacao
      g = cinza + (g - cinza) * fatorSaturacao
      b = cinza + (b - cinza) * fatorSaturacao
    }
    // Temperatura (quente aumenta vermelho, reduz azul)
    if (temperatura !== 0) {
      r += deslocaR
      b += deslocaB
    }
    // Vinheta (escurece as bordas)
    if (usaVinheta) {
      const px = (i / 4) % largura
      const py = Math.floor(i / 4 / largura)
      const dx = px - cx
      const dy = py - cy
      const razao = Math.sqrt(dx * dx + dy * dy) / distMax
      const escurece = 1 - forcaVinheta * Math.pow(razao, 2.2)
      r *= escurece
      g *= escurece
      b *= escurece
    }

    dados[i] = r < 0 ? 0 : r > 255 ? 255 : r
    dados[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g
    dados[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b
  }
}

/**
 * Nitidez por convolução 3×3 (unsharp). Lê `nitidezDSP` (0..100) do nó.
 * Trabalha sobre uma cópia da fonte para não contaminar a vizinhança.
 */
export function filtroNitidezDSP(this: Konva.Node, imageData: ImageData): void {
  const nitidez = (this.getAttr('nitidezDSP') as number | undefined) ?? 0
  if (nitidez <= 0) return

  const a = nitidez / 100 // 0..1
  const largura = imageData.width
  const altura = imageData.height
  const dados = imageData.data
  const fonte = new Uint8ClampedArray(dados)
  const centro = 1 + 4 * a

  for (let y = 1; y < altura - 1; y++) {
    for (let x = 1; x < largura - 1; x++) {
      const idx = (y * largura + x) * 4
      for (let canal = 0; canal < 3; canal++) {
        const p = idx + canal
        const valor =
          centro * fonte[p] -
          a * fonte[p - 4] -
          a * fonte[p + 4] -
          a * fonte[p - largura * 4] -
          a * fonte[p + largura * 4]
        dados[p] = valor < 0 ? 0 : valor > 255 ? 255 : valor
      }
    }
  }
}
