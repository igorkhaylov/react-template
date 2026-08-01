import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import AboutPage from './AboutPage'
import { renderWithProviders } from '@/test/utils'

describe('AboutPage', () => {
  it('renders the translated title and intro', () => {
    renderWithProviders(<AboutPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'About this template' }),
    ).toBeInTheDocument()
  })

  it('lists the included features and the FSD layers', () => {
    renderWithProviders(<AboutPage />)

    expect(screen.getByRole('heading', { name: "What's included" })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project structure (FSD)' })).toBeInTheDocument()

    for (const layer of ['app', 'pages', 'widgets', 'features', 'entities', 'shared']) {
      expect(screen.getByText(`${layer}/`)).toBeInTheDocument()
    }
  })
})
