import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { getEnv } from '@/env'
import { LOCALES } from '@/shared/constants/common'
import en from '@/shared/locales/en.json'
import ru from '@/shared/locales/ru.json'
import uz from '@/shared/locales/uz.json'

const bundles: Record<string, typeof en> = { ru, en, uz }

describe('i18n configuration', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('supports exactly the locales from LOCALES', () => {
    const supported = i18n.options.supportedLngs
    expect(Array.isArray(supported)).toBe(true)
    // i18next silently appends the technical 'cimode' locale.
    const locales = (supported as Array<string>).filter(lng => lng !== 'cimode')
    expect(locales.sort()).toEqual([...LOCALES].sort())
  })

  it('has a translation bundle for every supported locale', () => {
    for (const locale of LOCALES) {
      expect(i18n.hasResourceBundle(locale, 'translation')).toBe(true)
    }
  })

  it('uses the configured default locale as fallback language', () => {
    expect([i18n.options.fallbackLng].flat()).toContain(getEnv('VITE_DEFAULT_LOCALE'))
  })

  it('switches the active resources on changeLanguage', async () => {
    expect(i18n.t('nav.home')).toBe(en.nav.home)

    await i18n.changeLanguage('uz')
    expect(i18n.resolvedLanguage).toBe('uz')
    expect(i18n.t('nav.home')).toBe(uz.nav.home)

    await i18n.changeLanguage('ru')
    expect(i18n.resolvedLanguage).toBe('ru')
    expect(i18n.t('nav.home')).toBe(ru.nav.home)
  })

  it('falls back to the default locale for an unsupported language', () => {
    const fallbackBundle = bundles[getEnv('VITE_DEFAULT_LOCALE')]
    expect(fallbackBundle).toBeDefined()
    expect(i18n.t('nav.home', { lng: 'de' })).toBe(fallbackBundle?.nav.home)
  })

  it('returns the key itself for a missing translation', () => {
    expect(i18n.t('missing.key.that.does.not.exist')).toBe('missing.key.that.does.not.exist')
  })
})

describe('locale bundle parity', () => {
  // Locale files are discovered from disk, not listed by hand: adding a new
  // locale JSON automatically subjects it to the same completeness check.
  const discovered: Record<string, Record<string, unknown>> = import.meta.glob(
    '@/shared/locales/*.json',
    { eager: true, import: 'default' },
  )

  const flatKeys = (obj: Record<string, unknown>, prefix = ''): Array<string> =>
    Object.entries(obj).flatMap(([key, value]) =>
      value !== null && typeof value === 'object'
        ? flatKeys(value as Record<string, unknown>, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )

  const entries = Object.entries(discovered).map(([path, bundle]) => ({
    locale: path.replace(/^.*\/(\w+)\.json$/, '$1'),
    keys: flatKeys(bundle).sort(),
  }))

  it('finds a locale file for every entry in LOCALES', () => {
    expect(entries.map(e => e.locale).sort()).toEqual([...LOCALES].sort())
  })

  it('ships the exact same key set in every locale', () => {
    const [reference, ...rest] = entries
    expect(reference).toBeDefined()
    for (const entry of rest) {
      expect(
        entry.keys,
        `keys of ${entry.locale}.json differ from ${reference?.locale}.json`,
      ).toEqual(reference?.keys)
    }
  })
})
