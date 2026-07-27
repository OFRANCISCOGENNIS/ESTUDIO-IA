/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** '1' no build de arquivo único, onde não existe /sw.js para registrar. */
  readonly VITE_SEM_SW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
