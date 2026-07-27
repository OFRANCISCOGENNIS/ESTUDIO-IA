// =============================================================
// usaMovimentoReduzido — expõe `prefers-reduced-motion` ao JS.
// O CSS já respeita a preferência via @media, mas os componentes
// Konva (canvas) não leem CSS: precisam consultar isto para zerar
// translação/scale/spring preservando a informação (§7.7).
// =============================================================

import { useEffect, useState } from 'react'

const CONSULTA = '(prefers-reduced-motion: reduce)'

/** Leitura síncrona (para código fora de componentes, ex.: Konva) */
export function movimentoReduzido(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(CONSULTA).matches === true
}

/** Hook reativo: re-renderiza se o usuário mudar a preferência */
export function usaMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState(movimentoReduzido)

  useEffect(() => {
    const mq = window.matchMedia?.(CONSULTA)
    if (!mq) return
    const aoMudar = (e: MediaQueryListEvent) => setReduzido(e.matches)
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  return reduzido
}
