import {useTranslations} from 'next-intl';
import {PlaceholderImage} from '@/components/PlaceholderImage';

export default function HomePage() {
  const t = useTranslations('Placeholder');

  return (
    <div className="w-full">

      {/* Above-fold: 4:5 hero slot — full bleed, max-height constrained on desktop */}
      <section className="w-full max-h-[80vh] overflow-hidden">
        <PlaceholderImage
          aspectRatio="4/5"
          alt={t('imageAlt')}
          priority
          className="w-full"
        />
      </section>

      {/* Below-fold: 3:4 catalog card grid */}
      <section className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({length: 4}).map((_, i) => (
            <PlaceholderImage
              key={i}
              aspectRatio="3/4"
              alt={t('imageAlt')}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
