# HANDOFF — Phase 11 polish session

**Last touched:** 2026-05-18
**Branch:** `main` (no PR — committing direct)
**Tip:** `d51fb9d` (Shop wrapper line metrics)
**Dev port the user has been running on:** typically 3000, but I spun up 3017–3020 ephemerally for smoke tests during the session.

Read `.planning/STATE.md` for project state. Read `.planning/phases/11-storefront-ui-ux-polish-en/11-VERIFICATION.md` for the canonical Phase 11 status table. This file only covers the post-verification polish iterations that don't have their own GSD artifact yet.

---

## Where we are

Phase 11 (storefront-ui-ux-polish-en) shipped its 15 plans at commit `b55c1b5`. Since then the user has been doing a live-dev walkthrough and surfacing visual/interaction tweaks one at a time. Everything below is post-ship polish.

**User picked all UAT candidate A** for 404 / Shop.empty / Home.ethos copy. WhatsApp number deferred — `WA_NUMBER = 'TBD'` in `src/app/[locale]/contact/ContactClient.tsx:12`. Both WhatsApp anchors are intentionally rendered as `aria-disabled` + muted until that constant is swapped to a real international number before launch.

---

## Hard rules for this session (do not forget)

1. **DESKTOP-ONLY POLISH.** Memory: `feedback_desktop_first.md`. Do not edit mobile-responsive variants (`md:`, `sm:`), do not proactively fix mobile-only issues, do not touch the mobile-emulator viewport during smoke tests. The user will explicitly open mobile work when they're ready. If you must touch shared CSS that affects both, scope your changes (`@media (hover: none) and (pointer: coarse)` for touch-only).
2. **Match scope.** The user has been iterating in small, targeted commits. One concern per commit. Don't bundle.
3. **Verify before claiming success.** For UI work, infer what you can from rendered HTML / Tailwind classes, but be explicit when you cannot do a visual check — only the user can.

---

## What landed this session (in order)

### Animation polish pass (6 commits)
- `d0d7316` — **Lenis smooth scroll** mounted at `[locale]/layout.tsx` via new `src/components/SmoothScrollProvider.tsx`. Honors `prefers-reduced-motion`, pauses on body `[data-scroll-locked]` (base-ui dialogs), keeps `position: sticky` working.
- `6826223` — **Motion tokens** in `globals.css` `@theme inline`: `--ease-out-soft`, `--ease-spring`, `--duration-fast/base/slow`. All subsequent transitions reference these.
- `d2c6d86` — **Button + link interactions**: new `.link-underline` utility (RTL-aware via `background-position` swap), logo hover-scale, AddToCart + WhatsApp lift+press+glow, Home "View All" link.
- `723d93b` — **Card + image hover**: ProductCard image slow-zoom (700ms / `--ease-out-soft`), CategoryCard vignette fade + wordmark color breath + Shop-Now arrow slide.
- `28bcb5a` — **ScrollReveal tuned** to Lenis-matching curve `[0.16, 1, 0.3, 1]`, 1.1s duration, 48px slide.
- `bdcd99f` — **PDP hero parallax** (desktop only via `matchMedia('(min-width: 768px)')`). First image drifts -12% via `useScroll`/`useTransform`.

### Follow-up fixes (in order)
- `43f6fbb` — PDP sticky `top-20` → `top-32` so info panel pins from scroll=0 (no 48px hitch from page `py-12`).
- `eb066a8` — Extended `.link-underline` to all text-bearing nav + footer interactives.
- `1f4eafe` → `5fbb5cb` → `3ef1edf` → `08da826` — Iterated on footer link underline gap: collapse boxes, add 4px padding, move underline under the padded box. Final: outer link has `inline-block leading-none py-2`, `.link-underline` lives on the outer `<a>` so the underline sits under the box, not the text.
- `18f5560` — **Critical fix.** Removed a global `a, button, [role="button"] { min-height: 44px; min-width: 44px }` rule that was bloating every desktop link. Now scoped to `@media (hover: none) and (pointer: coarse)` (touch devices only). Mobile a11y preserved.
- `396c2aa` — Same recipe applied to navbar inner spans so they have the same 8px text-to-underline gap as footer.
- `b22e999` — **Navbar shrunk** `h-[80px]` → `h-16` (64px) + stripped `h-full` from inner elements + `items-stretch` → `items-center` on the grid. Hit areas now match content, not the full navbar strip. Knock-on: `<main pt-20>` → `pt-16`, PDPLayout `sticky top-32` → `top-28` (64 nav + 48 page py-12).
- `7fbb54e` → `d51fb9d` — Tried to align Shop dropdown trigger with About/Contact. Removed `flex items-center gap-1` from Shop's Link; added `text-sm leading-none` to its wrapper div to normalize the anonymous line-box. **Last status unknown — user has not confirmed `d51fb9d` worked.**

---

## Active loose ends (most → least important)

### 1. Shop trigger vertical alignment — **unverified**
After `d51fb9d` I asked the user to confirm. They haven't replied yet. If they say "still drifts," the next escalation is to make Shop's wrapper use the EXACT same structure as About/Contact — possibly stripping the `<div>` entirely and using a Floating-UI / portal pattern for the dropdown panel positioning so the trigger is a bare `<a>` like its siblings. Or wrap About/Contact in matching divs so all three are equivalent.

### 2. Footer benefit bar (Free shipping / Easy returns / Secure payments / 24/7 support)
The bar uses `group hover:bg-white/[0.02] transition-colors` per cell. The icons inside use `group-hover:text-white`. No new animation tokens applied — kept as-is. If the user wants the same `--ease-out-soft` / `--duration-base` treatment, that's a one-line fix per cell.

### 3. WhatsApp number swap
`src/app/[locale]/contact/ContactClient.tsx:12` — `const WA_NUMBER = 'TBD'`. Must be replaced with international format (e.g. `'966512345678'`) before the contact page is shippable. Both anchors are gated to `aria-disabled` while it's `'TBD'`, so the page is safe to deploy to staging.

### 4. Colors / hero
User noted at the start of this session that the site "feels boring, there are no colors" but explicitly deferred this — "could be because there is nothing in the hero section + no products yet, so we will tackle this later." Wait for them to bring it up.

### 5. AR-side root 404 voice (`src/app/not-found.tsx`)
The AR copy I wrote there (`٤٠٤ / ما في دروب هنا`) doesn't match the legacy AR copy in `messages/ar.json` `Errors.notFound.*` (`404 — ضاع في الضجيج.`). Both are valid; Phase 999.11 should reconcile to one canonical AR voice.

### 6. Hydration-warning suppressions
- `<body suppressHydrationWarning>` in `[locale]/layout.tsx` and `app/not-found.tsx` (ColorZilla / browser extensions inject `cz-shortcut-listen` etc.)
- `<button suppressHydrationWarning>` on ShopHeader category tabs and on shadcn `SelectTrigger` (password-manager extensions inject `fdprocessedid`)
These are intentional escape hatches for known browser-extension noise. Do not remove.

### 7. Stale `.next` cache → 500 on `favicon.ico` during dev HMR
Happens after structural changes (layout / middleware / providers). Fix is always `Remove-Item -Recurse -Force .next; npm run dev`. Not a code bug.

### 8. Test flake (pre-Phase-11)
`tests/rls/cross-user-deny.test.ts` times out at 5s when no live Supabase fixture is reachable. Phase 10 RLS test, unrelated to Phase 11. Listed in `11-VERIFICATION.md`.

---

## Files most touched (use these as starting points)

| File | Why |
|---|---|
| `src/app/globals.css` | Motion tokens, `.link-underline` utility, touch-target media gate |
| `src/components/nav/Navbar.tsx` | 64px chrome, inner-element layout |
| `src/components/nav/ShopDropdown.tsx` | Wrapper line metrics — alignment hotspot |
| `src/components/nav/LanguageSwitcher.tsx` | Underline span recipe |
| `src/components/auth/UserMenu.tsx` | Underline span recipe (both signed-in + out branches) |
| `src/components/footer/Footer.tsx` | All 9 column links with underline-under-box recipe |
| `src/components/SmoothScrollProvider.tsx` | Lenis mount + cleanup |
| `src/components/pdp/PDPGallery.tsx` | Parallax wiring |
| `src/components/pdp/PDPLayout.tsx` | Sticky `top-28` |
| `src/app/[locale]/layout.tsx` | `pt-16` main, provider mounting order |
| `src/components/pdp/PDPInfoPanel.tsx` | Hierarchy tightening (H1 / price / Limited-stock pill) |
| `src/components/pdp/SizeGuideModal.tsx` | Trigger as proper link affordance |
| `src/lib/format-price.ts` | New Riyal-glyph SAR formatter (`⃁`) |
| `src/app/not-found.tsx` | Root branded 404, locale-aware via middleware `x-pathname` header |
| `src/middleware.ts` | Sets `x-pathname` for root not-found.tsx |

---

## Recipes worth remembering

**Animated underline that grows from inline-start, RTL-mirrored, under a padded box:**

```html
<a class="text-sm font-semibold inline-block leading-none py-2 link-underline">
  {label}
</a>
```

Outer `<a>` carries `py-2` so the underline (at `background-position: 0% 100%`) lands at the bottom of the padded box — visually 8px under the text descender. `leading-none` collapses the line-box to the font size so the text doesn't get extra vertical leading inside the padded box.

**For the navbar** the same recipe lives on an inner span instead of the outer `<a>` because the outer `<a>` has additional flex-positioning needs. The wrapper div around `ShopDropdown` requires `text-sm leading-none` to normalize its line metrics to match the bare `<a>` siblings.

**Motion easings (any new animation should reference these, not hardcode `ms`):**
```
duration-[var(--duration-fast)]  // 200ms — button press, focus
duration-[var(--duration-base)]  // 400ms — hover, click feedback
duration-[var(--duration-slow)]  // 700ms — image zoom, scroll reveal
ease-[var(--ease-out-soft)]      // cubic-bezier(0.16, 1, 0.3, 1)
ease-[var(--ease-spring)]        // cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Touch-target safe pattern** for desktop-bare hit areas:
```html
<a class="inline-block leading-none py-2">{text}</a>
```
The global `a, button { min-height: 44px }` rule is scoped to touch devices only (`@media (hover: none) and (pointer: coarse)` in `globals.css`). Inline `min-h-[44px]` on a specific element still applies on desktop — strip those if you want desktop hit areas to match content.

---

## How to pick up where we left off

1. `git pull` / confirm tip is `d51fb9d` or beyond.
2. `Remove-Item -Recurse -Force .next; npm run dev`.
3. Open `http://localhost:3000/en` and `http://localhost:3000/ar` side-by-side.
4. Hover the Shop / About / Contact links in the navbar — confirm Shop's text baseline matches its siblings. **If yes**, ask the user what's next. **If no**, the wrapper needs structural unification (see "Active loose ends #1").
5. Don't touch mobile.
