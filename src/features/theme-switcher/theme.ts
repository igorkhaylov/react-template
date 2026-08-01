export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

// localStorage access can THROW (not just return null): Chrome with "block all
// cookies", some embedded WebViews, older Safari private mode. A theme preference
// is never worth crashing the app for, so every storage call is guarded.
export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** The theme currently applied to the document. */
export function getCurrentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Applies the theme to the document and persists the choice (best-effort). */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage blocked: the theme still applies for this session.
  }
}

/**
 * Called synchronously from main.tsx before React mounts. The real no-flash
 * guarantee comes from the inline script in index.html, which runs before the
 * stylesheet loads; this re-run only covers environments that skipped it (tests).
 * Falls back to the OS preference when nothing is stored yet.
 */
export function initTheme(): void {
  const stored = getStoredTheme()
  const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
  document.documentElement.classList.toggle('dark', (stored ?? preferred) === 'dark')
}
