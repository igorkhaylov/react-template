# Architecture

The `src/` tree follows a pragmatic, slimmed-down [Feature-Sliced Design](https://feature-sliced.design/)
(FSD-lite): six layers, each with a single responsibility, and a strict import direction.
No `processes` layer, no per-slice `model/ui/lib` segment ceremony — a slice is just a
folder with the files it needs and an `index.ts` barrel where re-exports help.

## Layers

| Layer       | Responsibility                                              | In this template                                                                   |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `app/`      | Application wiring: providers, router, route tree, devtools | `providers.tsx`, `router.ts`, `routes.tsx`, `devtools.tsx`                         |
| `pages/`    | Route screens — compose everything below into a view        | `HomePage`, `AboutPage`, `NotFoundPage`                                            |
| `widgets/`  | Self-contained page blocks reused across pages              | `header/`                                                                          |
| `features/` | User interactions that change something                     | `language-switcher/`, `theme-switcher/`                                            |
| `entities/` | Business data: types, API functions, query hooks            | `health/`                                                                          |
| `shared/`   | Everything domain-agnostic                                  | `api/`, `ui/`, `shadcn-ui/`, `lib/`, `locales/`, `styles/`, `constants/`, `types/` |

Three cross-cutting singletons live at the `src/` root rather than in a layer, because
everything may import them: `env.ts` (typed env access), `i18n.ts` (i18next init) and
`main.tsx` (the entry point).

## The import-direction rule

**A module may only import from layers below its own.** Top to bottom:

```
app → pages → widgets → features → entities → shared
```

- `app` may import anything; `shared` may import only other `shared` modules.
- Same-layer imports across slices are not allowed (e.g. one feature must not import
  another feature). If two slices need the same code, push it down — usually to `shared`.
- `src/env.ts` and `src/i18n.ts` are exempt: any layer may import them.

The rule is a convention, not enforced by tooling — review for it. It is what keeps
`shared` reusable, entities independent of UI, and pages freely composable.

Real examples from the template: `widgets/header` imports `features/language-switcher`
and `features/theme-switcher` (one layer down); `entities/health` imports `shared/api`;
`pages/HomePage` imports `entities/health` and `shared/shadcn-ui`.

## Where does new code go?

| You are adding…                               | Put it in                              | Example                   |
| --------------------------------------------- | -------------------------------------- | ------------------------- |
| A new screen with a URL                       | `pages/` + a route in `app/routes.tsx` | `ProfilePage`             |
| A block used on several pages                 | `widgets/`                             | footer, sidebar           |
| A user interaction with its own logic/state   | `features/`                            | logout button, search bar |
| A backend resource: types + API + query hooks | `entities/<name>/`                     | `user`, `order`           |
| A generic UI component (no domain knowledge)  | `shared/ui/`                           | spinner, modal            |
| A shadcn/ui component (via the CLI)           | `shared/shadcn-ui/`                    | `button.tsx`              |
| A helper function, hook, or constant          | `shared/lib/` / `shared/constants/`    | `cn()`                    |
| A wire type shared by many entities           | `shared/types/`                        | `BaseResponse`            |
| A provider or router concern                  | `app/`                                 | analytics provider        |

Rule of thumb: start as low as possible. Code is easy to promote from `shared` upward,
painful to demote.

## Routing

Routing is **code-based** (no file-based route generation): the whole route tree lives in
[`src/app/routes.tsx`](../src/app/routes.tsx) as `createRootRoute` / `createRoute` calls,
and [`src/app/router.ts`](../src/app/router.ts) builds the router from it.

- **Code splitting** — every page is wrapped in `lazyRouteComponent(() => import(...))`,
  so each page becomes its own chunk fetched on navigation.
- **Preloading** — `defaultPreload: 'intent'` starts loading a route on hover/touchstart,
  which usually hides the chunk fetch entirely.
- **Type safety** — the `declare module '@tanstack/react-router'` block in `router.ts`
  registers the router type, so `<Link to="...">` and `useNavigate` are checked against
  real routes at compile time.
- **Root layout** — `RootLayout` in `routes.tsx` renders the header, an `<Outlet />` and
  the devtools; add global chrome there.
- **Devtools** — [`src/app/devtools.tsx`](../src/app/devtools.tsx) loads TanStack
  Router/Query devtools lazily and only outside production builds; `import.meta.env.PROD`
  is replaced statically, so the devtools are dead-code-eliminated from the bundle.

To add a page: create `src/pages/FooPage.tsx` (default export), add a `createRoute` in
`routes.tsx`, and append it to `routeTree.addChildren([...])`.

## Data fetching

Three layers, each ignorant of the ones above:

```
shared/api/client.ts   →   entities/<name>/api.ts + queries.ts   →   components
   (fetch wrapper)             (endpoints + query hooks)              (hooks only)
```

1. **`shared/api/client.ts`** — a minimal typed wrapper over `fetch`: builds URLs from
   `VITE_API_BASE_URL`, serializes query params (skipping `null`/`undefined`), sends and
   parses JSON, forwards `AbortSignal`, and throws a typed `ApiError` (`status`, `detail`,
   `data`) for every non-2xx response. No axios, no interceptors, no runtime deps.
2. **`entities/<name>/api.ts`** — plain functions calling `apiClient`, one per endpoint,
   returning typed promises. **`queries.ts`** — TanStack Query hooks over those functions,
   with keys from the `createQueryKeys` factory (`shared/api/query-keys.ts`): every key
   starts with the entity scope, so invalidating `fooKeys.all` invalidates every query of
   that entity at once.
3. **Components** call the hooks and render `isPending` / `isSuccess` / `isError` — they
   never touch `apiClient` directly.

Query defaults are tuned in [`src/app/providers.tsx`](../src/app/providers.tsx):
`staleTime: 60s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`. Override
per-query where the data demands it — `entities/health/queries.ts` does (`retry: false`,
`refetchInterval: 30s`).

The reference implementation is `entities/health` plus the `BackendStatusCard` in
`HomePage.tsx` — copy that trio (`api.ts`, `queries.ts`, consuming component) for every
new resource.

## Errors and 404s

Both are handled once, at the router level (`src/app/router.ts`):

- **404** — `defaultNotFoundComponent: NotFoundPage`. Any unmatched URL renders
  `pages/NotFoundPage` inside the root layout; the SPA fallback in `nginx/nginx.conf`
  (`try_files` to `index.html`) makes this work on hard refreshes too.
- **Render/loader errors** — `defaultErrorComponent: ErrorFallback`
  (`shared/ui/ErrorFallback`). Any route that throws renders a translated message with
  the error text and a reload button, instead of a white screen.
- **API errors** — `ApiError` is thrown by the client and surfaces through TanStack
  Query's `isError`/`error`; components decide how to render it (see the health card's
  "no backend" state, which is an expected state, not a crash).
