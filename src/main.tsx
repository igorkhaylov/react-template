import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { initTheme } from '@/features/theme-switcher'
import '@/i18n'
import '@/shared/styles/global.css'

// Apply the persisted (or OS-preferred) theme before the first paint.
initTheme()

const rootElement = document.getElementById('app')

if (rootElement && !rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}
