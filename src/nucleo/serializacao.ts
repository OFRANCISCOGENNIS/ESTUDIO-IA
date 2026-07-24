// =============================================================
// Serialização do projeto — JSON versionado e retrocompatível.
// Toda leitura passa por `desserializarProjeto`, que valida e
// migra esquemas antigos para a versão atual.
//   v1 → v2: projetos de página única (elementos/corFundo no topo)
//   são embrulhados em uma única página `paginas[0]`.
// =============================================================

import {
  AJUSTES_NEUTROS,
  Elemento,
  FormatoMascara,
  Gradiente,
  ModoMistura,
  Pagina,
  Projeto,
  VERSAO_ESQUEMA_ATUAL,
} from '../tipos/projeto'

/** Converte o projeto para JSON estável (pronto para persistência) */
export function serializarProjeto(projeto: Projeto): string {
  return JSON.stringify({ ...projeto, versaoEsquema: VERSAO_ESQUEMA_ATUAL })
}

/**
 * Lê um projeto a partir de JSON, aplicando migrações de esquema
 * e preenchendo valores padrão para campos ausentes.
 * Lança erro se o JSON não representar um projeto válido.
 */
export function desserializarProjeto(json: string): Projeto {
  const bruto = JSON.parse(json) as Record<string, unknown>
  if (typeof bruto !== 'object' || bruto === null) {
    throw new Error('JSON de projeto inválido')
  }
  const migrado = migrarEsquema(bruto)
  return normalizarProjeto(migrado)
}

/**
 * Migra um projeto de versões anteriores do esquema para a atual.
 * Cada bloco transforma a versão N na N+1, em cascata.
 */
function migrarEsquema(bruto: Record<string, unknown>): Record<string, unknown> {
  let versao = typeof bruto.versaoEsquema === 'number' ? bruto.versaoEsquema : 1
  if (versao > VERSAO_ESQUEMA_ATUAL) {
    throw new Error(
      `Projeto criado em versão mais recente (esquema ${versao}). Atualize o aplicativo.`,
    )
  }
  let atual = { ...bruto }
  // v1 → v2: embrulha elementos/corFundo do topo em uma página única
  if (versao < 2) {
    const elementos = Array.isArray(atual.elementos) ? atual.elementos : []
    const corFundo = typeof atual.corFundo === 'string' ? atual.corFundo : '#ffffff'
    atual = {
      ...atual,
      paginas: [{ id: 'pagina-1', nome: 'Página 1', corFundo, elementos }],
    }
    delete atual.elementos
    delete atual.corFundo
    versao = 2
  }
  atual.versaoEsquema = VERSAO_ESQUEMA_ATUAL
  return atual
}

/** Garante todos os campos obrigatórios com padrões seguros */
function normalizarProjeto(bruto: Record<string, unknown>): Projeto {
  if (typeof bruto.id !== 'string' || bruto.id.length === 0) {
    throw new Error('Projeto sem identificador')
  }
  const paginasBrutas = Array.isArray(bruto.paginas) ? bruto.paginas : []
  const paginas = paginasBrutas
    .map((p, i) => normalizarPagina(p as Record<string, unknown>, i))
    .filter((p): p is Pagina => p !== null)
  // Todo projeto precisa de ao menos uma página
  if (paginas.length === 0) {
    paginas.push({ id: 'pagina-1', nome: 'Página 1', corFundo: '#ffffff', elementos: [] })
  }
  const agora = new Date().toISOString()
  return {
    versaoEsquema: VERSAO_ESQUEMA_ATUAL,
    id: bruto.id,
    nome: typeof bruto.nome === 'string' ? bruto.nome : 'Design sem título',
    larguraCanvas: numeroOu(bruto.larguraCanvas, 1080),
    alturaCanvas: numeroOu(bruto.alturaCanvas, 1080),
    paginas,
    criadoEm: typeof bruto.criadoEm === 'string' ? bruto.criadoEm : agora,
    atualizadoEm: typeof bruto.atualizadoEm === 'string' ? bruto.atualizadoEm : agora,
    miniatura: typeof bruto.miniatura === 'string' ? bruto.miniatura : undefined,
  }
}

function normalizarPagina(bruto: Record<string, unknown>, indice: number): Pagina | null {
  if (typeof bruto !== 'object' || bruto === null) return null
  const elementosBrutos = Array.isArray(bruto.elementos) ? bruto.elementos : []
  return {
    id: typeof bruto.id === 'string' ? bruto.id : `pagina-${indice + 1}`,
    nome: typeof bruto.nome === 'string' ? bruto.nome : `Página ${indice + 1}`,
    corFundo: typeof bruto.corFundo === 'string' ? bruto.corFundo : '#ffffff',
    elementos: elementosBrutos
      .map((e) => normalizarElemento(e as Record<string, unknown>))
      .filter((e): e is Elemento => e !== null),
  }
}

/** Normaliza um elemento; retorna null para tipos desconhecidos */
function normalizarElemento(bruto: Record<string, unknown>): Elemento | null {
  if (typeof bruto !== 'object' || bruto === null) return null
  const tipo = bruto.tipo
  const base = {
    id: typeof bruto.id === 'string' ? bruto.id : `el-${Math.random().toString(36).slice(2, 10)}`,
    nome: typeof bruto.nome === 'string' ? bruto.nome : 'Elemento',
    x: numeroOu(bruto.x, 0),
    y: numeroOu(bruto.y, 0),
    rotacao: numeroOu(bruto.rotacao, 0),
    opacidade: numeroOu(bruto.opacidade, 1),
    visivel: bruto.visivel !== false,
    bloqueado: bruto.bloqueado === true,
    mistura: normalizarMistura(bruto.mistura),
  }
  switch (tipo) {
    case 'retangulo':
    case 'elipse':
    case 'triangulo':
    case 'estrela':
      return {
        ...base,
        tipo,
        largura: numeroOu(bruto.largura, 100),
        altura: numeroOu(bruto.altura, 100),
        preenchimento: textoOu(bruto.preenchimento, '#7c4dff'),
        gradiente: normalizarGradiente(bruto.gradiente),
        corBorda: textoOu(bruto.corBorda, '#00000000'),
        espessuraBorda: numeroOu(bruto.espessuraBorda, 0),
        raioCanto: numeroOu(bruto.raioCanto, 0),
        pontas: numeroOu(bruto.pontas, 5),
      }
    case 'texto':
      return {
        ...base,
        tipo,
        texto: textoOu(bruto.texto, 'Texto'),
        fonte: textoOu(bruto.fonte, 'Inter'),
        tamanhoFonte: numeroOu(bruto.tamanhoFonte, 32),
        negrito: bruto.negrito === true,
        italico: bruto.italico === true,
        sublinhado: bruto.sublinhado === true,
        cor: textoOu(bruto.cor, '#1f2937'),
        alinhamento: bruto.alinhamento === 'center' || bruto.alinhamento === 'right'
          ? bruto.alinhamento
          : 'left',
        largura: numeroOu(bruto.largura, 300),
        alturaLinha: numeroOu(bruto.alturaLinha, 1.2),
        espacamentoLetras: numeroOu(bruto.espacamentoLetras, 0),
      }
    case 'imagem':
      return {
        ...base,
        tipo,
        url: textoOu(bruto.url, ''),
        largura: numeroOu(bruto.largura, 200),
        altura: numeroOu(bruto.altura, 200),
        raioCanto: numeroOu(bruto.raioCanto, 0),
        ajustes: normalizarAjustes(bruto.ajustes),
        filtro: textoOu(bruto.filtro, 'nenhum'),
        intensidadeFiltro: numeroOu(bruto.intensidadeFiltro, 1),
        mascara: normalizarMascara(bruto.mascara),
      }
    case 'linha':
      return {
        ...base,
        tipo,
        pontos: Array.isArray(bruto.pontos) && bruto.pontos.length >= 4
          ? (bruto.pontos as number[])
          : [0, 0, 200, 0],
        cor: textoOu(bruto.cor, '#1f2937'),
        espessura: numeroOu(bruto.espessura, 4),
        tracejada: bruto.tracejada === true,
      }
    default:
      return null
  }
}

const MODOS_MISTURA: ModoMistura[] = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion',
]

function normalizarMistura(valor: unknown): ModoMistura {
  return MODOS_MISTURA.includes(valor as ModoMistura) ? (valor as ModoMistura) : 'normal'
}

const MASCARAS: FormatoMascara[] = [
  'nenhuma', 'circulo', 'arredondado', 'triangulo', 'estrela', 'coracao',
]

function normalizarMascara(valor: unknown): FormatoMascara {
  return MASCARAS.includes(valor as FormatoMascara) ? (valor as FormatoMascara) : 'nenhuma'
}

function normalizarAjustes(valor: unknown): typeof AJUSTES_NEUTROS {
  if (typeof valor !== 'object' || valor === null) return { ...AJUSTES_NEUTROS }
  const v = valor as Record<string, unknown>
  return {
    brilho: numeroOu(v.brilho, 0),
    contraste: numeroOu(v.contraste, 0),
    saturacao: numeroOu(v.saturacao, 0),
    temperatura: numeroOu(v.temperatura, 0),
    nitidez: numeroOu(v.nitidez, 0),
    desfoque: numeroOu(v.desfoque, 0),
    vinheta: numeroOu(v.vinheta, 0),
  }
}

function normalizarGradiente(valor: unknown): Gradiente | undefined {
  if (typeof valor !== 'object' || valor === null) return undefined
  const v = valor as Record<string, unknown>
  const paradas = Array.isArray(v.paradas)
    ? v.paradas
        .map((p) => p as Record<string, unknown>)
        .filter((p) => typeof p.cor === 'string')
        .map((p) => ({ deslocamento: numeroOu(p.deslocamento, 0), cor: p.cor as string }))
    : []
  if (paradas.length < 2) return undefined
  return {
    tipo: v.tipo === 'radial' ? 'radial' : 'linear',
    angulo: numeroOu(v.angulo, 90),
    paradas,
  }
}

function numeroOu(valor: unknown, padrao: number): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : padrao
}

function textoOu(valor: unknown, padrao: string): string {
  return typeof valor === 'string' ? valor : padrao
}
