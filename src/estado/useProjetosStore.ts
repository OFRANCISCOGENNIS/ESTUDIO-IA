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
  /** Persiste o projeto. Devolve false quando não coube no localStorage. */
  salvarProjeto: (projeto: Projeto) => boolean
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

function gravarIndice(resumos: ResumoProjeto[]): boolean {
  try {
    localStorage.setItem(CHAVE_INDICE, JSON.stringify(resumos))
    return true
  } catch (erro) {
    console.error('Falha ao gravar o índice de projetos', erro)
    return false
  }
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
    let projetoGravado = false
    let semMiniatura = false
    try {
      localStorage.setItem(prefixoProjeto(projeto.id), serializarProjeto(projeto))
      projetoGravado = true
    } catch (erro) {
      // localStorage cheio (imagens grandes): salva sem miniatura como fallback
      console.error('Falha ao salvar projeto; tentando sem miniatura', erro)
      try {
        localStorage.setItem(
          prefixoProjeto(projeto.id),
          serializarProjeto({ ...projeto, miniatura: undefined }),
        )
        projetoGravado = true
        semMiniatura = true
      } catch (erroSemMiniatura) {
        // Sem espaço mesmo assim — o app segue em memória, mas quem
        // chamou precisa saber para poder avisar antes que o trabalho suma.
        console.error('Falha ao salvar projeto mesmo sem miniatura', erroSemMiniatura)
      }
    }

    // O índice também escreve no localStorage e pode estourar sozinho.
    // Sem proteção, a exceção subia daqui e derrubava o auto-save.
    const semEste = lerIndice().filter((resumo) => resumo.id !== projeto.id)
    const resumo = semMiniatura ? { ...resumoDe(projeto), miniatura: undefined } : resumoDe(projeto)
    const atualizado = [resumo, ...semEste]
    const indiceGravado = gravarIndice(atualizado)
    set({ resumos: atualizado })

    return projetoGravado && indiceGravado
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
