import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { CMGProvider } from './contexts/cmgcontext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <CMGProvider>
        <App />
      </CMGProvider>
    </HelmetProvider>
  </StrictMode>,
)
