// =============================================================
// BoasVindas — primeiro acesso (docs/PROMPT-UI.md §9.3).
// O logo se monta com a faísca traçando o caminho, uma linha só de
// copy, fundo superficie-950→900 e no máximo 6 partículas lentíssimas
// (loop de 40s). Calmo, caro, vivo — some sozinho e nunca mais volta.
// =============================================================

import { useEffect, useState } from 'react'

const CHAVE = 'dsp:jaVisitou'

/** 6 partículas com posição/atraso fixos (nada de aleatório por render) */
const PARTICULAS = [
  { esq: '12%', topo: '22%', atraso: '0s', escala: 1 },
  { esq: '27%', topo: '68%', atraso: '6s', escala: 0.7 },
  { esq: '48%', topo: '14%', atraso: '12s', escala: 0.55 },
  { esq: '66%', topo: '58%', atraso: '18s', escala: 0.85 },
  { esq: '81%', topo: '30%', atraso: '24s', escala: 0.6 },
  { esq: '92%', topo: '74%', atraso: '30s', escala: 0.45 },
]

export function BoasVindas() {
  const [visivel, setVisivel] = useState(() => {
    try {
      return localStorage.getItem(CHAVE) !== 'sim'
    } catch {
      return false
    }
  })
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    if (!visivel) return
    try {
      localStorage.setItem(CHAVE, 'sim')
    } catch {
      // Sem armazenamento: mostra desta vez e segue a vida
    }
    const inicioSaida = setTimeout(() => setSaindo(true), 2600)
    const fim = setTimeout(() => setVisivel(false), 3000)
    return () => {
      clearTimeout(inicioSaida)
      clearTimeout(fim)
    }
  }, [visivel])

  if (!visivel) return null

  return (
    <div
      role="status"
      aria-label="Bem-vindo ao estúdio"
      onClick={() => setVisivel(false)}
      className={`fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-gradient-to-b from-superficie-950 to-superficie-900 transition-opacity duration-longa ease-facil-saida ${
        saindo ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Partículas lentíssimas (40s) — no máximo 6 */}
      {PARTICULAS.map((p, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="particula-lenta pointer-events-none absolute rounded-full bg-primaria-400/50 blur-[1px]"
          style={{
            left: p.esq,
            top: p.topo,
            width: `${6 * p.escala}px`,
            height: `${6 * p.escala}px`,
            animationDelay: p.atraso,
          }}
        />
      ))}

      {/* Logo montado pela faísca que traça o caminho */}
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" className="mb-6">
        <rect
          x="8"
          y="8"
          width="56"
          height="56"
          rx="16"
          stroke="#7c4dff"
          strokeWidth="2.5"
          pathLength={1}
          className="traco-logo"
        />
        <text
          x="36"
          y="47"
          textAnchor="middle"
          fontSize="30"
          fontWeight="800"
          fill="#ffffff"
          className="letra-logo"
        >
          D
        </text>
      </svg>

      <p className="text-lg font-semibold tracking-tight text-white letra-logo">
        Bem-vindo ao estúdio.
      </p>
    </div>
  )
}
