import { getTranslations } from 'next-intl/server';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import type { Locale } from '@/types/domain';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Auth.reset');
  return (
    <main className="min-h-[calc(100vh-80px)] bg-black flex items-center justify-center py-24 px-6">
      <div className="w-full max-w-md space-y-12">
        <header className="text-center space-y-2">
          <p className="text-[12px] uppercase tracking-widest text-white/40 font-bold">
            {t('eyebrow')}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white leading-none">
            {t('heading')}
          </h1>
        </header>
        <ResetPasswordForm locale={locale as Locale} />
      </div>
    </main>
  );
}
