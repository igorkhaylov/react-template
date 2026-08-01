import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const INCLUDES = ['routing', 'query', 'ui', 'i18n', 'env', 'docker', 'quality'] as const

const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'] as const

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('about.title')}</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-lg">{t('about.intro')}</p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">{t('about.includesTitle')}</h2>
        <ul className="mt-4 space-y-2.5">
          {INCLUDES.map(key => (
            <li key={key} className="flex items-start gap-3 text-sm">
              <Check
                className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <span>{t(`about.includes.${key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">{t('about.layersTitle')}</h2>
        <ul className="bg-card text-card-foreground mt-4 divide-y rounded-xl border">
          {LAYERS.map(layer => (
            <li
              key={layer}
              className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4"
            >
              <code className="w-24 shrink-0 font-mono text-sm font-semibold">{layer}/</code>
              <span className="text-muted-foreground text-sm">{t(`about.layers.${layer}`)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
