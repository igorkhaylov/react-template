# Base images are pinned tag@digest: the tag documents the version, the digest
# makes builds reproducible and tamper-proof. Dependabot bumps the digests.

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# Stage 2: Build application
# ============================================
FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS builder

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
FROM nginx:1.30-alpine@sha256:97d490c12ba55b4946b01546d1c3ed324e8d41ab1c9fcb2a616aa470620e5b46 AS production

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
