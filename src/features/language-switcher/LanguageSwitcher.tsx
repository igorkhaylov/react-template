import { useTranslation } from 'react-i18next'
import { LOCALES } from '@/shared/constants/common'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  return (
    <div className='flex items-center gap-2'>
      {LOCALES.map((locale) => (
        <div key={locale}>
          <button
            className="rounded-md bg-black p-2 text-white"
            onClick={() => i18n.changeLanguage(locale)}
          >
            {locale}
          </button>
        </div>
      ))}
    </div>
  )
}
