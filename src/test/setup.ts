import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount rendered components after each test.
// Explicit because Testing Library's auto-cleanup relies on a global
// afterEach hook, which is not guaranteed with Vitest globals mode.
// Also restore anything stubbed with vi.stubGlobal / vi.stubEnv (fetch,
// window.__ENV__, VITE_* vars) so tests stay order-independent.
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
