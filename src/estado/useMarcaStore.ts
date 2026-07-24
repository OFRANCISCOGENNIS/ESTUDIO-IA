// =============================================================
// Store do Brand Kit (kits de marca) — persistido em localStorage.
// Cada kit guarda paleta de cores, fontes e logos, aplicáveis ao
// projeto com um clique.
// =============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'

const CHAVE = 'dsp:marcas'

export interface KitMarca {
  id: string
  nome: string
  cores: string[]
  fontes: string[]
  /** Logos como data URLs */
  logos: string[]
}

function ler(): KitMarca[] {
  try {
    const bruto = localStorage.getItem(CHAVE)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? (lista as KitMarca[]) : []
  } catch {
    return []
  }
}

function gravar(kits: KitMarca[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(kits))
  } catch {
    // Armazenamento cheio (logos grandes) — mantém em memória
  }
}

interface EstadoMarca {
  kits: KitMarca[]
  criarKit: (nome: string) => KitMarca
  removerKit: (id: string) => void
  atualizarKit: (id: string, mudancas: Partial<Omit<KitMarca, 'id'>>) => void
  adicionarCor: (id: string, cor: string) => void
  removerCor: (id: string, cor: string) => void
  adicionarLogo: (id: string, url: string) => void
}

export const useMarcaStore = create<EstadoMarca>((set, get) => ({
  kits: ler(),

  criarKit: (nome) => {
    const kit: KitMarca = {
      id: nanoid(8),
      nome: nome.trim() || 'Minha marca',
      cores: ['#7c4dff', '#111827', '#f8fafc'],
      fontes: ['Poppins', 'Inter'],
      logos: [],
    }
    const kits = [kit, ...get().kits]
    gravar(kits)
    set({ kits })
    return kit
  },

  removerKit: (id) => {
    const kits = get().kits.filter((k) => k.id !== id)
    gravar(kits)
    set({ kits })
  },

  atualizarKit: (id, mudancas) => {
    const kits = get().kits.map((k) => (k.id === id ? { ...k, ...mudancas } : k))
    gravar(kits)
    set({ kits })
  },

  adicionarCor: (id, cor) => {
    const kits = get().kits.map((k) =>
      k.id === id && !k.cores.includes(cor) ? { ...k, cores: [...k.cores, cor] } : k,
    )
    gravar(kits)
    set({ kits })
  },

  removerCor: (id, cor) => {
    const kits = get().kits.map((k) =>
      k.id === id ? { ...k, cores: k.cores.filter((c) => c !== cor) } : k,
    )
    gravar(kits)
    set({ kits })
  },

  adicionarLogo: (id, url) => {
    const kits = get().kits.map((k) => (k.id === id ? { ...k, logos: [...k.logos, url] } : k))
    gravar(kits)
    set({ kits })
  },
}))
