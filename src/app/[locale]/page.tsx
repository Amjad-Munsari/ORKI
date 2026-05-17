

import { Link } from '@/i18n/navigation'
import { getAllProducts } from '@/lib/products'
import { ProductCard } from '@/components/shop/ProductCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ArrowRight, ArrowLeft } from 'lucide-react'

import type { Locale } from '@/types/domain'

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  const isRtl = locale === 'ar'
  
  const products = await getAllProducts()
  const featuredProducts = products.slice(0, 4)

  return (
    <div className="w-full">
      {/* Editorial Hero */}
      <section className="relative h-screen w-full overflow-hidden flex items-end pb-24 md:pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[var(--color-placeholder-bg)] flex items-center justify-center pointer-events-none">
            <span
              className="font-semibold tracking-[0.2em] text-[10vw] uppercase"
              style={{color: 'rgba(255, 255, 255, 0.05)'}}
            >
              ORKI
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[var(--container-max)] mx-auto px-8 w-full">
          <ScrollReveal direction="up" className="max-w-4xl space-y-6">
            <span className="text-sm font-medium text-white/90 block">
              {isRtl ? '(صيف ٢٦ — الإصدار ٠١)' : '(SS26 — Drop 01)'}
            </span>
            <h1 className="display-4 font-medium text-white">
              {isRtl ? 'صُنع في صخب الرياض.' : 'Made in the noise of Riyadh.'}
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-xl leading-relaxed">
              {isRtl ? 'البس صوت المدينة.' : 'Wear what the city sounds like.'}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-32 max-w-[var(--container-max)] mx-auto px-8">
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-medium text-white">
              {isRtl ? 'الإصدارات المميزة' : 'Featured Drops'}
            </h2>
          </div>
          <Link 
            href="/shop"
            className="text-sm font-medium text-white/60 hover:text-white transition-colors border-b border-white/20 pb-1"
          >
            {isRtl ? 'مشاهدة الكل' : 'View All Products'}
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
          {featuredProducts.map((product, idx) => (
            <ScrollReveal key={product.id} delay={(idx % 4) * 0.08}>
              <ProductCard product={product} locale={locale as Locale} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Category Splat - Side-by-side Full Height */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 h-[100vh] min-h-[700px]">
        <CategoryCard
          title={isRtl ? "القطع العلوية" : "Tops"}
          href="/shop/tops"
          locale={locale}
        />
        <CategoryCard
          title={isRtl ? "القطع السفلية" : "Bottoms"}
          href="/shop/bottoms"
          locale={locale}
        />
      </section>

      {/* Brand Ethos */}
      <section className="py-64 bg-[var(--color-placeholder-bg)]">
        <ScrollReveal className="max-w-[var(--container-max)] mx-auto px-8 text-center space-y-12">
          <h3 className="display-4 font-medium text-white max-w-5xl mx-auto">
            {isRtl 
              ? 'نحن لا نصنع الملابس، نحن نوثق ثقافة الشارع.' 
              : 'We don\'t just make clothes. We document the evolution of street culture.'}
          </h3>
          <div className="pt-8">
            <Link 
              href="/about"
              className="text-sm font-medium text-white/40 hover:text-white transition-colors"
            >
              {isRtl ? 'اقرأ قصتنا' : 'Read Our Story'} —
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}

function CategoryCard({ title, href, locale }: { title: string; href: string; locale: string }) {
  const isRtl = locale === 'ar'
  return (
    <Link
      href={href}
      className="group relative h-full w-full overflow-hidden flex items-end p-12 md:p-16 bg-[var(--color-placeholder-bg)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      {/* Massive kerned wordmark of the category title — D-03 typographic-only treatment.
          Sits behind the foreground Shop-Now block; subtle scale on group-hover. */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden transition-transform duration-1000 group-hover:scale-[1.03]"
        aria-hidden="true"
      >
        <span
          className="font-bold uppercase leading-none tracking-[-0.04em]"
          style={{
            color: 'rgba(255, 255, 255, 0.08)',
            fontSize: '22vw',
          }}
        >
          {title}
        </span>
      </div>

      {/* Foreground action row — title (smaller, readable) + Shop Now button. */}
      <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
        <h3 className="text-5xl md:text-8xl font-medium text-white leading-tight">
          {title}
        </h3>
        <div className="bg-black text-white px-8 py-4 text-sm font-semibold flex items-center gap-3 transition-transform duration-300 group-hover:translate-x-2">
          {isRtl ? 'تسوق الآن' : 'Shop Now'}
          {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
        </div>
      </div>
    </Link>
  )
}
