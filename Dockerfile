# Base images are pinned tag@digest: the tag documents the version, the digest
# makes builds reproducible and tamper-proof. Dependabot bumps the digests.

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# Stage 2: Build application
# ============================================
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Stage 3: Production image with nginx
# ============================================
# Mainline (1.29) rather than stable: nginx.org recommends it for most users, and
# its binary carries the current CVE fixes that stable only receives as distro
# backports the official image lags behind on.
FROM nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de AS production

# The nginx image is rebuilt less often than Alpine ships security fixes — pull
# the patched OS packages at build time so the Trivy gate in CI stays green.
RUN apk upgrade --no-cache

# Replace the default server config with ours; the shared security-headers
# snippet goes to /etc/nginx/snippets (NOT conf.d — everything in conf.d is
# auto-included at http level, which would break the per-location includes).
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Regenerates env-config.js from container env vars at startup — nginx:alpine runs
# every executable /docker-entrypoint.d/*.sh automatically before starting nginx.
COPY --chmod=755 docker/90-env-config.sh /docker-entrypoint.d/90-env-config.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
