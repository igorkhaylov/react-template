import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from './api'
import { createQueryKeys } from '@/shared/api'

export const healthKeys = createQueryKeys('health')

export function useHealthQuery() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: ({ signal }) => fetchHealth(signal),
    // A single failed request is answer enough — the backend is not there.
    retry: false,
    refetchInterval: 30_000,
  })
}
