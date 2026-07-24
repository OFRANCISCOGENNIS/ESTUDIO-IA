// =============================================================
// Store de projetos — persistência local (localStorage).
// Cada projeto é salvo em uma chave própria para suportar
// documentos grandes (imagens em data URL) sem reescrever tudo.
// Em fases futuras este módulo vira um adapter de API remota.
// =============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { desserializarProjeto, serializarProjeto } from '../nucleo/serializacao'
import { Elemento, Projeto, VERSAO_ESQUEMA_ATUAL } from '../tipos/projeto'

const CHAVE_INDICE = 'dsp:indice'
const prefixoProjeto = (id: string) => `dsp:projeto:${id}`

/** Metadados exibidos nos cartões do dashboard (sem os elementos) */
export interface ResumoProjeto {
  id: string
  nome: string
  larguraCanvas: number
  alturaCanvas: number
  atualizadoEm: string
  miniatura?: string
}

interface EstadoProjetos {
  resumos: ResumoProjeto[]
  carregarIndice: () => void
  criarProjeto: (
    nome: string,
    largura: number,
    altura: number,
    corFundo?: string,
    elementos?: Elemento[],
  ) => Projeto
  carregarProjeto: (id: string) => Projeto | null
  salvarProjeto: (projeto: Projeto) => void
  excluirProjeto: (id: string) => void
  renomearProjeto: (id: string, nome: string) => void
}

function lerIndice(): ResumoProjeto[] {
  try {
    const bruto = localStorage.getItem(CHAVE_INDICE)
    if (!bruto) return []
    const lista = JSON.parse(bruto)
    return Array.isArray(lista) ? (lista as ResumoProjeto[]) : []
  } catch {
    return []
  }
}

function gravarIndice(resumos: ResumoProjeto[]): void {
  localStorage.setItem(CHAVE_INDICE, JSON.stringify(resumos))
}

function resumoDe(projeto: Projeto): ResumoProjeto {
  return {
    id: projeto.id,
    nome: projeto.nome,
    larguraCanvas: projeto.larguraCanvas,
    alturaCanvas: projeto.alturaCanvas,
    atualizadoEm: projeto.atualizadoEm,
    miniatura: projeto.miniatura,
  }
}

export const useProjetosStore = create<EstadoProjetos>((set, get) => ({
  resumos: lerIndice(),

  carregarIndice: () => set({ resumos: lerIndice() }),

  criarProjeto: (nome, largura, altura, corFundo = '#ffffff', elementos = []) => {
    const agora = new Date().toISOString()
    const projeto: Projeto = {
      versaoEsquema: VERSAO_ESQUEMA_ATUAL,
      id: nanoid(12),
      nome,
      larguraCanvas: largura,
      alturaCanvas: altura,
      paginas: [
        {
          id: 'pagina-1',
          nome: 'Página 1',
          corFundo,
          elementos,
          notas: '',
          transicao: 'fade',
          comentarios: [],
        },
      ],
      criadoEm: agora,
      atualizadoEm: agora,
    }
    get().salvarProjeto(projeto)
    return projeto
  },

  carregarProjeto: (id) => {
    try {
      const bruto = localStorage.getItem(prefixoProjeto(id))
      if (!bruto) return null
      return desserializarProjeto(bruto)
    } catch (erro) {
      console.error('Falha ao carregar projeto', id, erro)
      return null
    }
  },

  salvarProjeto: (projeto) => {
    try {
      localStorage.setItem(prefixoProjeto(projeto.id), serializarProjeto(projeto))
    } catch (erro) {
      // localStorage cheio (imagens grandes): salva sem miniatura como fallback
      console.error('Falha ao salvar projeto; tentando sem miniatura', erro)
      try {
        localStorage.setItem(
          prefixoProjeto(projeto.id),
          serializarProjeto({ ...projeto, miniatura: undefined }),
        )
      } catch {
        // Sem espaço mesmo assim — mantém o app funcionando em memória
      }
    }
    const semEste = lerIndice().filter((resumo) => resumo.id !== projeto.id)
    const atualizado = [resumoDe(projeto), ...semEste]
    gravarIndice(atualizado)
    set({ resumos: atualizado })
  },

  excluirProjeto: (id) => {
    localStorage.removeItem(prefixoProjeto(id))
    const atualizado = lerIndice().filter((resumo) => resumo.id !== id)
    gravarIndice(atualizado)
    set({ resumos: atualizado })
  },

  renomearProjeto: (id, nome) => {
    const projeto = get().carregarProjeto(id)
    if (!projeto) return
    get().salvarProjeto({ ...projeto, nome, atualizadoEm: new Date().toISOString() })
  },
}))
