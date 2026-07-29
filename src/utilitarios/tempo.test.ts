// Testes do debounce. `cancelar` existe porque o editor tem dois ritmos
// de auto-save (arraste rápido, digitação folgada) que levam ao mesmo
// destino: sem poder descartar o pendente, uma edição seguida da outra
// disparava os dois temporizadores e salvava duas vezes.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { debounce, tempoRelativo } from './tempo'

describe('debounce', () => {
  afterEach(() => vi.useRealTimers())

  it('executa uma única vez, depois da última chamada', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const adiada = debounce(fn, 100)

    adiada()
    adiada()
    adiada()
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('cancelar descarta a execução pendente', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const adiada = debounce(fn, 100)

    adiada()
    adiada.cancelar()
    vi.advanceTimersByTime(1000)

    expect(fn).not.toHaveBeenCalled()
  })

  it('segue utilizável depois de cancelada', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const adiada = debounce(fn, 100)

    adiada()
    adiada.cancelar()
    adiada()
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('cancelar sem nada pendente não faz nada', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const adiada = debounce(fn, 100)

    expect(() => adiada.cancelar()).not.toThrow()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('dois debounces independentes só se calam se cancelados', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const rapido = debounce(fn, 400)
    const normal = debounce(fn, 800)

    // Exatamente o cenário do editor: arrastar e logo depois digitar
    rapido()
    normal.cancelar()
    rapido.cancelar()
    normal()
    vi.advanceTimersByTime(2000)

    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('tempoRelativo', () => {
  afterEach(() => vi.useRealTimers())

  it('descreve o passado recente em português', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T12:00:00.000Z'))

    expect(tempoRelativo('2026-03-10T11:59:30.000Z')).toBe('agora mesmo')
    expect(tempoRelativo('2026-03-10T11:45:00.000Z')).toBe('há 15 min')
    expect(tempoRelativo('2026-03-10T09:00:00.000Z')).toBe('há 3 h')
    expect(tempoRelativo('2026-03-09T12:00:00.000Z')).toBe('ontem')
    expect(tempoRelativo('2026-03-05T12:00:00.000Z')).toBe('há 5 dias')
  })
})
