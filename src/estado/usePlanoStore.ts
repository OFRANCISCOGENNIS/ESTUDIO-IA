// Store do plano atual do usuário (persistido). Em produção viria do
// backend de billing; aqui um seletor permite testar o gating de recursos.

import { create } from 'zustand'
import { Plano } from '../dados/planos'

const CHAVE = 'dsp:plano'

function lerPlano(): Plano {
  const v = localStorage.getItem(CHAVE)
  return v === 'pro' || v === 'time' ? v : 'gratuito'
}

interface EstadoPlano {
  plano: Plano
  definirPlano: (plano: Plano) => void
}

export const usePlanoStore = create<EstadoPlano>((set) => ({
  plano: lerPlano(),
  definirPlano: (plano) => {
    localStorage.setItem(CHAVE, plano)
    set({ plano })
  },
}))
