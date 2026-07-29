// =============================================================
// Store de colaboração — presença, cursores ao vivo, papel de
// permissão e envio/recebimento de mudanças de documento/comentários.
// Usa o transporte registrado (BroadcastChannel por padrão).
// =============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { obterTransporteColab } from '../nucleo/colab/registro'
import { MensagemColab, Papel, Participante, Usuario } from '../nucleo/colab/tipos'
import { Comentario, Elemento } from '../tipos/projeto'
import { useEditorStore } from './useEditorStore'

const CORES = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
const NOMES = ['Raposa', 'Coruja', 'Lontra', 'Tucano', 'Onça', 'Arara', 'Golfinho', 'Tatu']

const escolher = <T,>(lista: T[]) => lista[Math.floor(Math.random() * lista.length)]

// Flag para suprimir eco: quando aplicamos algo vindo da rede, o hook
// de sincronização não deve reenviar a mesma mudança.
let aplicandoRemoto = false
export function estaAplicandoRemoto(): boolean {
  return aplicandoRemoto
}

const INATIVO_MS = 6000
const HEARTBEAT_MS = 2000
const CURSOR_MS = 45

interface AncoraComentario {
  x: number
  y: number
  elementoId: string | null
}

interface EstadoColab {
  usuario: Usuario
  papel: Papel
  conectado: boolean
  sala: string | null
  participantes: Record<string, Participante>
  /** Modo "adicionar comentário": o próximo clique no canvas fixa um pino */
  modoComentario: boolean
  /** Âncora do comentário em digitação (ou null) */
  comentarioPendente: AncoraComentario | null

  definirNome: (nome: string) => void
  definirPapel: (papel: Papel) => void
  conectar: (sala: string) => void
  desconectar: () => void
  moverCursor: (x: number, y: number) => void
  enviarDoc: (paginaId: string, elementos: Elemento[], corFundo: string) => void
  enviarComentarios: (paginaId: string, comentarios: Comentario[]) => void
  alternarModoComentario: () => void
  definirComentarioPendente: (ancora: AncoraComentario | null) => void
}

let heartbeat: ReturnType<typeof setInterval> | undefined
let ultimoCursor = 0

export const useColabStore = create<EstadoColab>((set, get) => {
  const usuario: Usuario = {
    id: nanoid(8),
    nome: `${escolher(NOMES)} ${Math.floor(Math.random() * 90) + 10}`,
    cor: escolher(CORES),
  }

  const enviar = (m: MensagemColab) => obterTransporteColab().enviar(m)

  // `x`/`y` só vêm nas mensagens de cursor. Presença e entrada não
  // carregam posição: sem preservar a última conhecida, o heartbeat de
  // 2 s jogava o cursor de cada colega para o canto superior esquerdo.
  const upsertParticipante = (u: Usuario, x?: number, y?: number) => {
    if (u.id === get().usuario.id) return
    set((estado) => {
      const anterior = estado.participantes[u.id]
      return {
        participantes: {
          ...estado.participantes,
          [u.id]: {
            ...u,
            x: x ?? anterior?.x ?? 0,
            y: y ?? anterior?.y ?? 0,
            ultimoVisto: Date.now(),
          },
        },
      }
    })
  }

  const aoReceber = (m: MensagemColab) => {
    if (m.remetente === get().usuario.id) return
    switch (m.tipo) {
      case 'entrar':
        upsertParticipante(m.usuario)
        // Responde para o recém-chegado nos conhecer
        enviar({ tipo: 'presenca', remetente: get().usuario.id, usuario: get().usuario })
        break
      case 'presenca':
        upsertParticipante(m.usuario)
        break
      case 'cursor':
        upsertParticipante(m.usuario, m.x, m.y)
        break
      case 'sair':
        set((estado) => {
          const copia = { ...estado.participantes }
          delete copia[m.remetente]
          return { participantes: copia }
        })
        break
      case 'doc': {
        aplicandoRemoto = true
        useEditorStore.getState().aplicarElementosRemotos(m.paginaId, m.elementos, m.corFundo)
        aplicandoRemoto = false
        break
      }
      case 'comentarios': {
        aplicandoRemoto = true
        useEditorStore.getState().aplicarComentariosRemotos(m.paginaId, m.comentarios)
        aplicandoRemoto = false
        break
      }
    }
  }

  return {
    usuario,
    papel: 'editor',
    conectado: false,
    sala: null,
    participantes: {},
    modoComentario: false,
    comentarioPendente: null,

    definirNome: (nome) =>
      set((estado) => ({ usuario: { ...estado.usuario, nome: nome.trim() || estado.usuario.nome } })),

    definirPapel: (papel) => set({ papel }),

    conectar: (sala) => {
      if (get().conectado) get().desconectar()
      obterTransporteColab().conectar(sala, aoReceber)
      set({ conectado: true, sala, participantes: {} })
      enviar({ tipo: 'entrar', remetente: usuario.id, usuario: get().usuario })
      heartbeat = setInterval(() => {
        enviar({ tipo: 'presenca', remetente: usuario.id, usuario: get().usuario })
        // Remove participantes inativos
        const agora = Date.now()
        set((estado) => {
          const ativos: Record<string, Participante> = {}
          for (const [id, p] of Object.entries(estado.participantes)) {
            if (agora - p.ultimoVisto < INATIVO_MS) ativos[id] = p
          }
          return { participantes: ativos }
        })
      }, HEARTBEAT_MS)
    },

    desconectar: () => {
      if (!get().conectado) return
      enviar({ tipo: 'sair', remetente: get().usuario.id })
      obterTransporteColab().desconectar()
      if (heartbeat) clearInterval(heartbeat)
      set({ conectado: false, sala: null, participantes: {} })
    },

    moverCursor: (x, y) => {
      if (!get().conectado) return
      const agora = Date.now()
      if (agora - ultimoCursor < CURSOR_MS) return
      ultimoCursor = agora
      enviar({ tipo: 'cursor', remetente: get().usuario.id, usuario: get().usuario, x, y })
    },

    enviarDoc: (paginaId, elementos, corFundo) => {
      if (!get().conectado) return
      enviar({ tipo: 'doc', remetente: get().usuario.id, paginaId, elementos, corFundo })
    },

    enviarComentarios: (paginaId, comentarios) => {
      if (!get().conectado) return
      enviar({ tipo: 'comentarios', remetente: get().usuario.id, paginaId, comentarios })
    },

    alternarModoComentario: () =>
      set((estado) => ({ modoComentario: !estado.modoComentario, comentarioPendente: null })),

    definirComentarioPendente: (ancora) => set({ comentarioPendente: ancora }),
  }
})

/** Helpers de permissão derivados do papel atual */
export function podeEditarPapel(papel: Papel): boolean {
  return papel === 'editor'
}
export function podeComentarPapel(papel: Papel): boolean {
  return papel !== 'viewer'
}
