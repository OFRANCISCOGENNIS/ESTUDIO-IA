/** @type {import('tailwindcss').Config} */
// Design system do DesignStudio Pro: tokens de cor, tipografia e espaçamento
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cor primária da marca (roxo/violeta — criatividade)
        primaria: {
          50: '#f3f1ff',
          100: '#e9e5ff',
          200: '#d5cdff',
          300: '#b7a6ff',
          400: '#9475ff',
          500: '#7c4dff',
          600: '#6d28f7',
          700: '#5e1ee3',
          800: '#4e19bf',
          900: '#41179c',
        },
        // Superfícies do tema escuro do editor
        superficie: {
          50: '#f8f9fb',
          100: '#eef0f4',
          200: '#dde1e8',
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
      boxShadow: {
        suave: '0 2px 12px rgba(0, 0, 0, 0.08)',
        painel: '0 4px 24px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
}
