// =============================================================
// LimiteErro — error boundary global. Se algo quebrar em produção,
// o usuário vê uma tela amigável com opção de recarregar em vez de
// uma página branca. O trabalho fica seguro: o auto-save já persiste
// o projeto no localStorage a cada alteração.
// =============================================================

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface Estado {
  erro: Error | null
}

export class LimiteErro extends Component<Props, Estado> {
  state: Estado = { erro: null }

  static getDerivedStateFromError(erro: Error): Estado {
    return { erro }
  }

  componentDidCatch(erro: Error): void {
    console.error('Erro não tratado na interface', erro)
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="flex h-screen items-center justify-center bg-superficie-100 p-6 dark:bg-superficie-950">
        <div className="w-full max-w-md rounded-2xl border border-superficie-200 bg-white p-8 text-center shadow-painel dark:border-superficie-800 dark:bg-superficie-900">
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-3xl dark:bg-red-950/40">
            ⚠️
          </span>
          <h1 className="mb-2 text-lg font-bold text-superficie-900 dark:text-white">
            Algo deu errado
          </h1>
          <p className="mb-1 text-sm text-superficie-600 dark:text-superficie-300">
            Ocorreu um erro inesperado na interface. Seu trabalho está seguro —
            os projetos são salvos automaticamente neste dispositivo.
          </p>
          <p className="mb-6 break-all text-xs text-superficie-500">
            {this.state.erro.message}
          </p>
          <button onClick={() => window.location.reload()} className="botao-primario w-full">
            Recarregar o estúdio
          </button>
        </div>
      </div>
    )
  }
}
