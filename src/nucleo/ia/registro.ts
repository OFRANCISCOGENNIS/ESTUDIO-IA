// =============================================================
// Registro do provedor de IA (adapter pattern).
// O editor sempre chama `obterAdaptadorIA()`; para trocar de provedor
// (ex.: um backend com Claude), basta chamar `definirAdaptadorIA` no
// bootstrap da aplicação — nenhum componente precisa mudar.
// =============================================================

import { adaptadorLocal } from './adaptadorLocal'
import { AdaptadorIA } from './tipos'

let adaptadorAtual: AdaptadorIA = adaptadorLocal

export function obterAdaptadorIA(): AdaptadorIA {
  return adaptadorAtual
}

export function definirAdaptadorIA(adaptador: AdaptadorIA): void {
  adaptadorAtual = adaptador
}
