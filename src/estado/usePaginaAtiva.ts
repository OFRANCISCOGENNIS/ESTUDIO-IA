// Hook utilitário: devolve a página ativa do projeto (ou null).
// Centraliza a seleção para os componentes não repetirem a busca.

import { Pagina } from '../tipos/projeto'
import { useEditorStore } from './useEditorStore'

export function usePaginaAtiva(): Pagina | null {
  return useEditorStore((s) =>
    s.projeto?.paginas.find((p) => p.id === s.paginaAtivaId) ?? null,
  )
}
