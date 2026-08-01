/**
 * Typed access to environment variables.
 *
 * Resolution order for every key:
 *   1. window.__ENV__      — injected at CONTAINER START by docker/90-env-config.sh
 *      (loaded via /env-config.js before the app bundle, see index.html)
 *   2. import.meta.env     — Vite .env files, baked in at BUILD time
 *   3. the default value below
 *
 * To add a new variable:
 * 1. Add it to .env.example
 * 2. Add it to the EnvConfig interface and the env object below
 * 3. Add it to the WHITELIST in docker/90-env-config.sh (for runtime injection)
 */

export interface EnvConfig {
  VITE_API_BASE_URL: string
  VITE_APP_NAME: string
  VITE_DEFAULT_LOCALE: string
}

declare global {
  interface Window {
    __ENV__?: Partial<EnvConfig>
  }
}

// Guarded so the module stays importable outside the browser (vitest, node scripts).
const runtimeEnv: Partial<EnvConfig> =
  typeof window !== 'undefined' && window.__ENV__ ? window.__ENV__ : {}

function resolve(key: keyof EnvConfig, fallback: string): string {
  return runtimeEnv[key] ?? import.meta.env[key] ?? fallback
}

const env: EnvConfig = {
  VITE_API_BASE_URL: resolve('VITE_API_BASE_URL', 'http://localhost:8000'),
  VITE_APP_NAME: resolve('VITE_APP_NAME', 'MyApp'),
  VITE_DEFAULT_LOCALE: resolve('VITE_DEFAULT_LOCALE', 'ru'),
}

export function getEnv<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  return env[key]
}

export default env
