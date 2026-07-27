// =============================================================
// Store de estado de UI do editor (Fase 3 do redesign):
// aba ativa da trilha, largura do painel direito (persistida),
// densidade e abertura da paleta de comandos.
// =============================================================

import { create } from 'zustand'

const CHAVE_LARGURA = 'dsp:larguraPainel'
const MIN_PAINEL = 240
const MAX_PAINEL = 400

function lerLargura(): number {
  const v = Number(localStorage.getItem(CHAVE_LARGURA))
  return Number.isFinite(v) && v >= MIN_PAINEL && v <= MAX_PAINEL ? v : 320
}

interface EstadoUi {
  abaFerramentas: string
  larguraPainel: number
  paletaAberta: boolean
  /** Verdadeiro enquanto um elemento é arrastado no canvas (esconde flutuantes) */
  arrastando: boolean
  definirAba: (aba: string) => void
  definirLarguraPainel: (px: number) => void
  abrirPaleta: () => void
  fecharPaleta: () => void
  alternarPaleta: () => void
  definirArrastando: (v: boolean) => void
}

export const useUiStore = create<EstadoUi>((set) => ({
  abaFerramentas: 'Templates',
  larguraPainel: lerLargura(),
  paletaAberta: false,
  arrastando: false,

  definirAba: (aba) => set({ abaFerramentas: aba }),

  definirLarguraPainel: (px) => {
    const largura = Math.max(MIN_PAINEL, Math.min(MAX_PAINEL, Math.round(px)))
    localStorage.setItem(CHAVE_LARGURA, String(largura))
    set({ larguraPainel: largura })
  },

  abrirPaleta: () => set({ paletaAberta: true }),
  fecharPaleta: () => set({ paletaAberta: false }),
  alternarPaleta: () => set((e) => ({ paletaAberta: !e.paletaAberta })),
  definirArrastando: (v) => set({ arrastando: v }),
}))

export const LIMITES_PAINEL = { min: MIN_PAINEL, max: MAX_PAINEL }
