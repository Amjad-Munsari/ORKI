'use client';

import {useState} from 'react';
import {motion, AnimatePresence, useReducedMotion} from 'motion/react';
import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {List, X} from '@phosphor-icons/react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {useDirection} from '@/hooks/useDirection';
import {animationPresets} from '@/lib/animation-presets';
import {UserMenu} from '@/components/auth/UserMenu';

interface AuthedUser {
  id: string;
  email: string;
}

interface MobileNavDrawerProps {
  user?: AuthedUser | null;
}

export function MobileNavDrawer({user = null}: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('Nav');
  const locale = useLocale();
  const direction = useDirection(); // 1 for LTR (EN), -1 for RTL (AR)
  const shouldReduceMotion = useReducedMotion();

  // Drawer slides from inline-end:
  // EN (LTR): inline-end is the right edge → side="right"
  // AR (RTL): inline-end is the left edge → side="left"
  // Never hardcode side="right" — that breaks RTL.
  const drawerSide = locale === 'ar' ? 'left' : 'right';

  // Motion variants for the drawer panel
  // Slides from 100% (inline-end edge) — direction multiplier handles RTL
  const drawerVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: animationPresets.navEnter,
    },
    closed: {
      x: shouldReduceMotion ? 0 : `${100 * direction}%`,
      opacity: shouldReduceMotion ? 0 : 1,
      transition: animationPresets.navExit,
    },
  };

  void drawerVariants; // defined for direction-aware pattern; Sheet handles CSS animation

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={
          <button
            aria-label={isOpen ? t('closeMenu') : t('openMenu')}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] text-black hover:opacity-60 transition-opacity duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          />
        }
      >
        {/* Hamburger to X morph via AnimatePresence — 200ms ease-out */}
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{opacity: 0, scale: 0.95}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.95}}
              transition={{duration: 0.2, ease: [0.23, 1, 0.32, 1]}}
            >
              <X weight="bold" size={24} aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{opacity: 0, scale: 0.95}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.95}}
              transition={{duration: 0.2, ease: [0.23, 1, 0.32, 1]}}
            >
              <List weight="bold" size={24} aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
      </SheetTrigger>

      <SheetContent
        side={drawerSide}
        showCloseButton={false}
        className="w-[280px] bg-black border-s border-white/[0.12] p-0"
      >
        <nav
          className="flex flex-col ps-6 pe-6 pt-8 gap-6"
          aria-label="Mobile navigation"
        >
          <Link
            href="/shop"
            onClick={() => setIsOpen(false)}
            className="text-lg font-bold text-white hover:text-white transition-opacity duration-150 min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {t('shop')}
          </Link>
          <div className="flex flex-col gap-4 ps-4 border-s border-white/10">
            <Link
              href="/shop/tops"
              onClick={() => setIsOpen(false)}
              className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150 min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {t('tops')}
            </Link>
            <Link
              href="/shop/bottoms"
              onClick={() => setIsOpen(false)}
              className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150 min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {t('bottoms')}
            </Link>
          </div>
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150 min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {t('about')}
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="text-base font-normal text-white/60 hover:text-white transition-opacity duration-150 min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {t('contact')}
          </Link>
          {/* Phase 10 Plan 05 — auth slot. UserMenu handles both signed-in
              and signed-out variants; the dropdown panel itself reuses the
              same base-ui menu chrome as desktop. */}
          <div className="pt-4 mt-2 border-t border-white/10">
            <UserMenu user={user} />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
