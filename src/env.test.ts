import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * env.ts resolves every key once at module evaluation, so each test stubs its
 * inputs first and then imports a fresh copy of the module.
 */
async function loadEnv() {
  vi.resetModules()
  return import('@/env')
}

describe('env resolution', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('prefers window.__ENV__ over import.meta.env', async () => {
    vi.stubEnv('VITE_APP_NAME', 'FromVite')
    vi.stubGlobal('__ENV__', { VITE_APP_NAME: 'FromWindow' })

    const { getEnv } = await loadEnv()

    expect(getEnv('VITE_APP_NAME')).toBe('FromWindow')
  })

  it('falls back to import.meta.env when window.__ENV__ misses the key', async () => {
    vi.stubEnv('VITE_APP_NAME', 'FromVite')
    vi.stubGlobal('__ENV__', {})

    const { getEnv } = await loadEnv()

    expect(getEnv('VITE_APP_NAME')).toBe('FromVite')
  })

  it('falls back to the defaults when nothing is configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined)
    vi.stubEnv('VITE_APP_NAME', undefined)
    vi.stubEnv('VITE_DEFAULT_LOCALE', undefined)

    const { getEnv } = await loadEnv()

    expect(getEnv('VITE_API_BASE_URL')).toBe('http://localhost:8000')
    expect(getEnv('VITE_APP_NAME')).toBe('MyApp')
    expect(getEnv('VITE_DEFAULT_LOCALE')).toBe('ru')
  })

  it('resolves each key independently', async () => {
    vi.stubGlobal('__ENV__', { VITE_APP_NAME: 'WindowApp' })
    vi.stubEnv('VITE_API_BASE_URL', 'https://vite.example.com')
    vi.stubEnv('VITE_DEFAULT_LOCALE', undefined)

    const { getEnv } = await loadEnv()

    expect(getEnv('VITE_APP_NAME')).toBe('WindowApp')
    expect(getEnv('VITE_API_BASE_URL')).toBe('https://vite.example.com')
    expect(getEnv('VITE_DEFAULT_LOCALE')).toBe('ru')
  })

  it('exposes the resolved config as the default export', async () => {
    vi.stubGlobal('__ENV__', { VITE_APP_NAME: 'WindowApp' })

    const { default: env, getEnv } = await loadEnv()

    expect(env.VITE_APP_NAME).toBe('WindowApp')
    expect(env.VITE_APP_NAME).toBe(getEnv('VITE_APP_NAME'))
  })
})
