import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { ErrorFallback } from './ErrorFallback'
import { renderWithProviders } from '@/test/utils'

describe('ErrorFallback', () => {
  it('renders the translated title and a reload button', () => {
    renderWithProviders(<ErrorFallback />)

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
  })

  it('shows the message of a thrown Error', () => {
    renderWithProviders(<ErrorFallback error={new Error('Route loader exploded')} />)

    expect(screen.getByText('Route loader exploded')).toBeInTheDocument()
  })

  it('hides the message for non-Error values', () => {
    renderWithProviders(<ErrorFallback error="not an Error instance" />)

    expect(screen.queryByText('not an Error instance')).not.toBeInTheDocument()
  })
})
