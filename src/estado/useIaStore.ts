// =============================================================
// Escolha do motor de IA: local (padrão) ou Claude.
//
// O motor local é o padrão deliberadamente. Ele roda no navegador,
// não custa nada e não manda nada para lugar nenhum — que é a
// promessa do resto do app. Ligar o Claude é uma troca consciente:
// respostas melhores em texto e layout, ao preço de mandar a
// descrição para a API da Anthropic e de guardar uma chave neste
// navegador.
// =============================================================

import { create } from 'zustand'
import { adaptadorLocal } from '../nucleo/ia/adaptadorLocal'
import { criarAdaptadorClaude } from '../nucleo/ia/adaptadorClaude'
import { clienteAnthropic } from '../nucleo/ia/clienteAnthropic'
import { definirAdaptadorIA } from '../nucleo/ia/registro'
import { gravarLocal, lerLocal, removerLocal } from '../utilitarios/armazenamento'

export type MotorIA = 'local' | 'claude'

const CHAVE_MOTOR = 'dsp:ia:motor'
const CHAVE_API = 'dsp:ia:chave'

interface EstadoIa {
  motor: MotorIA
  chave: string
  /** Última falha da API, para a interface poder mostrar */
  erro: string | null
  definirMotor: (motor: MotorIA) => void
  definirChave: (chave: string) => void
  limparErro: () => void
}

const mensagemDe = (erro: unknown): string => {
  if (erro instanceof Error) return erro.message
  return 'Falha ao falar com a API da Anthropic.'
}

export const useIaStore = create<EstadoIa>((set, get) => {
  /** Registra no `registro` o adaptador que corresponde ao estado */
  const aplicar = () => {
    const { motor, chave } = get()
    if (motor === 'claude' && chave.trim() !== '') {
      definirAdaptadorIA(
        criarAdaptadorClaude(clienteAnthropic(chave.trim()), {
          // A geração já caiu para o motor local; aqui só contamos o
          // ocorrido, para a interface não fingir que veio do Claude.
          aoFalhar: (erro) => set({ erro: mensagemDe(erro) }),
        }),
      )
    } else {
      definirAdaptadorIA(adaptadorLocal)
    }
  }

  const motorSalvo = lerLocal(CHAVE_MOTOR) === 'claude' ? 'claude' : 'local'
  const chaveSalva = lerLocal(CHAVE_API) ?? ''

  // Aplica a preferência guardada assim que a store nasce
  queueMicrotask(aplicar)

  return {
    motor: motorSalvo,
    chave: chaveSalva,
    erro: null,

    definirMotor: (motor) => {
      set({ motor, erro: null })
      gravarLocal(CHAVE_MOTOR, motor)
      aplicar()
    },

    definirChave: (chave) => {
      set({ chave, erro: null })
      if (chave.trim() === '') removerLocal(CHAVE_API)
      else gravarLocal(CHAVE_API, chave)
      aplicar()
    },

    limparErro: () => set({ erro: null }),
  }
})
