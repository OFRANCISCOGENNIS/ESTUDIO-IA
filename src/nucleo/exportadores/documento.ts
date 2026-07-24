// =============================================================
// Orquestração das exportações de documento (PDF, PPTX, SVG).
// Para PDF/PPTX, percorre TODAS as páginas usando o exportador fiel do
// Konva (registrado pelo CanvasEditor): troca a página ativa, espera o
// quadro renderizar e captura a imagem. Ao final, restaura a página.
// =============================================================

import { useEditorStore } from '../../estado/useEditorStore'
import { exportarDataUrl } from '../exportacao'
import { criarPdf } from './pdf'
import { criarPptx } from './pptx'
import { paginaParaSvg } from './svg'

const proximoQuadro = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Converte base64 em bytes */
function base64ParaBytes(base64: string): Uint8Array {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function jpegDoDataUrl(dataUrl: string): Uint8Array {
  return base64ParaBytes(dataUrl.split(',')[1] ?? '')
}

/** Dispara o download de um conjunto de bytes */
export function baixarBytes(bytes: Uint8Array, mime: string, nomeArquivo: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

interface PaginaCapturada {
  jpeg: Uint8Array
  larguraPx: number
  alturaPx: number
}

/** Renderiza e captura todas as páginas como JPEG (fiel, via Konva) */
async function capturarPaginas(escala: number): Promise<PaginaCapturada[]> {
  const projeto = useEditorStore.getState().projeto
  if (!projeto) return []
  const paginaOriginal = useEditorStore.getState().paginaAtivaId
  const capturas: PaginaCapturada[] = []

  for (const pagina of projeto.paginas) {
    useEditorStore.getState().selecionarPagina(pagina.id)
    await proximoQuadro()
    await proximoQuadro()
    await esperar(60)
    const dataUrl = exportarDataUrl({ formato: 'jpg', escala })
    if (dataUrl) {
      capturas.push({
        jpeg: jpegDoDataUrl(dataUrl),
        larguraPx: Math.round(projeto.larguraCanvas * escala),
        alturaPx: Math.round(projeto.alturaCanvas * escala),
      })
    }
  }

  useEditorStore.getState().selecionarPagina(paginaOriginal)
  return capturas
}

const nomeSeguro = (nome: string) =>
  nome
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase() || 'design'

/** Exporta todas as páginas em um único PDF */
export async function exportarPdf(nomeProjeto: string, escala = 1.5): Promise<void> {
  const capturas = await capturarPaginas(escala)
  if (capturas.length === 0) return
  const pdf = criarPdf(
    capturas.map((c) => ({ jpeg: c.jpeg, largura: c.larguraPx, altura: c.alturaPx })),
  )
  baixarBytes(pdf, 'application/pdf', `${nomeSeguro(nomeProjeto)}.pdf`)
}

/** Exporta todas as páginas em um arquivo PPTX (uma imagem por slide) */
export async function exportarPptx(nomeProjeto: string, escala = 1.5): Promise<void> {
  const projeto = useEditorStore.getState().projeto
  if (!projeto) return
  const capturas = await capturarPaginas(escala)
  if (capturas.length === 0) return
  const pptx = criarPptx(
    capturas.map((c) => ({
      jpeg: c.jpeg,
      largura: projeto.larguraCanvas,
      altura: projeto.alturaCanvas,
    })),
  )
  baixarBytes(
    pptx,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    `${nomeSeguro(nomeProjeto)}.pptx`,
  )
}

/** Exporta a página ATIVA como SVG vetorial */
export function exportarSvg(nomeProjeto: string): void {
  const estado = useEditorStore.getState()
  const projeto = estado.projeto
  if (!projeto) return
  const pagina = projeto.paginas.find((p) => p.id === estado.paginaAtivaId)
  if (!pagina) return
  const svg = paginaParaSvg(pagina, projeto.larguraCanvas, projeto.alturaCanvas)
  baixarBytes(new TextEncoder().encode(svg), 'image/svg+xml', `${nomeSeguro(nomeProjeto)}.svg`)
}
