import { lazy } from 'react'

/**
 * Router + Query devtools, loaded only outside production builds.
 * `import.meta.env.PROD` is replaced statically at build time, so the branch
 * with the dynamic imports is dead code in production and gets eliminated —
 * the devtools never reach the production bundle.
 */
export const AppDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      Promise.all([
        import('@tanstack/react-router-devtools'),
        import('@tanstack/react-query-devtools'),
      ]).then(([routerDevtools, queryDevtools]) => ({
        default: function Devtools() {
          return (
            <>
              <routerDevtools.TanStackRouterDevtools />
              <queryDevtools.ReactQueryDevtools initialIsOpen={false} />
            </>
          )
        },
      })),
    )
