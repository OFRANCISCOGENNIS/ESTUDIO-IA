// =============================================================
// Histórico de versões — snapshots nomeados do projeto, salvos no
// localStorage e restauráveis. Independente por projeto.
// =============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { desserializarProjeto, serializarProjeto } from '../nucleo/serializacao'
import { Projeto } from '../tipos/projeto'
import { gravarLocal, lerLocal } from '../utilitarios/armazenamento'

export interface Versao {
  id: string
  nome: string
  criadoEm: string
  /** Projeto serializado */
  dados: string
}

const chave = (projetoId: string) => `dsp:versoes:${projetoId}`

function ler(projetoId: string): Versao[] {
  try {
    const bruto = lerLocal(chave(projetoId))
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? (lista as Versao[]) : []
  } catch {
    return []
  }
}

function gravar(projetoId: string, versoes: Versao[]): void {
  try {
    gravarLocal(chave(projetoId), JSON.stringify(versoes))
  } catch {
    // Sem espaço — mantém em memória
  }
}

interface EstadoVersoes {
  projetoId: string | null
  versoes: Versao[]
  carregar: (projetoId: string) => void
  salvar: (projeto: Projeto, nome: string) => void
  restaurar: (versaoId: string) => Projeto | null
  remover: (versaoId: string) => void
}

export const useVersoesStore = create<EstadoVersoes>((set, get) => ({
  projetoId: null,
  versoes: [],

  carregar: (projetoId) => set({ projetoId, versoes: ler(projetoId) }),

  salvar: (projeto, nome) => {
    const versao: Versao = {
      id: nanoid(8),
      nome: nome.trim() || `Versão ${new Date().toLocaleString('pt-BR')}`,
      criadoEm: new Date().toISOString(),
      dados: serializarProjeto(projeto),
    }
    const versoes = [versao, ...ler(projeto.id)].slice(0, 50)
    gravar(projeto.id, versoes)
    set({ projetoId: projeto.id, versoes })
  },

  restaurar: (versaoId) => {
    const versao = get().versoes.find((v) => v.id === versaoId)
    if (!versao) return null
    try {
      return desserializarProjeto(versao.dados)
    } catch {
      return null
    }
  },

  remover: (versaoId) => {
    const { projetoId } = get()
    if (!projetoId) return
    const versoes = get().versoes.filter((v) => v.id !== versaoId)
    gravar(projetoId, versoes)
    set({ versoes })
  },
}))
