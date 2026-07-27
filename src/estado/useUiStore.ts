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
  /** Contador de pedidos de "encaixar na tela" (CanvasEditor observa) */
  pedidoEncaixe: number
  /** Grade de alinhamento visível (com snap) */
  mostrarGrade: boolean
  /** Diálogo Localizar e substituir */
  buscaAberta: boolean
  /** Painel do verificador de acessibilidade */
  acessibilidadeAberta: boolean
  definirAba: (aba: string) => void
  definirLarguraPainel: (px: number) => void
  abrirPaleta: () => void
  fecharPaleta: () => void
  alternarPaleta: () => void
  definirArrastando: (v: boolean) => void
  solicitarEncaixe: () => void
  alternarGrade: () => void
  abrirBusca: () => void
  fecharBusca: () => void
  abrirAcessibilidade: () => void
  fecharAcessibilidade: () => void
}

export const useUiStore = create<EstadoUi>((set) => ({
  abaFerramentas: 'Templates',
  larguraPainel: lerLargura(),
  paletaAberta: false,
  arrastando: false,
  pedidoEncaixe: 0,
  mostrarGrade: false,
  buscaAberta: false,
  acessibilidadeAberta: false,

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
  solicitarEncaixe: () => set((e) => ({ pedidoEncaixe: e.pedidoEncaixe + 1 })),
  alternarGrade: () => set((e) => ({ mostrarGrade: !e.mostrarGrade })),
  abrirBusca: () => set({ buscaAberta: true }),
  fecharBusca: () => set({ buscaAberta: false }),
  abrirAcessibilidade: () => set({ acessibilidadeAberta: true }),
  fecharAcessibilidade: () => set({ acessibilidadeAberta: false }),
}))

export const LIMITES_PAINEL = { min: MIN_PAINEL, max: MAX_PAINEL }
