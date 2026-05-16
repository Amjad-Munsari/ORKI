# Phase 11: Storefront UI/UX Polish (EN) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 11-storefront-ui-ux-polish-en
**Areas discussed:** Imagery direction, Brand voice rewrites, PDP gallery interaction depth, Contact form path

---

## Imagery direction

### Q1 — Photography strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Varied placeholder system | 4–6 intentional treatments, no asset dependency, ships now | ✓ |
| Real editorial photography | Sourced/licensed imagery; highest payoff but adds procurement work outside the code phase | |
| Hybrid | Placeholders now, named slots reserved for real imagery later | |

**User's choice:** Varied placeholder system

### Q2 — Variant count

| Option | Description | Selected |
|--------|-------------|----------|
| 4 variants | Ghost-mark, color-block, grain/noise, typographic. Deterministic by slug hash. | ✓ |
| 6 variants | Adds silhouette outline + diagonal hatch | |
| 3 variants | Ghost-mark, color-block, typographic — minimum variety | |

**User's choice:** 4 variants

### Q3 — Home category splat

| Option | Description | Selected |
|--------|-------------|----------|
| Typographic-only | Massive kerned TOPS/BOTTOMS wordmark, drop-shadowed, subtle hover scale | ✓ |
| Use one placeholder variant | Apply a variant at hero scale | |
| Reserved real-image slot | Build expecting real imagery with fallback | |

**User's choice:** Typographic-only

### Q4 — Variant assignment

| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic by slug hash | Pure function, SSR-stable | ✓ |
| Per-product field in data/products.ts | Manual curation per product | |
| Random per render | Hydration mismatch risk | |

**User's choice:** Deterministic by slug hash

---

## Brand voice rewrites

### Q1 — Voice register

| Option | Description | Selected |
|--------|-------------|----------|
| Editorial-confident | Short, declarative, sensory, Riyadh-specific. Underground but legible. | ✓ |
| Aggressive/raw | Graffiti-cadence, scene-coded, expletive-adjacent | |
| Restrained-minimal | Less specific, more abstract | |

**User's choice:** Editorial-confident

### Q2 — Shop empty-state copy

| Option | Description | Selected |
|--------|-------------|----------|
| Drop-cycle reference | "No drops yet. Next one lands Friday." | |
| Scene-locale reference | "Nothing on this rack. Check the streets." | |
| Defer to UAT — 3 drafts | Claude drafts 3 in execute, user picks in npm run dev | ✓ |

**User's choice:** Defer to UAT — 3 drafts
**Notes:** User asked "what is this about" — Claude explained the empty-state finding; user then chose defer-to-UAT pattern.

### Q3 — Home brand-ethos line

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to UAT — 3 drafts | Same pattern as empty-state | ✓ |
| Specific direction now | User gives one-line direction, Claude writes to spec | |
| Keep current line | Audit reopens; accepted | |

**User's choice:** Defer to UAT — 3 drafts

### Q4 — EN 404 copy

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to UAT — 3 drafts | Same pattern | ✓ |
| Lock '404 / NO DROP HERE' now | Audit's suggested line | |
| Specific direction now | One-line direction | |

**User's choice:** Defer to UAT — 3 drafts

### Q5 — About body-weight rhythm

| Option | Description | Selected |
|--------|-------------|----------|
| One body + one pull-quote style | Body font-normal text-base/relaxed; pull-quote font-light text-2xl tracking-tight | ✓ |
| All-uniform body | Drop pull-quotes entirely | |
| Defer to execute | Claude picks based on what reads well | |

**User's choice:** One body + one pull-quote style

---

## PDP gallery interaction depth

### Q1 — Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Mid — stack + thumbnails + dots | Vertical thumb strip desktop, swiper mobile, no zoom/lightbox | ✓ |
| Minimal — stack only | Vertical stack desktop, swiper mobile, no thumbs | |
| Max — stack + thumbs + lightbox + zoom | Full premium PDP, requires lightbox primitive | |

**User's choice:** Mid

### Q2 — Desktop thumbnail strip position

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical on inline-start | Logical props, RTL-correct, mirrors Marion reference | ✓ |
| Horizontal below gallery | Mobile-feeling on desktop | |
| Hover/scroll-synced (no strip) | Active image highlights on scroll | |

**User's choice:** Vertical on inline-start

### Q3 — Mobile gallery

| Option | Description | Selected |
|--------|-------------|----------|
| CSS scroll-snap + dot indicators | Zero JS, native RTL, smallest bundle | ✓ |
| JS swiper library (embla) | More control, ~5kB gz, configuration overhead | |
| Tap-to-advance | Anti-pattern on mobile | |

**User's choice:** CSS scroll-snap + dot indicators

### Q4 — Loading skeletons

| Option | Description | Selected |
|--------|-------------|----------|
| Static bg-white/[0.03] shells | No shimmer, calmer, brand-fit | ✓ |
| Subtle pulse shimmer | Opacity-only pulse | |
| Diagonal gradient sweep | Generic SaaS feel | |

**User's choice:** Static bg-white/[0.03] shells

---

## Contact form path

### Q1 — Form disposition

| Option | Description | Selected |
|--------|-------------|----------|
| WhatsApp callout, drop the form | Honest, KSA-native, zero backend dep | (Claude discretion — user said "you decide") |
| Keep form + "still wiring" banner | Mixed signal | |
| Wire Resend now | Blocked on RESEND_API_KEY, reopens Phase 8 scope | |

**User's choice:** "not sure" → tradeoff table presented → user said "you decide" → Claude locked WhatsApp callout (Q1's recommended option) given the audit's actual complaint (silent lying about delivery) and the Phase 8 deferral.

### Q2 — WhatsApp number sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| I'll provide in execute | Placeholder constant; UAT step swaps in real number | ✓ |
| Defer entirely — link to mailto: | Skip WhatsApp, use email | |
| I'll provide now | Bake into plan immediately | |

**User's choice:** I'll provide in execute

### Q3 — Contact page hero/heading

| Option | Description | Selected |
|--------|-------------|----------|
| Keep heading, replace form with callout block | Minimum-blast-radius edit | ✓ |
| Rework whole page — editorial 'how to reach us' layout | Drifts from audit's actual finding | |
| Minimal — hero only, no callout card | Feels sparse | |

**User's choice:** Keep heading, replace form with callout block

---

## Claude's Discretion

Decisions delegated to Claude (audit-recommended fixes applied uniformly, no per-call-site discussion):

- shadcn primitive `left-/right-` → `start-/end-` logical-prop fixes
- Near-black hex literal collapse to CSS variables
- PDP `nav-height` doc-comment reconciliation
- `text-destructive` → `text-white/60` on storefront OOS
- Featured-Drops ScrollReveal stagger + duration tuning
- Universal `focus-visible` ring tokens
- Footer wordmark tracking/cap
- Search icon hidden until search ships (out of scope)
- Navbar dark-chrome flip + LanguageSwitcher/MobileNavDrawer/ShopDropdown cascade
- Display-size scale definition (display-1/2/3/4 utilities)
- Container-width unification (preference toward `max-w-[1440px]`, audited in live dev)
- "Limited stock" passive line on PDP without size selection
- Native sort `<select>` → shadcn `Select`
- Brand-ethos em-dash → `.rtl-flip` icon
- EN About 01/02/03 numbering — kept in EN; AR-side choice deferred to Phase 999.11
- Contact form disposition (WhatsApp callout chosen on "you decide")

## Deferred Ideas

- Lightbox + zoom on PDP gallery — future polish phase
- Real editorial photography — separate asset phase
- Real Contact form — returns when Phase 8 RESEND_API_KEY lands
- AR voice/copy reconciliation — Phase 999.11
- Embla/JS swiper for PDP mobile gallery — only if scroll-snap proves unreliable in UAT
- CSP nonce migration — separate Phase 10 deferral
- Search drawer/route — dedicated future phase
- Lighthouse CI / build-time perf gate — Phase 9 deferral stands
