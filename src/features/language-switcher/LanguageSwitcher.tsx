import { useTranslation } from 'react-i18next'
import { LOCALES } from '@/shared/constants/common'
import { Button } from '@/shared/shadcn-ui/button'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t('language.label')}>
      {LOCALES.map(locale => {
        const isActive = i18n.resolvedLanguage === locale
        return (
          <Button
            key={locale}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            className="px-2 sm:px-3"
            aria-pressed={isActive}
            onClick={() => i18n.changeLanguage(locale)}
          >
            {locale.toUpperCase()}
          </Button>
        )
      })}
    </div>
  )
}
