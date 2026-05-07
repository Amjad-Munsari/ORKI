import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getAllProducts } from '@/lib/products'
import { ProductCard } from '@/components/shop/ProductCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { ArrowRight, ArrowLeft } from 'lucide-react'

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
      <section className="relative h-[90vh] w-full overflow-hidden flex items-end pb-24">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2070&auto=format&fit=crop"
            alt="ORKI Hero"
            fill
            priority
            className="object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 w-full">
          <div className="max-w-2xl space-y-8">
            <h1 className="text-6xl md:text-[120px] font-bold uppercase tracking-tighter leading-[0.8] text-white">
              {isRtl ? 'الأصل / الحديث' : 'ORIGIN / MODERN'}
            </h1>
            <p className="text-sm md:text-lg uppercase tracking-widest text-white/60 font-bold max-w-md leading-relaxed">
              {isRtl 
                ? 'استكشف أول مجموعة من أوركي. تصاميم مستوحاة من ثقافة الشارع السعودي.' 
                : 'Explore the debut collection from ORKI. Underground Saudi streetwear curated for the bold.'}
            </p>
            <div className="pt-6">
              <Link
                href="/shop"
                className="inline-flex items-center gap-4 h-16 px-10 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:bg-white/90 transition-colors group"
              >
                {isRtl ? 'تسوق الآن' : 'Shop Collection'}
                {isRtl ? <ArrowLeft className="size-5" /> : <ArrowRight className="size-5" />}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40">
          <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-white animate-scroll-indicator" />
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-32 max-w-[1280px] mx-auto px-6">
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white">
              {isRtl ? 'الإصدارات المميزة' : 'Featured Drops'}
            </h2>
            <div className="w-24 h-1 bg-white" />
          </div>
          <Link 
            href="/shop"
            className="text-xs font-bold uppercase tracking-widest text-white underline underline-offset-8 hover:text-white/60 transition-colors"
          >
            {isRtl ? 'مشاهدة الكل' : 'View All Products'}
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
          {featuredProducts.map((product, idx) => (
            <ScrollReveal key={product.id} delay={idx * 0.1}>
              <ProductCard product={product} locale={locale as any} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Category Splat */}
      <section className="pb-32 max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal direction="left">
            <CategoryCard
              title={isRtl ? 'القطع العلوية' : 'Tops'}
              href="/shop/tops"
              image="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1974&auto=format&fit=crop"
              locale={locale}
            />
          </ScrollReveal>
          <ScrollReveal direction="right" delay={0.2}>
            <CategoryCard
              title={isRtl ? 'القطع السفلية' : 'Bottoms'}
              href="/shop/bottoms"
              image="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1974&auto=format&fit=crop"
              locale={locale}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Brand Ethos */}
      <section className="py-48 bg-[#0a0a0a] border-y border-white/5">
        <ScrollReveal className="max-w-[1280px] mx-auto px-6 text-center space-y-12">
          <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold">
            {isRtl ? 'مهمتنا' : 'Our Ethos'}
          </span>
          <h3 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter text-white leading-tight max-w-4xl mx-auto">
            {isRtl 
              ? 'نحن لا نصنع الملابس، نحن نوثق ثقافة الشارع في قلب الرياض.' 
              : 'We don\'t just make clothes. We document the evolution of Saudi street culture.'}
          </h3>
          <div className="pt-8">
            <Link 
              href="/about"
              className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              {isRtl ? 'اقرأ قصتنا' : 'Read Our Story'} —
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}

function CategoryCard({ title, href, image, locale }: { title: string; href: string; image: string; locale: string }) {
  const isRtl = locale === 'ar'
  return (
    <Link href={href} className="group relative h-[600px] overflow-hidden rounded-lg">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
      <div className="absolute inset-0 p-12 flex flex-col justify-end items-start">
        <h3 className="text-5xl font-bold uppercase tracking-tighter text-white mb-6">
          {title}
        </h3>
        <span className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white">
          {isRtl ? 'استكشف' : 'Explore'}
          {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
        </span>
      </div>
    </Link>
  )
}
