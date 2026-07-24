// =============================================================
// Tipos centrais do DesignStudio Pro
// O projeto é serializado em JSON versionado (retrocompatível).
// A ordem do array `elementos` define a ordem Z (índice 0 = fundo).
// =============================================================

/** Versão atual do esquema de projeto. Incrementar ao mudar a estrutura. */
export const VERSAO_ESQUEMA_ATUAL = 1

export type TipoElemento =
  | 'texto'
  | 'retangulo'
  | 'elipse'
  | 'triangulo'
  | 'estrela'
  | 'linha'
  | 'imagem'

/** Propriedades comuns a todos os elementos do canvas */
export interface ElementoBase {
  id: string
  tipo: TipoElemento
  /** Nome exibido no painel de camadas */
  nome: string
  x: number
  y: number
  /** Rotação em graus */
  rotacao: number
  /** Opacidade de 0 a 1 */
  opacidade: number
  visivel: boolean
  bloqueado: boolean
}

export interface ElementoForma extends ElementoBase {
  tipo: 'retangulo' | 'elipse' | 'triangulo' | 'estrela'
  largura: number
  altura: number
  preenchimento: string
  corBorda: string
  espessuraBorda: number
  /** Raio dos cantos (apenas retângulo) */
  raioCanto: number
  /** Número de pontas (apenas estrela) */
  pontas: number
}

export interface ElementoTexto extends ElementoBase {
  tipo: 'texto'
  texto: string
  fonte: string
  tamanhoFonte: number
  negrito: boolean
  italico: boolean
  sublinhado: boolean
  cor: string
  alinhamento: 'left' | 'center' | 'right'
  largura: number
  alturaLinha: number
  espacamentoLetras: number
}

export interface ElementoImagem extends ElementoBase {
  tipo: 'imagem'
  /** Data URL ou URL do asset */
  url: string
  largura: number
  altura: number
  raioCanto: number
}

export interface ElementoLinha extends ElementoBase {
  tipo: 'linha'
  /** Pontos relativos [x1, y1, x2, y2] */
  pontos: number[]
  cor: string
  espessura: number
  tracejada: boolean
}

export type Elemento =
  | ElementoForma
  | ElementoTexto
  | ElementoImagem
  | ElementoLinha

/** Documento de projeto completo, serializável em JSON */
export interface Projeto {
  versaoEsquema: number
  id: string
  nome: string
  larguraCanvas: number
  alturaCanvas: number
  corFundo: string
  elementos: Elemento[]
  criadoEm: string
  atualizadoEm: string
  /** Miniatura em data URL para o dashboard */
  miniatura?: string
}

/** Ferramentas disponíveis no editor */
export type Ferramenta =
  | 'selecao'
  | 'mao'
  | 'texto'
  | 'retangulo'
  | 'elipse'
  | 'triangulo'
  | 'estrela'
  | 'linha'

/** Tamanhos predefinidos do botão "Criar design" */
export interface Predefinicao {
  id: string
  nome: string
  largura: number
  altura: number
  /** Emoji ilustrativo no dashboard */
  icone: string
}
