// =============================================================
// Transporte até a Messages API da Anthropic.
//
// AVISO DE SEGURANÇA, e ele é real: aqui a chave da API vive no
// NAVEGADOR. Não existe servidor neste projeto para guardá-la, então
// ela fica no armazenamento local e viaja em cada requisição a partir
// da máquina de quem usa. Quem tiver acesso ao navegador tem acesso à
// chave. Use uma chave com limite de gasto, e prefira o motor local
// quando isso não for aceitável.
//
// Isolado do adaptador de propósito: `adaptadorClaude` fala com a
// interface `ClienteClaude` e por isso é testável sem rede nem SDK.
// =============================================================

import type Anthropic from '@anthropic-ai/sdk'
import { ClienteClaude, PedidoClaude } from './adaptadorClaude'

/** Modelo usado em todas as chamadas do editor */
export const MODELO = 'claude-opus-5'

/** Teto de saída por chamada. Layouts de 4 opções cabem com folga e o
 *  valor fica abaixo do tempo limite do SDK sem streaming. */
const MAX_TOKENS = 16000

export function clienteAnthropic(chave: string): ClienteClaude {
  // O SDK entra por import dinâmico: são ~170 KB que só fazem sentido
  // para quem liga o Claude, e o motor local é o padrão. Quem nunca
  // trocar de motor não baixa nada disso.
  let cliente: Promise<Anthropic> | null = null
  const obterCliente = () => {
    if (!cliente) {
      cliente = import('@anthropic-ai/sdk').then(
        ({ default: Anthropic }) =>
          new Anthropic({
            apiKey: chave,
            // Sem isto o SDK se recusa a rodar fora do Node; o cabeçalho
            // é o que a API exige para aceitar a origem do navegador.
            dangerouslyAllowBrowser: true,
            defaultHeaders: { 'anthropic-dangerous-direct-browser-access': 'true' },
          }),
      )
    }
    return cliente
  }

  return {
    async gerar(pedido: PedidoClaude) {
      const anthropic = await obterCliente()
      const resposta = await anthropic.messages.create({
        model: MODELO,
        max_tokens: MAX_TOKENS,
        system: pedido.sistema,
        messages: [{ role: 'user', content: pedido.usuario }],
        output_config: {
          effort: pedido.esforco,
          format: { type: 'json_schema', schema: pedido.esquema },
        },
      })

      // Uma recusa de segurança volta com HTTP 200 e conteúdo vazio;
      // tratá-la como resposta daria um erro de JSON confuso.
      if (resposta.stop_reason === 'refusal') {
        throw new Error('O modelo recusou este pedido.')
      }

      const bloco = resposta.content.find((b) => b.type === 'text')
      if (!bloco || bloco.type !== 'text') throw new Error('Resposta sem texto')
      return JSON.parse(bloco.text) as unknown
    },
  }
}
