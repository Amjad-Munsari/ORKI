---
status: diagnosed
trigger: "UAT Test 10 — guest cart not merged into user cart after sign-in (item gone)"
created: 2026-05-30T22:30:00Z
updated: 2026-05-30T22:55:00Z
---

## Current Focus

hypothesis: CONFIRMED — the merge's DELETE-guest-cart branch fires because the
  signed-in account already owns a userId-bound cart row, and cart_items has
  ON DELETE CASCADE, so the guest's item is destroyed with no item-level union.
test: Static trace of all writers of carts.userId + cascade FK + hook firing points.
expecting: A userId-bound cart pre-exists for the test account (created by an
  earlier defensive-merge claim during Test 2/3), forcing the DELETE branch.
next_action: Report root cause (diagnose-only mode).

## Symptoms

expected: Guest adds item, then signs in → item retained (guest cart merged into account cart).
actual: After valid sign-in the previously-added guest item is gone.
errors: none (merge swallows all errors; no console output surfaced for Test 10).
reproduction: Test 10 in .planning/phases/10-authentication-and-security-core/10-UAT.md
started: Discovered UAT 2026-05-30. Always broken (merge has no item union since Plan 10-05).

## Eliminated

- hypothesis: Cookie name mismatch (signInAction reads a different cookie than session.ts writes).
  evidence: Both use the literal 'orki_sid'. session.ts:16 COOKIE_NAME='orki_sid';
    auth.ts:151 reads (await cookies()).get('orki_sid'). Match confirmed.
  timestamp: 2026-05-30T22:40:00Z

- hypothesis: Cookie rotation on sign-in changes sessionId so the guest cart isn't found.
  evidence: Supabase SSR client (supabase/server.ts setAll) only writes Supabase
    auth cookies. Nothing writes/rotates orki_sid during sign-in. sessionId is stable.
  timestamp: 2026-05-30T22:42:00Z

- hypothesis: revalidatePath/redirect ordering means the merge never runs.
  evidence: auth.ts:150-160 runs the merge BEFORE revalidatePath (line 162) and
    returns ok before any redirect (redirect is client-side after the action
    resolves). Merge runs. Also a second defensive merge runs in getOrCreateCart
    on the next authenticated /api/cart hit. Merge demonstrably executes.
  timestamp: 2026-05-30T22:44:00Z

## Evidence

- timestamp: 2026-05-30T22:35:00Z
  checked: Data model — where do cart items live?
  found: Items are rows in cart_items, keyed by cartId (schema.ts:125-141). The
    carts row holds only sessionId/userId/locale. cart_items.cartId has
    references(() => carts.id, { onDelete: 'cascade' }) (schema.ts:129).
  implication: Deleting a carts row CASCADE-deletes its cart_items. Any merge
    path that DELETEs the guest cart row destroys the guest's items irrecoverably.

- timestamp: 2026-05-30T22:38:00Z
  checked: merge-on-signin.ts branch logic.
  found: If the user already has ANY cart row (userCart.length > 0, line 46), the
    function DELETEs the guest cart (lines 50-54) and returns — NO item-level
    union. Comment at lines 9-11 confirms this is by design ("T-10-05-07
    accepted: no item-level union"). Only when the user has NO cart does it claim
    the guest cart by setting userId (lines 61-66).
  implication: The merge retains the guest item ONLY in the claim branch. If a
    userId-bound cart already exists for the account, the guest item is discarded
    by design — exactly the reported symptom.

- timestamp: 2026-05-30T22:46:00Z
  checked: Who ever sets carts.userId? (grep across src)
  found: The ONLY writer of carts.userId is merge-on-signin.ts:63 (the claim
    branch). getOrCreateCart always inserts rows with userId = null
    (session.ts:58-61). No DB trigger provisions user carts (0002 migration has
    none). orders use userId but carts get it solely from merge.
  implication: An account acquires a userId-bound cart the first time the
    defensive merge hook claims a cart for it. After that first claim, every
    subsequent sign-in with a fresh guest cart hits the DELETE branch.

- timestamp: 2026-05-30T22:50:00Z
  checked: Where/when does the defensive merge hook fire?
  found: getOrCreateCart (session.ts:84-119) runs the merge on EVERY authenticated
    request whose resolved cart still has userId === null. It is reached via
    GET /api/cart (api/cart/route.ts:14) which StoreHydration calls on EVERY page
    mount (StoreHydration.tsx:83, mounted in [locale]/layout.tsx:58 — i.e. every
    page, including /account).
  implication: The very first authenticated page load for the test account (e.g.
    landing on /account during Test 2 signup or Test 3 sign-in) fires the hook,
    which CLAIMS whatever cart the orki_sid cookie then pointed at and stamps it
    with userId. From that point the account permanently owns a userId-bound cart
    row. So by the time Test 10 runs, the account already has a cart →
    merge takes the DELETE branch → cascade wipes the new guest item.

- timestamp: 2026-05-30T22:53:00Z
  checked: Does the guest's item ever survive into the account cart in Test 10?
  found: No path performs an item-level move/union from the guest cart to the
    user cart. server.ts has addItemToCart/clearCartItems but the merge never
    calls them. The DELETE branch issues a raw DELETE on the carts row only.
  implication: Confirmed UX gap + latent design defect, not a wiring bug. The
    merge as coded cannot retain items when a user cart already exists.

## Resolution

root_cause: |
  mergeGuestCartIntoUserCart performs NO item-level union. When the signed-in
  account already owns a carts row (userId IS NOT NULL), the function takes the
  DELETE-guest-cart branch (merge-on-signin.ts:46-55) and the guest cart row is
  deleted. Because cart_items.cartId is ON DELETE CASCADE (schema.ts:129), the
  guest's freshly-added item is destroyed — the merge "works as coded" but loses
  the item by design.

  In UAT this condition is essentially always met: the ONLY writer of
  carts.userId is the merge's claim branch (merge-on-signin.ts:63), and the
  defensive merge hook in getOrCreateCart (session.ts:84-119) fires on every
  authenticated request via GET /api/cart (StoreHydration on every page mount).
  So the account's FIRST authenticated page load (during signup Test 2 / sign-in
  Test 3) already claimed and userId-stamped a cart. By Test 10 the account owns
  a (typically empty) userId-bound cart, so the new guest item hits the DELETE
  branch and is silently discarded. Hypothesis 1 confirmed; it is both a design
  gap (no union) AND reliably triggered (stale empty user cart from a prior session).
fix: ""  # diagnose-only — not applied
verification: ""
files_changed: []
