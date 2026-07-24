// =============================================================
// Serialização do projeto — JSON versionado e retrocompatível.
// Toda leitura passa por `desserializarProjeto`, que valida e
// migra esquemas antigos para a versão atual.
// =============================================================

import {
  Elemento,
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
 * Cada `case` transforma a versão N em N+1 (sem `break`, cascata).
 */
function migrarEsquema(bruto: Record<string, unknown>): Record<string, unknown> {
  const versao = typeof bruto.versaoEsquema === 'number' ? bruto.versaoEsquema : 1
  if (versao > VERSAO_ESQUEMA_ATUAL) {
    throw new Error(
      `Projeto criado em versão mais recente (esquema ${versao}). Atualize o aplicativo.`,
    )
  }
  // Futuras migrações entram aqui, ex.:
  // if (versao < 2) { /* transformar v1 -> v2 */ }
  return { ...bruto, versaoEsquema: VERSAO_ESQUEMA_ATUAL }
}

/** Garante todos os campos obrigatórios com padrões seguros */
function normalizarProjeto(bruto: Record<string, unknown>): Projeto {
  if (typeof bruto.id !== 'string' || bruto.id.length === 0) {
    throw new Error('Projeto sem identificador')
  }
  const elementosBrutos = Array.isArray(bruto.elementos) ? bruto.elementos : []
  const agora = new Date().toISOString()
  return {
    versaoEsquema: VERSAO_ESQUEMA_ATUAL,
    id: bruto.id,
    nome: typeof bruto.nome === 'string' ? bruto.nome : 'Design sem título',
    larguraCanvas: numeroOu(bruto.larguraCanvas, 1080),
    alturaCanvas: numeroOu(bruto.alturaCanvas, 1080),
    corFundo: typeof bruto.corFundo === 'string' ? bruto.corFundo : '#ffffff',
    elementos: elementosBrutos
      .map((elemento) => normalizarElemento(elemento as Record<string, unknown>))
      .filter((elemento): elemento is Elemento => elemento !== null),
    criadoEm: typeof bruto.criadoEm === 'string' ? bruto.criadoEm : agora,
    atualizadoEm: typeof bruto.atualizadoEm === 'string' ? bruto.atualizadoEm : agora,
    miniatura: typeof bruto.miniatura === 'string' ? bruto.miniatura : undefined,
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

function numeroOu(valor: unknown, padrao: number): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : padrao
}

function textoOu(valor: unknown, padrao: string): string {
  return typeof valor === 'string' ? valor : padrao
}
