# Runtime environment variables

## The problem

A Vite SPA is static files: `import.meta.env.VITE_*` values are string-replaced into the
bundle **at build time**. With plain `npm run build` that means one build per environment —
changing the API URL requires a rebuild.

This template keeps that behavior for non-Docker builds, but the Docker image is
**environment-agnostic**: built once by CI, configured at container start. The same
`sha-<full-sha>` image runs in dev, staging and prod; changing a value is a container
restart, not a rebuild.

## The mechanism, end to end

```
container env vars (.env / compose environment:)
        │
        ▼  at container START
docker/90-env-config.sh            baked into the image at /docker-entrypoint.d/90-env-config.sh;
        │                          nginx:alpine runs every executable *.sh there before nginx starts
        ▼  writes
/usr/share/nginx/html/env-config.js    e.g.  window.__ENV__ = { "VITE_API_BASE_URL": "https://api.example.com" }
        │
        ▼  loaded by index.html BEFORE the app bundle (plain <script src="/env-config.js">)
window.__ENV__
        │
        ▼  read by
src/env.ts       resolution per key: window.__ENV__ → import.meta.env → hardcoded default
```

Step by step:

1. **[`docker/90-env-config.sh`](../docker/90-env-config.sh)** — a POSIX sh script copied
   into `/docker-entrypoint.d/` by the [`Dockerfile`](../Dockerfile). The stock
   `nginx:alpine` entrypoint runs every executable `*.sh` in that directory before starting
   nginx. The script iterates a hardcoded `WHITELIST` — `VITE_API_BASE_URL`,
   `VITE_APP_NAME`, `VITE_DEFAULT_LOCALE` — skips empty/unset values, JSON-escapes each
   value (backslashes, quotes, newlines) and writes `window.__ENV__ = { ... }` to
   `/usr/share/nginx/html/env-config.js`. With nothing set it writes
   `window.__ENV__ = {}`.
2. **[`index.html`](../index.html)** loads `/env-config.js` with a plain `<script>` tag in
   `<head>`, **before** the module bundle — so `window.__ENV__` is populated by the time
   any app code runs.
3. **[`src/env.ts`](../src/env.ts)** is the only module that reads it. It resolves every
   key at module-evaluation time: `window.__ENV__[key]` → `import.meta.env[key]` → the
   default in the `env` object. App code calls `getEnv('VITE_API_BASE_URL')` and never
   touches `import.meta.env` or `window.__ENV__` directly.
4. **[`nginx/nginx.conf`](../nginx/nginx.conf)** serves `/env-config.js` with
   `Cache-Control: no-store` — the file changes on every container start, so it must never
   be cached (unlike the content-hashed bundle assets, which are cached for a year).

In **local dev** (`npm run dev`) and non-Docker builds, [`public/env-config.js`](../public/env-config.js)
is a committed fallback containing `window.__ENV__ = {}`, so resolution falls through to
`import.meta.env` — the ordinary Vite `.env` files.

Where the values come from in each mode:

| Mode                                         | Source of `VITE_*` values                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev` / `npm run build`              | Vite `.env` files, baked at build time                                        |
| `make up` (docker-compose.yml)               | your `.env` via `env_file:` (defaults in the `environment:` block), injected at container start |
| `make prod deploy` (docker-compose.prod.yml) | the server's `.env` via `env_file:`, injected at container start              |

## Adding a variable

Every place to touch, in order (using `VITE_FEATURE_FLAG` as the example):

1. **[`.env.example`](../.env.example)** — add `VITE_FEATURE_FLAG=...` with a comment, so
   `make env` produces a complete file.
2. **[`src/env.ts`](../src/env.ts)** — add the key to the `EnvConfig` interface and a
   `resolve('VITE_FEATURE_FLAG', '<default>')` entry to the `env` object.
3. **[`docker/90-env-config.sh`](../docker/90-env-config.sh)** — append the name to
   `WHITELIST`. Without this the variable silently never reaches the browser in Docker
   (dev keeps working via `import.meta.env`, which makes the omission easy to miss).
4. **[`docker-compose.yml`](../docker-compose.yml)** — optional: both compose files load
   `env_file: .env`, so a variable set in `.env` already reaches the container. Add it to
   the `environment:` block only if you want a fallback default for when `.env` does not
   define it.
5. Server `.env`s — set the real per-environment values (and the `ENV_FILE` GitHub
   Environment secret, if you use the optional `deploy.yml`).

Then use it as `getEnv('VITE_FEATURE_FLAG')`. All values are **strings** — parse booleans
and numbers at the call site.

The `src/env.test.ts` suite covers the precedence chain; extend it if you add resolution
behavior, not just keys.

## Security

- **Whitelist only, by design.** The script never dumps the whole container environment —
  only names listed in `WHITELIST` reach the browser. Keep it that way; auto-exporting
  every `VITE_*`-prefixed variable would eventually leak something.
- **Everything here is public.** `env-config.js` is served to every visitor unauthenticated,
  and `import.meta.env` values are readable in the bundle. Never put secrets, API keys, or
  tokens in any `VITE_*` variable, in either delivery mode. If the frontend needs access to
  a protected third-party API, proxy it through your backend.
- Values are JSON-escaped by the script, so hostile characters in an env value (quotes,
  newlines, carriage returns, backslashes) cannot break out of the generated JavaScript
  string.
