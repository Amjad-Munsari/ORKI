import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SignupForm } from '@/components/auth/SignupForm';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SignupPage({ params }: Props) {
  await params;
  const t = await getTranslations('Auth.signup');
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
        <SignupForm />
        <p className="text-center text-sm text-white/60">
          {t('alt')}{' '}
          <Link
            href="/login"
            className="underline underline-offset-4 text-white"
          >
            {t('altCta')}
          </Link>
        </p>
      </div>
    </main>
  );
}
