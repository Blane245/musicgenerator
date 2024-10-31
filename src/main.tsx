import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { HelmetProvider } from 'react-helmet-async'
import { CMGProvider, useCMGContext } from './contexts/cmgcontext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <CMGProvider>
        <App />
      </CMGProvider>
    </HelmetProvider>
  </StrictMode>,
)
