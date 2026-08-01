import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/shadcn-ui/button'

interface ErrorFallbackProps {
  error?: unknown
}

/**
 * Rendered by the router as defaultErrorComponent whenever a route throws.
 * Props are compatible with TanStack Router's ErrorComponentProps.
 */
export function ErrorFallback({ error }: ErrorFallbackProps) {
  const { t } = useTranslation()
  const message = error instanceof Error ? error.message : ''

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t('error.title')}</h1>
      {message && <p className="text-muted-foreground max-w-md text-sm break-words">{message}</p>}
      <Button className="mt-2" onClick={() => window.location.reload()}>
        {t('error.reload')}
      </Button>
    </div>
  )
}
