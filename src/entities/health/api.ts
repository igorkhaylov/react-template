import { apiClient } from '@/shared/api'

export interface HealthResponse {
  status: string
}

/**
 * Pairs with the healthcheck endpoint of the author's django-template backend:
 * https://github.com/igorkhaylov/django-template
 */
export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/healthcheck/', { signal })
}
