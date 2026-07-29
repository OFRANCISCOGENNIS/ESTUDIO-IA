// =============================================================
// usaTelaCompacta — abaixo deste ponto o layout de três colunas do
// editor não cabe.
//
// O estúdio coloca trilha + painel + canvas + propriedades lado a lado.
// Em 1024px isso ainda funciona; abaixo disso o canvas — que é o
// produto — vira uma faixa estreita, e num celular some da tela. Neste
// modo os painéis passam a flutuar SOBRE o canvas, sob demanda, e o
// canvas fica com a largura inteira.
// =============================================================

import { useEffect, useState } from 'react'

const CONSULTA = '(max-width: 1023px)'

/** Leitura síncrona, para quem precisa decidir fora de um componente. */
export function telaCompacta(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(CONSULTA).matches === true
}

/** Hook reativo: acompanha rotação de tela e redimensionamento da janela. */
export function usaTelaCompacta(): boolean {
  const [compacta, setCompacta] = useState(telaCompacta)

  useEffect(() => {
    const mq = window.matchMedia?.(CONSULTA)
    if (!mq) return
    const aoMudar = (e: MediaQueryListEvent) => setCompacta(e.matches)
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  return compacta
}
