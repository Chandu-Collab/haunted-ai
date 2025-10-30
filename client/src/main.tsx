import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'
import './styles/environments.css'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './context/ThemeContext'

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
