import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { getEnv } from '@/env'
import { LOCALES } from '@/shared/constants/common'
import en from '@/shared/locales/en.json'
import ru from '@/shared/locales/ru.json'
import uz from '@/shared/locales/uz.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      uz: { translation: uz },
    },
    fallbackLng: getEnv('VITE_DEFAULT_LOCALE'),
    supportedLngs: LOCALES,
    detection: {
      // The detector reads the persisted choice first, then the browser
      // language; every explicit changeLanguage() is cached back to localStorage.
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      // React already escapes rendered strings.
      escapeValue: false,
    },
  })

// Keep <html lang> in sync with the active locale (index.html ships a static
// lang="en"); fires on init too, once the detector has resolved the language.
i18n.on('languageChanged', lng => {
  document.documentElement.lang = lng
})

export default i18n
