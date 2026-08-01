import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import NotFoundPage from './NotFoundPage'
import { renderWithRouter } from '@/test/utils'

describe('NotFoundPage', () => {
  it('renders the translated 404 content', async () => {
    await renderWithRouter(<NotFoundPage />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(
      screen.getByText('The page you are looking for does not exist or has been moved.'),
    ).toBeInTheDocument()
  })

  it('links back to the home page', async () => {
    await renderWithRouter(<NotFoundPage />)

    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })
})
