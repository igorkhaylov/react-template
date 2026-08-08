import type { BaseError } from '@/shared/types/common'
import { getEnv } from '@/env'

export type QueryParams = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
  /** Query-string parameters; null/undefined values are skipped. */
  params?: QueryParams
  /** Pass an AbortSignal to make the request cancellable (TanStack Query does this for you). */
  signal?: AbortSignal
  headers?: Record<string, string>
  /** Abort the request after this many milliseconds. Default 30 000; 0 disables. */
  timeoutMs?: number
}

export const DEFAULT_TIMEOUT_MS = 30_000

// Every request gets a timeout even when the caller passes no signal — a fetch
// with no deadline can hang a UI state forever on a stalled connection.
function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal | undefined {
  if (timeoutMs <= 0) {
    return signal
  }
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
}

/**
 * Thrown for every non-2xx response. Mirrors the BaseError shape from
 * shared/types so error handling looks the same on both sides of the wire.
 */
export class ApiError<T = unknown> extends Error implements BaseError<T> {
  readonly status: number
  readonly detail: string
  readonly data: T

  constructor(status: number, detail: string, data: T) {
    super(`${status} ${detail}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.data = data
  }
}

function buildUrl(path: string, params?: QueryParams): string {
  const base = getEnv('VITE_API_BASE_URL').replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const search = new URLSearchParams()

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        search.set(key, String(value))
      }
    }
  }

  const query = search.toString()
  return `${base}${normalizedPath}${query ? `?${query}` : ''}`
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    // A JSON content-type with an unparsable body (truncated response, HTML error
    // page behind a proxy) must not surface as a SyntaxError — fall back to text
    // so error responses still become a proper ApiError.
    const text = await response.text()
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }
  return response.text()
}

function extractDetail(data: unknown): string | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    typeof data.detail === 'string'
  ) {
    return data.detail
  }
  return null
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { params, signal, headers, timeoutMs = DEFAULT_TIMEOUT_MS } = options

  const response = await fetch(buildUrl(path, params), {
    method,
    signal: withTimeout(signal, timeoutMs),
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(response.status, extractDetail(data) ?? response.statusText, data)
  }

  return data as T
}

/** Minimal typed JSON client over fetch — no runtime dependencies. */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
}
