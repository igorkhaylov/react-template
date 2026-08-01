# React Template

Production-oriented React + TypeScript starter: Vite, TanStack Router/Query, Tailwind CSS 4,
i18next (ru / en / uz), Vitest, and a Docker + nginx image with **runtime environment
variables** — build the image once, configure it at container start.

## Tech Stack

- **React 19** / **TypeScript 5** (strict) / **Vite 7**
- **TanStack Router** — type-safe, code-based routing with lazy-loaded pages
- **TanStack Query** — server state, typed fetch client, query-key factory
- **Tailwind CSS 4** + **shadcn/ui** primitives — dark mode via the `.dark` class
- **i18next** (react-i18next + browser language detector) — ru / en / uz
- **Vitest** + **Testing Library** — jsdom, V8 coverage
- **ESLint** (TanStack config) + **Prettier** — no semicolons, single quotes
- **Docker** — multi-stage `node:24-alpine` build → `nginx:1.27-alpine` serve
- **GitHub Actions** — CI gate, GHCR image publishing, optional deploy

## Project Structure

```
├── src/
│   ├── app/                 # Wiring: providers, router, routes, devtools
│   ├── pages/               # Route screens: HomePage, AboutPage, NotFoundPage
│   ├── widgets/             # Self-contained page blocks: header
│   ├── features/            # User interactions: language-switcher, theme-switcher
│   ├── entities/            # Business data + its API: health
│   ├── shared/              # api client, ui, shadcn-ui, lib, locales, styles, constants, types
│   ├── test/                # Vitest setup + render helpers
│   ├── env.ts               # Typed env access (runtime → build-time → default)
│   ├── i18n.ts              # i18next initialization
│   └── main.tsx             # Entry point
├── public/                  # Static assets; env-config.js dev fallback
├── docker/                  # 90-env-config.sh — runtime env injection at container start
├── nginx/                   # nginx.conf: SPA fallback, caching, /healthz
├── docs/                    # architecture.md · runtime-env.md · deploy.md
├── .github/workflows/       # ci.yml · build-push.yml · deploy.yml
├── docker-compose.yml       # Local production-like (builds from source)
├── docker-compose.prod.yml  # Production deploy (pulls the registry image)
├── Dockerfile
└── Makefile
```

The `src/` layering (a pragmatic Feature-Sliced Design) and the import-direction rule are
described in [docs/architecture.md](docs/architecture.md).

## Quick start

**Local development:**

```bash
nvm use          # Node 24 (.nvmrc)
npm ci
npm run dev      # → http://localhost:3000
```

**Docker (production-like, builds from source):**

```bash
make env         # create .env from .env.example (never overwrites an existing one)
make up          # build the image + serve via nginx → http://localhost:${APP_PORT:-3000}
```

## Environment variables

All variables live in [`.env.example`](.env.example); `make env` copies it to `.env`.

| Variable              | Default                                     | Description                                                                           |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `APP_PORT`            | `3000`                                      | Host port the container publishes (`docker-compose*.yml` → nginx `:80`)               |
| `FRONTEND_IMAGE`      | `ghcr.io/igorkhaylov/react-template:latest` | Image `docker-compose.prod.yml` pulls; pin `:sha-<full-sha>` for reproducible deploys |
| `VITE_API_BASE_URL`   | `http://localhost:8000`                     | Backend API base URL used by the fetch client                                         |
| `VITE_APP_NAME`       | `MyApp`                                     | App name shown in the header                                                          |
| `VITE_DEFAULT_LOCALE` | `ru`                                        | i18next fallback language (`ru` / `en` / `uz`)                                        |

### Build-time vs runtime env

A Vite SPA normally bakes `VITE_*` values into the bundle at build time — one build per
environment. This template avoids that for Docker: **the image is built once and configured
at container start.**

- **Docker image (runtime):** `nginx:alpine` runs [`docker/90-env-config.sh`](docker/90-env-config.sh)
  from `/docker-entrypoint.d/` before nginx starts. It writes whitelisted `VITE_*` container
  env vars into `env-config.js`, which `index.html` loads **before** the app bundle as
  `window.__ENV__`. Changing a value needs a container restart, not a rebuild.
- **Plain `npm run build` (build-time):** without Docker, values are baked in from the Vite
  `.env` files as usual — a different value means a rebuild.

[`src/env.ts`](src/env.ts) resolves every key as
`window.__ENV__` → `import.meta.env` → default. Only whitelisted, non-secret values are
exposed — everything here is public to the browser. Full mechanism, how to add a variable,
and the security notes: [docs/runtime-env.md](docs/runtime-env.md).

## Scripts

| Script                 | What it does                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Vite dev server with HMR on port 3000                             |
| `npm run build`        | Type-check (`tsc --noEmit`) then production build to `dist/`      |
| `npm run preview`      | Serve the built `dist/` locally                                   |
| `npm run typecheck`    | TypeScript check, no emit                                         |
| `npm run lint`         | ESLint                                                            |
| `npm run lint:fix`     | ESLint with auto-fix                                              |
| `npm run format`       | Prettier, write                                                   |
| `npm run format:check` | Prettier, check only                                              |
| `npm run test`         | Vitest, single run                                                |
| `npm run test:watch`   | Vitest watch mode                                                 |
| `npm run coverage`     | Vitest with V8 coverage (text + html reports)                     |
| `npm run check`        | Non-mutating gate: `format:check` + `lint` + `typecheck` + `test` |

## Makefile

`make help` prints the same summary. Local targets delegate to the npm scripts above.

| Group     | Targets                                                                               |
| --------- | ------------------------------------------------------------------------------------- |
| First run | `env` (create `.env`) · `install` (`npm ci`)                                          |
| Local dev | `start` · `lint` · `lint-fix` · `format` · `typecheck` · `test` · `check` · `preview` |
| Docker    | `up` · `down` · `down-v` · `build` · `pull` · `logs [service]` · `restart` · `bash`   |
| Server    | `make prod deploy` — pull the registry image and (re)start (never builds)             |
| Utilities | `push` (manual multi-platform image push) · `clean`                                   |

The `prod` prefix switches the compose file: `prod` → `docker-compose.prod.yml` (pulls the
prebuilt image), no prefix → `docker-compose.yml` (builds from source).

## Testing

Vitest + Testing Library on jsdom; `globals: true`, setup in
[`src/test/setup.ts`](src/test/setup.ts) (cleanup + `vi.unstubAllGlobals/Envs` after each
test). Tests are colocated with the code (`*.test.ts(x)`).

```bash
npm run test          # single run (what CI runs)
npm run test:watch    # watch mode
npm run coverage      # V8 coverage, text + html (coverage/ is gitignored)
```

[`src/test/utils.tsx`](src/test/utils.tsx) provides `renderWithProviders` (isolated
QueryClient + i18n instance), `renderWithRouter` (memory-history router), and
`fakeResponse` for testing the API client without a network.

## Code quality

- **ESLint** — [`eslint.config.js`](eslint.config.js): `@tanstack/eslint-config`
  (type-aware) + `eslint-config-prettier`, plus a few explicit rules (`no-console` warns).
- **Prettier** — [`prettier.config.js`](prettier.config.js): no semicolons, single quotes,
  width 100, Tailwind class sorting via `prettier-plugin-tailwindcss`.
- **TypeScript** — strict mode, `noUnusedLocals`/`noUnusedParameters`, `@/*` → `src/*` alias.

`npm run check` runs everything non-mutating — the same gates CI runs (CI additionally
verifies the production build with `npm run build`).

## Internationalization

i18next with `ru`, `en`, `uz` (translations in [`src/shared/locales/`](src/shared/locales)).
The language detector reads `localStorage` first, then the browser language; every explicit
switch is persisted back to `localStorage`. The fallback language comes from
`VITE_DEFAULT_LOCALE`.

To add a locale:

1. Create `src/shared/locales/<lng>.json` (copy `en.json` and translate — the
   locale-parity test in `src/i18n.test.ts` discovers locale files automatically and
   fails if any key set differs).
2. Add the code to `LOCALES` in [`src/shared/constants/common.ts`](src/shared/constants/common.ts).
3. Register it in `resources` in [`src/i18n.ts`](src/i18n.ts).

The language switcher renders from `LOCALES` automatically.

## Theming

Dark mode uses Tailwind's **class strategy**: the `.dark` class on `<html>` (wired via
`@custom-variant dark` in [`src/shared/styles/global.css`](src/shared/styles/global.css)).
All colors are CSS variables defined for `:root` and `.dark`, so shadcn/ui components theme
automatically. `initTheme()` runs synchronously before React mounts (no flash): stored
choice from `localStorage` first, OS `prefers-color-scheme` otherwise.

## API layer

A minimal typed fetch client ([`src/shared/api/client.ts`](src/shared/api/client.ts)) — no
runtime dependencies: JSON handling, query params, `AbortSignal` passthrough, and a typed
`ApiError` for every non-2xx response. Each entity owns its API functions and TanStack Query
hooks (`src/entities/<name>/api.ts` + `queries.ts`), with query keys from the
`createQueryKeys` factory. Conventions: [docs/architecture.md](docs/architecture.md).

The home page ships a **backend status card** that polls `GET /healthcheck/` and
demonstrates the layer end to end (pending → success → error states). It pairs with
[django-template](https://github.com/igorkhaylov/django-template) out of the box — start
that backend (or point `VITE_API_BASE_URL` at any API with a `/healthcheck/` endpoint) and
the card turns green. The "no backend" state is expected, not an error: the template runs
standalone.

## CI/CD

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — on every pull request and push to
  `master`: `format:check` → `lint` → `typecheck` → `test` → `build`.
- [`.github/workflows/build-push.yml`](.github/workflows/build-push.yml) — on push to
  `master`, on `v*` tags, or manual: runs the same quality gate, then builds the Docker
  image and pushes it to **GHCR** (`ghcr.io/<owner>/<repo>`) with tags `latest` (default
  branch), `sha-<full-sha>` (every build — use this to pin prod), and `vX.Y.Z` / `X.Y.Z`
  (git tags). Needs no secrets beyond the built-in `GITHUB_TOKEN`.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — **optional**, manual
  dispatch only, requires a **self-hosted runner** on the target server. Picks a GitHub
  Environment (`dev` / `prod`), writes `.env` from that environment's `ENV_FILE` secret,
  then `docker compose -f docker-compose.prod.yml pull && up -d`. If you deploy by SSH-ing
  in and running `make prod deploy`, delete it or leave it unused.

## Production deploy

Production uses a **registry image, not a server-side build**: CI pushes the image to GHCR,
the server only pulls it.

```bash
# On the server (needs: docker-compose.prod.yml + Makefile + ./.env):
make prod deploy    # = docker compose -f docker-compose.prod.yml pull && up -d
```

Set `FRONTEND_IMAGE` in the server's `.env` — pin a reproducible build by sha, e.g.
`ghcr.io/igorkhaylov/react-template:sha-<full-sha>` (a moving `:latest` also works but
drifts on the next push). GHCR packages are private by default, so the server must be
logged in to the registry first. The full zero-to-first-deploy runbook, including the
GHCR token setup and rollback, is in [docs/deploy.md](docs/deploy.md).

The container serves on port 80 (published as `APP_PORT`), answers `GET /healthz` with 204
for health checks, and is expected to sit behind your edge reverse proxy (TLS termination).

## Adapting this template

1. **Name the app**: `VITE_APP_NAME` in `.env` / `.env.example`, `name` and `description`
   in `package.json`, `<title>` + `meta description` in `index.html`, and
   `public/manifest.json`.
2. **Replace the icon**: `public/favicon.svg`.
3. **Point at your registry**: `FRONTEND_IMAGE` in `.env.example` and the `IMAGE` default
   in the `Makefile`; `GITHUB_URL` in `src/pages/HomePage.tsx`.
4. **Replace the health demo**: swap `src/entities/health` and the `BackendStatusCard` in
   `HomePage.tsx` for your first real entity — they exist to be copied.
5. **Prune locales**: drop unneeded languages from `LOCALES`, `src/i18n.ts` and
   `src/shared/locales/`; set `VITE_DEFAULT_LOCALE`.
6. **Rewrite the pages**: `HomePage` / `AboutPage` are template showcases.

## Documentation

- [docs/architecture.md](docs/architecture.md) — layering, import rules, routing and
  data-fetching conventions, where new code goes
- [docs/runtime-env.md](docs/runtime-env.md) — the runtime env mechanism end to end
- [docs/deploy.md](docs/deploy.md) — server runbook: zero → first deploy → CI

## License

[MIT](LICENSE)
