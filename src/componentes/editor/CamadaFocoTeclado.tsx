// =============================================================
// CamadaFocoTeclado — camada de foco DOM espelhando os nós Konva
// (docs/PROMPT-UI.md §10.3). O canvas é <canvas>: sem isto, nada
// dentro dele é alcançável por teclado.
//
// Para cada elemento visível há um botão transparente posicionado
// sobre ele, na ordem de camadas. Tab percorre os objetos, focar
// seleciona, Enter entra na edição de texto, Esc limpa a seleção.
// O contêiner é pointer-events:none — o mouse continua indo direto
// para o Konva (foco por teclado não interfere no canvas).
// =============================================================

import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { useColabStore } from '../../estado/useColabStore'
import { Elemento } from '../../tipos/projeto'

/** Dimensões aproximadas (sem rotação) para posicionar o alvo de foco */
function dimensoes(el: Elemento): { largura: number; altura: number } {
  if (el.tipo === 'linha' || el.tipo === 'caminho') {
    const xs = el.pontos.filter((_, i) => i % 2 === 0)
    const ys = el.pontos.filter((_, i) => i % 2 === 1)
    return {
      largura: Math.max(1, Math.max(...xs) - Math.min(...xs)),
      altura: Math.max(1, Math.max(...ys) - Math.min(...ys)),
    }
  }
  if (el.tipo === 'texto') {
    return { largura: el.largura, altura: el.tamanhoFonte * el.alturaLinha }
  }
  return { largura: el.largura, altura: el.altura }
}

/** Descrição falada do elemento, em pt-BR */
function descrever(el: Elemento, indice: number, total: number): string {
  const conteudo = el.tipo === 'texto' ? `: ${el.texto.slice(0, 40)}` : ''
  const estado = [
    el.bloqueado ? 'bloqueado' : null,
    !el.visivel ? 'oculto' : null,
  ]
    .filter(Boolean)
    .join(', ')
  return `${el.nome}${conteudo}. Camada ${indice} de ${total}${estado ? `, ${estado}` : ''}`
}

export function CamadaFocoTeclado() {
  const pagina = usePaginaAtiva()
  const zoom = useEditorStore((s) => s.zoom)
  const deslocamento = useEditorStore((s) => s.deslocamento)
  const selecionados = useEditorStore((s) => s.selecionados)
  const selecionar = useEditorStore((s) => s.selecionar)
  const limparSelecao = useEditorStore((s) => s.limparSelecao)
  const definirTextoEmEdicao = useEditorStore((s) => s.definirTextoEmEdicao)
  const textoEmEdicao = useEditorStore((s) => s.textoEmEdicao)
  const podeEditar = useColabStore((s) => s.papel === 'editor')

  if (!pagina || textoEmEdicao) return null

  const total = pagina.elementos.length
  // Ordem de camadas: topo primeiro, como o painel de camadas exibe
  const emOrdem = [...pagina.elementos].reverse()

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {emOrdem.map((el, i) => {
        if (!el.visivel) return null
        const d = dimensoes(el)
        const selecionado = selecionados.includes(el.id)
        return (
          <button
            key={el.id}
            type="button"
            // Alvo transparente: só existe para teclado e leitores de tela
            aria-label={descrever(el, i + 1, total)}
            aria-pressed={selecionado}
            onFocus={() => selecionar([el.id])}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && el.tipo === 'texto' && podeEditar && !el.bloqueado) {
                e.preventDefault()
                definirTextoEmEdicao(el.id)
              } else if (e.key === 'Escape') {
                limparSelecao()
                e.currentTarget.blur()
              }
            }}
            className="absolute rounded-sm bg-transparent"
            style={{
              left: el.x * zoom + deslocamento.x,
              top: el.y * zoom + deslocamento.y,
              width: Math.max(4, d.largura * zoom),
              height: Math.max(4, d.altura * zoom),
              transform: el.rotacao ? `rotate(${el.rotacao}deg)` : undefined,
              transformOrigin: 'top left',
            }}
          />
        )
      })}
    </div>
  )
}
