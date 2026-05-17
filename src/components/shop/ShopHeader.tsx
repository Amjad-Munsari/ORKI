'use client'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/types/domain'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ShopHeaderProps {
  activeCategory: 'all' | 'tops' | 'bottoms'
  activeSort: 'newest' | 'price-asc' | 'price-desc'
  productCount: number
  locale: Locale
}

// Client Component — uses useSearchParams() which requires <Suspense> wrapper in parent Server Component
export function ShopHeader({ activeCategory, activeSort, productCount, locale }: ShopHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('Shop')

  function setCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  function setSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (sort === 'newest') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const categories = [
    { value: 'all',     label: t('tabAll') },
    { value: 'tops',    label: t('tabTops') },
    { value: 'bottoms', label: t('tabBottoms') },
  ] as const

  const sorts = [
    { value: 'newest',     label: t('sortNewest') },
    { value: 'price-asc',  label: t('sortPriceAsc') },
    { value: 'price-desc', label: t('sortPriceDesc') },
  ] as const

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">

      {/* Category tabs */}
      <div className="flex items-center gap-6" role="tablist" aria-label={locale === 'ar' ? 'تصفية الفئة' : 'Category filter'}>
        {categories.map(({ value, label }) => {
          const isActive = activeCategory === value
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setCategory(value)}
              className={[
                'text-sm font-normal pb-1 transition-colors duration-150',
                isActive
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/60 hover:text-white border-b-2 border-transparent',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Product count + sort — D-05 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/60">
          {t('productCount', { count: productCount })}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">{t('sortLabel')}</span>
          <Select value={activeSort} onValueChange={(v) => { if (v !== null) setSort(v) }}>
            <SelectTrigger
              aria-label={locale === 'ar' ? 'ترتيب المنتجات' : 'Sort products'}
              className="w-auto min-w-[180px] bg-transparent border-white/[0.12] text-white hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--color-secondary-surface)] border-white/[0.12] text-white">
              {sorts.map(({ value, label }) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white focus:bg-white/[0.06] focus:text-white"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

    </div>
  )
}
