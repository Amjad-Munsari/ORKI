

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
  
  const products = getAllProducts()
  const featuredProducts = products.slice(0, 4)

  return (
    <div className="w-full">
      {/* Editorial Hero */}
      <section className="relative h-screen w-full overflow-hidden flex items-end pb-24 md:pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center pointer-events-none">
            <span
              className="font-semibold tracking-[0.2em] text-[10vw] uppercase"
              style={{color: 'rgba(255, 255, 255, 0.05)'}}
            >
              ORKI
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-8 w-full">
          <ScrollReveal direction="up" className="max-w-4xl space-y-6">
            <span className="text-sm font-medium text-white/90 block">
              {isRtl ? '(مجموعة مختارة)' : '(Featured Collection)'}
            </span>
            <h1 className="text-6xl md:text-[90px] font-medium text-white leading-[1.1] tracking-tight">
              {isRtl ? 'أساسيات العصر الحديث' : 'Timeless Essentials for the Season'}
            </h1>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-32 max-w-[1440px] mx-auto px-8">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20">
          {featuredProducts.map((product, idx) => (
            <ScrollReveal key={product.id} delay={idx * 0.1}>
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
      <section className="py-64 bg-[#050505]">
        <ScrollReveal className="max-w-[1440px] mx-auto px-8 text-center space-y-12">
          <h3 className="text-4xl md:text-7xl font-medium text-white leading-tight max-w-5xl mx-auto">
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
    <Link href={href} className="group relative h-full w-full overflow-hidden flex items-end p-12 md:p-16">
      <div className="absolute inset-0 bg-[#0d0d0d] flex items-center justify-center pointer-events-none transition-transform duration-1000 group-hover:scale-105">
        <span
          className="font-semibold tracking-[0.2em] text-[8vw] md:text-[5vw] uppercase"
          style={{color: 'rgba(255, 255, 255, 0.05)'}}
        >
          ORKI
        </span>
      </div>
      <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors duration-500" />
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
