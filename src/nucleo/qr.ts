// =============================================================
// Gerador de QR Code — implementação própria, sem dependências.
// Modo byte, correção de erros nível M, versões 1–10 (até ~200
// caracteres), máscara 0. Segue o algoritmo clássico (ISO 18004):
// codewords + Reed-Solomon em GF(256), intercalação de blocos,
// padrões de função e bits de formato/versão com BCH.
// Saída: matriz booleana e SVG data URL para inserir no canvas.
// =============================================================

// ---- Tabelas (nível M, versões 1–10) ----

/** Codewords de correção por bloco (nível M), índice = versão */
const ECC_POR_BLOCO = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]
/** Número de blocos de correção (nível M), índice = versão */
const NUM_BLOCOS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]
/** Posições centrais dos padrões de alinhamento, índice = versão */
const ALINHAMENTO: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

const VERSAO_MAXIMA = 10

/** Total de módulos de dados disponíveis na versão (fórmula padrão) */
function modulosBrutos(versao: number): number {
  let resultado = (16 * versao + 128) * versao + 64
  if (versao >= 2) {
    const numAlinh = Math.floor(versao / 7) + 2
    resultado -= (25 * numAlinh - 10) * numAlinh - 55
    if (versao >= 7) resultado -= 36
  }
  return resultado
}

/** Capacidade de DADOS em bytes da versão (nível M), já sem o ECC */
function capacidadeDados(versao: number): number {
  return (
    Math.floor(modulosBrutos(versao) / 8) - ECC_POR_BLOCO[versao] * NUM_BLOCOS[versao]
  )
}

// ---- Aritmética em GF(256) com polinômio 0x11D ----

function gfMultiplicar(a: number, b: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((b >>> i) & 1) * a
  }
  return z & 0xff
}

/** Polinômio gerador de Reed-Solomon com o grau pedido */
function divisorRS(grau: number): number[] {
  const resultado = new Array<number>(grau).fill(0)
  resultado[grau - 1] = 1
  let raiz = 1
  for (let i = 0; i < grau; i++) {
    for (let j = 0; j < grau; j++) {
      resultado[j] = gfMultiplicar(resultado[j], raiz)
      if (j + 1 < grau) resultado[j] ^= resultado[j + 1]
    }
    raiz = gfMultiplicar(raiz, 0x02)
  }
  return resultado
}

/** Resto da divisão polinomial (os codewords de correção) */
function restoRS(dados: number[], divisor: number[]): number[] {
  const resto = new Array<number>(divisor.length).fill(0)
  for (const b of dados) {
    const fator = b ^ (resto.shift() as number)
    resto.push(0)
    for (let i = 0; i < divisor.length; i++) {
      resto[i] ^= gfMultiplicar(divisor[i], fator)
    }
  }
  return resto
}

// ---- Montagem do fluxo de bits ----

class FluxoBits {
  bits: number[] = []
  anexar(valor: number, quantidade: number): void {
    for (let i = quantidade - 1; i >= 0; i--) this.bits.push((valor >>> i) & 1)
  }
}

/** Escolhe a menor versão (1–10) que comporta o texto em modo byte */
function escolherVersao(numBytes: number): number {
  for (let v = 1; v <= VERSAO_MAXIMA; v++) {
    const bitsContador = v <= 9 ? 8 : 16
    const capacidadeBits = capacidadeDados(v) * 8
    if (4 + bitsContador + numBytes * 8 <= capacidadeBits) return v
  }
  throw new Error(`Texto longo demais para um QR (máx. ~${capacidadeDados(VERSAO_MAXIMA) - 3} bytes)`)
}

/** Codifica o texto em codewords finais (dados + ECC intercalados) */
function codificarCodewords(texto: string, versao: number): number[] {
  const bytes = Array.from(new TextEncoder().encode(texto))
  const fluxo = new FluxoBits()
  fluxo.anexar(0b0100, 4) // modo byte
  fluxo.anexar(bytes.length, versao <= 9 ? 8 : 16)
  for (const b of bytes) fluxo.anexar(b, 8)

  const capacidadeBits = capacidadeDados(versao) * 8
  // Terminador + alinhamento a byte
  fluxo.anexar(0, Math.min(4, capacidadeBits - fluxo.bits.length))
  fluxo.anexar(0, (8 - (fluxo.bits.length % 8)) % 8)
  // Bytes de preenchimento alternados
  for (let pad = 0xec; fluxo.bits.length < capacidadeBits; pad ^= 0xec ^ 0x11) {
    fluxo.anexar(pad, 8)
  }

  const dados: number[] = []
  for (let i = 0; i < fluxo.bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | fluxo.bits[i + j]
    dados.push(b)
  }

  // Divide em blocos, calcula ECC e intercala
  const numBlocos = NUM_BLOCOS[versao]
  const eccPorBloco = ECC_POR_BLOCO[versao]
  const totalCodewords = Math.floor(modulosBrutos(versao) / 8)
  const blocosCurtos = numBlocos - (totalCodewords % numBlocos)
  const tamanhoCurto = Math.floor(totalCodewords / numBlocos)
  const divisor = divisorRS(eccPorBloco)

  const blocos: number[][] = []
  for (let i = 0, k = 0; i < numBlocos; i++) {
    const tamDados = tamanhoCurto - eccPorBloco + (i < blocosCurtos ? 0 : 1)
    const dat = dados.slice(k, k + tamDados)
    k += tamDados
    const bloco = dat.slice()
    if (i < blocosCurtos) bloco.push(0) // marcador do slot ausente
    bloco.push(...restoRS(dat, divisor))
    blocos.push(bloco)
  }

  const resultado: number[] = []
  for (let i = 0; i < blocos[0].length; i++) {
    for (let j = 0; j < blocos.length; j++) {
      if (i !== tamanhoCurto - eccPorBloco || j >= blocosCurtos) {
        resultado.push(blocos[j][i])
      }
    }
  }
  return resultado
}

// ---- Desenho da matriz ----

export interface MatrizQr {
  tamanho: number
  /** matriz[linha][coluna] = módulo escuro? */
  modulos: boolean[][]
  versao: number
}

/** Gera a matriz de módulos do QR para o texto dado */
export function gerarQr(texto: string): MatrizQr {
  if (!texto) throw new Error('Texto vazio')
  const numBytes = new TextEncoder().encode(texto).length
  const versao = escolherVersao(numBytes)
  const tamanho = versao * 4 + 17
  const modulos: boolean[][] = Array.from({ length: tamanho }, () =>
    new Array<boolean>(tamanho).fill(false),
  )
  const ehFuncao: boolean[][] = Array.from({ length: tamanho }, () =>
    new Array<boolean>(tamanho).fill(false),
  )

  const definirFuncao = (x: number, y: number, escuro: boolean) => {
    modulos[y][x] = escuro
    ehFuncao[y][x] = true
  }

  // Padrões temporais (linhas alternadas)
  for (let i = 0; i < tamanho; i++) {
    definirFuncao(6, i, i % 2 === 0)
    definirFuncao(i, 6, i % 2 === 0)
  }

  // Padrões localizadores (3 cantos) com separadores
  const desenharLocalizador = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x < 0 || x >= tamanho || y < 0 || y >= tamanho) continue
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        definirFuncao(x, y, dist !== 2 && dist !== 4)
      }
    }
  }
  desenharLocalizador(3, 3)
  desenharLocalizador(tamanho - 4, 3)
  desenharLocalizador(3, tamanho - 4)

  // Padrões de alinhamento (pulando os que caem nos localizadores)
  const centros = ALINHAMENTO[versao]
  for (let i = 0; i < centros.length; i++) {
    for (let j = 0; j < centros.length; j++) {
      const pulo =
        (i === 0 && j === 0) ||
        (i === 0 && j === centros.length - 1) ||
        (i === centros.length - 1 && j === 0)
      if (pulo) continue
      const cx = centros[i]
      const cy = centros[j]
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          definirFuncao(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
        }
      }
    }
  }

  // Bits de formato (nível M = 00, máscara 0) com BCH(15,5)
  const mascara = 0
  const dadosFormato = (0b00 << 3) | mascara
  let restoFmt = dadosFormato
  for (let i = 0; i < 10; i++) restoFmt = (restoFmt << 1) ^ ((restoFmt >>> 9) * 0x537)
  const bitsFormato = ((dadosFormato << 10) | restoFmt) ^ 0x5412
  const bitFmt = (i: number) => ((bitsFormato >>> i) & 1) === 1

  for (let i = 0; i <= 5; i++) definirFuncao(8, i, bitFmt(i))
  definirFuncao(8, 7, bitFmt(6))
  definirFuncao(8, 8, bitFmt(7))
  definirFuncao(7, 8, bitFmt(8))
  for (let i = 9; i < 15; i++) definirFuncao(14 - i, 8, bitFmt(i))
  for (let i = 0; i < 8; i++) definirFuncao(tamanho - 1 - i, 8, bitFmt(i))
  for (let i = 8; i < 15; i++) definirFuncao(8, tamanho - 15 + i, bitFmt(i))
  definirFuncao(8, tamanho - 8, true) // módulo escuro fixo

  // Bits de versão (somente v7+), BCH(18,6)
  if (versao >= 7) {
    let restoVer = versao
    for (let i = 0; i < 12; i++) restoVer = (restoVer << 1) ^ ((restoVer >>> 11) * 0x1f25)
    const bitsVersao = (versao << 12) | restoVer
    for (let i = 0; i < 18; i++) {
      const bit = ((bitsVersao >>> i) & 1) === 1
      const a = tamanho - 11 + (i % 3)
      const b = Math.floor(i / 3)
      definirFuncao(a, b, bit)
      definirFuncao(b, a, bit)
    }
  }

  // Dados em zigue-zague (colunas de 2, alternando o sentido)
  const codewords = codificarCodewords(texto, versao)
  let indiceBit = 0
  for (let direita = tamanho - 1; direita >= 1; direita -= 2) {
    if (direita === 6) direita = 5
    for (let vertical = 0; vertical < tamanho; vertical++) {
      for (let j = 0; j < 2; j++) {
        const x = direita - j
        const sobe = ((direita + 1) & 2) === 0
        const y = sobe ? tamanho - 1 - vertical : vertical
        if (!ehFuncao[y][x] && indiceBit < codewords.length * 8) {
          modulos[y][x] =
            ((codewords[indiceBit >>> 3] >>> (7 - (indiceBit & 7))) & 1) === 1
          indiceBit++
        }
      }
    }
  }

  // Máscara 0: inverte módulos de dados onde (x+y) é par
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      if (!ehFuncao[y][x] && (x + y) % 2 === 0) modulos[y][x] = !modulos[y][x]
    }
  }

  return { tamanho, modulos, versao }
}

/** Serializa a matriz como SVG data URL (com margem de sossego de 4 módulos) */
export function qrParaSvgDataUrl(texto: string, corEscura = '#000000', corClara = '#ffffff'): string {
  const { tamanho, modulos } = gerarQr(texto)
  const margem = 4
  const total = tamanho + margem * 2
  let caminhos = ''
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      if (modulos[y][x]) caminhos += `M${x + margem} ${y + margem}h1v1h-1z`
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="${corClara}"/>` +
    `<path d="${caminhos}" fill="${corEscura}"/>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
