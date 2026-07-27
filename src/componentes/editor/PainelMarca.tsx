// =============================================================
// PainelMarca — Brand Kit. Guarda paleta, fontes e logos da marca e
// permite aplicá-los ao projeto com um clique. Recurso do plano Pro.
// =============================================================

import { useState, type ChangeEvent } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { useMarcaStore } from '../../estado/useMarcaStore'
import { usePlanoStore } from '../../estado/usePlanoStore'
import { criarImagem } from '../../nucleo/elementos'
import { carregarArquivoImagem } from '../../utilitarios/imagem'
import { recursoLiberado } from '../../dados/planos'
import { FONTES } from '../../dados/fontes'

const classeSecao = 'mb-2 text-xs font-bold uppercase tracking-wide text-superficie-700 dark:text-superficie-300'

export function PainelMarca() {
  const projeto = useEditorStore((s) => s.projeto)
  const pagina = usePaginaAtiva()
  const selecionados = useEditorStore((s) => s.selecionados)
  const definirCorFundo = useEditorStore((s) => s.definirCorFundo)
  const adicionarElemento = useEditorStore((s) => s.adicionarElemento)
  const atualizarElementos = useEditorStore((s) => s.atualizarElementos)
  const recolorirDesignAtivo = useEditorStore((s) => s.recolorirDesignAtivo)
  const definirFonteGlobal = useEditorStore((s) => s.definirFonteGlobal)

  const kits = useMarcaStore((s) => s.kits)
  const criarKit = useMarcaStore((s) => s.criarKit)
  const removerKit = useMarcaStore((s) => s.removerKit)
  const adicionarCor = useMarcaStore((s) => s.adicionarCor)
  const removerCor = useMarcaStore((s) => s.removerCor)
  const atualizarKit = useMarcaStore((s) => s.atualizarKit)
  const adicionarLogo = useMarcaStore((s) => s.adicionarLogo)

  const plano = usePlanoStore((s) => s.plano)

  const [nomeNovo, setNomeNovo] = useState('')
  const [kitAtivoId, setKitAtivoId] = useState<string | null>(kits[0]?.id ?? null)

  if (!projeto || !pagina) return null

  if (!recursoLiberado('brand-kit', plano)) {
    return (
      <div className="space-y-3">
        <h3 className={classeSecao}>🎯 Brand Kit · Pro</h3>
        <p className="text-sm text-superficie-600 dark:text-superficie-400">
          Salve as cores, fontes e logos da sua marca e aplique em qualquer design com um clique.
        </p>
        <p className="rounded-lg bg-primaria-50 p-3 text-xs text-primaria-700 dark:bg-primaria-900 dark:text-primaria-200">
          🔒 Disponível no plano <strong>Pro</strong>. Troque o plano na aba ✨ IA para experimentar.
        </p>
      </div>
    )
  }

  const kit = kits.find((k) => k.id === kitAtivoId) ?? kits[0] ?? null

  const centrarX = (largura: number) => projeto.larguraCanvas / 2 - largura / 2
  const centrarY = (altura: number) => projeto.alturaCanvas / 2 - altura / 2

  const aplicarFonte = (fonte: string) => {
    const idsTexto = pagina.elementos
      .filter((e) => e.tipo === 'texto' && selecionados.includes(e.id))
      .map((e) => e.id)
    if (idsTexto.length > 0) atualizarElementos(idsTexto, { fonte })
  }

  // Aplica a marca ao design inteiro: recolore com a paleta do kit e
  // troca a fonte de todos os textos pela fonte principal da marca.
  const aplicarMarcaAoDesign = () => {
    if (!kit) return
    if (kit.cores.length > 0) recolorirDesignAtivo(kit.cores)
    if (kit.fontes[0]) definirFonteGlobal(kit.fontes[0])
  }

  const inserirLogo = async (url: string) => {
    // Descobre proporção real do logo antes de inserir
    const img = new Image()
    img.onload = () => {
      const largura = 300
      const altura = largura * (img.height / img.width || 1)
      adicionarElemento(criarImagem(url, centrarX(largura), centrarY(altura), largura, altura))
    }
    img.src = url
  }

  const enviarLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo || !kit) return
    try {
      const carregada = await carregarArquivoImagem(arquivo)
      adicionarLogo(kit.id, carregada.url)
    } catch (erro) {
      console.error('Falha ao enviar logo', erro)
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className={classeSecao}>🎯 Brand Kit</h3>
        <div className="flex gap-2">
          <input
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            placeholder="Nome da marca"
            className="campo-texto"
          />
          <button
            onClick={() => {
              const novo = criarKit(nomeNovo)
              setKitAtivoId(novo.id)
              setNomeNovo('')
            }}
            className="botao-primario shrink-0"
          >
            Criar
          </button>
        </div>
      </div>

      {kits.length > 1 && (
        <select
          value={kit?.id ?? ''}
          onChange={(e) => setKitAtivoId(e.target.value)}
          className="campo-texto"
          aria-label="Selecionar marca"
        >
          {kits.map((k) => (
            <option key={k.id} value={k.id}>{k.nome}</option>
          ))}
        </select>
      )}

      {!kit ? (
        <p className="text-sm text-superficie-600 dark:text-superficie-400">
          Crie um kit de marca para começar.
        </p>
      ) : (
        <>
          {/* Aplicar a marca ao design inteiro (1 clique) */}
          <button
            onClick={aplicarMarcaAoDesign}
            className="botao-primario flex w-full items-center justify-center gap-2"
            title="Recolore o design com a paleta da marca e aplica a fonte principal"
          >
            <span>✨</span>
            <span>Aplicar marca ao design</span>
          </button>

          {/* Cores */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className={classeSecao + ' mb-0'}>Cores</h4>
              <label className="cursor-pointer text-xs font-medium text-primaria-600 dark:text-primaria-300">
                + Adicionar
                <input
                  type="color"
                  className="sr-only"
                  onChange={(e) => adicionarCor(kit.id, e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {kit.cores.map((cor) => (
                <div key={cor} className="group relative">
                  <button
                    onClick={() => definirCorFundo(cor)}
                    className="h-9 w-9 rounded-lg border border-superficie-200 transition hover:scale-110 dark:border-superficie-700"
                    style={{ backgroundColor: cor }}
                    title={`Usar ${cor} no fundo`}
                  />
                  <button
                    onClick={() => removerCor(kit.id, cor)}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[0.6rem] text-white group-hover:flex"
                    title="Remover cor"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Fontes */}
          <section>
            <h4 className={classeSecao}>Fontes (aplicar ao texto selecionado)</h4>
            <div className="space-y-1.5">
              {kit.fontes.map((fonte) => (
                <button
                  key={fonte}
                  onClick={() => aplicarFonte(fonte)}
                  className="w-full rounded-lg border border-superficie-200 px-3 py-2 text-left text-sm transition hover:border-primaria-300 hover:bg-primaria-50 dark:border-superficie-800 dark:hover:bg-superficie-800"
                  style={{ fontFamily: fonte }}
                  title="Aplicar aos textos selecionados"
                >
                  {fonte}
                </button>
              ))}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value && !kit.fontes.includes(e.target.value)) {
                  atualizarKit(kit.id, { fontes: [...kit.fontes, e.target.value] })
                }
                e.target.value = ''
              }}
              className="campo-texto mt-2"
              defaultValue=""
              aria-label="Adicionar fonte à marca"
            >
              <option value="" disabled>+ Adicionar fonte…</option>
              {FONTES.map((f) => (
                <option key={f.familia} value={f.familia}>{f.nome}</option>
              ))}
            </select>
          </section>

          {/* Logos */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className={classeSecao + ' mb-0'}>Logos</h4>
              <label className="cursor-pointer text-xs font-medium text-primaria-600 dark:text-primaria-300">
                + Enviar
                <input type="file" accept="image/*" hidden onChange={enviarLogo} />
              </label>
            </div>
            {kit.logos.length === 0 ? (
              <p className="text-xs text-superficie-500 dark:text-superficie-400">
                Nenhum logo ainda.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {kit.logos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => inserirLogo(url)}
                    className="flex aspect-square items-center justify-center rounded-lg border border-superficie-200 bg-white p-1 transition hover:border-primaria-300 dark:border-superficie-800 dark:bg-superficie-900"
                    title="Inserir logo no canvas"
                  >
                    <img src={url} alt={`Logo ${i + 1}`} className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <button
            onClick={() => {
              if (confirm(`Remover o kit "${kit.nome}"?`)) {
                removerKit(kit.id)
                setKitAtivoId(null)
              }
            }}
            className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
          >
            Remover este kit
          </button>
        </>
      )}
    </div>
  )
}
