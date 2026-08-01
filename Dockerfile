# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# Stage 2: Build application
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Stage 3: Production image with nginx
# ============================================
FROM nginx:1.27-alpine AS production

# Replace the default server config with ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Regenerates env-config.js from container env vars at startup — nginx:alpine runs
# every executable /docker-entrypoint.d/*.sh automatically before starting nginx.
COPY --chmod=755 docker/90-env-config.sh /docker-entrypoint.d/90-env-config.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
