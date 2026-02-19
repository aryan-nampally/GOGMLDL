import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { FocusProvider } from './context/FocusContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FocusProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </FocusProvider>
  </StrictMode>,
)
