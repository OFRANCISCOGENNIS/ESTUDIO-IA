// =============================================================
// Sistema de ícones do DesignStudio Pro — SVG stroke consistente
// (24×24, stroke 1.8, cantos redondos), no lugar de emojis, para o
// chrome do app ter acabamento de produto profissional.
// Todos herdam a cor do texto via currentColor.
// =============================================================

import type { SVGProps } from 'react'

interface PropsIcone extends SVGProps<SVGSVGElement> {
  /** Tamanho em px (largura = altura). Padrão 20. */
  tamanho?: number
}

function Icone({ tamanho = 20, children, ...resto }: PropsIcone) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {children}
    </svg>
  )
}

// ---------------- Navegação / chrome ----------------

export const IconeSetaEsquerda = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </Icone>
)

export const IconeDesfazer = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icone>
)

export const IconeRefazer = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </Icone>
)

export const IconeSol = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Icone>
)

export const IconeLua = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Icone>
)

export const IconePlay = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M7 4.5v15l12-7.5-12-7.5Z" />
  </Icone>
)

export const IconeDownload = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Icone>
)

export const IconeCompartilhar = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="17.5" cy="5.5" r="2.6" />
    <circle cx="17.5" cy="18.5" r="2.6" />
    <path d="m8.4 10.8 6.8-4M8.4 13.2l6.8 4" />
  </Icone>
)

export const IconeMais = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icone>
)

export const IconeMenos = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M5 12h14" />
  </Icone>
)

export const IconeEncaixar = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
  </Icone>
)

// ---------------- Trilha de ferramentas ----------------

export const IconePaleta = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M12 3a9 9 0 1 0 0 18h1.2a2.2 2.2 0 0 0 1.6-3.7 2.2 2.2 0 0 1 1.6-3.7H19a2 2 0 0 0 2-2A8.6 8.6 0 0 0 12 3Z" />
    <circle cx="7.8" cy="10.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.6" r="1" fill="currentColor" stroke="none" />
    <circle cx="16.2" cy="10.5" r="1" fill="currentColor" stroke="none" />
  </Icone>
)

export const IconeFormas = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="8" cy="8" r="4.5" />
    <rect x="11" y="11" width="9.5" height="9.5" rx="1.5" />
  </Icone>
)

export const IconeTipoTexto = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 6V4h16v2M12 4v16m-3 0h6" />
  </Icone>
)

export const IconeUpload = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M12 16V4m0 0 4.5 4.5M12 4 7.5 8.5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Icone>
)

export const IconeFoto = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.8" cy="9.2" r="1.7" />
    <path d="m3 17 5-5 4 4 3.5-3.5L21 18" />
  </Icone>
)

export const IconeFaisca = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    <path d="M18.5 15.5 19.3 17.7 21.5 18.5 19.3 19.3 18.5 21.5 17.7 19.3 15.5 18.5 17.7 17.7 18.5 15.5Z" />
  </Icone>
)

export const IconeAlvo = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5.2" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </Icone>
)

export const IconePessoas = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.8 14.6A5.5 5.5 0 0 1 20.5 20" />
  </Icone>
)

export const IconePredio = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
    <path d="M9 7.5h2m2 0h2M9 11h2m2 0h2M9 14.5h2m2 0h2M10 20.5v-3h4v3" />
  </Icone>
)

export const IconePasta = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2.2 2.5H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </Icone>
)

export const IconeBlocos = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
    <path d="M16.8 13.5v6.5m-3.3-3.3H20" />
  </Icone>
)

// ---------------- Ações de conteúdo ----------------

export const IconeDuplicar = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </Icone>
)

export const IconeCopiar = IconeDuplicar

export const IconeColar = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 11h6m-6 4h4" />
  </Icone>
)

export const IconeFrente = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="4" y="4" width="11" height="11" rx="2" />
    <path d="M9 20h9a2 2 0 0 0 2-2V9" />
  </Icone>
)

export const IconeTras = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 4H6a2 2 0 0 0-2 2v9" />
  </Icone>
)

export const IconeCadeado = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icone>
)

export const IconeLixeira = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
  </Icone>
)

export const IconeX = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icone>
)

// ---------------- Ferramentas Pro ----------------

export const IconeAgrupar = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
    <path d="M13 7h3a1 1 0 0 1 1 1v3M11 17H8a1 1 0 0 1-1-1v-3" />
  </Icone>
)

export const IconeDesagrupar = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
    <path d="m14.5 9.5 5-5m-15 15 5-5" />
  </Icone>
)

export const IconeDistribuirH = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 4v16M20 4v16" />
    <rect x="9.5" y="8" width="5" height="8" rx="1" />
  </Icone>
)

export const IconeDistribuirV = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 4h16M4 20h16" />
    <rect x="8" y="9.5" width="8" height="5" rx="1" />
  </Icone>
)

export const IconeContaGotas = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="m13.2 5.2 2-2a2.4 2.4 0 0 1 3.4 0l2.2 2.2a2.4 2.4 0 0 1 0 3.4l-2 2M13.2 5.2 4.6 13.8a2 2 0 0 0-.55 1.05L3.3 19.2a1.2 1.2 0 0 0 1.5 1.5l4.35-.75a2 2 0 0 0 1.05-.55l8.6-8.6M13.2 5.2l5.6 5.6" />
  </Icone>
)

export const IconeGrade = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <path d="M9.2 3.5v17m5.6-17v17M3.5 9.2h17m-17 5.6h17" />
  </Icone>
)

export const IconeBusca = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icone>
)

export const IconeLapis = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 0l.5.5a2.1 2.1 0 0 1 0 3L8.5 19 4 20Z" />
    <path d="m14.5 6 3.5 3.5" />
  </Icone>
)

export const IconeQr = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <path d="M13.5 13.5h3v3h-3zM17.5 17.5h3v3h-3z" />
  </Icone>
)

export const IconeAcessivel = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </Icone>
)

// ---------------- Tipos de elemento (painel de camadas) ----------------

export const IconeRetanguloEl = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="4" y="6" width="16" height="12" rx="1.5" />
  </Icone>
)

export const IconeElipseEl = (p: PropsIcone) => (
  <Icone {...p}>
    <ellipse cx="12" cy="12" rx="8.5" ry="6.5" />
  </Icone>
)

export const IconeTrianguloEl = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M12 5 20 19H4L12 5Z" />
  </Icone>
)

export const IconeEstrelaEl = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="m12 3.5 2.5 5.4 5.9.6-4.4 4 1.2 5.8L12 16.4l-5.2 2.9 1.2-5.8-4.4-4 5.9-.6L12 3.5Z" />
  </Icone>
)

export const IconeLinhaEl = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M5 19 19 5" />
  </Icone>
)

export const IconeCaminhoEl = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 18c4-8 8 4 12-8" />
    <circle cx="4" cy="18" r="1.6" />
    <circle cx="20" cy="8" r="1.6" />
  </Icone>
)

export const IconeGraficoEl = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 20V4m0 16h16" />
    <path d="M8 16v-5m4 5V8m4 8v-3" />
  </Icone>
)

export const IconeTabelaEl = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="4" y="5" width="16" height="14" rx="1.5" />
    <path d="M4 10h16M10 10v9m5-9v9" />
  </Icone>
)
