import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração do Vite para o DesignStudio Pro
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as ReturnType<typeof defineConfig> & { test: unknown })
