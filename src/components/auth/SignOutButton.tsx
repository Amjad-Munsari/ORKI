'use client';
/**
 * Phase 10 Plan 05 — header sign-out button.
 *
 * UI-SPEC §"Header Changes": uses <form action={signOutAction}> (NOT
 * useTransition). The form-action pattern works without JavaScript — if the
 * page never hydrated, the form still posts to the Server Action and the
 * server-side redirect('/login') completes the flow.
 *
 * No confirmation modal (UI-SPEC §Anti-patterns #9): sign-out is recoverable.
 * Destructive-tinted text color (text-red-400/90) is sufficient affordance.
 */
import { useTranslations } from 'next-intl';
import { signOutAction } from '@/app/actions/auth';

export function SignOutButton() {
  const t = useTranslations('Account');
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full text-start px-4 py-3 text-sm text-red-400/90 hover:bg-white/5 rounded-md transition-colors min-h-[44px]"
      >
        {t('signOut')}
      </button>
    </form>
  );
}
