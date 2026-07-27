import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build de arquivo único para publicação como página estática.
//
// Difere do build normal em dois pontos:
//  - inlineDynamicImports desliga o code splitting (o editor deixa de ser
//    um chunk separado), porque o destino não pode buscar chunks pela rede;
//  - VITE_SEM_SW desativa o registro do service worker, que não existe aqui.
//
// O pós-processamento (scripts/gerar-site.mjs) costura CSS, JS e fontes
// num único HTML sem nenhuma requisição externa.
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'import.meta.env.VITE_SEM_SW': '"1"',
  },
  build: {
    outDir: 'dist-site',
    // Um único arquivo grande comprime melhor e evita qualquer fetch.
    assetsInlineLimit: 100 * 1024 * 1024,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
