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
FROM nginx:1.28-alpine@sha256:a8b39bd9cf0f83869a2162827a0caf6137ddf759d50a171451b335cecc87d236 AS production

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
