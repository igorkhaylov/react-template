import { Link } from '@tanstack/react-router'
import { ArrowRight, ExternalLink, Loader2, Unplug } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHealthQuery } from '@/entities/health'
import { Button } from '@/shared/shadcn-ui/button'

const GITHUB_URL = 'https://github.com/igorkhaylov/react-template'

const STACK = [
  'React 19',
  'TypeScript',
  'Vite',
  'TanStack Router',
  'TanStack Query',
  'Tailwind CSS 4',
  'i18next',
  'Docker',
]

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <section>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('home.title')}</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">{t('home.subtitle')}</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {STACK.map(item => (
            <li
              key={item}
              className="bg-secondary text-secondary-foreground rounded-full border px-3 py-1 text-xs font-medium"
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              {t('home.github')}
              <ExternalLink aria-hidden />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/about">
              {t('home.aboutLink')}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      <BackendStatusCard />
    </div>
  )
}

/**
 * Demonstrates the API layer end to end: shared/api client → entities/health
 * query → UI states. The "unreachable" state is a feature, not a bug — the
 * template is expected to run without a backend.
 */
function BackendStatusCard() {
  const { t } = useTranslation()
  const health = useHealthQuery()

  return (
    <section className="bg-card text-card-foreground mt-14 rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{t('health.title')}</h2>
        <code className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-xs">
          GET /healthcheck/
        </code>
      </div>

      <div className="mt-4">
        {health.isPending && (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t('health.checking')}
          </p>
        )}

        {health.isSuccess && (
          <div className="flex items-center gap-2.5 text-sm">
            <span className="relative flex size-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {t('health.ok')}
            </span>
            <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
              {health.data.status}
            </code>
          </div>
        )}

        {health.isError && (
          <div className="flex items-start gap-3">
            <Unplug className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="text-sm">
              <p className="font-medium">{t('health.unreachable')}</p>
              <p className="text-muted-foreground mt-1">{t('health.unreachableHint')}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
