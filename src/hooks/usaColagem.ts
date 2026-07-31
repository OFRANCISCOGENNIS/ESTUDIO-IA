// =============================================================
// Colagem — um único ponto de entrada para Ctrl+V.
//
// O evento `paste` é usado em vez do atalho de teclado porque só ele
// enxerga a área de transferência do sistema: é o que permite colar
// um print direto no canvas. Quando não há imagem no sistema, a
// colagem interna (elementos copiados no editor) segue normalmente.
//
// Tratar os dois no mesmo lugar evita a colagem dupla que aconteceria
// se o atalho e o evento agissem em paralelo.
// =============================================================

import { useEffect } from 'react'
import { useEditorStore } from '../estado/useEditorStore'
import { useColabStore } from '../estado/useColabStore'
import { criarImagem } from '../nucleo/elementos'
import {
  cascata,
  dimensionarParaCanvas,
  posicionarEm,
  separarImagens,
} from '../nucleo/insercaoImagem'
import { carregarArquivoImagem } from '../utilitarios/imagem'

const emCampoDeTexto = (alvo: EventTarget | null): boolean =>
  alvo instanceof HTMLElement &&
  (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)

export function usaColagem() {
  useEffect(() => {
    const aoColar = async (evento: ClipboardEvent) => {
      // Colar dentro de um campo é colar texto, não inserir no design
      if (emCampoDeTexto(evento.target)) return

      const estado = useEditorStore.getState()
      if (!estado.projeto || estado.textoEmEdicao) return
      if (useColabStore.getState().papel !== 'editor') return

      const { imagens } = separarImagens([...(evento.clipboardData?.files ?? [])])
      if (imagens.length === 0) {
        estado.colar()
        return
      }

      evento.preventDefault()
      const canvas = {
        largura: estado.projeto.larguraCanvas,
        altura: estado.projeto.alturaCanvas,
      }
      const centro = { x: canvas.largura / 2, y: canvas.altura / 2 }

      for (const [i, arquivo] of imagens.entries()) {
        try {
          const img = await carregarArquivoImagem(arquivo)
          const dim = dimensionarParaCanvas(img, canvas)
          const desvio = cascata(i)
          const pos = posicionarEm(
            dim,
            { x: centro.x + desvio.x, y: centro.y + desvio.y },
            canvas,
          )
          useEditorStore
            .getState()
            .adicionarElemento(
              criarImagem(img.url, pos.x, pos.y, dim.largura, dim.altura, {
                nome: 'Imagem colada',
              }),
            )
        } catch {
          // Um item ilegível na área de transferência não impede os outros
        }
      }
    }

    window.addEventListener('paste', aoColar)
    return () => window.removeEventListener('paste', aoColar)
  }, [])
}

/**
 * Impede que soltar um arquivo FORA do canvas faça o navegador abrir
 * esse arquivo no lugar do editor — o app sairia do ar levando junto o
 * que ainda não tinha sido salvo. Só intercepta arrastos de arquivo; o
 * arraste de camadas dentro do painel continua funcionando.
 */
export function usaBloqueioSolturaFora() {
  useEffect(() => {
    const impedir = (evento: DragEvent) => {
      if (!evento.dataTransfer?.types.includes('Files')) return
      evento.preventDefault()
      if (evento.type === 'drop') evento.dataTransfer.dropEffect = 'none'
    }
    window.addEventListener('dragover', impedir)
    window.addEventListener('drop', impedir)
    return () => {
      window.removeEventListener('dragover', impedir)
      window.removeEventListener('drop', impedir)
    }
  }, [])
}
