// =============================================================
// Gerador de PDF mínimo — uma página por imagem JPEG (DCTDecode).
// Puro, sem dependências. Usado para exportar a apresentação/documento
// (cada página do projeto vira uma página do PDF).
// =============================================================

export interface ImagemPdf {
  jpeg: Uint8Array
  largura: number
  altura: number
}

const enc = (s: string) => new TextEncoder().encode(s)

/** Monta um PDF com uma página por imagem */
export function criarPdf(imagens: ImagemPdf[]): Uint8Array {
  const partes: Uint8Array[] = []
  let comprimento = 0
  const deslocamentos: Record<number, number> = {}

  const push = (bytes: Uint8Array) => {
    partes.push(bytes)
    comprimento += bytes.length
  }
  const iniciarObj = (num: number) => {
    deslocamentos[num] = comprimento
    push(enc(`${num} 0 obj\n`))
  }
  const fecharObj = () => push(enc('endobj\n'))

  // Cabeçalho (com comentário binário recomendado)
  push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))

  const n = imagens.length
  const numsPagina = imagens.map((_, i) => 3 + i * 3)

  // 1: Catálogo
  iniciarObj(1)
  push(enc('<< /Type /Catalog /Pages 2 0 R >>\n'))
  fecharObj()

  // 2: Árvore de páginas
  iniciarObj(2)
  push(enc(`<< /Type /Pages /Kids [${numsPagina.map((p) => `${p} 0 R`).join(' ')}] /Count ${n} >>\n`))
  fecharObj()

  imagens.forEach((img, i) => {
    const numPagina = 3 + i * 3
    const numImagem = 4 + i * 3
    const numConteudo = 5 + i * 3
    const { jpeg, largura, altura } = img

    // Página
    iniciarObj(numPagina)
    push(
      enc(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${largura} ${altura}] ` +
          `/Resources << /XObject << /Im0 ${numImagem} 0 R >> >> /Contents ${numConteudo} 0 R >>\n`,
      ),
    )
    fecharObj()

    // Imagem (JPEG via DCTDecode)
    iniciarObj(numImagem)
    push(
      enc(
        `<< /Type /XObject /Subtype /Image /Width ${largura} /Height ${altura} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
      ),
    )
    push(jpeg)
    push(enc('\nendstream\n'))
    fecharObj()

    // Fluxo de conteúdo: desenha a imagem cobrindo a página
    const conteudo = enc(`q\n${largura} 0 0 ${altura} 0 0 cm\n/Im0 Do\nQ\n`)
    iniciarObj(numConteudo)
    push(enc(`<< /Length ${conteudo.length} >>\nstream\n`))
    push(conteudo)
    push(enc('\nendstream\n'))
    fecharObj()
  })

  // Tabela de referências cruzadas
  const totalObjs = 2 + n * 3
  const deslocamentoXref = comprimento
  push(enc(`xref\n0 ${totalObjs + 1}\n`))
  push(enc('0000000000 65535 f \n'))
  for (let num = 1; num <= totalObjs; num++) {
    push(enc(`${String(deslocamentos[num]).padStart(10, '0')} 00000 n \n`))
  }
  push(enc(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${deslocamentoXref}\n%%EOF\n`))

  const saida = new Uint8Array(comprimento)
  let pos = 0
  for (const parte of partes) {
    saida.set(parte, pos)
    pos += parte.length
  }
  return saida
}
