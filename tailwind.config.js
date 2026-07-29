/** @type {import('tailwindcss').Config} */
// Design system do DesignStudio Pro — Fase 1 do redesign (docs/PROMPT-UI.md):
// paleta perceptual OKLCH, sombras empilhadas via CSS vars, tokens de
// movimento (curvas/durações) e breakpoint de estúdio.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // Breakpoint dedicado ao editor (o default do Tailwind vai só até 2xl:1536)
        estudio: '1440px',
      },
      colors: {
        // Cor primária da marca em OKLCH (lightness perceptualmente uniforme,
        // hue ~287). Canal <alpha-value> habilita os tints /8 /12 do sistema.
        // O 500 é fixado no hex âncora exato (#7c4dff).
        primaria: {
          50: 'oklch(97% 0.02 287 / <alpha-value>)',
          100: 'oklch(94% 0.04 287 / <alpha-value>)',
          200: 'oklch(88% 0.08 287 / <alpha-value>)',
          300: 'oklch(80% 0.13 287 / <alpha-value>)',
          400: 'oklch(70% 0.17 287 / <alpha-value>)',
          500: 'rgb(124 77 255 / <alpha-value>)',
          600: 'oklch(56% 0.18 287 / <alpha-value>)',
          700: 'oklch(46% 0.15 287 / <alpha-value>)',
          800: 'oklch(36% 0.11 287 / <alpha-value>)',
          900: 'oklch(26% 0.07 287 / <alpha-value>)',
        },
        // Cor semântica de risco (hue ~25). Fica separada do roxo da marca
        // de propósito: "algo deu errado" não pode depender do acento, que
        // já significa "ação principal" em toda a interface.
        perigo: {
          50: 'oklch(97% 0.02 25 / <alpha-value>)',
          400: 'oklch(70% 0.16 25 / <alpha-value>)',
          500: 'oklch(62% 0.19 25 / <alpha-value>)',
          600: 'oklch(55% 0.20 25 / <alpha-value>)',
          950: 'oklch(22% 0.06 25 / <alpha-value>)',
        },
        // Superfícies (base para as variáveis semânticas --sup-* no CSS)
        superficie: {
          50: '#f8f9fb',
          100: '#eef0f4',
          200: '#dde1e8',
          500: '#8b93a3',
          600: '#6b7280',
          700: '#3a3f4b',
          800: '#252932',
          850: '#1e222a',
          900: '#181b21',
          950: '#121419',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // Sombras empilhadas (contato + ambiente) via CSS vars, com override no escuro
      boxShadow: {
        suave: 'var(--shadow-suave)',
        painel: 'var(--shadow-painel)',
        flutuante: 'var(--shadow-flutuante)',
      },
      borderRadius: {
        // Cartões e painéis (14px, conforme o sistema de raios)
        xl2: '0.875rem',
      },
      // Tokens de movimento — teto de 320ms na interface
      transitionTimingFunction: {
        'facil-saida': 'cubic-bezier(.22,1,.36,1)',
        'facil-padrao': 'cubic-bezier(.4,0,.2,1)',
        'facil-brusco': 'cubic-bezier(.4,0,1,1)',
      },
      transitionDuration: {
        micro: '120ms',
        curta: '180ms',
        media: '240ms',
        longa: '320ms',
      },
      backgroundImage: {
        // Gradiente assinatura (sempre 135°) — uso parcimonioso (5 lugares)
        marca: 'linear-gradient(135deg, #7c4dff 0%, #9d5cff 45%, #ff6ec7 100%)',
      },
    },
  },
  plugins: [],
}
