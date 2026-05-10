'use client';
/**
 * Phase 10 Plan 05 — header account dropdown.
 *
 * Two modes (UI-SPEC §"Header Changes"):
 *   - user === null → render a plain "Sign in" Link.
 *   - user !== null → render the dropdown trigger + panel.
 *
 * Critical: the trigger LABEL is "Account" (never the email) per UI-SPEC
 * Anti-patterns + T-10-05-02. The email is exposed ONLY through aria-label
 * so screen readers can announce the active account without leaking emails
 * in screenshots / screen recordings.
 *
 * Sign-out is a `<form action={signOutAction}>` (see SignOutButton) — works
 * without JS hydration.
 */
import { Menu } from '@base-ui/react/menu';
import { useTranslations } from 'next-intl';
import { UserCircle, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Separator } from '@/components/ui/separator';
import { SignOutButton } from './SignOutButton';

interface AuthedUser {
  id: string;
  email: string;
}

interface Props {
  user: AuthedUser | null;
}

export function UserMenu({ user }: Props) {
  const t = useTranslations('Account');
  const tNav = useTranslations('Nav');

  if (!user) {
    return (
      <Link
        href="/login"
        className="h-full flex items-center text-sm font-medium tracking-tight hover:opacity-60 transition-opacity whitespace-nowrap"
      >
        {tNav('signIn')}
      </Link>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        className="h-full flex items-center gap-2 text-sm font-medium tracking-tight hover:opacity-60 transition-opacity whitespace-nowrap min-h-[44px]"
        aria-label={t('userMenu', { email: user.email })}
      >
        <UserCircle className="size-5" aria-hidden />
        <span className="hidden sm:inline">{tNav('account')}</span>
        <ChevronDown className="size-4 rtl-flip" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8}>
          <Menu.Popup className="min-w-[220px] bg-[#111111] border border-white/10 rounded-lg p-2 shadow-2xl outline-none">
            <p className="px-4 py-2 text-[12px] uppercase tracking-widest text-white/40 font-bold truncate max-w-[200px]">
              {t.rich('signedInAs', {
                email: () => <span dir="ltr">{user.email}</span>,
              })}
            </p>
            <Separator className="my-1 bg-white/10" />
            <Menu.Item
              render={
                <Link
                  href="/account"
                  className="block w-full text-start px-4 py-3 text-sm text-white hover:bg-white/5 rounded-md transition-colors min-h-[44px]"
                >
                  {t('account')}
                </Link>
              }
            />
            <Menu.Item
              render={<div />}
              closeOnClick={false}
              className="block w-full"
            >
              <SignOutButton />
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
