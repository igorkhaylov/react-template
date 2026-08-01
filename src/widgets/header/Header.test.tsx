import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { getEnv } from '@/env'
import { renderWithRouter } from '@/test/utils'
import { Header } from '@/widgets/header'

describe('Header', () => {
  it('renders the app name linking to the home page', async () => {
    await renderWithRouter(<Header />)

    const brand = screen.getByRole('link', { name: getEnv('VITE_APP_NAME') })
    expect(brand).toHaveAttribute('href', '/')
  })

  it('renders the navigation and marks the current page', async () => {
    await renderWithRouter(<Header />)

    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    const home = within(nav).getByRole('link', { name: 'Home' })
    const about = within(nav).getByRole('link', { name: 'About' })

    expect(home).toHaveAttribute('href', '/')
    expect(about).toHaveAttribute('href', '/about')
    // The test router renders at "/", so Home is the current page.
    expect(home).toHaveAttribute('aria-current', 'page')
    expect(about).not.toHaveAttribute('aria-current')
  })

  it('renders the language and theme switchers', async () => {
    await renderWithRouter(<Header />)

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument()
  })
})
