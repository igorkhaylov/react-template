export const LOCALES = ['ru', 'en', 'uz'] as const

export type Locale = (typeof LOCALES)[number]
