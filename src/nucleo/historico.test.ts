// =============================================================
// Testes da pilha de histórico (desfazer/refazer por snapshots).
// Ambiente node — sem DOM. Cada teste usa uma instância própria.
// =============================================================

import { describe, it, expect } from 'vitest'
import { Historico, CAPACIDADE_HISTORICO } from './historico'

describe('Historico', () => {
  it('(a) desfazer devolve o snapshot anterior e refazer o desfaz de volta', () => {
    const historico = new Historico()
    historico.registrar('A')

    // Estado atual é 'B'; desfazer devolve 'A'.
    const desfeito = historico.desfazer('B')
    expect(desfeito).toBe('A')

    // Estado atual voltou a 'A'; refazer devolve 'B'.
    const refeito = historico.refazer('A')
    expect(refeito).toBe('B')
  })

  it('(b) registrar limpa a pilha de futuro', () => {
    const historico = new Historico()
    historico.registrar('A')
    historico.desfazer('B')

    // Há algo para refazer após o desfazer.
    expect(historico.podeRefazer()).toBe(true)

    // Um novo registro descarta o futuro.
    historico.registrar('C')
    expect(historico.podeRefazer()).toBe(false)
  })

  it('(c) dedup: registrar o mesmo snapshot consecutivo não duplica', () => {
    const historico = new Historico()
    historico.registrar('A')
    historico.registrar('A')

    expect(historico.tamanhoPassado).toBe(1)
  })

  it('(d) respeita a capacidade máxima', () => {
    const historico = new Historico()

    // Registra mais entradas do que a capacidade, todas distintas.
    for (let i = 0; i < CAPACIDADE_HISTORICO + 25; i++) {
      historico.registrar(`snapshot-${i}`)
    }

    expect(historico.tamanhoPassado).toBeLessThanOrEqual(CAPACIDADE_HISTORICO)
    expect(historico.tamanhoPassado).toBe(CAPACIDADE_HISTORICO)
  })

  it('(e) podeDesfazer/podeRefazer refletem o estado', () => {
    const historico = new Historico()
    // Vazio: nada a desfazer nem a refazer.
    expect(historico.podeDesfazer()).toBe(false)
    expect(historico.podeRefazer()).toBe(false)

    // Após registrar: pode desfazer, mas ainda não refazer.
    historico.registrar('A')
    expect(historico.podeDesfazer()).toBe(true)
    expect(historico.podeRefazer()).toBe(false)

    // Após desfazer: pode refazer, mas não desfazer novamente.
    historico.desfazer('B')
    expect(historico.podeDesfazer()).toBe(false)
    expect(historico.podeRefazer()).toBe(true)
  })

  it('(f) desfazer sem histórico retorna null', () => {
    const historico = new Historico()
    expect(historico.desfazer('qualquer')).toBeNull()
  })
})
