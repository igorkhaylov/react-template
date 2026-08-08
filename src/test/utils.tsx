import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import type { i18n as I18nInstance } from 'i18next'
import type { ReactElement, ReactNode } from 'react'
import { LOCALES } from '@/shared/constants/common'
import en from '@/shared/locales/en.json'
import ru from '@/shared/locales/ru.json'
import uz from '@/shared/locales/uz.json'

/**
 * Fresh QueryClient per test: retries off so error states appear after a
 * single failed request, caching neutralized so tests never share state.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

/**
 * Isolated i18next instance with the real locale resources. Language is fixed
 * (English by default) instead of detected, and there is no localStorage
 * caching — tests stay deterministic and independent of each other.
 */
export function createTestI18n(lng: string = 'en'): I18nInstance {
  const instance = createInstance()
  void instance.use(initReactI18next).init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      uz: { translation: uz },
    },
    lng,
    fallbackLng: 'en',
    supportedLngs: LOCALES,
    // Resources are bundled, so init can complete synchronously.
    initAsync: false,
    interpolation: { escapeValue: false },
  })
  return instance
}

interface ProviderOptions {
  queryClient?: QueryClient
  i18n?: I18nInstance
}

/**
 * Renders `ui` inside the app's provider stack (TanStack Query + i18next)
 * with test-friendly defaults. Returns the render result plus a ready
 * user-event instance and the QueryClient / i18n used, for assertions.
 */
export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient()
  const i18n = options.i18n ?? createTestI18n()
  const user = userEvent.setup()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </I18nextProvider>
    )
  }

  return { user, queryClient, i18n, ...render(ui, { wrapper: Wrapper }) }
}

/**
 * Like renderWithProviders, but mounts `ui` as the index route of a minimal
 * memory-history router so components using <Link> / router hooks work.
 * An empty /about route exists so links to it resolve. The router is loaded
 * before rendering, which keeps the initial render synchronous.
 */
export async function renderWithRouter(ui: ReactElement, options: ProviderOptions = {}) {
  const rootRoute = createRootRoute({ component: Outlet })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => ui,
  })
  const aboutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/about',
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, aboutRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()

  const result = renderWithProviders(<RouterProvider router={router} />, options)
  // Flush the router's mount transition so its state updates land inside act.
  await act(async () => {})
  return result
}

interface FakeResponseOptions {
  status?: number
  statusText?: string
  body?: unknown
  contentType?: string
}

/**
 * Minimal Response stand-in covering exactly what shared/api/client.ts reads
 * (status, statusText, ok, content-type header, json(), text()). Plain object
 * instead of the real Response class so tests do not depend on fetch globals
 * being present in the test environment.
 */
export function fakeResponse(options: FakeResponseOptions = {}): Response {
  const { status = 200, statusText = '', body = null, contentType = 'application/json' } = options
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}
