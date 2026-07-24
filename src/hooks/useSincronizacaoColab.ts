// =============================================================
// Sincronização de documento em tempo real: observa a página ativa no
// store do editor e transmite as mudanças de elementos/fundo e de
// comentários aos demais colaboradores. Suprime eco (não reenvia o que
// acabou de chegar da rede).
// =============================================================

import { useEffect, useRef } from 'react'
import { useEditorStore } from '../estado/useEditorStore'
import { estaAplicandoRemoto, useColabStore } from '../estado/useColabStore'
import { Comentario, Elemento } from '../tipos/projeto'

interface Ultimo {
  paginaId: string
  elementos: Elemento[] | null
  corFundo: string
  comentarios: Comentario[] | null
}

export function useSincronizacaoColab() {
  const ultimo = useRef<Ultimo>({ paginaId: '', elementos: null, corFundo: '', comentarios: null })

  useEffect(() => {
    const cancelar = useEditorStore.subscribe((estado) => {
      const pagina = estado.projeto?.paginas.find((p) => p.id === estado.paginaAtivaId)
      if (!pagina) return

      const mudouDoc =
        pagina.id !== ultimo.current.paginaId ||
        pagina.elementos !== ultimo.current.elementos ||
        pagina.corFundo !== ultimo.current.corFundo
      const mudouComentarios =
        pagina.id !== ultimo.current.paginaId || pagina.comentarios !== ultimo.current.comentarios

      // Atualiza a referência sempre (evita reenviar conteúdo remoto)
      ultimo.current = {
        paginaId: pagina.id,
        elementos: pagina.elementos,
        corFundo: pagina.corFundo,
        comentarios: pagina.comentarios,
      }

      const colab = useColabStore.getState()
      if (!colab.conectado || estaAplicandoRemoto()) return
      if (mudouDoc) colab.enviarDoc(pagina.id, pagina.elementos, pagina.corFundo)
      if (mudouComentarios) colab.enviarComentarios(pagina.id, pagina.comentarios)
    })
    return cancelar
  }, [])
}
