'use client';
/**
 * Phase 10 Plan 05 — header sign-out button.
 *
 * Lives inside the UserMenu's base-ui dropdown (JS-only — the menu cannot open
 * without hydration), so there is no progressive-enhancement reason to keep a
 * server-redirecting `<form action>`.
 *
 * Navigation is a full-document `window.location.assign` AFTER signOutAction
 * resolves — NOT a Server-Action `redirect()`. A `redirect()` here produced a
 * soft client navigation that left the browser on a stale document where the
 * next sign-in Server Action POST failed with "Failed to fetch" (Phase 10 UAT
 * Test 4 re-verify). The full reload guarantees a fresh /login document, the
 * same fix the sign-in success path uses (LoginForm, commit 1e37411).
 *
 * No confirmation modal (UI-SPEC §Anti-patterns #9): sign-out is recoverable.
 * Destructive-tinted text color (text-red-400/90) is sufficient affordance.
 */
import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { signOutAction } from '@/app/actions/auth';

export function SignOutButton() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await signOutAction();
          // Full-document navigation — see file header. Avoids the soft-nav
          // "Failed to fetch" on the subsequent sign-in Server Action.
          window.location.assign(`/${locale}/login`);
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="w-full text-start px-4 py-3 text-sm text-red-400/90 hover:bg-white/5 rounded-md transition-colors min-h-[44px] disabled:opacity-50"
      >
        {t('signOut')}
      </button>
    </form>
  );
}
