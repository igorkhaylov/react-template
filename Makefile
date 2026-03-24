include .env
export

DC := docker compose
IMAGE := $(REGISTRY)/$(IMAGE_NAME):latest

.PHONY: up down build logs restart bash clean install start lint format check test preview env setup push

# ==========================================
# Container Registry
# ==========================================

## Создать/активировать buildx-builder с поддержкой multi-platform
setup:
	docker buildx create --name multiplatform --driver docker-container --use 2>/dev/null || \
	docker buildx use multiplatform

## Собрать образ для linux/amd64 и linux/arm64, запушить в реестр с тегом latest
push: setup
	echo "$(REGISTRY_PASSWORD)" | docker login $(REGISTRY) -u $(REGISTRY_USER) --password-stdin
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		--push \
		-t $(IMAGE) \
		.

# ==========================================
# Docker (сборка и деплой)
# ==========================================
up:
	$(DC) up -d --build

down:
	$(DC) down

down-v:
	$(DC) down -v

build:
	$(DC) build --no-cache

logs:
	$(DC) logs -f

restart:
	$(DC) restart

bash:
	$(DC) exec frontend sh

# ==========================================
# Локальная разработка
# ==========================================
install:
	npm ci

PORT ?= 3000

start:
	npm run dev -- --port $(PORT)

lint:
	npm run lint

format:
	npm run format

check:
	npm run check

test:
	npm run test

preview:
	npm run build && npm run preview

# ==========================================
# Утилиты
# ==========================================
clean:
	rm -rf node_modules dist

env:
	@test -f .env || (cp .env.example .env && echo ".env created from .env.example")
