#!/bin/sh
# Generates /usr/share/nginx/html/env-config.js from container environment variables.
# nginx:alpine runs every executable *.sh in /docker-entrypoint.d/ before starting,
# so the same image can be configured per environment without a rebuild.
#
# Only whitelisted variables are exposed to the browser, and only when non-empty.
# To add a new variable:
#   1. Add it to WHITELIST below
#   2. Add it to EnvConfig in src/env.ts and to .env.example
set -eu

OUTPUT=/usr/share/nginx/html/env-config.js
WHITELIST="VITE_API_BASE_URL VITE_APP_NAME VITE_DEFAULT_LOCALE"

# Escape a value for embedding in a double-quoted JSON string:
# backslashes, double quotes, carriage returns, then newlines (joined as \n).
# CR is escaped AFTER the backslash pass (or its inserted \ would get doubled) and
# matched as a literal byte via $(printf '\r') — BSD sed does not parse \r.
json_escape() {
  cr=$(printf '\r')
  printf '%s' "$1" \
    | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e "s/$cr/\\\\r/g" \
    | awk 'BEGIN { ORS = "" } NR > 1 { printf "\\n" } { printf "%s", $0 }'
}

{
  echo '// Generated at container start by /docker-entrypoint.d/90-env-config.sh.'
  echo '// Do not edit: changes are overwritten on the next container start.'
  printf 'window.__ENV__ = {'
  first=1
  for key in $WHITELIST; do
    eval "value=\${$key:-}"
    [ -n "$value" ] || continue
    if [ "$first" -eq 1 ]; then first=0; else printf ','; fi
    printf '\n  "%s": "%s"' "$key" "$(json_escape "$value")"
  done
  printf '\n}\n'
} > "$OUTPUT"

echo "90-env-config.sh: wrote $OUTPUT"
