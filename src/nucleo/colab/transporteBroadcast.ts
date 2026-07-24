// =============================================================
// Adaptador de transporte via BroadcastChannel — colaboração em tempo
// real entre abas/janelas do MESMO navegador, sem servidor. Serve de
// demonstração fiel do modelo; um adaptador WebSocket implementaria a
// mesma interface para colaboração entre dispositivos.
// =============================================================

import { MensagemColab, TransporteColab } from './tipos'

export function criarTransporteBroadcast(): TransporteColab {
  let canal: BroadcastChannel | null = null
  return {
    id: 'broadcast',
    conectar(sala, aoReceber) {
      if (typeof BroadcastChannel === 'undefined') return
      canal = new BroadcastChannel(`dsp-colab-${sala}`)
      canal.onmessage = (evento) => aoReceber(evento.data as MensagemColab)
    },
    enviar(mensagem) {
      canal?.postMessage(mensagem)
    },
    desconectar() {
      canal?.close()
      canal = null
    },
  }
}
