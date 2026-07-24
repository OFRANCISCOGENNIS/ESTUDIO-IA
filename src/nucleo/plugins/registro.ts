// =============================================================
// Arquitetura de plugins — registro de extensões que adicionam novas
// ferramentas/ações ao editor sem tocar no núcleo. Um plugin registra
// uma ação nomeada; a aba "Apps" lista e executa os plugins.
// =============================================================

export interface PluginFerramenta {
  id: string
  nome: string
  icone: string
  descricao: string
  /** Ação executada ao acionar o plugin */
  executar: () => void
}

const plugins: PluginFerramenta[] = []

export function registrarPlugin(plugin: PluginFerramenta): void {
  if (!plugins.some((p) => p.id === plugin.id)) plugins.push(plugin)
}

export function listarPlugins(): PluginFerramenta[] {
  return [...plugins]
}
