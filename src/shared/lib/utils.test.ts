import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('supports clsx conditionals, arrays and objects', () => {
    const isHidden = Boolean(0)
    expect(cn('base', isHidden && 'hidden', undefined, null)).toBe('base')
    expect(cn(['a', { b: true, c: false }])).toBe('a b')
  })

  it('resolves Tailwind conflicts in favor of the last class', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('keeps non-conflicting utilities side by side', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
    expect(cn('text-sm', 'font-medium')).toBe('text-sm font-medium')
  })

  it('scopes conflict resolution to the same variant', () => {
    expect(cn('hover:p-2', 'hover:p-4')).toBe('hover:p-4')
    expect(cn('p-2', 'hover:p-4')).toBe('p-2 hover:p-4')
  })
})
