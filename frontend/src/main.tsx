import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { QueryProvider } from "@/providers/query"
import { ThemeProvider } from "@/providers/theme"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
