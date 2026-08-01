import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getEnv } from '@/env'
import { LanguageSwitcher } from '@/features/language-switcher'
import { ThemeSwitcher } from '@/features/theme-switcher'

const navLinkClass =
  'rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3'

const navLinkActiveClass = 'bg-accent text-foreground'

export default function Header() {
  const { t } = useTranslation()

  return (
    <header className="z-header bg-background/80 sticky top-0 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link to="/" className="text-sm font-semibold tracking-tight whitespace-nowrap">
            {getEnv('VITE_APP_NAME')}
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1" aria-label={t('nav.main')}>
            <Link
              to="/"
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
              activeOptions={{ exact: true }}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/about"
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
            >
              {t('nav.about')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
