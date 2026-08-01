import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import HomePage from './HomePage'
import { fakeResponse, renderWithRouter } from '@/test/utils'

const fetchMock = vi.fn<typeof fetch>()

describe('HomePage', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('renders the hero section', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { status: 'ok' } }))

    await renderWithRouter(<HomePage />)

    expect(screen.getByRole('heading', { level: 1, name: 'React Template' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view on github/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /about the template/i })).toBeInTheDocument()
  })

  it('shows the connected state when the healthcheck succeeds', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { status: 'ok' } }))

    await renderWithRouter(<HomePage />)

    expect(await screen.findByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('ok')).toBeInTheDocument()

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.pathname).toBe('/healthcheck/')
  })

  it('shows the unreachable state when the backend is down', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await renderWithRouter(<HomePage />)

    expect(await screen.findByText('No backend')).toBeInTheDocument()
    // A single request is enough — the query does not retry.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
