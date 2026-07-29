// Monta a landing page em um arquivo único: baixa o subconjunto latino
// das fontes, converte em data URI e injeta no lugar do marcador
// /*FONTES*/ de landing/index.html. A CSP do artifact bloqueia qualquer
// host externo, então nada pode sobrar apontando para fora.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const FAMILIAS = [
  ['Anton', ''],
  ['Work Sans', 'wght@400;600'],
  ['IBM Plex Mono', 'wght@400;500'],
]

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const partes = []
let totalBytes = 0

for (const [familia, eixo] of FAMILIAS) {
  const spec = eixo ? `${familia.replace(/ /g, '+')}:${eixo}` : familia.replace(/ /g, '+')
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${spec}&display=swap`, {
    headers: { 'User-Agent': UA },
  }).then((r) => {
    if (!r.ok) throw new Error(`${familia}: HTTP ${r.status}`)
    return r.text()
  })

  let usados = 0
  for (const bloco of css.split('@font-face').slice(1)) {
    const antes = css.slice(0, css.indexOf(bloco))
    // O CSS vem comentado por subconjunto; só o latino básico interessa
    // (latin-ext dobra o tamanho para acentos que o português já tem).
    if ([...antes.matchAll(/\/\*\s*([a-z-]+)\s*\*\//g)].pop()?.[1] !== 'latin') continue

    const urlFonte = bloco.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (!urlFonte) continue

    const buf = Buffer.from(
      await fetch(urlFonte, { headers: { 'User-Agent': UA } }).then((r) => r.arrayBuffer()),
    )
    totalBytes += buf.length
    usados++
    partes.push(
      `@font-face${bloco
        .replace(/url\(https:[^)]+\.woff2\)/, `url(data:font/woff2;base64,${buf.toString('base64')})`)
        .trim()}`,
    )
  }
  console.error(`${familia}: ${usados} arquivo(s)`)
}

const fontes = partes.join('\n')
const pagina = readFileSync('landing/index.html', 'utf8')
if (!pagina.includes('/*FONTES*/')) throw new Error('marcador /*FONTES*/ não encontrado')

const saida = pagina.replace('/*FONTES*/', fontes)

// Rede de segurança: nada pode restar apontando para fora.
const externas = saida.match(/(?:src|href)\s*=\s*["']https?:\/\/(?!claude\.ai)[^"']+/gi)
if (externas) throw new Error(`recurso externo na página: ${externas[0]}`)
if (/url\(\s*['"]?https?:/i.test(saida)) throw new Error('CSS ainda referencia URL externa')

mkdirSync('dist-site', { recursive: true })
writeFileSync('dist-site/landing.html', saida)
console.error(
  `\nwoff2 ${(totalBytes / 1024).toFixed(0)} KB → fontes ${(fontes.length / 1024).toFixed(0)} KB` +
    ` → landing.html ${(saida.length / 1024).toFixed(0)} KB`,
)
