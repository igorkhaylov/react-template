# Usage:
#   make env                # FIRST RUN: create .env from .env.example
#   make install            # npm ci
#   make start              # Vite dev server with HMR
#   make check              # non-mutating quality gate (format:check + lint + typecheck + test)
#   make up                 # local production-like container: build image + serve via nginx
#   make prod deploy        # SERVER: pull the registry image and (re)start (no build)
#   make logs frontend      # tail logs of a service
#
# Prefix selects the compose file:
#   prod -> docker-compose.prod.yml  (pulls the prebuilt image; never builds)
#   none -> docker-compose.yml       (local, builds from source)

ifneq ($(filter prod,$(MAKECMDGOALS)),)
  COMPOSE := docker compose -f docker-compose.prod.yml
else
  COMPOSE := docker compose
endif

# Extra args: MAKECMDGOALS minus "prod" and the target name ($@).
ARGS = $(filter-out prod $@,$(MAKECMDGOALS))

# Load .env so APP_PORT / FRONTEND_IMAGE reach compose and buildx. `-include` (not
# `include`) keeps make usable before .env exists — run `make env` to create it.
-include .env
export

# Every real target — used for .PHONY and for the typo guard below.
KNOWN_TARGETS := help env install start lint lint-fix format typecheck test check \
        preview up down down-v build pull deploy logs restart bash push clean

.PHONY: prod $(KNOWN_TARGETS)

# Typo guard: the first goal after the prod prefix must be a real target. Without
# this the catch-all `%:` at the bottom silently swallows typos (`make depoy` would
# exit 0 doing nothing). Extra words AFTER a real target (`make logs frontend`)
# still pass through the catch-all as arguments.
PRIMARY_GOAL := $(firstword $(filter-out prod,$(MAKECMDGOALS)))
ifneq ($(PRIMARY_GOAL),)
  ifeq ($(filter $(PRIMARY_GOAL),$(KNOWN_TARGETS)),)
    $(error Unknown target '$(PRIMARY_GOAL)' — run 'make help' for the list)
  endif
endif

help:
	@echo "First run:   make env && make install"
	@echo "Local dev:   start lint lint-fix format typecheck test check preview"
	@echo "Docker:      up / down / down-v / build / logs [service] / restart / bash"
	@echo "Server:      prod deploy    # pull the registry image and (re)start"
	@echo "Utilities:   env clean push"

prod:
	@:

# --- First-time setup ---
env:
	@test -f .env || (cp .env.example .env && echo ".env created from .env.example")

install:
	npm ci

# --- Local development (delegates to npm scripts) ---
start:
	npm run dev

lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

typecheck:
	npm run typecheck

test:
	npm run test

# Non-mutating quality gate — the same checks CI runs.
check:
	npm run check

preview:
	npm run build && npm run preview

# --- Docker lifecycle ---
up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

down-v:
	$(COMPOSE) down -v

build:
	$(COMPOSE) build

pull:
	$(COMPOSE) pull

# Server-side deploy: pull the prebuilt image from the registry and (re)start.
# Usage on the server:  make prod deploy
# Pin a tag by setting FRONTEND_IMAGE in .env (e.g. ...:sha-<full-sha>).
deploy:
	$(COMPOSE) pull
	$(COMPOSE) up -d

logs:
	$(COMPOSE) logs -f $(ARGS)

restart:
	$(COMPOSE) restart

bash:
	$(COMPOSE) exec frontend sh

# --- Image publishing ---
# CI (.github/workflows/build-push.yml) is the PRIMARY image publisher — this target
# is an optional manual escape hatch for multi-platform pushes from a workstation.
# Requires a prior `docker login` to the registry.
IMAGE ?= $(or $(FRONTEND_IMAGE),ghcr.io/igorkhaylov/react-template:latest)

push:
	docker buildx create --name multiplatform --driver docker-container --use 2>/dev/null || \
	docker buildx use multiplatform
	docker buildx build --platform linux/amd64,linux/arm64 --push -t $(IMAGE) .

# --- Utilities ---
clean:
	rm -rf node_modules dist coverage

# Catch extra arguments (e.g. `make logs frontend`) so make doesn't error on them.
%:
	@:
