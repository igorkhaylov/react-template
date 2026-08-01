import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiClient } from './client'
import { fakeResponse } from '@/test/utils'

const fetchMock = vi.fn<typeof fetch>()

function requestedUrl(): URL {
  return new URL(String(fetchMock.mock.calls[0]?.[0]))
}

function requestInit(): RequestInit {
  return fetchMock.mock.calls[0]?.[1] ?? {}
}

function requestHeaders(): Record<string, string> {
  return (requestInit().headers ?? {}) as Record<string, string>
}

describe('apiClient', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('performs a GET request and parses the JSON body', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { id: 1, name: 'Ada' } }))

    const data = await apiClient.get<{ id: number; name: string }>('/users/1/')

    expect(data).toEqual({ id: 1, name: 'Ada' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(requestedUrl().pathname).toBe('/users/1/')
    expect(requestInit().method).toBe('GET')
    expect(requestHeaders().Accept).toBe('application/json')
    // No body -> no Content-Type header.
    expect(requestHeaders()['Content-Type']).toBeUndefined()
    expect(requestInit().body).toBeUndefined()
  })

  it('normalizes a path without a leading slash', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: [] }))

    await apiClient.get('users/')

    expect(requestedUrl().pathname).toBe('/users/')
  })

  it('serializes query params and skips null / undefined values', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: [] }))

    await apiClient.get('/items/', {
      params: {
        page: 2,
        q: 'hello world',
        active: true,
        empty: '',
        skipNull: null,
        skipUndefined: undefined,
      },
    })

    const url = requestedUrl()
    expect(url.pathname).toBe('/items/')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('q')).toBe('hello world')
    expect(url.searchParams.get('active')).toBe('true')
    expect(url.searchParams.get('empty')).toBe('')
    expect(url.searchParams.has('skipNull')).toBe(false)
    expect(url.searchParams.has('skipUndefined')).toBe(false)
  })

  it('sends a JSON body with the Content-Type header on POST', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ status: 201, body: { id: 5 } }))

    const data = await apiClient.post<{ id: number }>('/items/', { name: 'New item' })

    expect(data).toEqual({ id: 5 })
    expect(requestInit().method).toBe('POST')
    expect(requestInit().body).toBe(JSON.stringify({ name: 'New item' }))
    expect(requestHeaders()['Content-Type']).toBe('application/json')
  })

  it('passes the AbortSignal through to fetch', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: null }))
    const controller = new AbortController()

    await apiClient.get('/items/', { signal: controller.signal })

    expect(requestInit().signal).toBe(controller.signal)
  })

  it('returns null for a 204 No Content response', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ status: 204 }))

    await expect(apiClient.delete('/items/1/')).resolves.toBeNull()
  })

  it('returns raw text for non-JSON responses', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ body: 'pong', contentType: 'text/plain; charset=utf-8' }),
    )

    await expect(apiClient.get('/ping/')).resolves.toBe('pong')
  })

  it('throws a typed ApiError with the detail from the response body', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ status: 404, statusText: 'Not Found', body: { detail: 'Item not found.' } }),
    )

    const error: unknown = await apiClient.get('/items/999/').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError<{ detail: string }>
    expect(apiError.status).toBe(404)
    expect(apiError.detail).toBe('Item not found.')
    expect(apiError.data).toEqual({ detail: 'Item not found.' })
    expect(apiError.message).toBe('404 Item not found.')
  })

  it('falls back to statusText when the error body has no detail', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        status: 500,
        statusText: 'Internal Server Error',
        body: 'stack trace',
        contentType: 'text/plain',
      }),
    )

    const error: unknown = await apiClient.get('/boom/').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.status).toBe(500)
    expect(apiError.detail).toBe('Internal Server Error')
    expect(apiError.data).toBe('stack trace')
  })

  it('propagates network failures as-is', async () => {
    const failure = new TypeError('Failed to fetch')
    fetchMock.mockRejectedValue(failure)

    await expect(apiClient.get('/items/')).rejects.toBe(failure)
  })

  it('strips a trailing slash from the configured base URL', async () => {
    vi.stubGlobal('__ENV__', { VITE_API_BASE_URL: 'https://api.example.com/' })
    vi.resetModules()
    const fresh = await import('./client')
    fetchMock.mockResolvedValue(fakeResponse({ body: {} }))

    await fresh.apiClient.get('/healthcheck/')

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://api.example.com/healthcheck/')
  })
})
