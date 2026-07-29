// Testes de presença na colaboração. O bug original: `presenca` e
// `entrar` não carregam posição de cursor, e o upsert as tratava como
// zero. Como o heartbeat manda `presenca` a cada 2 s, o cursor de cada
// colega saltava para o canto superior esquerdo o tempo todo — o rastro
// de cursor ao vivo era inutilizável.

import { afterEach, describe, expect, it } from 'vitest'
import { definirTransporteColab } from '../nucleo/colab/registro'
import { MensagemColab, TransporteColab, Usuario } from '../nucleo/colab/tipos'
import { useColabStore } from './useColabStore'

const COLEGA: Usuario = { id: 'colega-1', nome: 'Lontra 42', cor: '#22c55e' }

/** Transporte de mentira: guarda o callback para injetarmos mensagens */
function instalarTransporte() {
  let receber: ((m: MensagemColab) => void) | null = null
  const enviadas: MensagemColab[] = []
  const transporte: TransporteColab = {
    id: 'teste',
    conectar: (_sala, aoReceber) => {
      receber = aoReceber
    },
    enviar: (m) => void enviadas.push(m),
    desconectar: () => {
      receber = null
    },
  }
  definirTransporteColab(transporte)
  return { entregar: (m: MensagemColab) => receber?.(m), enviadas }
}

const participante = () => useColabStore.getState().participantes[COLEGA.id]

describe('useColabStore — presença', () => {
  afterEach(() => useColabStore.getState().desconectar())

  it('guarda a posição que vem numa mensagem de cursor', () => {
    const canal = instalarTransporte()
    useColabStore.getState().conectar('sala-teste')

    canal.entregar({ tipo: 'cursor', remetente: COLEGA.id, usuario: COLEGA, x: 320, y: 180 })

    expect(participante()).toMatchObject({ x: 320, y: 180, nome: 'Lontra 42' })
  })

  it('o heartbeat de presença não zera o cursor já conhecido', () => {
    const canal = instalarTransporte()
    useColabStore.getState().conectar('sala-teste')
    canal.entregar({ tipo: 'cursor', remetente: COLEGA.id, usuario: COLEGA, x: 320, y: 180 })

    canal.entregar({ tipo: 'presenca', remetente: COLEGA.id, usuario: COLEGA })

    expect(participante()).toMatchObject({ x: 320, y: 180 })
  })

  it('quem chega sem cursor conhecido fica na origem', () => {
    const canal = instalarTransporte()
    useColabStore.getState().conectar('sala-teste')

    canal.entregar({ tipo: 'entrar', remetente: COLEGA.id, usuario: COLEGA })

    expect(participante()).toMatchObject({ x: 0, y: 0 })
  })

  it('presença renova o sinal de vida sem mexer na posição', () => {
    const canal = instalarTransporte()
    useColabStore.getState().conectar('sala-teste')
    canal.entregar({ tipo: 'cursor', remetente: COLEGA.id, usuario: COLEGA, x: 10, y: 20 })
    const antes = participante().ultimoVisto

    canal.entregar({ tipo: 'presenca', remetente: COLEGA.id, usuario: COLEGA })

    expect(participante().ultimoVisto).toBeGreaterThanOrEqual(antes)
    expect(participante()).toMatchObject({ x: 10, y: 20 })
  })

  it('sair remove o participante', () => {
    const canal = instalarTransporte()
    useColabStore.getState().conectar('sala-teste')
    canal.entregar({ tipo: 'cursor', remetente: COLEGA.id, usuario: COLEGA, x: 5, y: 5 })

    canal.entregar({ tipo: 'sair', remetente: COLEGA.id })

    expect(participante()).toBeUndefined()
  })

  it('ignora o eco das próprias mensagens', () => {
    const canal = instalarTransporte()
    useColabStore.getState().conectar('sala-teste')
    const eu = useColabStore.getState().usuario

    canal.entregar({ tipo: 'cursor', remetente: eu.id, usuario: eu, x: 99, y: 99 })

    expect(useColabStore.getState().participantes[eu.id]).toBeUndefined()
  })
})
