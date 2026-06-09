'use client';

/**
 * Storefront chrome gate.
 *
 * The admin dashboard (`/[locale]/admin/*`) is its own app shell — it has its
 * own `ORKI ADMIN` sidebar + "Exit Admin" control and does not want the public
 * storefront chrome (Navbar, cart drawer, Footer) or the navbar's `pt-16`
 * offset. Everything else gets the full storefront chrome + page transitions.
 *
 * Detection uses next-intl's `usePathname`, which returns the path WITHOUT the
 * locale prefix (e.g. `/admin/inventory`), so this is locale-agnostic. It runs
 * on both server and client identically, so there's no hydration mismatch.
 *
 * The chrome pieces are passed in as already-rendered elements (server
 * components) so this client boundary only decides *whether* to show them.
 *
 * Smooth scroll (Lenis) is also storefront-only: admin is a data-dense
 * dashboard that wants native scroll, and keeping Lenis out avoids it
 * hijacking the wheel over admin's inner scroll containers (e.g. the
 * ProductEditor slide-over).
 */
import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { PageTransition } from '@/components/PageTransition';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';

interface SiteChromeProps {
  navbar: ReactNode;
  footer: ReactNode;
  cartDrawer: ReactNode;
  children: ReactNode;
}

export function SiteChrome({
  navbar,
  footer,
  cartDrawer,
  children,
}: SiteChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdmin) {
    // Bare shell — the admin layout supplies its own sidebar chrome.
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <SmoothScrollProvider />
      {navbar}
      {cartDrawer}
      <PageTransition>
        <main className="flex-1 pt-16">{children}</main>
      </PageTransition>
      {footer}
    </>
  );
}
