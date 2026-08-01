import { describe, expect, it } from 'vitest'
import { createQueryKeys } from './query-keys'

describe('createQueryKeys', () => {
  const keys = createQueryKeys('todos')

  it('starts every key with the entity scope', () => {
    expect(keys.all).toEqual(['todos'])
    expect(keys.lists()).toEqual(['todos', 'list'])
    expect(keys.list({ page: 1 })).toEqual(['todos', 'list', { page: 1 }])
    expect(keys.details()).toEqual(['todos', 'detail'])
    expect(keys.detail(7)).toEqual(['todos', 'detail', 7])
    expect(keys.detail('abc')).toEqual(['todos', 'detail', 'abc'])
  })
})
