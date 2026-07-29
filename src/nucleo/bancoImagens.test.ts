import { beforeEach, describe, expect, it } from 'vitest'
import {
  desserializarComBanco,
  limparBanco,
  serializarComBanco,
  tamanhoBanco,
} from './bancoImagens'

/** Data URL grande o bastante para o ganho ser mensurável */
const FOTO = `data:image/jpeg;base64,${'A'.repeat(20_000)}`
const OUTRA = `data:image/png;base64,${'B'.repeat(20_000)}`

const paginaCom = (urls: string[]) => ({
  paginas: [
    {
      id: 'pagina-1',
      elementos: urls.map((url, i) => ({ id: `img-${i}`, tipo: 'imagem', url, largura: 10 })),
    },
  ],
})

describe('bancoImagens', () => {
  beforeEach(() => limparBanco())

  it('substitui o data URL por uma referência curta ao serializar', () => {
    const texto = serializarComBanco(paginaCom([FOTO]))

    expect(texto).not.toContain('AAAA')
    expect(texto).toContain('banco:img:')
    expect(texto.length).toBeLessThan(500)
  })

  it('devolve o data URL original ao desserializar', () => {
    const original = paginaCom([FOTO])
    const volta = desserializarComBanco<typeof original>(serializarComBanco(original))

    expect(volta).toEqual(original)
  })

  it('guarda uma cópia só quando a mesma imagem aparece várias vezes', () => {
    serializarComBanco(paginaCom([FOTO, FOTO, FOTO]))

    expect(tamanhoBanco()).toBe(1)
  })

  it('mantém imagens distintas separadas', () => {
    serializarComBanco(paginaCom([FOTO, OUTRA]))

    expect(tamanhoBanco()).toBe(2)
  })

  it('não cresce quando o mesmo estado é serializado muitas vezes', () => {
    // É o caso real do histórico: 100 passos sobre o mesmo projeto.
    const estado = paginaCom([FOTO, OUTRA])
    const snapshots = Array.from({ length: 100 }, () => serializarComBanco(estado))

    expect(tamanhoBanco()).toBe(2)
    // 100 snapshots somados custam bem menos que uma cópia do original
    const somaSnapshots = snapshots.reduce((t, s) => t + s.length, 0)
    expect(somaSnapshots).toBeLessThan(FOTO.length)
  })

  it('preserva URLs remotas, que já são curtas', () => {
    const original = paginaCom(['https://exemplo.com/foto.png'])
    const texto = serializarComBanco(original)

    expect(texto).toContain('https://exemplo.com/foto.png')
    expect(desserializarComBanco(texto)).toEqual(original)
  })

  it('não quebra o snapshot quando o banco é limpo antes de restaurar', () => {
    const texto = serializarComBanco(paginaCom([FOTO]))
    limparBanco()

    const volta = desserializarComBanco<ReturnType<typeof paginaCom>>(texto)

    // A imagem se perde, mas a estrutura sobrevive — nada de exceção
    expect(volta.paginas[0].elementos[0].url).toBe('banco:img:0')
    expect(volta.paginas[0].elementos).toHaveLength(1)
  })
})
