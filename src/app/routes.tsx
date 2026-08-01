import { Suspense } from 'react'
import { Outlet, createRootRoute, createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AppDevtools } from './devtools'
import { Header } from '@/widgets/header'

function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Suspense fallback={null}>
        <AppDevtools />
      </Suspense>
    </div>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

// Pages are code-split: each lazyRouteComponent becomes its own chunk that is
// fetched on navigation (or ahead of time thanks to defaultPreload: 'intent').
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyRouteComponent(() => import('@/pages/HomePage')),
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: lazyRouteComponent(() => import('@/pages/AboutPage')),
})

export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])
