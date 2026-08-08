import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, getCurrentTheme, getStoredTheme, initTheme } from './theme'

function stubPrefersDark(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }))
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  describe('getStoredTheme', () => {
    it('returns null when nothing is stored', () => {
      expect(getStoredTheme()).toBeNull()
    })

    it('returns the stored theme', () => {
      localStorage.setItem('theme', 'dark')
      expect(getStoredTheme()).toBe('dark')
    })

    it('ignores invalid stored values', () => {
      localStorage.setItem('theme', 'solarized')
      expect(getStoredTheme()).toBeNull()
    })
  })

  describe('getCurrentTheme', () => {
    it('reflects the class on the document element', () => {
      expect(getCurrentTheme()).toBe('light')
      document.documentElement.classList.add('dark')
      expect(getCurrentTheme()).toBe('dark')
    })
  })

  describe('applyTheme', () => {
    it('adds the dark class and persists the choice', () => {
      applyTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('removes the dark class and persists the choice', () => {
      document.documentElement.classList.add('dark')
      applyTheme('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(localStorage.getItem('theme')).toBe('light')
    })
  })

  describe('initTheme', () => {
    it('prefers the stored theme over the OS preference', () => {
      localStorage.setItem('theme', 'dark')
      stubPrefersDark(false)

      initTheme()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('falls back to the OS preference when nothing is stored', () => {
      stubPrefersDark(true)

      initTheme()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('stays light when nothing is stored and the OS prefers light', () => {
      stubPrefersDark(false)

      initTheme()

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('does not persist anything on init', () => {
      stubPrefersDark(true)

      initTheme()

      expect(localStorage.getItem('theme')).toBeNull()
    })
  })
})
