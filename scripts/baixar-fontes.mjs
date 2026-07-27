// Baixa o subconjunto latino das fontes do editor e gera um CSS com @font-face
// em data URI, para que o app funcione sem nenhuma requisição externa.
import { writeFileSync } from 'node:fs'

// Só os pesos realmente usados — italico e pesos extras ficam de fora
// para manter o arquivo final pequeno (o navegador sintetiza o itálico).
const FAMILIAS = [
  ['Inter', 'wght@400;600;700'],
  ['Poppins', 'wght@400;700'],
  ['Montserrat', 'wght@400;700'],
  ['Roboto', 'wght@400;700'],
  ['Playfair Display', 'wght@400;700'],
  ['Bebas Neue', ''],
  ['Lobster', ''],
  ['Caveat', 'wght@400;700'],
]

// UA de Chrome moderno faz o Google devolver woff2 (o menor formato)
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const partes = []
let totalBytes = 0

for (const [familia, eixo] of FAMILIAS) {
  const nomeUrl = familia.replace(/ /g, '+')
  const spec = eixo ? `${nomeUrl}:${eixo}` : nomeUrl
  const url = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`

  const css = await fetch(url, { headers: { 'User-Agent': UA } }).then((r) => {
    if (!r.ok) throw new Error(`${familia}: HTTP ${r.status}`)
    return r.text()
  })

  // O CSS vem em blocos comentados por subconjunto: /* latin */, /* cyrillic */...
  // Ficamos apenas com latin e latin-ext.
  const blocos = css.split('@font-face').slice(1)
  let usados = 0

  for (const bloco of blocos) {
    const antes = css.slice(0, css.indexOf(bloco))
    const subconjunto = antes.match(/\/\*\s*([a-z-]+)\s*\*\/\s*$/m)
    const rotulo = [...antes.matchAll(/\/\*\s*([a-z-]+)\s*\*\//g)].pop()?.[1]
    void subconjunto
    // Só o subconjunto latino básico: latin-ext dobrava o tamanho final
    // para cobrir acentos que o português já tem em latin.
    if (rotulo !== 'latin') continue

    const urlFonte = bloco.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (!urlFonte) continue

    const buf = Buffer.from(
      await fetch(urlFonte, { headers: { 'User-Agent': UA } }).then((r) => r.arrayBuffer()),
    )
    totalBytes += buf.length
    usados++

    const b64 = buf.toString('base64')
    const corpo = bloco
      .replace(/url\(https:[^)]+\.woff2\)/, `url(data:font/woff2;base64,${b64})`)
      // unicode-range mantém o navegador seletivo; sem ele o fallback piora
      .trim()
    partes.push(`@font-face${corpo}`)
  }

  console.error(`${familia}: ${usados} arquivo(s)`)
}

const saida = partes.join('\n')
writeFileSync(process.argv[2], saida)
console.error(
  `\nwoff2 bruto: ${(totalBytes / 1024).toFixed(0)} KB → CSS final: ${(saida.length / 1024).toFixed(0)} KB`,
)
