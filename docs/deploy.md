# Deploy runbook: zero → first deploy → CI

How to take a server from nothing to a running frontend container, and optionally let CI
deploy to it.

**The model** (same as [README → CI/CD](../README.md#cicd)):
[`build-push.yml`](../.github/workflows/build-push.yml) builds the image and pushes it to
**GHCR**; the server **only pulls** — it never builds. The server holds three things: the
deploy files (simplest: a git checkout of this repo), its own `./.env`, and a Docker login
to the registry.

The container is a self-contained nginx serving the SPA on port 80 (published as
`APP_PORT`). Run it behind your edge reverse proxy — the one terminating TLS for your
domain — pointed at `APP_PORT`.

---

## 1. Prerequisites

- A server with **Docker Engine + the compose plugin**
  (`curl -fsSL https://get.docker.com | sh` on Debian/Ubuntu).
- An image in GHCR — push to `master` once (or run the _Build and push frontend image_
  workflow manually) so `ghcr.io/<owner>/<repo>` exists.
- An edge reverse proxy for TLS (Caddy, Traefik, nginx — anything that can proxy to a
  local port).

## 2. Registry login (GHCR)

GHCR packages are **private by default**, so an anonymous `docker pull` fails — and
`pull_policy: always` in `docker-compose.prod.yml` means even restarts need a logged-in
Docker. Authenticate with a GitHub **Personal Access Token (classic)**:

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** →
   **Tokens (classic)** → **Generate new token (classic)**.
2. Tick **only** the **`read:packages`** scope — this token lives on the server, keep it
   read-only. (Use a _classic_ token: GHCR does not accept fine-grained tokens for
   package pulls.)
3. Log the server in (once; Docker persists it in `~/.docker/config.json`):

```bash
echo "$GHCR_PAT" | docker login ghcr.io -u <github-username> --password-stdin
```

The stored credential is only base64-encoded, not encrypted — another reason for the
minimal scope. To rotate: generate a new token, re-run `docker login`, delete the old one.

Alternatively, make the package public (GitHub → the package → Package settings →
Change visibility) and skip the login entirely.

## 3. Files on the server

```bash
git clone git@github.com:<owner>/<repo>.git /srv/<project>
cd /srv/<project>
```

A full checkout is simplest (and is what keeps `docker-compose.prod.yml` in sync via
`git pull`), but strictly the server only needs three files in one directory:
`docker-compose.prod.yml`, `Makefile` (for `make prod deploy`; optional if you run the
compose commands directly) and `./.env`.

Create the production `.env` (it stays on the server; nothing else writes it unless you
adopt the optional CI deploy below):

```bash
make env    # copies .env.example → .env, then edit it
```

| Variable                                | Value in prod                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `FRONTEND_IMAGE`                        | `ghcr.io/<owner>/<repo>:sha-<full-sha>` — pin the exact build (a moving `:latest` works but drifts on the next push) |
| `APP_PORT`                              | host port your edge proxy targets (default `3000`)                                                                   |
| `VITE_API_BASE_URL`                     | public URL of your backend API                                                                                       |
| `VITE_APP_NAME` / `VITE_DEFAULT_LOCALE` | your values                                                                                                          |

The `VITE_*` values are injected into the running container at start — no rebuild; see
[runtime-env.md](runtime-env.md).

## 4. First deploy

```bash
cd /srv/<project>
make prod deploy    # = docker compose -f docker-compose.prod.yml pull && up -d
```

Verify:

```bash
docker compose -f docker-compose.prod.yml ps        # frontend should become "healthy"
curl -i http://localhost:${APP_PORT:-3000}/healthz  # HTTP 204
curl -s http://localhost:${APP_PORT:-3000}/env-config.js   # your VITE_* values
```

Point the edge proxy at `APP_PORT` and you are live.

## 5. Updating

Every merge to `master` publishes a new image tagged `latest` and `sha-<full-sha>` (the
sha is the commit hash — find it on the commit or in the _Build and push_ run). To update:

```bash
cd /srv/<project>
git pull                          # sync compose/Makefile, if you keep a checkout
# edit .env: FRONTEND_IMAGE=ghcr.io/<owner>/<repo>:sha-<new-full-sha>
make prod deploy
```

If you run `:latest` instead of pinning, `make prod deploy` alone picks up the newest
build — convenient, but you lose the record of what exactly is deployed.

## 6. Rollback

Every build stays in the registry forever under its `sha-` tag, so rollback is redeploying
the previous pin:

```bash
# edit .env back to the previous sha, then:
make prod deploy
# or as a one-off, without editing .env:
FRONTEND_IMAGE=ghcr.io/<owner>/<repo>:sha-<previous-sha> make prod deploy
```

The frontend is stateless — no migrations, no data — so rollbacks are instant and safe.
(Mind API compatibility: an old frontend against a newer backend is the only thing that
can bite.)

## 7. Optional: deploys from GitHub Actions (self-hosted runner)

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) automates steps 4–5. It
is **optional** — if SSH + `make prod deploy` suits you, delete it or leave it unused. It
requires a **self-hosted runner** because the job runs `docker compose` directly on the
machine it executes on.

Setup:

1. **Register a self-hosted runner on the target server**: GitHub repo → Settings →
   Actions → Runners → New self-hosted runner, and follow the instructions (run it as a
   service). The runner's user needs access to the Docker daemon, and the server must be
   logged in to GHCR (step 2) so the pull succeeds.
2. **Create GitHub Environments** `dev` and `prod` (Settings → Environments) — the
   workflow's environment choice selects which one's secrets are used. Add per-environment
   protection rules (required reviewers) if you want gated prod deploys.
3. **Add the `ENV_FILE` secret to each environment**: the _full contents_ of that
   environment's `.env` (step 3), including the pinned `FRONTEND_IMAGE`. The workflow
   writes it to `.env` (mode 600) in the runner workspace on every run — the workspace
   checkout is the deploy directory, so no server-side `.env` editing is needed on this
   path.
4. **Run it**: Actions → _Deploy_ → _Run workflow_ → pick `dev` or `prod`. The job checks
   out the repo (bringing the current `docker-compose.prod.yml`), writes `.env`, runs
   `docker compose -f docker-compose.prod.yml pull && up -d`, then prunes images unused
   for 72 h (so the previous image sticks around ~3 days for instant local rollback).
   Deploys to the same environment queue rather than overlap.

To deploy or roll back a specific build via CI, change the `FRONTEND_IMAGE` pin inside the
environment's `ENV_FILE` secret and re-run the workflow.

> **One runner, one server.** As shipped, the workflow targets whatever machine hosts the
> runner (`runs-on: self-hosted`); the environment choice only switches secrets. If `dev`
> and `prod` are different servers, register a runner on each with a distinguishing label
> and scope the job accordingly (e.g. `runs-on: [self-hosted, prod]`) — otherwise both
> environments deploy to the same host, differing only in `.env` contents.
