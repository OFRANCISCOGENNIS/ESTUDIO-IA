// =============================================================
// Tipos centrais do DesignStudio Pro
// O projeto é serializado em JSON versionado (retrocompatível).
// A partir do esquema 2, o projeto tem várias PÁGINAS; dentro de
// cada página a ordem do array `elementos` define a ordem Z
// (índice 0 = fundo).
// =============================================================

/** Versão atual do esquema de projeto. Incrementar ao mudar a estrutura. */
export const VERSAO_ESQUEMA_ATUAL = 4

export type TipoElemento =
  | 'texto'
  | 'retangulo'
  | 'elipse'
  | 'triangulo'
  | 'estrela'
  | 'linha'
  | 'imagem'

/** Modos de mesclagem por camada (globalCompositeOperation do canvas) */
export type ModoMistura =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'

/** Animação de entrada de um elemento no modo apresentação */
export type TipoAnimacao = 'nenhuma' | 'fade' | 'rise' | 'pan' | 'tumble'

export interface AnimacaoEntrada {
  tipo: TipoAnimacao
  /** Atraso antes de iniciar (ms) */
  atraso: number
  /** Duração da animação (ms) */
  duracao: number
}

export const ANIMACAO_PADRAO: AnimacaoEntrada = { tipo: 'nenhuma', atraso: 0, duracao: 500 }

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
  /** Modo de mesclagem com as camadas abaixo */
  mistura: ModoMistura
  /** Animação de entrada na apresentação */
  animacao: AnimacaoEntrada
}

/** Gradiente de preenchimento (linear ou radial) com paradas de cor */
export interface Gradiente {
  tipo: 'linear' | 'radial'
  /** Ângulo em graus (apenas linear) */
  angulo: number
  /** Paradas de cor ordenadas por deslocamento (0..1) */
  paradas: { deslocamento: number; cor: string }[]
}

export interface ElementoForma extends ElementoBase {
  tipo: 'retangulo' | 'elipse' | 'triangulo' | 'estrela'
  largura: number
  altura: number
  preenchimento: string
  /** Quando presente, substitui o preenchimento sólido por um gradiente */
  gradiente?: Gradiente
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

/** Ajustes finos de imagem (todos neutros = 0) */
export interface AjustesImagem {
  /** -100..100 */
  brilho: number
  /** -100..100 */
  contraste: number
  /** -100..100 */
  saturacao: number
  /** -100 (frio) .. 100 (quente) */
  temperatura: number
  /** 0..100 */
  nitidez: number
  /** 0..100 (raio do desfoque) */
  desfoque: number
  /** 0..100 (escurecimento das bordas) */
  vinheta: number
}

/** Ajustes de imagem neutros (nenhum efeito) */
export const AJUSTES_NEUTROS: AjustesImagem = {
  brilho: 0,
  contraste: 0,
  saturacao: 0,
  temperatura: 0,
  nitidez: 0,
  desfoque: 0,
  vinheta: 0,
}

/** Formatos de máscara para recortar imagens */
export type FormatoMascara =
  | 'nenhuma'
  | 'circulo'
  | 'arredondado'
  | 'triangulo'
  | 'estrela'
  | 'coracao'

export interface ElementoImagem extends ElementoBase {
  tipo: 'imagem'
  /** Data URL ou URL do asset */
  url: string
  largura: number
  altura: number
  raioCanto: number
  /** Ajustes manuais de imagem */
  ajustes: AjustesImagem
  /** Id do filtro predefinido aplicado ('nenhum' = sem filtro) */
  filtro: string
  /** Intensidade do filtro predefinido (0..1) */
  intensidadeFiltro: number
  /** Máscara de recorte aplicada à imagem */
  mascara: FormatoMascara
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

/** Transição ao entrar em um slide na apresentação */
export type TransicaoSlide = 'nenhuma' | 'fade' | 'slide' | 'zoom'

/** Comentário ancorado a um ponto do canvas (opcionalmente a um elemento) */
export interface Comentario {
  id: string
  /** Elemento ao qual o comentário se refere (ou null se ancorado à página) */
  elementoId: string | null
  /** Posição da âncora em coordenadas do canvas */
  x: number
  y: number
  autor: string
  /** Cor do autor (para o pino) */
  cor: string
  texto: string
  criadoEm: string
  resolvido: boolean
}

/** Uma página/prancheta dentro de um projeto (também é um slide) */
export interface Pagina {
  id: string
  nome: string
  corFundo: string
  elementos: Elemento[]
  /** Notas do apresentador (modo apresentador) */
  notas: string
  /** Transição ao entrar neste slide */
  transicao: TransicaoSlide
  /** Comentários de colaboração ancorados nesta página */
  comentarios: Comentario[]
}

/** Documento de projeto completo, serializável em JSON */
export interface Projeto {
  versaoEsquema: number
  id: string
  nome: string
  /** Dimensões do artboard, compartilhadas por todas as páginas */
  larguraCanvas: number
  alturaCanvas: number
  paginas: Pagina[]
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
