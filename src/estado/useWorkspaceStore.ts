// =============================================================
// Workspaces / Times — biblioteca de assets compartilhada por equipe,
// persistida no localStorage. Base para times reais em um backend.
// =============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface MembroTime {
  nome: string
  cor: string
}

export interface AssetCompartilhado {
  id: string
  nome: string
  /** Data URL do asset */
  url: string
  proporcao: number
}

export interface Workspace {
  id: string
  nome: string
  membros: MembroTime[]
  assets: AssetCompartilhado[]
}

const CHAVE = 'dsp:workspaces'
const CORES = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

function ler(): Workspace[] {
  try {
    const bruto = localStorage.getItem(CHAVE)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? (lista as Workspace[]) : []
  } catch {
    return []
  }
}

function gravar(ws: Workspace[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ws))
  } catch {
    // Sem espaço (assets grandes) — mantém em memória
  }
}

interface EstadoWorkspace {
  workspaces: Workspace[]
  criar: (nome: string) => Workspace
  remover: (id: string) => void
  adicionarMembro: (id: string, nome: string) => void
  adicionarAsset: (id: string, asset: Omit<AssetCompartilhado, 'id'>) => void
  removerAsset: (id: string, assetId: string) => void
}

export const useWorkspaceStore = create<EstadoWorkspace>((set, get) => ({
  workspaces: ler(),

  criar: (nome) => {
    const ws: Workspace = {
      id: nanoid(8),
      nome: nome.trim() || 'Meu time',
      membros: [{ nome: 'Você', cor: '#7c4dff' }],
      assets: [],
    }
    const lista = [ws, ...get().workspaces]
    gravar(lista)
    set({ workspaces: lista })
    return ws
  },

  remover: (id) => {
    const lista = get().workspaces.filter((w) => w.id !== id)
    gravar(lista)
    set({ workspaces: lista })
  },

  adicionarMembro: (id, nome) => {
    const lista = get().workspaces.map((w) =>
      w.id === id
        ? { ...w, membros: [...w.membros, { nome: nome.trim() || 'Convidado', cor: CORES[w.membros.length % CORES.length] }] }
        : w,
    )
    gravar(lista)
    set({ workspaces: lista })
  },

  adicionarAsset: (id, asset) => {
    const lista = get().workspaces.map((w) =>
      w.id === id ? { ...w, assets: [{ id: nanoid(8), ...asset }, ...w.assets] } : w,
    )
    gravar(lista)
    set({ workspaces: lista })
  },

  removerAsset: (id, assetId) => {
    const lista = get().workspaces.map((w) =>
      w.id === id ? { ...w, assets: w.assets.filter((a) => a.id !== assetId) } : w,
    )
    gravar(lista)
    set({ workspaces: lista })
  },
}))
