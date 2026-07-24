// =============================================================
// Atalhos de teclado profissionais do editor.
// Ignora eventos quando o foco está em campos de texto ou quando
// um texto do canvas está em edição inline.
// =============================================================

import { useEffect } from 'react'
import { useEditorStore } from '../estado/useEditorStore'

export function useAtalhosTeclado() {
  useEffect(() => {
    const manipular = (e: KeyboardEvent) => {
      const estado = useEditorStore.getState()
      // Não interfere na digitação nem na edição inline de texto
      const alvo = e.target
      const emCampo =
        alvo instanceof HTMLElement &&
        (alvo.tagName === 'INPUT' ||
          alvo.tagName === 'TEXTAREA' ||
          alvo.isContentEditable)
      if (emCampo || estado.textoEmEdicao) return

      const comModificador = e.ctrlKey || e.metaKey
      const tecla = e.key.toLowerCase()

      if (comModificador) {
        switch (tecla) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) estado.refazer()
            else estado.desfazer()
            return
          case 'y':
            e.preventDefault()
            estado.refazer()
            return
          case 'c':
            estado.copiarSelecionados()
            return
          case 'v':
            estado.colar()
            return
          case 'd':
            e.preventDefault()
            estado.duplicarSelecionados()
            return
          case 'a': {
            e.preventDefault()
            const ids = estado.projeto?.elementos.map((el) => el.id) ?? []
            estado.selecionar(ids)
            return
          }
          case 's':
            e.preventDefault()
            estado.salvarAgora()
            return
          default:
            return
        }
      }

      // Teclas sem modificador
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          estado.removerSelecionados()
          return
        case 'Escape':
          estado.limparSelecao()
          return
        case 'ArrowLeft':
          e.preventDefault()
          estado.moverSelecionados(e.shiftKey ? -10 : -1, 0)
          return
        case 'ArrowRight':
          e.preventDefault()
          estado.moverSelecionados(e.shiftKey ? 10 : 1, 0)
          return
        case 'ArrowUp':
          e.preventDefault()
          estado.moverSelecionados(0, e.shiftKey ? -10 : -1)
          return
        case 'ArrowDown':
          e.preventDefault()
          estado.moverSelecionados(0, e.shiftKey ? 10 : 1)
          return
      }

      // Seleção de ferramentas por letra
      switch (tecla) {
        case 'v':
          estado.definirFerramenta('selecao')
          break
        case 'h':
          estado.definirFerramenta('mao')
          break
        case 't':
          estado.definirFerramenta('texto')
          break
        case 'r':
          estado.definirFerramenta('retangulo')
          break
        case 'o':
          estado.definirFerramenta('elipse')
          break
        case 'l':
          estado.definirFerramenta('linha')
          break
      }
    }

    window.addEventListener('keydown', manipular)
    return () => window.removeEventListener('keydown', manipular)
  }, [])
}
