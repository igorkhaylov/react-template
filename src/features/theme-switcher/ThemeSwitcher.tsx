import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { applyTheme, getCurrentTheme } from './theme'
import { Button } from '@/shared/shadcn-ui/button'

export default function ThemeSwitcher() {
  const { t } = useTranslation()
  // Initial value comes from the document: initTheme() already ran in main.tsx.
  const [theme, setTheme] = useState(getCurrentTheme)

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <Button variant="ghost" size="icon-sm" aria-label={t('theme.toggle')} onClick={toggle}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
