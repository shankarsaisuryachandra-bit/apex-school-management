import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { TenantProvider } from './context/TenantContext'
import { ThemeProvider } from './context/ThemeContext'
import { CommandPaletteProvider } from './context/CommandPaletteContext'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <ThemeProvider>
              <CommandPaletteProvider>
                <App />
              </CommandPaletteProvider>
            </ThemeProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

