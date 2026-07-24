# DesignStudio Pro

![status](https://img.shields.io/badge/status-Fase%201%20(MVP)-7c4dff)
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

**Fase 1 (MVP) — entregue.** O editor já é totalmente funcional para criar
peças de design do zero ou a partir de templates, com camadas, texto, formas,
imagens, exportação e salvamento automático.

### Roadmap (Fases 2–6)

| Fase | Tema | Destaques planejados |
|------|------|----------------------|
| **2** | Edição de imagem | Filtros, ajustes de cor, máscaras, recortes e composição raster |
| **3** | Inteligência artificial | Geração de imagem/texto, remoção de fundo e sugestões de layout |
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
   retrocompatibilidade à medida que o formato evolui.
3. **Histórico por snapshots.** O `undo/redo` guarda snapshots serializados do
   projeto (não deltas), o que torna o comportamento **previsível e confiável** e
   mantém o custo de memória sob controle (capacidade de 100 passos).
4. **Auto-save com _debounce_ e stores como _adapters_.** Hoje a persistência é
   feita em `localStorage`, mas os stores (`useEditorStore`, `useProjetosStore`)
   foram desenhados como **camada de adaptação**: trocar o backend por uma **API
   remota** amanhã não afeta os componentes.
5. **IA e colaboração via _adapter pattern_ + _feature flags_.** Os recursos das
   próximas fases entram como implementações plugáveis, ativadas por
   **_feature flags_ por plano**, sem acoplar o núcleo do editor a nenhum
   serviço específico.

---

## Estrutura de pastas

```
src/
├─ tipos/          # Modelo de dados: Projeto, Elemento, Ferramenta, Predefinicao
├─ nucleo/         # Regras de domínio (sem UI)
│  ├─ elementos.ts      # Fábrica de elementos (formas, texto, imagem, linha)
│  ├─ exportacao.ts     # Exportar/baixar PNG e JPG
│  ├─ historico.ts      # Pilha de undo/redo por snapshots
│  └─ serializacao.ts   # JSON versionado + migração de esquema
├─ estado/         # Stores Zustand
│  ├─ useEditorStore.ts     # Estado do editor + auto-save
│  └─ useProjetosStore.ts   # Índice e persistência de projetos
├─ dados/          # Conteúdo pronto (templates, fontes, galeria, predefinições)
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
| **Gratuito** | Uso pessoal | Editor completo da Fase 1, com limites de projetos/exportação |
| **Pro** | Criadores e freelancers | Recursos avançados (IA, filtros, exportações em alta) |
| **Time** | Equipes | Colaboração em tempo real, biblioteca compartilhada e permissões |

> As _feature flags_ são estrutura de código — a cobrança e a ativação por plano
> serão conectadas a partir das próximas fases.

---

<sub>DesignStudio Pro — Fase 1 (MVP). Feito com React, TypeScript e muito café. ☕</sub>
