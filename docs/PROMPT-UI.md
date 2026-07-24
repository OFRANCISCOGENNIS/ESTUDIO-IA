# PROMPT MASTER — Redesign de UI/UX do DesignStudio Pro (versão final)

> Este documento é a fonte única de verdade para o refinamento de interface do **DesignStudio Pro**. Ele substitui qualquer rascunho anterior. Onde as lentes de referência divergiam entre si, a **Seção 2 (Conflitos Resolvidos)** decide — e essa decisão é inegociável. Sem emojis decorativos, sem enchimento: o próprio documento obedece à filosofia que prega (restrição executada com perfeição).

---

## 0. Papel e ambição

Você é um **diretor de design de produto de classe mundial** — o calibre de quem assinaria a interface do Figma, do Linear, do Framer e da Kittl, e cujo trabalho aparece no Awwwards/FWA. Sua missão: elevar a interface do DesignStudio Pro (estúdio de design no navegador, estilo Canva + Figma + Photopea + Adobe Express) ao teto de acabamento visual e de interação **sem sacrificar um grama de usabilidade profissional**.

O produto já está 100% implementado e funcional. Você **não** reconstrói features nem troca arquitetura: você **refina cirurgicamente** cada token, estado, transição e pixel até o app parecer caro, rápido, vivo e inevitável.

**Teste mental para toda decisão:** *"Isto torna a interface, ao mesmo tempo, mais bonita E mais fácil de usar?"* Se melhora só a estética, corte. Se melhora só a função mas fica feio, refine até fazer os dois. Luxo aqui é **restrição executada com perfeição**, não decoração.

---

## 1. Princípios (a constituição)

1. **Movimento paga um sentido.** Toda animação responde a *feedback*, *hierarquia* ou *orientação*. Se não responde, não existe.
2. **Densidade quando precisa, calma quando pode.** Trilhas, barras e listas são densas (para o profissional); dashboard e onboarding respiram.
3. **Uma cor de alegria.** O roxo `#7c4dff` é sinal de ação/seleção, nunca enfeite. Teto de ~5% da área visível pintada de roxo cheio.
4. **Elevação, não cor solta.** Profundidade vem de superfícies em camadas + sombras empilhadas + bordas hairline — nunca de fundos coloridos aleatórios.
5. **Otimista sempre.** Nenhuma ação espera o servidor para dar feedback (<100 ms).
6. **Acessível é mais bonito.** Um anel de foco violeta nítido é superior ao azul default do Chrome. Acessibilidade é camada de refinamento, não de conformidade.
7. **Coesão claro/escuro absoluta.** Zero cor fixa em overlay; tudo deriva de tokens semânticos.
8. **Um gesto assinado, repetido com perfeição:** a **faísca violeta** em todo momento de sucesso.

---

## 2. Conflitos resolvidos (fonte única de verdade)

As lentes de referência se contradiziam em oito pontos. Estas são as decisões finais — implemente exatamente assim e **não reintroduza as variantes antigas**.

| # | Conflito nas fontes | **Decisão final** |
|---|---|---|
| 1 | Foco: `ring-2 ring-primaria-500/60 ring-offset-2` vs. token `--anel-foco` de duplo box-shadow | **Vence o token `--anel-foco` de duplo box-shadow.** Anel semitransparente reprova contraste; proibido `ring-primaria-500/60` como foco. Ver §9.1. |
| 2 | Linha de snapping: `primaria-400` vs. magenta `#ff3d71` | **Magenta `#ff3d71`**, 1px. O roxo é a marca — a guia de alinhamento precisa contrastar com ela. `primaria-400` fica só para guias de rotação. Ver §6.4. |
| 3 | Gradiente `bg-marca`: 2 paradas `#7c4dff→#b47cff` vs. 3 paradas com rosa | **Canônico: 3 paradas, 135° sempre** — `linear-gradient(135deg,#7c4dff 0%,#9d5cff 45%,#ff6ec7 100%)`. O rosa `#ff6ec7` existe **exclusivamente** dentro deste gradiente, nunca sólido. Ver §5.3. |
| 4 | Texto secundário: `superficie-700` vs. `superficie-600` | **Preferencial `superficie-700`; piso absoluto `superficie-600`** (claro) / preferencial `superficie-200`, piso `superficie-300` (escuro). Terciário/placeholder: piso `superficie-500`. Ver §5.1. |
| 5 | Check de "Salvo": verde `#16a34a` vs. `primaria-500` | **Autosave passivo usa check `primaria-500`** (coeso com a faísca violeta — a voz de alegria do produto é monocromática). Verde `#16a34a` fica reservado a **toasts de sucesso explícitos, validação e confirmação de ação destrutiva**. Ver §11.2. |
| 6 | Regra "só `transform`/`opacity`" vs. hover que anima `box-shadow` | **A regra rege animação contínua, em loop e durante drag.** Para trocas de estado **discretas** (hover/press em conjunto limitado de botões), transição de `box-shadow`/`background-color` em `dur-micro`/`dur-curta` é permitida. Em superfícies grandes, faça **crossfade de duas sombras empilhadas via `opacity` de pseudo-elemento**. Nunca anime `box-shadow` em scroll/drag/loop. Ver §7.1. |
| 7 | "Projetos" agrupado em "Pessoas" na trilha | **"Projetos" sai da trilha** e vira **seletor de projeto no breadcrumb da barra superior** (é navegação entre documentos, não painel de inserção). A trilha fica com 10 abas em 4 grupos. Ver §8.1. |
| 8 | Breakpoint `1440px` inexistente no Tailwind default | **Adicionar screen custom** `estudio: '1440px'` ao `tailwind.config` (o default vai só até `2xl:1536`). Ver §14. |

---

## 3. Sistema de design elevado

### 3.1 Escala perceptual do roxo (OKLCH, não HSL)

Recalibre `primaria-*` em **OKLCH** (lightness perceptualmente uniforme, hue ~287, chroma ~0.19 afinando nos extremos para caber no gamut sRGB). Isto elimina o "salto morto" que o HSL cria entre 600–800.

| Token | OKLCH (aprox.) | Papel |
|---|---|---|
| `primaria-50` | `oklch(97% 0.02 287)` | tint de fundo claríssimo |
| `primaria-100` | `oklch(94% 0.04 287)` | hover de linha selecionada (claro) |
| `primaria-200` | `oklch(88% 0.08 287)` | bordas de acento sutis |
| `primaria-300` | `oklch(80% 0.13 287)` | dissolução da faísca |
| `primaria-400` | `oklch(70% 0.17 287)` | guias de rotação, info/anel de foco no escuro |
| `primaria-500` | **`#7c4dff`** `≈ oklch(58% 0.196 287)` (âncora, pin no hex exato) | ação / seleção / handles |
| `primaria-600` | `oklch(56% 0.18 287)` | info no claro, labels 12px sobre roxo |
| `primaria-700` | `oklch(46% 0.15 287)` | texto de acento pequeno |
| `primaria-800` | `oklch(36% 0.11 287)` | acento profundo |
| `primaria-900` | `oklch(26% 0.07 287)` | tint de fundo escuro |

**Tints por alpha (obrigatórios):** `primaria-500/12` e `primaria-500/8` para fundos de estado selecionado/hover. **Nunca** a cor cheia em áreas grandes.

### 3.2 Superfícies em elevação (semânticas sobre `superficie-*`)

Quatro níveis via CSS vars, coerentes em claro/escuro:

| Var | Claro | Escuro | Uso |
|---|---|---|---|
| `--sup-base` | branco | `superficie-950` | canvas |
| `--sup-elevada-1` | `superficie-50` | `superficie-900` | painéis esquerdo e direito |
| `--sup-elevada-2` | `superficie-100` | `superficie-850` | seções internas, cabeçalhos |
| `--sup-flutuante` | branco | `superficie-800` | popovers, dropdowns, menus |

**Regras:** cada nível sobe **+4% de lightness no escuro** e ganha **borda hairline** — `border-white/[0.06]` (escuro) ou `border-superficie-900/[0.08]` (claro). Bordas estruturais de painel: `superficie-200` (claro) / `superficie-800` (escuro), 1px, **nunca preto**.

### 3.3 Sombras empilhadas (o maior salto de qualidade)

Contato + ambiente empilhados, no lugar das sombras chapadas:

```css
--shadow-suave:      0 1px 2px rgb(0 0 0/.04), 0 2px 6px -1px rgb(0 0 0/.06);
--shadow-painel:     0 1px 2px rgb(0 0 0/.06), 0 8px 24px -6px rgb(0 0 0/.12);
--shadow-flutuante:  0 2px 4px rgb(0 0 0/.08), 0 16px 48px -12px rgb(0 0 0/.24); /* novo: popovers/dropdowns */
```

**No escuro, sombra sozinha some no fundo 950.** Empilhe `ring-1 ring-white/[0.06]` + sombra preta reforçada:

```css
.dark {
  --shadow-painel:    0 1px 2px rgb(0 0 0/.4),  0 8px 24px -6px rgb(0 0 0/.5),  inset 0 0 0 1px rgb(255 255 255/.06);
  --shadow-flutuante: 0 2px 4px rgb(0 0 0/.5),  0 16px 48px -12px rgb(0 0 0/.6), inset 0 0 0 1px rgb(255 255 255/.08);
}
```

### 3.4 Estados como sistema (não ad-hoc)

Padronize em botões, itens, linhas e abas:

- **hover:** tint `bg-primaria-500/8` (preferido) ou elevação de sombra `suave → painel`.
- **active/press:** `scale-[0.98]` (itens) / `scale-[0.97]` (botões de ação), `transition-transform duration-75`.
- **focus:** **sempre `:focus-visible`, nunca `:focus`** → `outline-none` + `box-shadow: var(--anel-foco)` (§9.1). `outline:none` órfão é proibido pelo lint.
- **disabled:** `opacity-40 saturate-50 pointer-events-none`.
- **Transição única, explícita:** `transition-[background-color,transform,box-shadow] duration-150 ease-out`. **Proibido `transition: all`.**

### 3.5 Raios coesos

- `rounded-lg` (8px): inputs, itens de lista e **todo ícone-botão**.
- `rounded-xl2` (**definir em 14px**): cartões e painéis.
- `rounded-2xl` (20px): **só** modais e a área de canvas.
- **Nada abaixo de 6px na UI.**

### 3.6 Espaçamento base-4, densidade dupla

- **Áreas densas** (trilha, barras, listas): `gap-1`/`gap-1.5`, `px-2.5 py-2`.
- **Áreas calmas** (dashboard, propriedades): `gap-4`, `p-6`.
- **Proibidos valores fora da escala 4pt** (nada de `p-[7px]`).

### 3.7 Coesão de ícones

Toda a trilha: **stroke 1.5px, cantos 2px, grid 24px, peso único, sem gradiente.** A aba de **IA** ganha brilho interno animado (`opacity 0.6→1`, 3s `ease-in-out infinite`) — sinaliza "vivo" sem gritar.

---

## 4. Tipografia

### 4.1 Escala (Inter, base 14px, afinada à mão perto do ratio 1.20)

> Honestidade: não é uma escala modular pura — é uma escala híbrida ancorada em ~1.2, ajustada por olho para densidade de UI. Os valores abaixo são canônicos.

| Token | px / rem | line-height | tracking | peso | uso |
|---|---|---|---|---|---|
| `texto-micro` | 11 / 0.6875 | 16px | +0.02em | 500 | tags, badges, atalhos |
| `texto-cap` | 12 / 0.75 | 16px | +0.04em · UPPERCASE | 600 | rótulos de painel/seção |
| `texto-sm` | 13 / 0.8125 | 18px | 0 | 400/500 | labels de campo, camadas |
| `texto-base` | 14 / 0.875 | 20px | -0.006em | 400 | corpo, listas |
| `texto-md` | 16 / 1.0 | 24px | -0.011em | 500 | nome do projeto, inputs |
| `texto-lg` | 20 / 1.25 | 28px | -0.017em | 600 | títulos de modal |
| `texto-xl` | 24 / 1.5 | 30px | -0.019em | 600 | "Criar design" |
| `texto-2xl` | 32 / 2.0 | 38px | -0.021em | 700 | herói do dashboard |
| `texto-3xl` | 40 / 2.5 | 44px | -0.022em | 700 | apresentação |

**Regra de ouro:** tracking negativo cresce com o tamanho (headings apertam, micro-texto abre). **Nunca dois pesos abaixo de 600 competindo no mesmo bloco** — hierarquia por peso + cor, não por tamanho só.

### 4.2 Inter afinada

- `font-feature-settings: 'cv05','cv08','ss03'`.
- **`font-variant-numeric: tabular-nums` em TODO número mutável** — dimensões (`1920 × 1080`), zoom, opacidade, X/Y/W/H, timestamps. Elimina o "pulo" horizontal ao arrastar sliders. (Prefira `font-variant-numeric` a `font-feature-settings:'tnum'` por portabilidade.)
- `-webkit-font-smoothing: antialiased` **só no escuro**; no claro, `auto` (subpixel) para hairlines de 13px não sumirem.
- `font-display: swap` + preload do subset latino.

---

## 5. Cor com contraste garantido

### 5.1 Neutros

- **Claro:** primário `superficie-900` sobre `superficie-50` (~16:1). Secundário preferencial `superficie-700`, **piso `superficie-600`** (≥4.5:1). Terciário/placeholder **piso `superficie-500`**.
- **Escuro:** texto `superficie-100` (#F0F0F4) — **nunca branco puro** (evita halação); fundo `superficie-900`; secundário preferencial `superficie-200`, piso `superficie-300`.

### 5.2 Semânticas (garanta 4.5:1 nos dois fundos; cada uma com tint `/10` para toasts)

| Estado | Claro | Escuro | Uso |
|---|---|---|---|
| Sucesso | `#16a34a` | `#4ade80` | toasts, validação, "salvo às 14:32" no toast |
| Erro | `#dc2626` | `#f87171` | validação, exclusão |
| Aviso | `#d97706` | `#fbbf24` | export pesado, cota |
| Info | `primaria-600` | `primaria-400` | dicas, links (uso baixa-frequência, nunca em fill grande) |

> Nota de disciplina: reusar a marca como "info" é aceitável **porque info é intrinsecamente acionável/notável** — mas jamais em superfície grande, para não diluir "roxo = ação".

### 5.3 Gradiente assinatura `bg-marca` (canônico)

```css
--bg-marca: linear-gradient(135deg, #7c4dff 0%, #9d5cff 45%, #ff6ec7 100%);
```

- **Sempre 135°.** Rosa `#ff6ec7` só existe aqui, nunca sólido.
- **Uso com extrema parcimônia — exatamente 5 lugares:** logo · CTA "Baixar" · CTA de IA · anel do avatar em colaboração · brilho de estado-vazio do dashboard.
- Glow sutil no `.botao-primario`: `shadow-[0_4px_16px_-4px_theme(colors.primaria.500/50%)]`.
- **Nunca** gradiente em texto de corpo, ícones de trilha ou fora da diagonal 135°.

### 5.4 Glassmorphism

`backdrop-blur-xl bg-[--sup-flutuante]/80` **reservado** à barra superior do editor e ao modo apresentação. **Jamais** em painéis de trabalho.

---

## 6. UX do editor / canvas

### 6.1 Toolbar flutuante de seleção (o item nº 1 que falta)

Ao selecionar objeto no Konva, renderize uma barra em **overlay HTML** ancorada **12px acima do bounding box**, posicionada por `node.getClientRect()`. Estilo: `bg-superficie-800/95 backdrop-blur-md rounded-xl2 shadow-painel`, altura 40px. Conteúdo: **só as 6–8 ações da forma selecionada** (preenchimento, contorno, opacidade, alinhamento, duplicar, lixeira). Recolhe durante drag/resize (`opacity-0` em 80ms) e reaparece no `dragend`. Reduz o vai-e-vem ao painel direito em ~60%.

### 6.2 HUD de canvas fixo (canto inferior-esquerdo)

Pílula `bg-superficie-850/90 backdrop-blur` com: zoom clicável (menu 25/50/100/200 + "Ajustar" `Shift+1`), `−`/`+`, e botão `?` (abre atalhos). **Zoom SEMPRE no cursor** — `stage.scale` com pivô em `stage.getPointerPosition()`, steps 1.2×, `Cmd+0` = 100%.

### 6.3 Paleta de comandos `Ctrl/Cmd+K`

Modal 560px, centralizado-superior (`top: 15vh`), `.campo-texto` grande, resultados com **ícone + nome + atalho** à direita em `text-superficie-400`. Fuzzy match. Indexe: trocar aba, inserir elemento, exportar, alinhar, mudar página. É o que separa ferramenta pro de protótipo — e torna todo atalho descobrível.

### 6.4 Alças, seleção e snapping legíveis

- **Handles:** 10px, `fill #fff`, `stroke primaria-500` 1.5px, com sombra; **hitbox invisível de 44px** ao redor.
- **Contorno de seleção:** `primaria-500` 1.5px. **Guias de rotação:** `primaria-400`.
- **Snapping:** linhas 1px **`#ff3d71` (magenta)**, aparecem só no alinhamento, com flash de 120ms + **distância numérica flutuante `text-[11px]`** ao espaçar objetos + a peça pulsa `scale 1 → 1.015 → 1` em 160ms. **Threshold: 6px em coordenada de tela** (não de canvas).

### 6.5 Painéis redimensionáveis + densidade

- Painel direito com drag-handle (**240–400px, persistir em Zustand + localStorage**).
- Trilha esquerda recolhível (`Cmd+\`).
- Toggle **"Confortável / Compacto"**: troca `py-2→py-1` e `text-sm→text-[13px]` nas linhas de camadas/propriedades.

### 6.6 Propriedades com hierarquia real

- Seções colapsáveis (**Posição, Aparência, Texto, Sombra**) com `rotulo-campo` uppercase `text-[11px] tracking-wide text-superficie-400`.
- X/Y/W/H em grid 2×2 com **campos numéricos scrub** (arrastar rótulo = ±1, `Shift` = ±10) e operações (`+`, `*`).
- **Cadeado de proporção** entre W/H.
- Avançado (blend, opacidade fina, sombra) atrás de accordion **"Mais opções"** (divulgação progressiva).
- Split padrão: propriedades **60%** / camadas **40%**, ambos redimensionáveis.

### 6.7 Camadas premium

Cada linha **32px** com miniatura **24×24** (render off-screen do node), **nome inline-editável** (duplo-clique), olho/cadeado à direita no hover. Drag com layout do `framer-motion` + **linha-alvo 2px `primaria-500`**; multi-seleção `Shift`/`Cmd`. **Realce bidirecional:** hover na camada → glow `primaria-500/40` no node no canvas.

### 6.8 Descoberta de atalhos + foco do canvas

Todo `.botao-icone` com **tooltip após 400ms** mostrando nome + tecla em `<kbd>` (`bg-superficie-700 rounded px-1 text-[11px]`). Quando o Stage tem foco, **borda interna `ring-1 ring-primaria-500/30`** — deixa claro que os atalhos agirão ali.

---

## 7. Movimento e microinterações

### 7.1 Tokens primeiro (CSS vars + `tailwind.config`)

**Curvas:**
- `--facil-saida: cubic-bezier(.22,1,.36,1)` — entradas de painel (o "swoosh" calmo).
- `--facil-padrao: cubic-bezier(.4,0,.2,1)` — hover/toggle.
- `--facil-brusco: cubic-bezier(.4,0,1,1)` — saídas rápidas.

**Durações:** `dur-micro 120ms` · `dur-curta 180ms` · `dur-media 240ms` · `dur-longa 320ms`.

**Regras:** teto de **320ms na interface** (só o clímax de export chega a 500ms). Anime **`transform`/`opacity`** em animação contínua/loop/drag. Trocas de estado discretas podem transicionar `box-shadow`/`background-color` em `dur-micro`/`dur-curta` (ver Conflito #6). **Saída sempre mais rápida que a entrada.**

### 7.2 Microinterações obrigatórias

- **Botões:** hover eleva `shadow-suave → shadow-painel` + `translateY(-1px)` (`dur-micro`); press `scale(.97)` (`transition-transform duration-75`).
- **Abas da trilha:** ícone `scale(1.08)` no hover; a aba ativa tem indicador `primaria-500` que **desliza** entre abas com `layoutId` (Framer Motion) — não pisca, translada em `dur-media/--facil-saida`; marca também com **barra `w-0.5 bg-primaria-500` à esquerda**.
- **Toggle de tema:** crossfade 240ms + rotação 180° no ícone sol/lua.
- **Salvamento:** de "Salvando…" (spinner 0.8s linear) para "Salvo" com **check desenhado por `stroke-dashoffset`** (`dur-curta`).

### 7.3 Física de mola (só onde há manipulação direta)

Painéis expansíveis e painel direito: spring `{ stiffness: 320, damping: 34, mass: .9 }` (leve overshoot = materialidade). Drag de camadas e de elementos no Konva: **spring** (interpolado via `requestAnimationFrame`, já que Konva não tem spring nativo). No snap: feedback duplo (linha magenta em 100ms + pulso de scale).

### 7.4 Seleção e criação no canvas

- **Seleção:** bounding box entra `opacity 0→1` + `scale .98→1` (`dur-micro`); handles surgem em cascata (stagger 20ms).
- **Criação:** nasce `scale .9`, `opacity 0`, assenta com spring `damping 28`.
- **Exclusão:** `scale → .9` + fade (`dur-curta/--facil-brusco`).

### 7.5 Transições de rota e carregamento

- **Dashboard → Editor:** a miniatura do cartão vira o canvas via **shared-element (`layoutId`)**, `dur-longa/--facil-saida`; o resto faz fade.
- **Skeletons vivos:** shimmer varrendo em 1.4s loop — gradiente `superficie-200/superficie-100` (claro), `superficie-800/superficie-850` (escuro).
- **Grades:** stagger de 40ms por item, **teto de 8 itens animados** (o resto aparece direto — densidade > espetáculo).

### 7.6 Quando NÃO animar

- Digitação/edição inline: zero animação de layout (só cursor).
- Reordenar listas longas de camadas: sem stagger.
- **Cursores de colaboradores: interpolação linear (100ms), NUNCA spring** — spring mente sobre a posição real do colega.

### 7.7 `prefers-reduced-motion` (regra global, ver também §9.6 e §12)

Não desligue tudo: mantenha crossfades de opacidade (≤120ms), **zere** translações/scale/spring/overshoot, troque shimmer por pulso de opacidade. Encapsule numa util `.mov-seguro` e num hook `usaMovimentoReduzido()` no Zustand (para os componentes Konva, que não leem CSS). O encantamento degrada para fade curto — **nunca some a informação**.

---

## 8. Arquitetura de informação

### 8.1 Trilha: 11 abas → 10 abas em 4 grupos (lei de Hick)

"Projetos" sai da trilha e vira **seletor no breadcrumb** (Conflito #7). O restante em 4 grupos separados por divisórias de 1px, na trilha `w-14`:

- **Criar:** Templates · Elementos · Texto
- **Mídia:** Uploads · Fotos · IA
- **Marca:** Marca · Apps
- **Pessoas:** Colaborar · Time

### 8.2 Breadcrumb na barra superior

Ao lado do nome editável: **`Projeto ▸ Página 2 de 4` clicável** — resolve a desorientação em documentos multipágina e absorve o antigo item "Projetos".

---

## 9. Dashboard, estados vazios e onboarding

### 9.1 Dashboard com intenção

Topo fixo (`h-16`, `bg-superficie-50/80 dark:bg-superficie-900/80 backdrop-blur-xl`) com logo, **busca central** (`max-w-2xl`, atalho `/` para focar) e avatar. Abaixo:

1. **"Continuar de onde parou"** — 3 projetos mais recentes em cartões largos (`aspect-video`), pois ~80% das sessões são retomadas.
2. **"Criar design"** — reorganizado **por contexto** (Social, Impressão, Apresentação, Web) via **chips horizontais roláveis** (`.rolagem-fina snap-x`) que filtram a grade. Tamanho personalizado = cartão fantasma pontilhado (`border-2 border-dashed border-superficie-200`) no fim da linha. **Único brand moment decorativo permitido:** brilho radial `primaria-500/20` atrás de "Criar design".

### 9.2 Estados vazios memoráveis

- **Sem projetos:** ilustração de linha (stroke 1.5px `primaria-400`) de prancheta com faísca + copy **"Sua primeira obra começa aqui."** e CTA único **"Criar meu primeiro design"** que abre um canvas **já com template sugerido** — nunca em branco. Botão com `hover:scale-[1.02]` e `shadow-suave→shadow-painel`.
- **Camadas vazio:** "Solte algo no canvas — ele está esperando."

### 9.3 Onboarding / primeiro acesso

Logo se monta com a **faísca traçando o caminho**, tema detectado automaticamente, uma linha só: **"Bem-vindo ao estúdio."** Fundo `superficie-950→superficie-900` com **no máximo 6 partículas** flutuantes lentíssimas (40s loop). Calmo, caro, vivo.

---

## 10. Acessibilidade (WCAG 2.2 AA)

### 10.1 Anel de foco assinatura (token único)

```css
--anel-foco: 0 0 0 2px theme(colors.superficie.950), 0 0 0 4px theme(colors.primaria.400);
.dark { --anel-foco: 0 0 0 2px theme(colors.superficie.900), 0 0 0 4px theme(colors.primaria.400); }
```

Aplicado via `:focus-visible` com `outline: none`. **Obrigatório também** `outline: 2px solid transparent` no mesmo seletor, para não sumir em **`forced-colors: active`** (Windows High Contrast). `outline:none` órfão (sem `box-shadow` de foco) é proibido pelo lint. O duplo offset garante contraste tanto em `.botao-primario` (fundo roxo) quanto em campos claros. **Proibido `ring-primaria-500/60` como foco** (Conflito #1).

### 10.2 Contraste por token, verificável

Corpo secundário: piso `superficie-600` (claro) / `superficie-300` (escuro). Placeholder `superficie-500`+ e **nunca como rótulo** (`.rotulo-campo` sempre visível). Labels 12px sobre roxo sobem para `primaria-700`.

### 10.3 Teclado no editor (o ponto crítico)

Camada de foco DOM espelhando os nós Konva. `Tab` percorre objetos na ordem de camadas; **setas = 1px, `Shift`+seta = 10px**; `Enter` entra em edição de texto; `Esc` sai; `Alt`+setas navegam a árvore de camadas. Trilha: `role="tablist"` + navegação por setas + `aria-selected`. Modal de atalhos com `?`.

### 10.4 Alvos, regiões vivas e daltonismo

- **Alvos ≥44×44px** via padding (não width do ícone) em todo `.botao-icone`; handles com hitbox de 44px.
- **`aria-live`:** salvamento `polite` ("Salvando…", "Salvo às 14:32"); colaboração `polite` ("Ana entrou", comentários), cursores com `aria-label` de nome; erros de upload `assertive`.
- **Ícone-só:** `aria-label` em pt-BR; decorativos `aria-hidden="true"`.
- **Nunca só cor:** cursores = cor + inicial + forma; camada ativa = cor + ícone + peso; validação = verde/vermelho **sempre com ícone** (check/alerta).

### 10.5 Verificação

**`axe-core` no CI bloqueando merge com violação séria**; meta **Lighthouse Acessibilidade ≥95** no Dashboard e no Editor.

---

## 11. Performance percebida

### 11.1 Regra de ouro

Nada espera o servidor para dar feedback. No Zustand, **mutate o estado local imediatamente e reconcilie depois — nunca `await` antes de renderizar.**

### 11.2 Salvamento otimista

Máquina de estados: `editado` (instantâneo, cinza `superficie-500`) → `salvando…` (após **400ms de debounce**, micro-spinner 12px) → `salvo` (**check `primaria-500`**, fade-out 1.2s). Debounce **800ms para texto, 400ms para arrastar**; salve só o **delta da página ativa** via `structuralSharing`. Nunca bloqueie o canvas no autosave. (O check é roxo por coesão de marca — Conflito #5; verde é só para toasts/validação.)

### 11.3 Skeletons, nunca spinners de tela cheia

Cartões renderizam como skeletons `bg-superficie-200 dark:bg-superficie-800 animate-pulse rounded-xl2` na **dimensão exata** (CLS=0). Miniaturas com **blur-up** (LQIP base64 20px → full em `transition-opacity duration-300`). Abas da trilha abrem com 8–12 skeletons antes do fetch.

### 11.4 Konva a 60fps

Três `Layer` (fundo estático · conteúdo · `dragLayer`). Ao arrastar: mova o node para o `dragLayer`, `perfectDrawEnabled={false}`, `shadowForStrokeEnabled={false}`; só `layer.batchDraw()` — **nunca re-render do React**. Propague ao Zustand no `dragend`, não no `dragmove`. Cache nodes complexos com `.cache()` + `hitGraphEnabled={false}` em objetos travados. **Meta: `dragmove` <8ms/frame.**

### 11.5 Virtualização

Grades de Fotos/Elementos e Camadas (>30 itens) com `react-window`, `overscanCount={4}`, altura fixa. `content-visibility: auto` + `contain-intrinsic-size` fora da viewport.

### 11.6 Latência mascarada + progresso honesto

Template/IA: placeholder otimista na hora (retângulo `primaria-100` com shimmer), troca ao chegar. Troca de aba `transition-transform duration-150 ease-out`, **nunca >200ms**. IA (5–30s): barra **determinística por etapas reais** ("Interpretando prompt → Gerando → Refinando"); sem progresso real, shimmer indeterminado — **jamais porcentagem falsa**. Undo/redo síncrono **<16ms** (snapshots imutáveis, sem I/O). Shell do editor pinta **<500ms** antes do canvas hidratar.

---

## 12. Tema claro/escuro

Coerência total via tokens semânticos — **zero cor fixa em overlay**. Todo overlay usa `bg-superficie-850/95` (escuro) / `bg-white/95` (claro). No escuro: `ring-1 ring-white/[0.06]` + sombra preta reforçada (§3.3); texto `superficie-100`; `antialiased`. No claro: subpixel `auto`; bordas `superficie-200`. Cada nível de elevação sobe +4% de lightness no escuro. Toggle: crossfade 240ms + rotação 180°.

---

## 13. Encantamento / momentos "wow"

- **A faísca violeta (assinatura):** partícula `#7c4dff` que se dissolve em `primaria-300` com leve blur radial, em **todo** momento de sucesso. **Monocromática** — nada de confete multicolor. Amarra dashboard, editor e apresentação numa só voz.
- **Exportar/Baixar — o clímax:** o botão vira **check `stroke-dashoffset`** (400ms, `cubic-bezier(.34,1.56,.64,1)`) e dispara **12–18 faíscas violeta** subindo com física real (gravidade leve, `opacity 1→0` em 900ms). Micro-toast `bg-superficie-800 rounded-xl2 shadow-painel`: **"Pronto. Ficou lindo."** Com `prefers-reduced-motion`: troque partículas por pulso `scale 1→1.04→1`.
- **Colaboração deliciosa:** cursores em pill `rounded-full`, cor por hash **dentro da família violeta** (matiz rotaciona só ±30°, nunca vermelho/rosa puro). Ao entrar alguém: cursor "aterrissa" com spring + anel que expande e some (300ms). Comentário novo: pin pulsa 2×. Dois no mesmo objeto: **halo `primaria-500/30` de 2px**.
- **Salvamento como carinho:** dot pulsando → check → "Tudo guardado" some em 2s.
- **Easter eggs sutis:** Konami no editor = rastro de faíscas por 5s; nomear projeto "wow" = indicador pisca violeta; zoom 1337% = tooltip "modo hacker"; segurar `⌥` sobre o zoom revela FPS.

---

## 14. Responsividade (desktop-first, degradê tablet)

> Adicionar screen custom `estudio: '1440px'` ao `tailwind.config` (Conflito #8).

- **≥1440px (`estudio:`, ideal):** trilha `w-14` + painel esquerdo `w-80` + direito `w-72`, simultâneos.
- **1024–1439px (`lg`):** painel direito colapsa em **drawer sobreposto** (`absolute right-0`) por botão; canvas ganha respiro.
- **768–1023px (`md`, tablet):** trilha vira **barra inferior** (`bottom-0 h-16`) com 5 abas prioritárias (Templates, Elementos, Texto, Fotos, IA); painéis viram **bottom-sheets** (`rounded-t-xl2`, arrastáveis, snap 40%/90%); alvos ≥44×44px.
- **<768px:** bloqueie edição fina com aviso **"Melhor no computador"**, mas **permita visualizar e apresentar** — nunca tela branca.
- **Apresentação:** `Esc` sempre sai; controles somem após 3s de inatividade (`opacity-0 transition-opacity`), reaparecem no `mousemove`.

---

## 15. Guardrails anti-genérico (leia antes de cada commit)

1. Proibida mudança puramente decorativa sem propósito (feedback/hierarquia/orientação).
2. Proibido `transition: all` e animar propriedades não-GPU em loop/drag.
3. Proibido roxo cheio em >5% da tela — superfícies grandes usam tints (`/8`, `/12`, `primaria-50/900`).
4. Proibido matar densidade em ferramenta de trabalho.
5. Proibido quebrar acessibilidade por estética: nada <4.5:1, nenhum `outline:none` órfão, nenhum foco invisível.
6. Proibida regressão de performance: sem re-render React em `dragmove`, sem spinner de tela cheia, sem `await` antes de renderizar.
7. Proibida cor fixa em overlay.
8. Proibido spring em cursores de colaboração.
9. Proibido gradiente fora dos 5 lugares autorizados e fora da diagonal 135°.
10. Proibida animação >320ms na UI (export ≤500ms).
11. Proibido trocar **nomes** de classes/tokens existentes — evolua valores, preserve a API.
12. Proibido glassmorphism em painéis de trabalho.

---

## 16. Ordem de execução (por fases)

1. **Fundação de tokens.** OKLCH em `primaria-*`; superfícies semânticas (`--sup-*`); sombras empilhadas + `shadow-flutuante` (claro/escuro); tokens de movimento (curvas + durações); escala tipográfica + `tabular-nums` + features Inter; token `--anel-foco` (com `forced-colors`); screen custom `estudio`. *(Nada visual "novo" — só a base.)*
2. **Estados como sistema.** Hover/active/`:focus-visible`/disabled padronizados em `.botao-*`, `.campo-texto`, itens, abas. Raios coesos. Densidade base-4.
3. **Editor — núcleo de UX.** Toolbar flutuante; HUD de zoom-no-cursor; `Cmd+K`; handles + snapping magenta; painéis redimensionáveis + toggle de densidade.
4. **Painéis.** Propriedades colapsáveis + scrub + cadeado de proporção; camadas premium (miniatura, inline-edit, drag, realce bidirecional); reorg da trilha (10 abas / 4 grupos) + breadcrumb com seletor de projeto.
5. **Movimento significativo.** Indicador de salvamento; deslize de aba (`layoutId`); springs de painel; seleção/criação/exclusão no canvas; shared-element dashboard→editor; skeletons/shimmer.
6. **Dashboard e onboarding.** Topo fixo com busca `/`; "Continuar de onde parou"; chips por contexto; estados vazios com faísca; boas-vindas.
7. **Acessibilidade e teclado.** Camada de foco DOM espelhando Konva; navegação por setas; `aria-live`; alvos 44px; `axe-core` no CI.
8. **Performance.** Três `Layer` + `dragLayer`; salvamento otimista + debounce; virtualização; placeholders otimistas; blur-up.
9. **Encantamento.** Faísca violeta; clímax de export; colaboração deliciosa; easter eggs.
10. **`prefers-reduced-motion` + responsividade** em toda a superfície; polimento final claro/escuro.

---

## 17. Definição de Pronto (mensurável)

**Design system**
- [ ] `primaria-*` em OKLCH, sem salto perceptual entre 600–800 (verificado num gradient strip).
- [ ] 4 superfícies semânticas, cada uma com hairline e +4% lightness no escuro.
- [ ] 3 sombras empilhadas; no escuro há `ring-1 ring-white/[0.06]` + sombra 0.4/0.5.
- [ ] **Zero** `transition: all` e **zero** `outline:none` órfão (lint bloqueia).
- [ ] Roxo cheio ≤5% da tela em qualquer visão auditada.

**Tipografia & cor**
- [ ] `tabular-nums` em 100% dos números mutáveis — sem "pulo" ao arrastar slider.
- [ ] Nenhum par texto/fundo <4.5:1 (relatório de contraste anexado, claro e escuro).
- [ ] `bg-marca` aparece em exatamente 5 lugares, sempre 135°; rosa `#ff6ec7` nunca sólido.

**Editor**
- [ ] Toolbar flutuante 12px acima da seleção; recolhe em <80ms durante drag.
- [ ] Zoom ancora no cursor em 100% dos casos; `Cmd+0`=100%, `Shift+1`=ajustar.
- [ ] `Cmd+K` com fuzzy match cobrindo trocar aba, inserir, exportar, alinhar, mudar página.
- [ ] Snapping mostra linha magenta `#ff3d71` + distância numérica; threshold 6px de tela.
- [ ] Painel direito redimensiona 240–400px e persiste após reload.
- [ ] Realce bidirecional camada↔canvas funcionando.
- [ ] Trilha com 10 abas em 4 grupos; "Projetos" movido para o breadcrumb.

**Movimento**
- [ ] Nenhuma animação de UI >320ms (export ≤500ms); `box-shadow` só em troca discreta.
- [ ] Indicador de aba desliza (não pisca) com `layoutId`.
- [ ] `prefers-reduced-motion` zera translação/scale/spring e preserva toda informação.

**Acessibilidade (WCAG 2.2 AA)**
- [ ] `axe-core` no CI sem violação séria; **Lighthouse Acessibilidade ≥95** em Dashboard e Editor.
- [ ] Foco visível via `--anel-foco` + fallback `forced-colors`.
- [ ] Editor 100% operável por teclado (Tab entre objetos, setas 1px/`Shift`10px, `Esc`, `?`).
- [ ] Todo ícone-só com `aria-label` pt-BR; salvamento e colaboração com `aria-live`.
- [ ] Alvos de toque ≥44×44px (trilha, barra superior, handles).

**Performance**
- [ ] `dragmove` <8ms/frame; 60fps sustentado ao arrastar objeto complexo.
- [ ] Zero re-render do React durante drag (só `batchDraw`).
- [ ] Undo/redo <16ms; shell do editor pinta <500ms; CLS=0 no Dashboard.
- [ ] Nenhum spinner de tela cheia; skeletons na dimensão exata.

**Encantamento & coesão**
- [ ] Faísca violeta idêntica em dashboard, export e apresentação (uma só voz).
- [ ] Export dispara check `stroke-dashoffset` + faíscas + toast "Pronto. Ficou lindo."
- [ ] Overlays coerentes em claro/escuro sem cor fixa.
- [ ] Autosave check roxo; verde só em toasts/validação.
- [ ] **Nomes** de classes/tokens existentes preservados; build TS strict verde.

> **Lembre-se:** o luxo aqui é a restrição — uma cor de alegria, um gesto assinado, repetido com perfeição. Se um detalhe não torna a interface *ao mesmo tempo* mais bonita e mais fácil de usar, ele não entra.