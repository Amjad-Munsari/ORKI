---
status: diagnosed
trigger: "UAT Test 12 — Console Error on /ar/login: hydration mismatch on MobileNavDrawer SheetTrigger Base UI id (server base-ui-_R_1pn9etb_ vs client base-ui-_R_76r9etb_). Genuine React useId divergence in Navbar tree, not extension-injected. Recurring auth-page hydration issue."
created: 2026-05-30T22:40:00Z
updated: 2026-05-30T23:10:00Z
mode: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED — Raw `useReducedMotion()` from motion/react (used directly in CartBadge and MobileNavDrawer, NOT via the hydration-safe wrapper) returns a different value on the client's first render than on the server for prefers-reduced-motion users, AND motion's AnimatePresence/PopChild/usePresence each consume React `useId` slots. The motion useId calls share the SAME React useId tree-counter as Base UI's Dialog. Any server↔client difference in the motion subtree (child count, branch, or motion's own reduced-motion-gated internals) shifts the useId sequence, so the downstream Base UI SheetTrigger id (and every Base UI id after it) no longer matches.
test: Traced the layout/Navbar render tree and the motion + Base UI useId callers in node_modules.
expecting: At least one useId-consuming motion subtree upstream of (or sibling-before) MobileNavDrawer's SheetTrigger that renders a different shape/count on the client's first paint.
next_action: Report root cause (diagnose-only mode — no fix applied).

## Symptoms

expected: Pages hydrate cleanly with no React hydration-mismatch console error.
actual: Console Error on /ar/login: "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties." Mismatched attribute is the Base UI generated id on MobileNavDrawer's SheetTrigger button — server id="base-ui-_R_1pn9etb_" vs client id="base-ui-_R_76r9etb_". Stack points to src/components/nav/MobileNavDrawer.tsx:60. NOT a browser-extension artifact (it is a Base UI useId value, not fdprocessedid).
errors: "hydration mismatch", "base-ui-_R_..._", "useId", MobileNavDrawer.tsx:60, SheetTrigger
reproduction: UAT Test 12 — load /ar/login (and likely all pages) with a browser that resolves a real prefers-reduced-motion value.
started: Recurring "hydration error reappears on auth pages" per project memory. Prior fix (commit 1e5c2f5 "fix: hydration mismatch under prefers-reduced-motion") only covered PageTransition; the raw useReducedMotion callers were left untouched.

## Evidence

- timestamp: 2026-05-30T22:45:00Z
  checked: src/app/[locale]/layout.tsx
  found: Layout renders, inside NextIntlClientProvider and in this order: SmoothScrollProvider (null), StoreHydration (null), Navbar, CartDrawer, PageTransition>main, Footer. CartDrawer and PageTransition both render motion/Base-UI subtrees. There is NO (auth)/layout.tsx — auth pages use this exact layout, so Navbar renders identically on /ar/login.
  implication: Navbar + its motion-using children are in the same React tree as CartDrawer's Sheet and PageTransition's AnimatePresence. They all share one React useId counter.

- timestamp: 2026-05-30T22:50:00Z
  checked: src/components/nav/Navbar.tsx
  found: Server component. Fetches user via supabase.auth.getUser(), passes a plain `authedUser` PROP to both UserMenu (desktop) and MobileNavDrawer (line 68, 72). Props are identical server↔client, so the user value itself is NOT the divergence.
  implication: Rules out investigation hypothesis #1 (user differs server vs client). The user prop is server-serialized and stable across hydration.

- timestamp: 2026-05-30T22:55:00Z
  checked: src/components/nav/CartBadge.tsx (line 12) and src/components/nav/MobileNavDrawer.tsx (line 31)
  found: Both call the RAW `useReducedMotion()` from 'motion/react' directly — NOT the hydration-safe `useReducedMotionSafe()` wrapper. CartBadge wraps its badge in `<AnimatePresence mode="popLayout">{count>0 && <motion.span/>}</AnimatePresence>`. MobileNavDrawer wraps its icon in `<AnimatePresence mode="wait" initial={false}>{isOpen ? <motion.span key="close"/> : <motion.span key="open"/>}</AnimatePresence>`.
  implication: These are the only Navbar-subtree components using the UNSAFE reduced-motion hook. CartBadge renders BEFORE MobileNavDrawer in the Navbar (CartTrigger is rendered before MobileNavDrawer), so a useId shift inside CartBadge propagates to MobileNavDrawer's SheetTrigger.

- timestamp: 2026-05-30T23:00:00Z
  checked: node_modules/framer-motion (motion v12.38) — AnimatePresence internals
  found: THREE distinct React `useId` callers live inside the AnimatePresence subtree:
    (1) PresenceChild.mjs:11 — `const id = useId()` — ONE per present child of AnimatePresence.
    (2) PopChild.mjs:44 — `const id = useId()` — rendered when AnimatePresence mode is involved; PresenceChild wraps children in PopChild (PresenceChild.mjs:55 `PopChild pop={mode === "popLayout"}`).
    (3) use-presence.mjs:35 — `const id = useId()` — called by every motion.* element that is a presence child.
  implication: Every motion.span inside an AnimatePresence consumes MULTIPLE React useId slots (PresenceChild + PopChild + usePresence). These ids are drawn from the SAME React useId counter that Base UI's Dialog.Trigger later draws from. Any difference in how many / which motion children render on the client's first paint shifts that shared counter downstream — directly changing the SheetTrigger's id.

- timestamp: 2026-05-30T23:03:00Z
  checked: node_modules/@base-ui/react/internals/useBaseUiId.js
  found: Base UI generates ids as `base-ui-` + React's native `useId()` output. So `base-ui-_R_1pn9etb_` IS React's useId value with a prefix. The encoded suffix (`1pn9etb` vs `76r9etb`) encodes the component's POSITION/sequence in React's useId tree.
  implication: A different suffix proves the SheetTrigger sits at a different useId tree position on server vs client — i.e. something with a different useId footprint rendered before it. This is the textbook symptom of an upstream tree-shape / hook-count divergence, not a problem with the SheetTrigger itself.

- timestamp: 2026-05-30T23:06:00Z
  checked: node_modules/framer-motion/.../use-reduced-motion.mjs:32-44 and src/hooks/useReducedMotionSafe.ts
  found: motion's raw `useReducedMotion()` does `useState(prefersReducedMotion.current)` — on the server prefersReducedMotion has no matchMedia and resolves false; on the client's first render it reads the real media query (true for reduced-motion users). The project ALREADY has `useReducedMotionSafe()` whose docblock explicitly states the fix: return false for SSR + first client render, apply the real preference only after a mount useEffect. PageTransition uses the safe hook; CartBadge and MobileNavDrawer do NOT.
  implication: For a prefers-reduced-motion user, CartBadge/MobileNavDrawer evaluate reduced-motion differently on first client paint than the server did. Where that value (or motion's own reduced-motion-gated AnimatePresence/PopChild behaviour) changes the rendered motion subtree, the shared useId counter diverges → SheetTrigger id mismatch.

- timestamp: 2026-05-30T23:08:00Z
  checked: git log (hydration commits)
  found: Commit 1e5c2f5 "fix: hydration mismatch under prefers-reduced-motion" introduced useReducedMotionSafe and applied it to PageTransition only. Commits b60b084 / faaaa79 added suppressHydrationWarning for browser-extension (fdprocessedid) cases — a DIFFERENT class of issue.
  implication: Confirms the "recurring" framing: the root pattern (raw useReducedMotion in motion subtrees that share the useId counter) was only partially remediated. The auth-page recurrence is the same root cause leaking through the un-migrated callers.

## Eliminated

- hypothesis: The server-fetched `user` differs from the client's first render, shifting UserMenu's subtree.
  evidence: Navbar.tsx passes `authedUser` as a plain serialized PROP (lines 68, 72). Props are identical across server render and hydration; UserMenu receives the same value both times. Not the divergence.
  timestamp: 2026-05-30T22:50:00Z

- hypothesis: A separate (auth) layout renders Navbar differently on /ar/login.
  evidence: Glob of src/app/[locale]/(auth)/** shows no layout.tsx — auth pages inherit the locale layout unchanged.
  timestamp: 2026-05-30T22:48:00Z

## Resolution

root_cause: |
  Motion (framer-motion) AnimatePresence subtrees in the Navbar consume React `useId` slots that share the SAME React useId counter as Base UI's Dialog/Sheet. Two Navbar-subtree components — CartBadge (src/components/nav/CartBadge.tsx:12) and MobileNavDrawer (src/components/nav/MobileNavDrawer.tsx:31) — call the RAW `useReducedMotion()` from motion/react instead of the project's hydration-safe `useReducedMotionSafe()`. For a prefers-reduced-motion user, raw useReducedMotion returns false on the server / first SSR pass but the real (true) value on the client's first render. Combined with motion's internal useId callers (PresenceChild.mjs:11, PopChild.mjs:44, usePresence use-presence.mjs:35 — each motion.span inside AnimatePresence consumes several useId slots), the client's first-paint motion subtree no longer matches the server's, shifting the shared useId sequence. Because CartBadge (rendered before MobileNavDrawer in the Navbar) sits upstream of the SheetTrigger, the shift cascades: SheetTrigger gets base-ui-_R_1pn9etb_ on the server but base-ui-_R_76r9etb_ on the client. The id mismatch is the DOWNSTREAM symptom; the upstream cause is the server/client motion-subtree divergence driven by unsafe useReducedMotion in components that share the Base UI useId counter. A prior fix (commit 1e5c2f5) introduced useReducedMotionSafe but only migrated PageTransition, leaving CartBadge and MobileNavDrawer on the raw hook — hence the recurrence on auth pages.
fix: ""  # not applied — diagnose-only mode
verification: ""
files_changed: []
