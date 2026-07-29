// =============================================================
// Escolha de escala e formato para caber num orçamento de bytes.
//
// Limitar só a dimensão não basta: um PNG 1600×1600 com muita variação
// passa dos 5 MB sozinho — mais que a cota inteira do localStorage —
// enquanto o JPEG sai comprimido por qualidade. Aqui a redução é guiada
// pelo tamanho real do resultado, não pelo número de pixels.
//
// A codificação entra por parâmetro para esta lógica ficar testável sem
// canvas; quem tem DOM é o utilitário que a chama.
// =============================================================

export type FormatoImagem = 'png' | 'jpeg'

/**
 * Teto do data URL. O localStorage costuma dar ~5 MB no total, e um
 * projeto guarda várias imagens mais o histórico — 1,4 MB por imagem
 * deixa margem para um punhado delas sem estourar a cota.
 */
export const TETO_DATA_URL = 1_400_000

/** Reduções tentadas em ordem, antes de abrir mão da transparência. */
const ESCALAS = [1, 0.75, 0.55, 0.4]

export interface ResultadoCompressao {
  url: string
  escala: number
  formato: FormatoImagem
  /** true quando a transparência foi sacrificada para caber no teto */
  perdeuTransparencia: boolean
}

/**
 * Procura a maior versão que cabe no teto.
 *
 * Com transparência: tenta PNG em escalas decrescentes e, se nenhuma
 * couber, cai para JPEG — imagem visível vale mais que canal alfa
 * preservado num arquivo que não pode ser salvo.
 *
 * Sem transparência: só o caminho JPEG.
 *
 * Se nem a menor tentativa couber, devolve a menor delas: melhor um
 * salvamento apertado que um travamento.
 */
export function comprimirAteCaber(
  codificar: (escala: number, formato: FormatoImagem) => string,
  preservaTransparencia: boolean,
  teto: number = TETO_DATA_URL,
): ResultadoCompressao {
  const formatos: FormatoImagem[] = preservaTransparencia ? ['png', 'jpeg'] : ['jpeg']
  let menor: ResultadoCompressao | null = null

  for (const formato of formatos) {
    for (const escala of ESCALAS) {
      const url = codificar(escala, formato)
      const resultado: ResultadoCompressao = {
        url,
        escala,
        formato,
        perdeuTransparencia: preservaTransparencia && formato === 'jpeg',
      }
      if (url.length <= teto) return resultado
      if (!menor || url.length < menor.url.length) menor = resultado
    }
  }

  // Só chega aqui se nada coube; `menor` está preenchido porque
  // ESCALAS nunca é vazio.
  return menor as ResultadoCompressao
}
