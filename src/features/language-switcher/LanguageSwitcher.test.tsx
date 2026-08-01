import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { LanguageSwitcher } from '@/features/language-switcher'
import { LOCALES } from '@/shared/constants/common'
import { renderWithProviders } from '@/test/utils'

describe('LanguageSwitcher', () => {
  it('renders a button for every supported locale', () => {
    renderWithProviders(<LanguageSwitcher />)

    for (const locale of LOCALES) {
      expect(screen.getByRole('button', { name: locale.toUpperCase() })).toBeInTheDocument()
    }
  })

  it('marks only the active locale as pressed', () => {
    renderWithProviders(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'RU' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'UZ' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches the language on click', async () => {
    const { user, i18n } = renderWithProviders(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { name: 'RU' }))

    await waitFor(() => {
      expect(i18n.resolvedLanguage).toBe('ru')
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'RU' })).toHaveAttribute('aria-pressed', 'true')
    })
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
  })
})
