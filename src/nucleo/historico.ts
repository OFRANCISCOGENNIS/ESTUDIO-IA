// =============================================================
// Histórico de desfazer/refazer baseado em snapshots.
// Independente de framework para ser testável isoladamente.
// Capacidade mínima exigida: 100 passos.
// =============================================================

export const CAPACIDADE_HISTORICO = 100

/**
 * Pilha de histórico genérica. Guarda snapshots serializados (string)
 * para manter o custo de memória previsível e a comparação barata.
 */
export class Historico {
  private passado: string[] = []
  private futuro: string[] = []

  constructor(private capacidade: number = CAPACIDADE_HISTORICO) {
    this.capacidade = Math.max(1, capacidade)
  }

  /** Registra o estado atual antes de uma alteração. Limpa o futuro. */
  registrar(snapshotAtual: string): void {
    // Evita entradas duplicadas consecutivas (ex.: cliques sem mudança)
    if (this.passado[this.passado.length - 1] === snapshotAtual) return
    this.passado.push(snapshotAtual)
    if (this.passado.length > this.capacidade) {
      this.passado.shift()
    }
    this.futuro = []
  }

  /**
   * Desfaz: devolve o snapshot anterior e move o estado atual para o futuro.
   * Retorna null se não houver nada a desfazer.
   */
  desfazer(snapshotAtual: string): string | null {
    const anterior = this.passado.pop()
    if (anterior === undefined) return null
    this.futuro.push(snapshotAtual)
    return anterior
  }

  /**
   * Refaz: devolve o próximo snapshot e move o estado atual para o passado.
   * Retorna null se não houver nada a refazer.
   */
  refazer(snapshotAtual: string): string | null {
    const proximo = this.futuro.pop()
    if (proximo === undefined) return null
    this.passado.push(snapshotAtual)
    return proximo
  }

  podeDesfazer(): boolean {
    return this.passado.length > 0
  }

  podeRefazer(): boolean {
    return this.futuro.length > 0
  }

  limpar(): void {
    this.passado = []
    this.futuro = []
  }

  get tamanhoPassado(): number {
    return this.passado.length
  }
}
