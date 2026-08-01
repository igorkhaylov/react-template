import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routes'
import NotFoundPage from '@/pages/NotFoundPage'
import { ErrorFallback } from '@/shared/ui/ErrorFallback'

export const router = createRouter({
  routeTree,
  // Start loading a route when the user shows intent (hover / touchstart).
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: ErrorFallback,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
