// Costura o build de arquivo único num HTML sem nenhuma requisição externa.
//
// Entradas (produzidas por `npm run site`):
//   dist-site/app.js    — bundle já sem code splitting
//   dist-site/app.css   — estilos do app
//   dist-site/fontes.css — @font-face em data URI
//
// Saída: dist-site/site.html — fragmento de página (sem doctype/html/head/body),
// pronto para ser publicado como página estática.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'dist-site'
const ler = (nome) => {
  const caminho = join(dir, nome)
  if (!existsSync(caminho)) throw new Error(`faltando: ${caminho}`)
  return readFileSync(caminho, 'utf8')
}

// Uma sequência `</script` dentro de uma string do bundle encerraria a tag
// antes da hora; o escape é obrigatório mesmo sendo raro.
const seguro = (s) => s.replace(/<\/(script|style)/gi, '<\\/$1')

const js = ler('app.js')
const css = ler('app.css')
const fontes = ler('fontes.css')

// Nada pode escapar para a rede: o CSP da publicação bloqueia, e o app
// ficaria quebrado em silêncio. Falha aqui é melhor que falha no navegador.
for (const [nome, conteudo] of [
  ['app.css', css],
  ['fontes.css', fontes],
]) {
  const externos = conteudo.match(/url\(\s*['"]?(https?:)?\/\//gi)
  if (externos) throw new Error(`${nome} ainda referencia ${externos.length} URL(s) externa(s)`)
}
if (/from\s+['"]https?:\/\//.test(js)) throw new Error('app.js importa de URL externa')

const html = `<title>DesignStudio Pro</title>
<style>
${fontes}
</style>
<style>
${seguro(css)}
</style>
<div id="root"></div>
<script type="module">
${seguro(js)}
</script>
`

writeFileSync(join(dir, 'site.html'), html)

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`
console.log(`fontes ${kb(fontes)} + css ${kb(css)} + js ${kb(js)} → site.html ${kb(html)}`)
