// =============================================================
// Banco de imagens do histórico.
//
// O snapshot de undo/redo serializa as páginas inteiras, e uma imagem
// mora no projeto como data URL (`ElementoImagem.url`). Sem tratamento,
// cada passo de histórico carrega uma cópia nova de todo o base64 — com
// capacidade de 100 passos, uma única foto de 500 KB vira ~50 MB de
// texto repetido na memória.
//
// Aqui o data URL vira uma referência curta na hora de serializar, e
// volta ao original na hora de restaurar. O conteúdo fica guardado uma
// única vez, por valor: imagens idênticas compartilham a referência.
// =============================================================

const PREFIXO = 'banco:img:'

/** data URL → referência (deduplica por conteúdo) */
const porConteudo = new Map<string, string>()
/** referência → data URL */
const porReferencia = new Map<string, string>()
let proximoId = 0

/** Guarda o data URL e devolve a referência curta que o representa. */
export function referenciar(dataUrl: string): string {
  const existente = porConteudo.get(dataUrl)
  if (existente) return existente

  const ref = `${PREFIXO}${proximoId++}`
  porConteudo.set(dataUrl, ref)
  porReferencia.set(ref, dataUrl)
  return ref
}

/**
 * Devolve o data URL de uma referência. Se a referência for desconhecida
 * (banco limpo antes da restauração), devolve o próprio texto — a imagem
 * some, mas o resto do snapshot continua utilizável.
 */
export function resolver(ref: string): string {
  return porReferencia.get(ref) ?? ref
}

/**
 * Esvazia o banco. Só é seguro quando nenhum snapshot vivo depende dele
 * — na prática, junto do `historico.limpar()` ao trocar de projeto.
 */
export function limparBanco(): void {
  porConteudo.clear()
  porReferencia.clear()
  proximoId = 0
}

/** Quantas imagens distintas o banco guarda (usado em teste e diagnóstico). */
export function tamanhoBanco(): number {
  return porReferencia.size
}

/**
 * Serializa trocando todo data URL do campo `url` por uma referência.
 * `url` só existe em ElementoImagem no esquema, então a troca por chave
 * é inequívoca e funciona em qualquer profundidade.
 */
export function serializarComBanco(valor: unknown): string {
  return JSON.stringify(valor, (chave, bruto) =>
    chave === 'url' && typeof bruto === 'string' && bruto.startsWith('data:')
      ? referenciar(bruto)
      : bruto,
  )
}

/** Desserializa devolvendo os data URLs no lugar das referências. */
export function desserializarComBanco<T>(texto: string): T {
  return JSON.parse(texto, (chave, bruto) =>
    chave === 'url' && typeof bruto === 'string' && bruto.startsWith(PREFIXO)
      ? resolver(bruto)
      : bruto,
  ) as T
}
