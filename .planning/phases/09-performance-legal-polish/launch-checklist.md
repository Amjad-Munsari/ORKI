# Phase 9 Launch Checklist (pre-public-deploy)

Owned blockers that MUST be resolved before flipping the public-deploy switch.
Created by Plan 09-08 (gap closure) on 2026-05-10.

## Blocking — copy

- [ ] **Strip `[AR-LEGAL-REVIEW]` placeholders** from `messages/ar.json` (30 occurrences as of 2026-05-10).
  - Verification: `npm run check:legal-placeholders` exits 0.
  - Owner: native AR legal reviewer + project lead.
  - Source: 09-REVIEW.md IN-01.

- [ ] **Resolve `[USER-CONFIRM ...]` placeholders** in `messages/en.json` and `messages/ar.json` (collectively 16 occurrences as of 2026-05-10).
  - These mark missing real values: commercial registration number, controller postal address, retention periods, etc.
  - Verification: `npm run check:legal-placeholders` exits 0 (same script catches both pattern families).
  - Owner: project lead.
  - Source: 09-REVIEW.md IN-02.

## Blocking — UAT (post-deploy)

The eight items in `09-HUMAN-UAT.md` remain pending. Five of them (items 3, 4, 5)
are now runnable locally via `npm run smoke:routes` (added by Plan 09-08 Task 7).
Items 1, 2, 6, 7, 8 still require a Vercel preview deploy.

## Suggested CI wiring (post-launch)

Add `npm run check:legal-placeholders` to the `vercel-build` script (or a GitHub
Actions pre-merge job) so the placeholder guard runs on every deploy. Not done in
this plan because it would block the current preview deploy that still has
placeholders by design — flip the switch only when the blocking items above are
cleared.
