// =============================================================
// Quantização de cores — extrai as cores dominantes de uma lista de
// pixels. Núcleo PURO da "paleta automática" (a captura de pixels da
// imagem, que depende de canvas/DOM, fica no adaptador). Testável.
//
// Estratégia: histograma 3D grosseiro (buckets de 5 bits por canal),
// ordenação por população e escolha das cores mais frequentes,
// descartando tons quase idênticos aos já escolhidos.
// =============================================================

interface Balde {
  somaR: number
  somaG: number
  somaB: number
  contagem: number
}

function paraHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Distância euclidiana ao quadrado entre duas cores RGB */
function distancia2(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

/**
 * Extrai até `quantidade` cores dominantes de um array plano de pixels
 * RGB ([r,g,b, r,g,b, ...]). Ignora entradas incompletas no fim.
 */
export function quantizarCores(pixels: number[], quantidade: number): string[] {
  const baldes = new Map<number, Balde>()

  for (let i = 0; i + 2 < pixels.length; i += 3) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    // Chave: 5 bits por canal (32 níveis) → 32768 baldes possíveis
    const chave = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    const balde = baldes.get(chave)
    if (balde) {
      balde.somaR += r
      balde.somaG += g
      balde.somaB += b
      balde.contagem += 1
    } else {
      baldes.set(chave, { somaR: r, somaG: g, somaB: b, contagem: 1 })
    }
  }

  // Cor média de cada balde, ordenados por população
  const medias = [...baldes.values()]
    .sort((a, b) => b.contagem - a.contagem)
    .map((balde) => ({
      r: balde.somaR / balde.contagem,
      g: balde.somaG / balde.contagem,
      b: balde.somaB / balde.contagem,
    }))

  // Seleciona evitando cores muito próximas das já escolhidas
  const LIMIAR = 40 * 40 * 3 // ~40 por canal
  const escolhidas: { r: number; g: number; b: number }[] = []
  for (const cor of medias) {
    if (escolhidas.length >= quantidade) break
    if (escolhidas.every((e) => distancia2(e, cor) > LIMIAR)) {
      escolhidas.push(cor)
    }
  }
  // Se a diversidade for baixa, completa com os próximos mais frequentes
  for (const cor of medias) {
    if (escolhidas.length >= quantidade) break
    if (!escolhidas.includes(cor)) escolhidas.push(cor)
  }

  return escolhidas.map((c) => paraHex(c.r, c.g, c.b))
}
