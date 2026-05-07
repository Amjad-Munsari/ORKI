'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Nav')

  const nextLocale = locale === 'en' ? 'ar' : 'en'
  const label = locale === 'en' ? t('switchToAr') : t('switchToEn')

  function handleSwitch() {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <button
      onClick={handleSwitch}
      aria-label={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      className="flex items-center justify-center min-h-[44px] min-w-[44px] text-xs font-semibold tracking-wider uppercase text-black/60 hover:text-black transition-opacity duration-150 active:scale-[0.97]"
    >
      {label}
    </button>
  )
}