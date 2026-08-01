import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/shadcn-ui/button'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-muted-foreground/30 text-7xl font-bold tracking-tight">404</p>
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <p className="text-muted-foreground max-w-md">{t('notFound.description')}</p>
      <Button asChild className="mt-2">
        <Link to="/">{t('notFound.goHome')}</Link>
      </Button>
    </div>
  )
}
