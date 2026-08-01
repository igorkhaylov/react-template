/**
 * Query-key factory convention: one factory per entity, every key starts with
 * the entity scope so all related queries can be invalidated at once.
 *
 *   const todoKeys = createQueryKeys('todos')
 *   todoKeys.all           // ['todos']
 *   todoKeys.lists()       // ['todos', 'list']
 *   todoKeys.list(params)  // ['todos', 'list', params]
 *   todoKeys.detail(id)    // ['todos', 'detail', id]
 */
export function createQueryKeys<TScope extends string>(scope: TScope) {
  return {
    all: [scope] as const,
    lists: () => [scope, 'list'] as const,
    list: (params: Record<string, unknown>) => [scope, 'list', params] as const,
    details: () => [scope, 'detail'] as const,
    detail: (id: number | string) => [scope, 'detail', id] as const,
  }
}
