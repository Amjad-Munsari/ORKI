# Phase 1: Foundation — Research

**Researched:** 2026-05-06
**Domain:** Next.js 15 App Router + next-intl + Tailwind CSS v4 + shadcn/ui + RTL architecture
**Confidence:** HIGH (core stack verified against live npm registry and Context7 official docs)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Site serves bilingual content with URL-based locale routing (`/en/...` and `/ar/...`) | next-intl v4 `defineRouting` + middleware pattern fully documented; file structure confirmed |
| FOUND-02 | Arabic locale renders full RTL layout using CSS logical properties throughout | `dir="rtl"` on `<html>` + Tailwind v4 logical utilities (`ms-`, `me-`, `ps-`, `pe-`); ESLint enforcement pattern documented |
| FOUND-03 | English and Arabic typefaces load via next/font with FOUT prevention | `next/font/google` with `variable` prop + `display: 'swap'` confirmed; `:lang()` CSS selector pattern for font switching documented |
| FOUND-04 | Placeholder image system uses intentional dark-field editorial treatment with locked aspect ratios | `<PlaceholderImage>` component spec in UI-SPEC; `next/image` with `fill` inside aspect-ratio container pattern documented |
| FOUND-05 | All pages are mobile-responsive across standard breakpoints (375px, 768px, 1280px+) | Tailwind v4 responsive variants; Sheet component for mobile nav confirmed |
| NAV-01 | Global navigation includes category links (Tops, Bottoms), About, and a language switcher (EN/AR) | shadcn NavigationMenu (desktop) + Sheet (mobile drawer) patterns documented; language switcher via `useRouter().replace(pathname, {locale})` confirmed |
| NAV-02 | Global footer includes policy links (Shipping, Returns) and Contact | Standard layout component; Separator from shadcn confirmed |

</phase_requirements>

---

## Summary

Phase 1 is a greenfield Next.js scaffolding phase — no existing code to modify. The primary technical challenge is wiring together five distinct systems correctly from the start: Next.js 15 App Router routing, next-intl v4 locale middleware, Tailwind CSS v4 configuration, shadcn/ui initialization, and the RTL architecture. All five systems are interdependent: getting one wrong cascades into every subsequent phase.

The second challenge is the version landscape. As of 2026-05-06, `npm install next` installs **v16.2.5** (the new `latest` tag), but the project specification in CLAUDE.md requires **Next.js 15**. The plan MUST pin to `next@15` explicitly. Next.js 16 introduces a breaking middleware rename (`middleware.ts` → `proxy.ts`) that is incompatible with the next-intl middleware pattern used in this project. Use `next@^15.3.9` (current 15.x stable).

The third challenge unique to this phase is that shadcn/ui has not been initialized. The `components.json` file does not exist. The plan must include `npx shadcn@latest init` as the first shadcn step before any component can be added.

**Primary recommendation:** Scaffold with `npx create-next-app@15` (pin to 15.x), configure next-intl routing before any component is written, then initialize shadcn. This order matters — next-intl's file structure must exist before components reference locale-aware navigation.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Locale detection & routing | Frontend Server (SSR) | — | next-intl middleware runs at edge/server before React renders; locale in URL segment read server-side |
| `lang` + `dir` on `<html>` | Frontend Server (SSR) | — | Set in server-rendered root layout from URL segment; no client JS needed |
| Font loading (FOUT prevention) | Frontend Server (SSR) | — | next/font self-hosts and injects preload links in `<head>` server-side |
| Navigation (desktop) | Browser / Client | Frontend Server | NavigationMenu renders server-side; language switcher needs `'use client'` for programmatic navigation |
| Mobile nav drawer | Browser / Client | — | Sheet component requires client-side open/close state |
| Language switcher | Browser / Client | — | Must call `useRouter().replace()` — client-only hook |
| Placeholder image | Browser / Client | Frontend Server | `next/image` renders server-side; fill mode with aspect-ratio container is CSS-only |
| Footer | Frontend Server (SSR) | — | Static markup; no client state needed |
| CSS logical properties enforcement | Browser / Client | — | ESLint rule enforced at build time; runtime behavior driven by `dir` attribute on `<html>` |
| Animation presets | Browser / Client | — | Motion (`motion/react`) is client-only; presets file is shared config |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.3.9 | Framework | Project spec requires Next.js 15; v16 is `latest` but breaks middleware pattern |
| react | ^19.0.0 | UI runtime | Peer requirement of Next.js 15 |
| react-dom | ^19.0.0 | DOM renderer | Peer requirement of Next.js 15 |
| typescript | ^5.0.0 | Type safety | Bundled with create-next-app |
| next-intl | ^4.11.0 | i18n routing + translations | Purpose-built for Next.js App Router; Server Component support; type-safe messages |
| tailwindcss | ^4.2.4 | Utility CSS | v4 is current; logical property utilities built-in |
| @tailwindcss/postcss | ^4.2.4 | PostCSS plugin | v4 uses this instead of `autoprefixer` |
| motion | ^12.38.0 | Component animations | Project spec; AnimatePresence, useReducedMotion, RTL-aware motion |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn (CLI) | ^4.7.0 | Component scaffolding | `npx shadcn@latest add <component>` — not a runtime dep |
| @phosphor-icons/react | ^2.1.10 | Icon library | UI-SPEC specifies Phosphor Icons Bold weight |
| gsap | ^3.15.0 | Scroll animations | Phase 4 scroll reveals; install in Phase 1 to avoid mid-project addition |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-intl | next-i18next | next-i18next is Pages Router only; next-intl is purpose-built for App Router |
| motion | framer-motion | Same package; `framer-motion` is legacy name; `motion` is current |
| @phosphor-icons/react | lucide-react | minimalist-ui skill bans Lucide; Phosphor Bold has the right weight character |
| Tailwind v4 logical utilities | CSS modules with logical properties | Tailwind v4 is standard; logical utilities remove need for custom CSS |

**Installation (Phase 1 packages):**
```bash
npx create-next-app@15 . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
npm install next-intl motion @phosphor-icons/react
npm install --save-dev gsap
```

**Version verification (confirmed 2026-05-06 via npm registry):**
```
next:                 16.2.5 (latest) / 15.3.9 (next-15-3 tag — USE THIS)
tailwindcss:          4.2.4
@tailwindcss/postcss: 4.2.4
next-intl:            4.11.0
motion:               12.38.0
zustand:              5.0.13 (Phase 2)
gsap:                 3.15.0
@phosphor-icons/react: 2.1.10
shadcn (CLI):         4.7.0
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser Request (/ar/shop)
        ↓
[middleware.ts] (next-intl createMiddleware)
  — detects locale from URL segment
  — redirects / to /en if no locale
  — writes x-next-intl-locale header
        ↓
[src/app/[locale]/layout.tsx] (Server Component)
  — awaits params.locale
  — validates locale with hasLocale()
  — renders <html lang={locale} dir={dir}>
  — applies font CSS variables to <html>
  — wraps children in NextIntlClientProvider
        ↓
    ┌───────────────┬────────────────────┐
    ↓               ↓                    ↓
[<Navbar>]   [Page content]       [<Footer>]
Server       (varies by route)    Server
  ↓
[<LanguageSwitcher>]  ← 'use client' (useRouter)
[<MobileNavDrawer>]   ← 'use client' (Sheet open state)
```

**Data flow for locale switch:**
```
User clicks EN/AR toggle
    ↓
usePathname() + useRouter() (from @/i18n/navigation)
    ↓
router.replace(currentPathname, {locale: 'ar'})
    ↓
URL changes to /ar/[same-path]
    ↓
middleware re-runs
    ↓
layout.tsx re-renders with lang="ar" dir="rtl"
    ↓
All CSS logical properties flip automatically
```

### Recommended Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx        # Root layout: <html lang dir>, fonts, NextIntlClientProvider
│   │   └── page.tsx          # Home (placeholder in Phase 1)
│   └── globals.css           # @import 'tailwindcss'; custom @theme; :lang() font rules
├── components/
│   ├── nav/
│   │   ├── Navbar.tsx        # Server component (desktop nav)
│   │   ├── MobileNavDrawer.tsx  # 'use client' — Sheet + open state
│   │   └── LanguageSwitcher.tsx # 'use client' — useRouter
│   ├── footer/
│   │   └── Footer.tsx        # Server component
│   ├── ui/                   # shadcn components (auto-generated by CLI)
│   └── PlaceholderImage.tsx  # 'use client' or server — next/image with fill
├── i18n/
│   ├── routing.ts            # defineRouting({locales, defaultLocale, localePrefix})
│   ├── request.ts            # getRequestConfig — loads messages per locale
│   └── navigation.ts         # createNavigation(routing) — exports Link, useRouter, etc.
├── lib/
│   ├── animation-presets.ts  # Motion preset objects (nav-enter, fade-in, etc.)
│   └── products.ts           # Data access layer (empty stub in Phase 1)
├── messages/
│   ├── en.json               # EN translations
│   └── ar.json               # AR translations
├── types/
│   └── domain.ts             # Product, CartItem, Locale, Direction types
├── data/
│   └── products.ts           # Static product data (empty array stub in Phase 1)
└── middleware.ts             # createMiddleware(routing) + matcher config
```

### Pattern 1: Locale Layout with HTML Attributes

```typescript
// Source: Context7 /amannn/next-intl docs
// src/app/[locale]/layout.tsx

import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {spaceGrotesk, ibmPlexArabic} from '@/lib/fonts';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${spaceGrotesk.variable} ${ibmPlexArabic.variable}`}
    >
      <body>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Pattern 2: next-intl Routing Setup

```typescript
// Source: Context7 /amannn/next-intl docs
// src/i18n/routing.ts

import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always',  // Forces /en/ and /ar/ prefixes on all routes
});

// src/i18n/navigation.ts
import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
```

### Pattern 3: Middleware Configuration

```typescript
// Source: Context7 /amannn/next-intl docs
// src/middleware.ts  ← Keep as middleware.ts (NOT proxy.ts) for Next.js 15

import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

### Pattern 4: next/font with CSS Variables

```typescript
// Source: Context7 /vercel/next.js docs
// src/lib/fonts.ts  (imported in layout.tsx)

import {Space_Grotesk} from 'next/font/google';
import {IBM_Plex_Arabic} from 'next/font/google';

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const ibmPlexArabic = IBM_Plex_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-ibm-plex-arabic',
});
```

```css
/* globals.css — font switching via :lang() selector */
/* Source: UI-SPEC.md contract */
@import 'tailwindcss';

@theme inline {
  --font-sans: var(--font-space-grotesk), sans-serif;
  --font-arabic: var(--font-ibm-plex-arabic), sans-serif;
}

:lang(en) { font-family: var(--font-space-grotesk), sans-serif; }
:lang(ar) { font-family: var(--font-ibm-plex-arabic), sans-serif; }
:lang(ar) { font-size: 1.0625rem; } /* 17px Arabic optical size adjustment */
```

### Pattern 5: Language Switcher (Client Component)

```typescript
// Source: Context7 /amannn/next-intl docs
// src/components/nav/LanguageSwitcher.tsx
'use client';

import {usePathname, useRouter} from '@/i18n/navigation';
import {useLocale} from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const nextLocale = locale === 'en' ? 'ar' : 'en';

  return (
    <button
      onClick={() => router.replace(pathname, {locale: nextLocale})}
      aria-label={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
```

### Pattern 6: useReducedMotion in Motion

```typescript
// Source: Context7 /websites/motion_dev docs
// src/components/nav/MobileNavDrawer.tsx
'use client';

import {motion, AnimatePresence, useReducedMotion} from 'motion/react';
import {useDirection} from '@/hooks/useDirection';

export function MobileNavDrawer({isOpen}: {isOpen: boolean}) {
  const shouldReduceMotion = useReducedMotion();
  const direction = useDirection(); // returns 1 (LTR) or -1 (RTL)
  
  const variants = {
    open: { x: 0, opacity: 1 },
    closed: shouldReduceMotion
      ? { x: 0, opacity: 0 }
      : { x: `${100 * direction}%`, opacity: 1 }, // inline-end offset
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={variants}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
        />
      )}
    </AnimatePresence>
  );
}
```

### Pattern 7: PlaceholderImage Component

```typescript
// Source: UI-SPEC.md; next/image fill pattern
// src/components/PlaceholderImage.tsx
import Image from 'next/image';

interface PlaceholderImageProps {
  aspectRatio: '3/4' | '4/5';
  alt: string;
  priority?: boolean;
}

export function PlaceholderImage({aspectRatio, alt, priority = false}: PlaceholderImageProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{aspectRatio: aspectRatio.replace('/', ' / ')}}
    >
      {/* Dark field background */}
      <div className="absolute inset-0 bg-[#0A0A0A]" />
      {/* Ghost ORKI wordmark — inline SVG or next/image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white/15 font-semibold tracking-widest text-2xl select-none">
          ORKI
        </span>
      </div>
      {/* next/image with fill — wired now; Phase 2 swaps src only */}
      <Image src="data:..." alt={alt} fill priority={priority} className="object-cover opacity-0" />
    </div>
  );
}
```

### Pattern 8: Tailwind v4 and shadcn/ui init

```bash
# Source: Context7 /llmstxt/ui_shadcn_llms_txt; npm registry
# 1. Scaffold Next.js 15
npx create-next-app@15 . --typescript --tailwind --app --src-dir

# 2. shadcn init (run AFTER scaffolding, BEFORE adding components)
npx shadcn@latest init
# Select: Dark mode, CSS variables, default style
# This writes components.json and patches globals.css

# 3. Add required Phase 1 shadcn components
npx shadcn@latest add sheet
npx shadcn@latest add navigation-menu
npx shadcn@latest add separator
```

### Anti-Patterns to Avoid

- **Using `ml-`, `mr-`, `pl-`, `pr-` Tailwind classes:** These are physical direction utilities and break RTL. Use `ms-`, `me-`, `ps-`, `pe-` (logical). ESLint rule enforces this.
- **Importing `motion` from `framer-motion`:** Use `import { motion } from 'motion/react'`. Both work but the project must be consistent; the package renamed to `motion`.
- **Calling `npx create-next-app@latest`:** This installs Next.js 16. Use `create-next-app@15` to stay on v15.
- **Adding components before shadcn init:** `npx shadcn@latest add sheet` fails without `components.json`. Run `init` first.
- **Setting only `dir` without `lang`:** Screen readers mispronounce content. Always update both atomically in `layout.tsx`.
- **Direct import from `/data/products.ts`:** All product data must flow through `/lib/products.ts` only. Ban direct imports via ESLint or code convention.
- **Using `proxy.ts` instead of `middleware.ts`:** `proxy.ts` is a Next.js 16 convention. On Next.js 15, keep `middleware.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locale routing + redirect logic | Custom middleware that parses URL | next-intl `createMiddleware` | Handles preflight, cookies, negotiation, redirect loops correctly |
| Type-safe translations | Custom translation dictionary + hook | next-intl `useTranslations` + JSON augmentation | TypeScript catches missing keys; plural rules built in |
| Locale-aware Link/router | Wrapper around `next/link` that prepends locale | `createNavigation(routing).Link` | Handles localized pathnames, hreflang, locale override automatically |
| Font FOUT prevention | Manual `@font-face` + preload link tags | `next/font/google` with `variable` | Next.js handles preloading, subsetting, self-hosting, display strategy |
| Image optimization | Custom `<img>` + srcset | `next/image` with `fill` | AVIF/WebP format negotiation, lazy loading, priority, layout shift prevention |
| Accessible drawer component | Custom `<div>` with focus trap | shadcn `Sheet` (Radix UI) | Focus trap, escape key, ARIA roles, scroll lock — all correct |
| Accessible navigation | `<ul>` + custom keyboard handling | shadcn `NavigationMenu` (Radix UI) | ARIA expanded/haspopup, keyboard navigation, focus management built in |

**Key insight:** Every component that handles RTL has directional edge cases that compound. Use the libraries that solve them once; don't rediscover them in every component.

---

## Common Pitfalls

### Pitfall 1: Next.js Version Mismatch (CRITICAL)
**What goes wrong:** `npx create-next-app@latest` installs v16.2.5. The project requires v15. In Next.js 16, `middleware.ts` is deprecated in favor of `proxy.ts`, and the edge runtime is not supported in `proxy`. next-intl's middleware uses edge runtime by default. The result: i18n routing silently breaks.
**Why it happens:** npm `latest` tag was updated to v16 after project spec was written.
**How to avoid:** Use `npx create-next-app@15` explicitly. Pin in `package.json` as `"next": "^15.3.9"`.
**Warning signs:** `npm list next` shows 16.x; middleware errors about edge runtime.

### Pitfall 2: shadcn/ui Not Initialized Before Component Add
**What goes wrong:** Running `npx shadcn@latest add sheet` before `npx shadcn@latest init` fails or creates incorrect `components.json`. Components are added with wrong Tailwind configuration.
**Why it happens:** `init` writes `components.json` which configures path aliases, Tailwind CSS version, and base color. Components depend on this file existing.
**How to avoid:** `shadcn init` MUST be the first shadcn command. Confirm `components.json` exists before any `add`.
**Warning signs:** `components.json` not found error; components using wrong import paths.

### Pitfall 3: next-intl v4 Breaking Changes from v3
**What goes wrong:** Code examples from tutorials use `getServerSideProps`, the old `unstable_setRequestLocale`, or old `routing` API shape. These are v3 patterns.
**Why it happens:** Search results and training data contain v3 patterns. next-intl v4 (4.11.0 current) uses `requestLocale` (stable) instead of `unstable_setRequestLocale`, and `hasLocale` instead of manual array check.
**How to avoid:** Use the patterns verified in this research. Key v4 changes: `requestLocale` (not `locale`) in `getRequestConfig`; `hasLocale()` helper; `messages/` directory with JSON files (not TypeScript exports).
**Warning signs:** TypeScript errors on `unstable_setRequestLocale`; import errors from `next-intl/server`.

### Pitfall 4: Tailwind v4 Config Differences from v3
**What goes wrong:** Adding `tailwind.config.js` with `content` array (v3 pattern) causes Tailwind v4 to not apply styles correctly. v4 uses `@import 'tailwindcss'` and `@theme inline {}` in CSS — no JS config file needed.
**Why it happens:** v4 is a major breaking change from v3. Old tutorials and templates show v3 `tailwind.config.js`.
**How to avoid:** Tailwind v4 config lives entirely in CSS (`globals.css`). PostCSS uses `@tailwindcss/postcss` (not `tailwindcss`). No `tailwind.config.js` needed for basic setup.
**Warning signs:** Tailwind utility classes not applying; "unknown at rule @tailwind" warnings; `tailwind.config.js` in root of project.

### Pitfall 5: Physical CSS Properties Entering Codebase
**What goes wrong:** `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` Tailwind classes pass code review because they look correct in LTR. In Arabic locale, nav items align wrong, buttons are offset, drawer slides from wrong edge.
**Why it happens:** Default muscle memory writes `ml-4` not `ms-4`. The error is invisible until RTL is tested.
**How to avoid:** ESLint rule via `eslint-plugin-tailwindcss` blocking directional classes from first commit. Must be set up in Wave 0 of the plan.
**Warning signs:** Any `ml-`, `mr-`, `pl-`, `pr-`, `left-[`, `right-[` in component files.

### Pitfall 6: Multiple Font Class Applications Causing Specificity Conflicts
**What goes wrong:** Adding `className={inter.className}` to `<html>` (direct class application) conflicts with the CSS `:lang()` font switching strategy. Both try to set `font-family`. The `:lang()` approach (using CSS variables) is the correct one for bilingual projects.
**Why it happens:** Next.js examples show `className={font.className}` as the default. This works for single-language apps but conflicts with `:lang()` selector in bilingual apps.
**How to avoid:** Use `variable` option in next/font config, apply `className={font.variable}` to inject the CSS variable, then reference via `:lang()` in CSS. Never use `font.className` directly when bilingual.
**Warning signs:** Arabic text still showing Space Grotesk despite `:lang(ar)` rule.

### Pitfall 7: Direction-Aware Mobile Nav Drawer (RTL edge)
**What goes wrong:** Sheet drawer configured with `side="right"` opens from the right in both LTR and RTL. In Arabic (RTL), the drawer should open from the left (which is `inline-end`). Using fixed `side="right"` breaks the RTL experience.
**Why it happens:** shadcn Sheet `side` prop accepts `"right" | "left" | "top" | "bottom"` — physical values, not logical.
**How to avoid:** Read `dir` from the document or pass locale as prop, then set `side={dir === 'rtl' ? 'left' : 'right'}`.
**Warning signs:** Mobile nav slides from right in Arabic locale.

---

## Code Examples

### messages/en.json (Translation file structure)

```json
// Source: Context7 /amannn/next-intl docs (verified pattern)
{
  "Nav": {
    "shop": "Shop",
    "tops": "Tops",
    "bottoms": "Bottoms",
    "about": "About",
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "switchToAr": "AR",
    "switchToEn": "EN"
  },
  "Footer": {
    "shipping": "Shipping",
    "returns": "Returns",
    "contact": "Contact",
    "copyright": "© 2026 ORKI. All rights reserved."
  },
  "Placeholder": {
    "imageAlt": "ORKI product placeholder"
  },
  "Meta": {
    "siteTitle": "ORKI — Underground Streetwear"
  }
}
```

### TypeScript type augmentation for next-intl

```typescript
// Source: Context7 /amannn/next-intl docs
// src/types/next-intl.d.ts
import messages from '../../messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'en' | 'ar';
    Messages: typeof messages;
  }
}
```

### domain.ts stub (Phase 1 establishes the contract)

```typescript
// Source: ARCHITECTURE.md data contract pattern; UI-SPEC.md
// src/types/domain.ts

export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface Product {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  category: 'tops' | 'bottoms';
  price: number;
  currency: 'SAR';
  sizes: Size[];
  images: string[];
  inStock: boolean;
}

export interface Size {
  label: string; // 'S' | 'M' | 'L' | 'XL'
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}
```

### useDirection hook

```typescript
// Source: PITFALLS.md P-RTL-6; UI-SPEC RTL Interaction Contract
// src/hooks/useDirection.ts
'use client';

import {useLocale} from 'next-intl';

export function useDirection(): 1 | -1 {
  const locale = useLocale();
  return locale === 'ar' ? -1 : 1;
}
```

### animation-presets.ts

```typescript
// Source: UI-SPEC.md animation contract
// src/lib/animation-presets.ts

export const animationPresets = {
  navEnter: {
    duration: 0.2,
    ease: [0.23, 1, 0.32, 1] as const,
  },
  navExit: {
    duration: 0.16,
    ease: [0.32, 0.72, 0, 1] as const,
  },
  fadeIn: {
    duration: 0.2,
    ease: [0.23, 1, 0.32, 1] as const,
  },
  fadeOut: {
    duration: 0.15,
    ease: [0.32, 0.72, 0, 1] as const,
  },
} as const;
```

### next.config.ts

```typescript
// Source: Context7 /amannn/next-intl docs; PITFALLS.md P-PERF-1
// next.config.ts

import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` import | `motion/react` import | 2024 (v11) | Both work; `motion` is canonical for new code |
| `unstable_setRequestLocale` | `requestLocale` (stable) in `getRequestConfig` | next-intl v3.22 | No longer experimental; remove `unstable_` prefix |
| Tailwind `tailwind.config.js` | `@theme inline {}` in CSS | Tailwind v4 | JS config file no longer needed for basic setup |
| PostCSS `tailwindcss` + `autoprefixer` | `@tailwindcss/postcss` only | Tailwind v4 | Single plugin replaces two |
| `next-i18next` | `next-intl` | App Router era | next-i18next is Pages Router only |
| `middleware.ts` named export `middleware` | `proxy.ts` named export `proxy` | Next.js 16 | Only relevant if upgrading to v16; stay on v15 |
| shadcn: `npx shadcn-ui@latest init` | `npx shadcn@latest init` | 2024 | Package renamed from `shadcn-ui` to `shadcn` |
| `tailwindcss-animate` plugin | `tw-animate-css` import | shadcn Tailwind v4 migration | Required when using shadcn with Tailwind v4 |

**Deprecated/outdated:**
- `next-i18next`: Pages Router only. Do not use.
- `react-i18next` in App Router: Missing RSC and middleware support. Do not use.
- `framer-motion` as package import: Use `motion` package. `framer-motion` still works but is the legacy name.
- Tailwind `rtl:` variant classes (e.g., `rtl:ml-4`): These use physical properties in RTL context. Use logical `ms-`, `me-` unconditionally instead.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js scaffolding | ✓ | v22.18.0 | — |
| npm | Package installation | ✓ | 11.7.0 | — |
| npx | create-next-app, shadcn CLI | ✓ | bundled | — |
| Git | Version control | ✓ | (repo exists) | — |

No external services or databases required for Phase 1. All Phase 1 work is local scaffolding, static data, and frontend-only rendering.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None yet — Wave 0 gap (project not scaffolded) |
| Config file | `jest.config.ts` or `vitest.config.ts` — create in Wave 0 |
| Quick run command | `npm test -- --passWithNoTests` (after setup) |
| Full suite command | `npm test` |

**Note:** Phase 1 is primarily structural/configuration work. Automated unit tests have limited applicability for RTL CSS and locale routing. The primary validation method for Phase 1 requirements is browser inspection (responsive, RTL layout, font rendering). The plan should include browser-based spot checks as the acceptance criteria mirror.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | `/ar/` URL renders Arabic locale | Manual (browser) | — | N/A |
| FOUND-02 | RTL layout renders with logical properties | Manual (browser DevTools) | ESLint check: `npm run lint` | ❌ Wave 0 |
| FOUND-03 | No FOUT on font load (both locales) | Manual (Lighthouse / slow 3G) | — | N/A |
| FOUND-04 | PlaceholderImage renders at 3:4 and 4:5 | Visual regression (manual) | — | N/A |
| FOUND-05 | Layout intact at 375px, 768px, 1280px | Manual (DevTools responsive) | — | N/A |
| NAV-01 | Nav renders all links + language switcher | E2E smoke (manual) | — | N/A |
| NAV-02 | Footer renders all links | Visual inspection | — | N/A |

### Sampling Rate

- **Per task commit:** `npm run lint` (catches physical direction class violations)
- **Per wave merge:** `npm run lint && npm run build` (catches TypeScript + missing translation keys)
- **Phase gate:** Manual browser verification of all 5 success criteria in both `/en/` and `/ar/` at all three breakpoints

### Wave 0 Gaps

- [ ] `.eslintrc.json` or `eslint.config.mjs` — needs `@next/eslint-plugin-next` (no-img-element) and `eslint-plugin-tailwindcss` (logical properties rule) configured
- [ ] `src/i18n/routing.ts` — `defineRouting` config
- [ ] `src/i18n/request.ts` — `getRequestConfig` returning messages
- [ ] `src/middleware.ts` — `createMiddleware(routing)` with matcher
- [ ] `messages/en.json` + `messages/ar.json` — translation files
- [ ] `src/types/domain.ts` — Product, CartItem, Locale, Direction types
- [ ] `src/lib/products.ts` — data access layer (empty stub)
- [ ] `src/data/products.ts` — static data (empty array stub)

---

## Security Domain

> Phase 1 has no user authentication, no form submissions, no payment flows, and no external API calls. The attack surface is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 1 |
| V3 Session Management | No | No sessions in Phase 1 |
| V4 Access Control | No | All routes public in Phase 1 |
| V5 Input Validation | No | No user input in Phase 1 |
| V6 Cryptography | No | No secrets or keys in Phase 1 |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via locale parameter | Tampering | next-intl `hasLocale()` validation in layout rejects invalid locale values (calls `notFound()`) |
| CSS injection via locale-derived classNames | Tampering | Locale values only used for `lang`/`dir` attributes and CSS class lookups; never interpolated into raw CSS strings |
| Dependency supply chain | Tampering | Use exact versions in `package.json`; audit with `npm audit` after install |

---

## Project Constraints (from CLAUDE.md)

The following directives from CLAUDE.md are absolute constraints for Phase 1 planning. The plan must not recommend any approach that contradicts these.

| Directive | Impact on Phase 1 |
|-----------|-------------------|
| CSS logical properties only (`ms-`, `me-`, `ps-`, `pe-`) | ESLint rule enforcing this must be in Wave 0 |
| Never write `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` as directional styles | Same ESLint rule; code review gate |
| `lang` + `dir` set atomically on `<html>` when locale switches | Layout.tsx pattern; never one without the other |
| All product data imports through `/lib/products.ts` only | Data access pattern; stub created in Phase 1 |
| `next/image` only — raw `<img>` tags banned via ESLint | `@next/eslint-plugin-next/no-img-element` rule enabled |
| Fonts via `next/font` for FOUT prevention | `Space_Grotesk` + `IBM_Plex_Arabic` with `variable` option |
| Motion library for all animations | `motion` (`motion/react`) installed in Phase 1 |
| Placeholder images: dark-field editorial, not grey boxes | `<PlaceholderImage>` component per UI-SPEC spec |
| next-intl URL-based locale routing (`/en/...`, `/ar/...`) | `defineRouting` with `localePrefix: 'always'` |
| Tailwind CSS v4 — logical properties only | v4 confirmed current; `@tailwindcss/postcss` PostCSS plugin |
| shadcn/ui | Not yet initialized; `npx shadcn@latest init` required in Wave 0 |
| Vercel deployment | No special Phase 1 config needed; Next.js 15 deploys to Vercel without changes |
| Dark-first; black and white only (#000000, #111111, #FFFFFF) | shadcn init selects dark mode + neutral base |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Space_Grotesk` export name matches `next/font/google` export for Space Grotesk font | Code Examples (fonts.ts) | Import fails; must check actual export name — may be `Space_Grotesk` with underscore |
| A2 | `IBM_Plex_Arabic` export name matches `next/font/google` for IBM Plex Arabic | Code Examples (fonts.ts) | Import fails; must verify export name during scaffolding |
| A3 | shadcn v4.7.0 `init` command correctly configures Tailwind v4 dark mode with black/white palette without manual post-editing | Architecture Patterns (Pattern 8) | May need manual CSS variable overrides in globals.css after init |
| A5 | Phosphor Icons `Bold` weight is available in `@phosphor-icons/react` v2.1.10 | Standard Stack | Weight may require different import pattern; verify during task execution |

**Claims tagged `[ASSUMED]`:** A1-A3, A5 above. A1 and A2 are minor — verify actual export names from `next/font/google` during the fonts.ts creation task. A3 requires a post-init CSS review step. A5 is low risk.

---

## Open Questions (RESOLVED)

1. **Next.js version pinning strategy** — RESOLVED
   - Decision: Use `next@^15.3.9` (v16 is `latest` on npm but breaks the next-intl middleware pattern; `middleware.ts` → `proxy.ts` rename in v16 is incompatible with this project's setup).
   - Plans pin `"next": "^15.3.9"` in package.json and verify via `npm list next 2>/dev/null | grep 'next@15\.'`.

2. **`localePrefix` strategy: `'always'` vs `'as-needed'`** — RESOLVED
   - Decision: Use `localePrefix: 'always'`. This gives symmetric `/en/shop` and `/ar/shop` URLs, which is correct for SEO bilingual parity and is consistent with the ARCHITECTURE.md pattern. All routes have a predictable locale prefix.

3. **shadcn dark mode class vs attribute** — RESOLVED
   - Decision: Keep `class="dark"` permanently on `<html>`. The site is dark-only with no light mode toggle. A permanent `.dark` class is simpler than a ThemeProvider and avoids a flash of incorrect theme on load.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/amannn/next-intl` — App Router setup, middleware, routing, navigation, getRequestConfig, locale switching patterns
- Context7 `/vercel/next.js` — next/font setup, Tailwind v4 CSS import, create-next-app, project structure
- Context7 `/llmstxt/ui_shadcn_llms_txt` — shadcn init, Sheet, NavigationMenu, Tailwind v4 migration, CSS variables
- Context7 `/websites/motion_dev` — useReducedMotion, AnimatePresence, motion/react import
- npm registry (live query 2026-05-06) — all version numbers verified

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — technology decision rationale (training knowledge, previously researched)
- `.planning/research/ARCHITECTURE.md` — folder structure, data layer, RTL patterns
- `.planning/research/PITFALLS.md` — failure modes and mitigations
- `.planning/phases/01-foundation/01-UI-SPEC.md` — approved design contract (Phase 1 authority)

### Tertiary (LOW confidence)
- None — all Phase 1 claims verified via Context7 or npm registry

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all versions verified against npm registry 2026-05-06
- next-intl integration: HIGH — patterns verified against Context7 official docs
- Tailwind v4 setup: HIGH — verified against Next.js official docs and shadcn migration guide
- RTL architecture: HIGH — documented in PITFALLS.md and ARCHITECTURE.md, consistent with W3C i18n standards
- Animation patterns: HIGH — verified against motion.dev official docs
- shadcn initialization: MEDIUM — init behavior with Tailwind v4 may need post-init manual CSS adjustments (A3)

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (30 days — stable stack; next-intl and Next.js version changes would invalidate)
