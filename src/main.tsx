import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LimiteErro } from './componentes/LimiteErro'
import './styles/index.css'
// Registra os plugins de exemplo (arquitetura de extensões)
import './nucleo/plugins/exemplos'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LimiteErro>
      <App />
    </LimiteErro>
  </React.StrictMode>,
)

// PWA — registra o service worker para funcionamento offline básico
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registro do SW falhou — o app segue funcionando online
    })
  })
}
