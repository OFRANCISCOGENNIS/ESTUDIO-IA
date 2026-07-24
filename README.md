# DesignStudio Pro

![status](https://img.shields.io/badge/status-Fase%203%20entregue-7c4dff)
![versão](https://img.shields.io/badge/versão-0.1.0-blue)
![stack](https://img.shields.io/badge/React%2018-TypeScript-3178c6)
![licença](https://img.shields.io/badge/licença-proprietária-lightgrey)

**DesignStudio Pro** é um estúdio de design tudo-em-um que roda inteiramente no
navegador. A proposta é reunir, num só produto, o melhor de várias ferramentas
que hoje vivem separadas: a facilidade do **Canva**, o controle de layers e a
precisão do **Figma**, a edição de imagem raster do **Photopea** e a agilidade
de criação do **Adobe Express**.

Tudo funciona localmente, sem depender de servidor: seus projetos são salvos no
próprio navegador e podem ser abertos, editados e exportados a qualquer momento.

---

## Status do projeto

**Fases 1, 2 e 3 — entregues.** O editor é totalmente funcional para criar peças
de design do zero ou a partir de templates (Fase 1); com **edição de imagem**
(filtros, ajustes, máscaras), **gradientes**, **mesclagem** e **múltiplas
páginas** (Fase 2); e agora com **IA integrada** (texto para design, Magic Write,
remoção de fundo, redimensionamento mágico, paleta automática), **Brand Kit** e
**feature flags por plano** (Fase 3).

### Roadmap

| Fase | Tema | Situação / destaques |
|------|------|----------------------|
| **1** | Editor (MVP) | ✅ Canvas, camadas, texto, formas, imagens, templates, export, auto-save |
| **2** | Edição de imagem | ✅ Filtros (20+), ajustes de cor, máscaras, gradientes, mesclagem, múltiplas páginas |
| **3** | Inteligência artificial | ✅ Texto→design, Magic Write, remoção de fundo, redimensionamento mágico, paleta automática, Brand Kit, planos |
| **4** | Apresentação & movimento | Modo apresentação, transições e animações de elementos |
| **5** | Colaboração | Edição multiusuário em tempo real, comentários e permissões |
| **6** | Criação avançada | Pen tool, tipografia criativa, gráficos/infográficos e PWA offline |

---

## Recursos da Fase 1

- **Dashboard** com tamanhos predefinidos (Post Instagram, Story, Thumbnail
  YouTube, Apresentação, Logo, Cartão de visita, A4, Capa de e-book) e lista de
  **projetos recentes** com miniatura e data relativa.
- **Editor com canvas** completo: **zoom** e **pan** (mão), régua de trabalho e
  seleção múltipla.
- **Camadas**: painel de reordenação (frente/trás/topo/fundo), visibilidade e
  bloqueio por elemento.
- **Texto**: fontes, tamanho, negrito/itálico/sublinhado, cor, alinhamento,
  altura de linha e espaçamento entre letras, com edição inline no canvas.
- **Formas**: retângulo, elipse, triângulo e estrela, com preenchimento, borda,
  raio de canto e número de pontas.
- **Linhas**: cor, espessura e traço tracejado.
- **Imagens**: upload com **compressão automática** (evita estourar o
  armazenamento local e melhora a performance).
- **Templates prontos** por categoria, aplicáveis com um clique.
- **Alinhamento** e distribuição (esquerda, centro, direita, topo, meio, base).
- **Propriedades contextuais**: o painel se adapta ao tipo de elemento
  selecionado.
- **Desfazer/Refazer** com histórico de **100 passos**.
- **Auto-save** com _debounce_ de **2 segundos** e persistência local.
- **Exportação** em **PNG** e **JPG** com escala configurável.
- **Tema claro/escuro** (persistido) e **atalhos de teclado** profissionais.

---

## Recursos da Fase 2 (edição de imagem e composição)

- **Múltiplas páginas / pranchetas** no mesmo projeto: adicionar, duplicar,
  remover e renomear páginas, todas compartilhando o tamanho do artboard. O
  `undo/redo` cobre inclusive operações de página.
- **Filtros predefinidos** (mais de 20, no estilo Instagram: Clarendon, Juno,
  Moon, Lo-Fi, Vintage…) com **intensidade ajustável**.
- **Ajustes finos de imagem**: brilho, contraste, saturação, temperatura,
  nitidez, desfoque e vinheta — aplicados via filtros customizados do Konva em
  um nó com cache (sem travar a interface).
- **Máscaras de recorte**: encaixe a imagem em círculo, retângulo arredondado,
  triângulo, estrela ou coração.
- **Gradientes** (linear e radial) como preenchimento de formas, com duas
  paradas de cor e ângulo configurável.
- **Modos de mesclagem** por camada (multiplicar, divisão, sobrepor, luz suave,
  diferença e outros) somados à opacidade.

---

## Recursos da Fase 3 (IA e Brand Kit)

Todos os recursos de IA rodam **100% no navegador** através de um **adaptador
local** (sem rede nem chaves de API), pronto para ser trocado por um provedor
real (ex.: Claude) via _adapter pattern_, sem alterar a interface.

- **Texto para design**: descreva o que quer ("post de hamburgueria, fundo
  escuro, estilo moderno") e a IA gera **4 layouts completos e editáveis**.
- **Magic Write**: geração e reescrita de textos (títulos, subtítulos, legendas,
  CTAs) com **tom ajustável** (profissional, descontraído, ousado, amigável),
  tanto no painel de IA quanto direto nas propriedades de um texto.
- **Remoção de fundo**: _flood fill_ a partir das bordas — remove fundos sólidos
  com um clique (bom para fotos de produto e logos).
- **Redimensionamento mágico**: adapta o design (todas as páginas) para outro
  formato, reorganizando os elementos pelo centro relativo e escalando sem
  distorção.
- **Paleta automática**: extrai as cores dominantes de qualquer imagem (por
  amostragem + quantização) e aplica no fundo com um clique.
- **Sugestão de cores e fontes** a partir da descrição do projeto.
- **Brand Kit**: salve paleta, fontes e logos da marca e aplique-os em qualquer
  design com um clique.
- **Feature flags por plano** (Gratuito / Pro / Time): recursos como remoção de
  fundo, redimensionamento mágico e Brand Kit são liberados conforme o plano,
  com um seletor de plano para demonstração.

---

## Stack

- **React 18** + **TypeScript** (modo `strict`)
- **Konva** / **react-konva** — renderização do canvas
- **Zustand** — gerência de estado
- **TailwindCSS** — design system próprio
- **Vite** — bundler e servidor de desenvolvimento
- **Vitest** — infraestrutura de testes

---

## Decisões de arquitetura

1. **Canvas por camada de abstração.** Os painéis nunca falam diretamente com o
   Konva — eles apenas leem e escrevem no store. O canvas fica isolado atrás de
   uma fronteira bem definida, permitindo **trocar a engine de renderização no
   futuro** (WebGL, canvas 2D próprio, etc.) sem reescrever a interface.
2. **Projeto serializado em JSON versionado.** Todo projeto carrega um
   `versaoEsquema`. A leitura passa sempre por `desserializarProjeto`, que
   **valida, migra esquemas antigos e preenche padrões** — garantindo
   retrocompatibilidade à medida que o formato evolui. A Fase 2 exercitou isso
   na prática: a introdução de **múltiplas páginas** subiu o esquema de `1` para
   `2`, e a migração embrulha automaticamente projetos antigos (página única)
   na nova estrutura de `paginas`, sem perder nenhum design salvo.
3. **Histórico por snapshots.** O `undo/redo` guarda snapshots serializados do
   projeto (não deltas), o que torna o comportamento **previsível e confiável** e
   mantém o custo de memória sob controle (capacidade de 100 passos).
4. **Auto-save com _debounce_ e stores como _adapters_.** Hoje a persistência é
   feita em `localStorage`, mas os stores (`useEditorStore`, `useProjetosStore`)
   foram desenhados como **camada de adaptação**: trocar o backend por uma **API
   remota** amanhã não afeta os componentes.
5. **IA via _adapter pattern_ + _feature flags_ (implementado na Fase 3).** Todo
   recurso de IA é acessado por `obterAdaptadorIA()`, atrás da interface
   `AdaptadorIA`. O adaptador padrão é **local** (roda no navegador); trocar por
   um provedor real (ex.: Claude) é registrar outro adaptador no bootstrap, sem
   tocar em nenhum componente. Os recursos por plano são controlados por
   **_feature flags_** centralizadas em `recursoLiberado`.

---

## Estrutura de pastas

```
src/
├─ tipos/          # Modelo de dados: Projeto, Pagina, Elemento, AjustesImagem…
├─ nucleo/         # Regras de domínio (sem UI)
│  ├─ elementos.ts      # Fábrica de elementos (formas, texto, imagem, linha)
│  ├─ exportacao.ts     # Exportar/baixar PNG e JPG
│  ├─ filtros.ts        # Presets, ajustes e filtros de pixel (puro, testável)
│  ├─ historico.ts      # Pilha de undo/redo por snapshots
│  ├─ serializacao.ts   # JSON versionado + migração de esquema (v1→v2)
│  └─ ia/               # IA: adapter, adaptador local, paleta, redimensionar
├─ estado/         # Stores Zustand
│  ├─ useEditorStore.ts     # Estado do editor, páginas e auto-save
│  ├─ usePaginaAtiva.ts     # Hook da página ativa
│  ├─ useMarcaStore.ts      # Brand Kits (paleta, fontes, logos)
│  ├─ usePlanoStore.ts      # Plano atual (feature flags)
│  └─ useProjetosStore.ts   # Índice e persistência de projetos
├─ dados/          # Conteúdo pronto (templates, fontes, galeria, predefinições, planos)
├─ componentes/    # Interface
│  ├─ dashboard/       # Tela inicial e projetos recentes
│  └─ editor/          # Canvas, barras, painéis e overlays
├─ utilitarios/    # Imagem (compressão), tempo (debounce/datas) e helpers
├─ hooks/          # useAtalhosTeclado e outros hooks de UI
├─ styles/         # CSS global e design system (Tailwind)
├─ App.tsx         # Alterna dashboard/editor e controla o tema
└─ main.tsx        # Ponto de entrada
```

---

## Como rodar

Requisitos: **Node.js 18+** e **npm**.

```bash
# Instalar dependências
npm install

# Ambiente de desenvolvimento (http://localhost:5173)
npm run dev

# Build de produção (type-check + bundle)
npm run build

# Testes
npm test
```

Para pré-visualizar o build de produção localmente: `npm run preview`.

---

## Atalhos de teclado

| Atalho | Ação |
|--------|------|
| `Ctrl/Cmd + Z` | Desfazer |
| `Ctrl/Cmd + Shift + Z` · `Ctrl/Cmd + Y` | Refazer |
| `Ctrl/Cmd + C` | Copiar seleção |
| `Ctrl/Cmd + V` | Colar |
| `Ctrl/Cmd + D` | Duplicar seleção |
| `Ctrl/Cmd + A` | Selecionar tudo |
| `Ctrl/Cmd + S` | Salvar agora |
| `Ctrl/Cmd + G` | Agrupar seleção _(planejado)_ |
| `V` | Ferramenta Seleção |
| `H` | Ferramenta Mão (pan) |
| `T` | Ferramenta Texto |
| `R` | Ferramenta Retângulo |
| `O` | Ferramenta Elipse |
| `L` | Ferramenta Linha |
| `Delete` · `Backspace` | Remover seleção |
| `Esc` | Limpar seleção |
| `← ↑ → ↓` | Mover 1 px (com `Shift`, move 10 px) |

> Os atalhos são ignorados enquanto você digita em um campo ou edita um texto
> diretamente no canvas.

---

## Modelo de negócio

DesignStudio Pro é planejado em três planos, com liberação de recursos por
**_feature flags_** já previstas na arquitetura do código:

| Plano | Público | Ideia geral |
|-------|---------|-------------|
| **Gratuito** | Uso pessoal | Editor completo, texto→design e Magic Write, com limites |
| **Pro** | Criadores e freelancers | Remoção de fundo, redimensionamento mágico, Brand Kit e export SVG |
| **Time** | Equipes | Tudo do Pro + colaboração em tempo real, biblioteca compartilhada e permissões |

> As _feature flags_ já estão implementadas (`recursoLiberado`) e gateiam os
> recursos por plano. A cobrança real será conectada a um backend de billing;
> um seletor de plano na aba **IA** permite experimentar o gating.

---

<sub>DesignStudio Pro — Fases 1, 2 e 3 entregues. Feito com React, TypeScript e muito café. ☕</sub>
