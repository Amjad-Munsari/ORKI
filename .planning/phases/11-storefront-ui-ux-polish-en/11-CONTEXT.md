# Phase 11: Storefront UI/UX Polish (EN) - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the 17 `[OPEN]` findings in `.planning/STOREFRONT-UI-REVIEW-EN.md` so the public storefront (Home, Shop + category, PDP, About, Contact, Navbar, Footer, 404) reads as intentional, branded, and accessible. The audit was code-only; Phase 11 is execution + first live `npm run dev` verification.

**In scope:** Storefront EN copy/voice rewrites, dark Navbar chrome flip, focus-visible rings on every interactive, varied placeholder imagery system, PDP gallery upgrade (thumbs + swiper + skeletons), shop-list loading skeleton, Contact form replacement with WhatsApp callout, display-size scale unification, container-width unification, design-token hex cleanup, RTL logical-prop fixes inside shadcn primitives, ScrollReveal stagger tuning, EN 404 voice.

**Out of scope:** Checkout, cart drawer, admin pages, auth flows, account pages, AR copy reconciliation (`STOREFRONT-UI-REVIEW-AR.md` → Phase 999.11), real product photography sourcing, Resend wiring (Phase 8 dependency), CSP nonce migration (Phase 11 dep deferred earlier — separate hardening pass).

</domain>

<decisions>
## Implementation Decisions

### Imagery Direction
- **D-01:** Ship a **varied placeholder system** (not real photography, not hybrid). Phase risk-free, brand-coherent. Real imagery is a future asset-procurement phase.
- **D-02:** **4 placeholder variants**: ghost-mark (current), color-block (graduated near-blacks via the existing `--color-placeholder-bg` token + 2 sibling shades), grain/noise texture (SVG-based, no asset dependency), typographic (kerned ORKI wordmark with low-opacity fill). Treat as a system, not a zoo.
- **D-03:** **Home category splat = typographic-only.** Massive kerned `TOPS` / `BOTTOMS` wordmark fills the splat, drop-shadowed or stroked, subtle hover scale. No flat `bg-white/10` wash, no real image dependency. AR mirror: Arabic category names at equivalent display size.
- **D-04:** **Variant assignment = deterministic by slug hash.** Pure function `getPlaceholderVariant(slug) → 0..3`. SSR-stable, no localStorage, no hydration mismatch, no per-product field needed in `data/products.ts`. Same product always renders the same treatment.

### Brand Voice Rewrites
- **D-05:** **Voice register = editorial-confident.** Short, declarative, sensory, Riyadh-specific. Aligned with the locked hero copy ("Made in the noise of Riyadh. / Wear what the city sounds like."). Not aggressive/slangy, not abstract-minimal.
- **D-06:** **Shop empty-state copy → defer to UAT.** Claude drafts 3 candidates in execute (one drop-cycle-coded, one scene/locale-coded, one stripped); user picks live in `npm run dev`.
- **D-07:** **Home brand-ethos line (page.tsx:94-95) → defer to UAT.** Same pattern — 3 drafts, picked in live dev.
- **D-08:** **EN 404 copy (`Errors.notFound`) → defer to UAT.** 3 drafts including a baseline like `404 / NO DROP HERE`; picked in live dev.
- **D-09:** **About body-weight rhythm = one body + one pull-quote style.** Body: `font-normal text-base leading-relaxed`. Pull-quote: `font-light text-2xl tracking-tight`, used 1–2× per section maximum. Apply consistently across about/page.tsx:40,60,82.

### PDP Gallery Interaction Depth
- **D-10:** **Mid-depth gallery** — stack + thumbnails + dots. No lightbox, no zoom this phase (defer to a future polish phase if PDP analytics indicate need).
- **D-11:** **Desktop thumbnail strip = vertical on inline-start.** Use logical props (`start-0`, `ms-`) so RTL mirrors correctly. Sticky alongside the main stack.
- **D-12:** **Mobile gallery = CSS scroll-snap container + dot indicators.** No swiper library dependency. Dots update via `IntersectionObserver` on visible image. Native RTL via document direction.
- **D-13:** **Loading skeletons = static `bg-white/[0.03]` shells.** No shimmer, no gradient sweep. Shop: 8 cards at 3:4. PDP: 4:5 hero shell + 3 thumb shells.

### Contact Form Path
- **D-14:** **Replace form with WhatsApp callout.** Drop the mock `setTimeout` form entirely. Ship a visible callout card ("We're still wiring this up — message us on WhatsApp" + `wa.me/<number>` button) in the same visual slot as the current form.
- **D-15:** **Keep Contact hero/heading.** Only the form region swaps. Page heading and surrounding chrome unchanged.
- **D-16:** **WhatsApp number = placeholder constant resolved in execute.** Plan uses `const WA_NUMBER = 'TBD'`; UAT step prompts user for the real number; swapped in before final commit.
- **D-17:** **The form returns when Phase 8's `RESEND_API_KEY` lands** — this is a deferral, not a deletion. Component can be reintroduced in a future polish phase once the email channel is real.

### Claude's Discretion (apply audit-recommended fix without re-asking)
- Replace `ml-/mr-/left-/right-` leaks in shadcn primitives (`dialog.tsx`, `sheet.tsx`, `navigation-menu.tsx`) and `ShopDropdown.tsx:50` with logical `start-/end-` equivalents.
- Collapse `#0a0a0a`, `#0d0d0d`, `#050505`, `#111111` literals to the existing `--color-placeholder-bg` / `--color-secondary-surface` CSS variables. Decide canonical near-black at execute time.
- Reconcile `nav-height` doc-comment in `PDPLayout.tsx:16` against the actual `h-[80px]` Navbar via a single CSS var or by fixing the comment.
- Replace `text-destructive` on storefront OOS (`StockStateBadge.tsx:55`) with `text-white/60`.
- Tame Featured-Drops ScrollReveal: cap stagger at `(idx % 4) * 0.08`, tighten duration from 800ms to ~500ms.
- Add `focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black` to every storefront interactive (Navbar links, LanguageSwitcher, CartTrigger, MobileNavDrawer trigger, ShopDropdown items, sort select, Contact callout, About scroll cues).
- Footer wordmark: `tracking-[-0.04em]`, cap at `text-9xl` (~128px).
- Hide no-op search icon entirely in Phase 11 (search is not in scope). Re-introduce in a future search phase.
- Flip Navbar chrome to dark — `bg-black/80 backdrop-blur text-white border-white/[0.08]`, LanguageSwitcher + MobileNavDrawer trigger tokens updated to match, ShopDropdown panel mirrors CategoryDropdown's `bg-[var(--color-secondary-surface)] border-white/[0.12]`.
- Define a display-size scale — `display-1: 160px, display-2: 120px, display-3: 96px, display-4: 72px` (or close) via Tailwind utilities or theme; replace bespoke `text-[90px]`/`[100px]`/`[120px]`/`[160px]` literals.
- Unify container width to a single token across home, footer, shop, category, PDP, About, Contact. Pick at execute time — preference toward `max-w-[1440px]` for the editorial feel (currently home + footer); audit in live dev whether shop content survives the wider container.
- "Limited stock" passive line on PDP — surface lowest in-stock count across sizes near the price, in addition to the per-size gated version.
- Replace native sort `<select>` (`ShopHeader.tsx:88-99`) with shadcn `Select` (already in project).
- Brand-ethos em-dash trail (`page.tsx:102-103`) → use existing `.rtl-flip` utility on an `<ArrowRight>` icon.
- About 01/02/03 numbering in EN — keep numbering on EN side (audit framed this as an EN-or-AR choice; locking EN to keep numbers, AR-side choice defers to Phase 999.11).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit source of truth
- `.planning/STOREFRONT-UI-REVIEW-EN.md` — the 17 `[OPEN]` findings + 6 `[CLOSED]` for context. Phase 11's job is to close every `[OPEN]` row or explicitly defer with rationale.
- `.planning/STOREFRONT-UI-REVIEW-AR.md` — sibling AR audit; **out of scope for Phase 11**; deferred to Phase 999.11. Reference only to ensure EN decisions don't lock AR into bad choices.

### Project-level
- `CLAUDE.md` — RTL logical-prop rules, font contract (Geist + IBM Plex Sans Arabic), color discipline, design-system constraints.
- `.planning/PROJECT.md` — brand voice anchors, dark/minimal/editorial direction.
- `.planning/ROADMAP.md` §"Phase 11" — success criteria + out-of-scope.
- `.planning/STATE.md` — current phase position, Phase 10 sign-off status.

### Files touched (line-cited evidence in STOREFRONT-UI-REVIEW-EN.md)
- `src/components/nav/Navbar.tsx:23` — chrome flip
- `src/components/nav/LanguageSwitcher.tsx:23`, `src/components/nav/MobileNavDrawer.tsx:62` — chrome flip cascade
- `src/components/nav/ShopDropdown.tsx:50` — panel chrome + logical prop fix
- `src/components/nav/CategoryDropdown.tsx:29` — reference chrome
- `src/components/PlaceholderImage.tsx:13-14,48,54-66` — variant system
- `src/components/footer/Footer.tsx:41-43` — wordmark tracking/cap
- `src/components/shop/ProductGrid.tsx:14-22,27,29` — empty state copy, grid scale unification
- `src/components/shop/ShopHeader.tsx:88-99` — sort select
- `src/components/shop/StockStateBadge.tsx:55` — destructive token swap
- `src/components/pdp/PDPGallery.tsx` (whole file) — thumbnail + swiper + dots
- `src/components/pdp/PDPInfoPanel.tsx:42-54` — Limited stock passive line
- `src/components/pdp/PDPLayout.tsx:16` — nav-height comment reconciliation
- `src/app/[locale]/page.tsx:27-34,43,66-70,90,92,94-95,102-103,114-123` — home hero scale, ethos line, category splat, ScrollReveal stagger
- `src/app/[locale]/about/page.tsx:29,39,40,47-54,58,60,69-76,80,82` — display-scale + body rhythm
- `src/app/[locale]/contact/ContactClient.tsx:15-22,29,52-99` — form replacement
- `src/app/[locale]/shop/page.tsx:33-52,79` — Suspense skeleton
- `src/app/[locale]/not-found.tsx:11-26` — EN 404 voice
- `src/app/globals.css:9-10,54-59,189-191` — display-scale tokens, near-black collapse, rtl-flip utility
- `messages/en.json` — empty state, ethos, 404 keys; `Errors.notFound.*`

### Prior-phase context (already-locked)
- `.planning/phases/09-performance-legal-polish/09-CONTEXT.md` — Vercel Analytics is mounted, cookieless; no consent banner to redesign around.
- `.planning/phases/10-authentication-and-security-core/10-CONTEXT.md` — CSP currently allows `'unsafe-inline'`; any new motion/script must work without nonces this phase (nonce migration deferred).
- `.planning/codebase/data-access-pattern.md` — Drizzle relational query pattern (Phase 11 is UI-only so untouched, but read before touching any read path).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PlaceholderImage` component (`src/components/PlaceholderImage.tsx`) — single existing variant (ghost-mark). Extend in-place to a `variant` prop accepting `'ghost' | 'color' | 'texture' | 'type'` with deterministic selection via slug hash.
- `useReducedMotion` hook (already used in `PageTransition` — closed in pivot commit) — apply to mobile gallery swiper auto-snap and Featured-Drops stagger so reduced-motion users get instant transitions.
- shadcn `Select` is in the project — use it to replace the native sort `<select>`.
- `.rtl-flip` utility (`globals.css:189-191`) — apply to the brand-ethos em-dash icon swap.
- `CategoryDropdown.tsx:29` already uses the correct dark chrome (`bg-[#111111] border-white/[0.12]`) — use as the reference token set when flipping Navbar/ShopDropdown.
- `ScrollReveal` primitive — already capped in `ProductGrid.tsx:29`; the un-capped instance is only on the home Featured-Drops grid.

### Established Patterns
- All product data flows through `/lib/products.ts` and the `Product` type in `/types/domain.ts` (CLAUDE.md). The placeholder-variant decision must NOT add a field to `Product` — pure function on `product.slug` keeps the contract intact.
- next-intl translation keys live in `messages/{en,ar}.json`. Every new copy string ships with both an EN and AR key; AR keys for Phase 11 may be placeholder pending Phase 999.11 reviewer (AR-native).
- Logical CSS props (`ms-/me-/ps-/pe-/start-/end-`) are mandatory (CLAUDE.md). Audit specifically flagged remaining `left-/right-` leaks inside shadcn primitives — fix at the primitive level once, not per-call-site.
- `currency` formatter uses `Intl.NumberFormat('ar-SA-u-nu-latn', { currency: 'SAR' })` — already correct; nothing in Phase 11 touches it.

### Integration Points
- Live-dev verification is *part of Phase 11's success criteria* (success criterion #2 in ROADMAP.md) — execute phase must spin up `npm run dev`, validate every changed surface in browser, and capture the validation step in 11-VERIFICATION.md. This is the first audit→ship→live-verify round-trip in the project; the audit was deliberately code-only.

</code_context>

<specifics>
## Specific Ideas

- **Voice anchor:** the locked hero copy ("Made in the noise of Riyadh. / Wear what the city sounds like." with eyebrow "(SS26 — Drop 01)") is the bar for every other piece of EN copy this phase. New drafts that drift more abstract or more slangy should be rejected.
- **Marion reference (PROJECT.md):** vertical-stack PDP gallery with a side thumbnail rail matches the marionshop.framer.website reference the user pointed to. Mid-depth gallery decision (D-10/11) was anchored to that reference.
- **WhatsApp over email for KSA:** WhatsApp is the default messaging channel in KSA — chosen over a `mailto:` fallback even though it adds a UAT-time number dependency.
- **No consent banner concerns:** Phase 9 explicitly decided no banner; Phase 11 must not reintroduce one even via the WhatsApp callout (no third-party scripts loaded).

</specifics>

<deferred>
## Deferred Ideas

- **Lightbox + zoom on PDP gallery** — defer to a future polish phase. Trigger: PDP analytics indicating users want fullscreen detail viewing, or live-dev observation that the mid-depth gallery feels thin on multi-image products.
- **Real editorial photography** — separate asset-procurement phase. Trigger: licensed/commissioned imagery becomes available. The placeholder system is designed to swap to real images per slot without code churn (a `Product.heroImage` URL would simply override the placeholder fallback).
- **Real Contact form** — reopens when Phase 8's `RESEND_API_KEY` is provisioned. The form component can be reintroduced; the WhatsApp callout pattern stays as a secondary channel.
- **AR voice/copy reconciliation** — `.planning/STOREFRONT-UI-REVIEW-AR.md` → Phase 999.11. EN decisions here (D-05..D-09, About 01/02/03 numbering kept in EN) deliberately leave the AR mirror open.
- **Embla / JS swiper for PDP mobile gallery** — only revisit if scroll-snap dots prove unreliable across mobile browsers in UAT.
- **CSP nonce migration** — separately deferred from Phase 10 (script-src 'unsafe-inline'). Not a Phase 11 concern but noted because any new motion library would worsen the nonce migration's future scope.
- **Search drawer / route** — Navbar search icon hidden in Phase 11. Re-introduce in a dedicated search phase when scope and IA are defined.
- **Lighthouse CI / build-time perf gate** — explicitly deferred by Phase 9 decision; Phase 11 must not regress Vitals but doesn't add automated gating.

</deferred>

---

*Phase: 11-storefront-ui-ux-polish-en*
*Context gathered: 2026-05-17*
