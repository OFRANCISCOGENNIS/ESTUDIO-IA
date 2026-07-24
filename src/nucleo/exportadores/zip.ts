// =============================================================
// Escritor de ZIP mínimo (método "store", sem compressão) para gerar
// arquivos .pptx (que são ZIPs OOXML). Puro — sem dependências.
// =============================================================

export interface ArquivoZip {
  nome: string
  dados: Uint8Array
}

/** CRC-32 (polinômio padrão do ZIP) */
function crc32(dados: Uint8Array): number {
  let c = ~0
  for (let i = 0; i < dados.length; i++) {
    c ^= dados[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (~c) >>> 0
}

const codificador = new TextEncoder()

/** Monta um arquivo ZIP a partir de uma lista de entradas */
export function criarZip(arquivos: ArquivoZip[]): Uint8Array {
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let deslocamento = 0

  for (const arquivo of arquivos) {
    const nome = codificador.encode(arquivo.nome)
    const crc = crc32(arquivo.dados)
    const tamanho = arquivo.dados.length

    // Cabeçalho de arquivo local (30 bytes + nome)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true) // versão necessária
    local.setUint16(6, 0, true) // flags
    local.setUint16(8, 0, true) // método = store
    local.setUint16(10, 0, true) // hora
    local.setUint16(12, 0x21, true) // data (mín. válida)
    local.setUint32(14, crc, true)
    local.setUint32(18, tamanho, true)
    local.setUint32(22, tamanho, true)
    local.setUint16(26, nome.length, true)
    local.setUint16(28, 0, true) // extra
    const localBytes = new Uint8Array(local.buffer)

    partes.push(localBytes, nome, arquivo.dados)

    // Entrada no diretório central (46 bytes + nome)
    const cd = new DataView(new ArrayBuffer(46))
    cd.setUint32(0, 0x02014b50, true)
    cd.setUint16(4, 20, true) // versão criadora
    cd.setUint16(6, 20, true) // versão necessária
    cd.setUint16(8, 0, true)
    cd.setUint16(10, 0, true) // método
    cd.setUint16(12, 0, true)
    cd.setUint16(14, 0x21, true)
    cd.setUint32(16, crc, true)
    cd.setUint32(20, tamanho, true)
    cd.setUint32(24, tamanho, true)
    cd.setUint16(28, nome.length, true)
    cd.setUint16(30, 0, true)
    cd.setUint16(32, 0, true)
    cd.setUint16(34, 0, true)
    cd.setUint16(36, 0, true)
    cd.setUint32(38, 0, true)
    cd.setUint32(42, deslocamento, true)
    central.push(new Uint8Array(cd.buffer), nome)

    deslocamento += localBytes.length + nome.length + arquivo.dados.length
  }

  const inicioCentral = deslocamento
  let tamanhoCentral = 0
  for (const parte of central) tamanhoCentral += parte.length

  // Fim do diretório central (EOCD)
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(4, 0, true)
  eocd.setUint16(6, 0, true)
  eocd.setUint16(8, arquivos.length, true)
  eocd.setUint16(10, arquivos.length, true)
  eocd.setUint32(12, tamanhoCentral, true)
  eocd.setUint32(16, inicioCentral, true)
  eocd.setUint16(20, 0, true)

  const todas = [...partes, ...central, new Uint8Array(eocd.buffer)]
  let total = 0
  for (const parte of todas) total += parte.length
  const saida = new Uint8Array(total)
  let pos = 0
  for (const parte of todas) {
    saida.set(parte, pos)
    pos += parte.length
  }
  return saida
}

/** Converte texto UTF-8 em bytes (utilitário para os XML do PPTX) */
export function textoParaBytes(texto: string): Uint8Array {
  return codificador.encode(texto)
}
