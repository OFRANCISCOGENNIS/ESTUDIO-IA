// Registro do transporte de colaboração (adapter pattern).
// Troque por um transporte WebSocket via `definirTransporteColab`.

import { criarTransporteBroadcast } from './transporteBroadcast'
import { TransporteColab } from './tipos'

let transporteAtual: TransporteColab = criarTransporteBroadcast()

export function obterTransporteColab(): TransporteColab {
  return transporteAtual
}

export function definirTransporteColab(transporte: TransporteColab): void {
  transporteAtual = transporte
}
