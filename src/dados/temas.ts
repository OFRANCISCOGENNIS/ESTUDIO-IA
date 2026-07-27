// =============================================================
// Temas de cor — paletas curadas para recolorir um design inteiro com
// um clique (estilo "Estilos → Cores" do Canva). Cada tema é uma
// sequência do tom mais escuro ao mais claro; o motor de recoloração
// mapeia as cores do design sobre a paleta preservando a relação
// claro↔escuro.
// =============================================================

export interface TemaCor {
  id: string
  nome: string
  cores: string[]
}

export const TEMAS_COR: TemaCor[] = [
  { id: 'original', nome: 'Original', cores: [] }, // vazio = mantém as cores atuais
  { id: 'crepusculo', nome: 'Crepúsculo', cores: ['#1a1030', '#7c4dff', '#c77dff', '#ff9e7d', '#ffe8d6'] },
  { id: 'oceano', nome: 'Oceano', cores: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'] },
  { id: 'floresta', nome: 'Floresta', cores: ['#1b4332', '#2d6a4f', '#40916c', '#95d5b2', '#f0f7f2'] },
  { id: 'por-do-sol', nome: 'Pôr do sol', cores: ['#3a0ca3', '#f72585', '#ff8500', '#ffbe0b', '#fff3d6'] },
  { id: 'terroso', nome: 'Terroso', cores: ['#3b2417', '#7f5539', '#b08968', '#ddb892', '#f6f1ea'] },
  { id: 'mono-grafite', nome: 'Grafite', cores: ['#111418', '#3a3f4b', '#6b7280', '#c3c8d2', '#f4f6fa'] },
  { id: 'doce', nome: 'Doce', cores: ['#4a1942', '#b5179e', '#ff5d8f', '#ffa5ba', '#ffe5ec'] },
  { id: 'neon', nome: 'Neon', cores: ['#0d0221', '#7b2cbf', '#e0aaff', '#39ff14', '#f7ff00'] },
  { id: 'corporativo', nome: 'Corporativo', cores: ['#0b132b', '#1c2541', '#3a506b', '#5bc0be', '#f2f7f7'] },
  { id: 'coral', nome: 'Coral', cores: ['#2b2d42', '#8d99ae', '#ef233c', '#ff8fa3', '#edf2f4'] },
  { id: 'menta', nome: 'Menta', cores: ['#1d3557', '#2a9d8f', '#8ecae6', '#c7f9cc', '#f1faee'] },
]
