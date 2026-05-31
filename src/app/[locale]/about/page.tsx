import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/types/domain';

interface AboutPageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    path: '/about',
    locale,
    titleKey: 'Meta.about.title',
    descriptionKey: 'Meta.about.description',
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  const isRtl = locale === 'ar'

  return (
    <div className="min-h-screen bg-black pt-24 pb-48">
      <div className="max-w-[var(--container-max)] mx-auto px-12">
        <header className="mb-32">
          <h1 className="display-2 font-bold uppercase text-white">
            {isRtl ? 'أوركي / القصة' : 'ORKI / THE STORY'}
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-24">
            <section className="space-y-8">
              <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold">
                {isRtl ? 'رؤيتنا' : '01 — Vision'}
              </span>
              <p className="font-light text-2xl md:text-4xl tracking-tight text-white leading-tight">
                {isRtl 
                  ? 'أوركي هي علامة تجارية ولدت من صخب الرياض. نحن نؤمن بأن ملابس الشارع هي لغة بصرية توثق اللحظة الراهنة.' 
                  : 'ORKI is a brand born from the noise of Riyadh. We believe streetwear is a visual language that documents the here and now.'}
              </p>
            </section>

            <div className="relative aspect-[3/4] md:aspect-video overflow-hidden rounded-lg bg-[var(--color-placeholder-bg)] flex items-center justify-center select-none">
              <span
                className="font-semibold tracking-[0.2em] text-[5vw] uppercase"
                style={{color: 'rgba(255, 255, 255, 0.05)'}}
              >
                ORKI
              </span>
            </div>

            <section className="space-y-8">
              <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold">
                {isRtl ? 'جذورنا' : '02 — Heritage'}
              </span>
              <p className="font-light text-2xl md:text-4xl tracking-tight text-white leading-tight">
                {isRtl
                  ? 'من قلب نجد إلى شوارع العالم. تصاميمنا تدمج الخطوط الكلاسيكية مع القصات العصرية، لخلق توازن فريد يعبر عن الجيل الجديد.'
                  : 'From the heart of Najd to the streets of the world. Our designs merge classic lines with modern silhouettes, creating a unique balance that speaks for the new generation.'}
              </p>
            </section>
          </div>

          <div className="lg:col-span-5 lg:pt-48 space-y-24">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[var(--color-secondary-surface)] flex items-center justify-center select-none">
              <span
                className="font-semibold tracking-[0.2em] text-[3vw] uppercase"
                style={{color: 'rgba(255, 255, 255, 0.05)'}}
              >
                ORKI
              </span>
            </div>

            <section className="space-y-8">
              <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold">
                {isRtl ? 'الجودة' : '03 — Quality'}
              </span>
              <p className="font-light text-2xl md:text-4xl tracking-tight text-white leading-tight">
                {isRtl
                  ? 'نحن نستخدم أجود أنواع القطن والمنسوجات، مع اهتمام فائق بالتفاصيل الدقيقة التي تجعل كل قطعة عملاً فنياً قائماً بذاته.'
                  : 'We use the finest cotton and textiles, with obsessive attention to the minute details that make every piece a standalone work of art.'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
