// =============================================================
// Contrato do transporte de colaboração (adapter pattern).
// O editor fala apenas com `TransporteColab`; hoje usamos um
// adaptador BroadcastChannel (tempo real entre abas do mesmo
// navegador), amanhã basta registrar um adaptador WebSocket sem
// alterar nenhuma tela.
// =============================================================

import { Comentario, Elemento } from '../../tipos/projeto'

/** Papéis de permissão no compartilhamento por link */
export type Papel = 'editor' | 'commenter' | 'viewer'

export interface Usuario {
  id: string
  nome: string
  cor: string
}

/** Participante remoto conectado (com posição do cursor) */
export interface Participante extends Usuario {
  x: number
  y: number
  /** Timestamp do último sinal (para remover inativos) */
  ultimoVisto: number
}

/** Mensagens trocadas entre os colaboradores */
export type MensagemColab =
  | { tipo: 'entrar'; remetente: string; usuario: Usuario }
  | { tipo: 'presenca'; remetente: string; usuario: Usuario }
  | { tipo: 'sair'; remetente: string }
  | { tipo: 'cursor'; remetente: string; usuario: Usuario; x: number; y: number }
  | { tipo: 'doc'; remetente: string; paginaId: string; elementos: Elemento[]; corFundo: string }
  | { tipo: 'comentarios'; remetente: string; paginaId: string; comentarios: Comentario[] }

/** Transporte de mensagens de colaboração */
export interface TransporteColab {
  id: string
  conectar: (sala: string, aoReceber: (m: MensagemColab) => void) => void
  enviar: (m: MensagemColab) => void
  desconectar: () => void
}
