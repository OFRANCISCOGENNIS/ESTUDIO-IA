// =============================================================
// Exportação de imagens — utilitários puros + registro do
// exportador do canvas (o CanvasEditor injeta a função real,
// que depende do Stage do Konva).
// =============================================================

export type FormatoExportacao = 'png' | 'jpg'

export interface OpcoesExportacao {
  formato: FormatoExportacao
  /** Multiplicador de resolução (1x, 2x...) */
  escala: number
}

/** Tipo MIME correspondente ao formato de exportação */
export function mimeDoFormato(formato: FormatoExportacao): string {
  return formato === 'png' ? 'image/png' : 'image/jpeg'
}

/** Gera nome de arquivo seguro a partir do nome do projeto */
export function nomeArquivoExportacao(
  nomeProjeto: string,
  formato: FormatoExportacao,
): string {
  const limpo = nomeProjeto
    .trim()
    .normalize('NFD')
    // Remove acentos para máxima compatibilidade de nomes de arquivo
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  return `${limpo || 'design'}.${formato}`
}

/** Assinatura do exportador registrado pelo CanvasEditor */
export type FuncaoExportadora = (opcoes: OpcoesExportacao) => string | null

let exportadorAtual: FuncaoExportadora | null = null

/** O CanvasEditor registra aqui a função que rasteriza o Stage */
export function registrarExportador(fn: FuncaoExportadora | null): void {
  exportadorAtual = fn
}

/** Gera o data URL do canvas atual, ou null se não houver canvas montado */
export function exportarDataUrl(opcoes: OpcoesExportacao): string | null {
  return exportadorAtual ? exportadorAtual(opcoes) : null
}

/** Dispara o download de um data URL no navegador */
export function baixarDataUrl(dataUrl: string, nomeArquivo: string): void {
  const link = document.createElement('a')
  link.download = nomeArquivo
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
