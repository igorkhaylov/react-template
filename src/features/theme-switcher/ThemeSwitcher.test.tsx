import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { ThemeSwitcher } from '@/features/theme-switcher'
import { renderWithProviders } from '@/test/utils'

function toggleButton() {
  return screen.getByRole('button', { name: 'Toggle theme' })
}

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('switches to dark mode and persists the choice', async () => {
    const { user } = renderWithProviders(<ThemeSwitcher />)

    await user.click(toggleButton())

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('toggles back to light mode', async () => {
    const { user } = renderWithProviders(<ThemeSwitcher />)

    await user.click(toggleButton())
    await user.click(toggleButton())

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('starts from the theme already applied to the document', async () => {
    document.documentElement.classList.add('dark')
    const { user } = renderWithProviders(<ThemeSwitcher />)

    await user.click(toggleButton())

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
