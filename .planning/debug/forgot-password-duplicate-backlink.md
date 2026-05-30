---
status: diagnosed
trigger: "Forgot-password success state shows TWO 'back to sign-in' buttons; expected ONE"
created: 2026-05-30T00:00:00Z
updated: 2026-05-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — duplicate back-link comes from BOTH the page chrome (always-on footer link) and the form's success-state link, which overlap once the form is submitted.
test: Read both files, compared with login page pattern, verified shared translation key.
expecting: N/A — root cause confirmed.
next_action: Return diagnosis. find_root_cause_only — no fix applied.

## Symptoms

expected: After submitting forgot-password, the generic-success state shows ONE "Back to sign in" link.
actual: TWO "Back to sign in" links/buttons appear in the success state.
errors: none (visual/UX defect)
reproduction: Test 6 in .planning/phases/10-authentication-and-security-core/10-UAT.md — submit forgot-password form, observe success state.
started: Discovered during UAT 2026-05-30. Present since the success-state branch was added to ForgotPasswordForm.

## Eliminated

(none — first hypothesis confirmed)

## Evidence

- timestamp: 2026-05-30
  checked: src/components/auth/ForgotPasswordForm.tsx
  found: Success-state branch (if submitted) renders its OWN back-link at lines 70-77: <Link href="/login">{t('back')}</Link> using namespace Auth.forgot, key 'back'.
  implication: The form contributes link #1 only when submitted === true.

- timestamp: 2026-05-30
  checked: src/app/[locale]/(auth)/forgot-password/page.tsx
  found: Page chrome (RSC) renders an UNCONDITIONAL footer back-link at lines 25-32: <Link href="/login">{t('back')}</Link>, also Auth.forgot.back. It is always present, before AND after submit, sitting directly below <ForgotPasswordForm /> (line 24).
  implication: This is link #2, always visible. After submit, it appears alongside the form's success-state link → two identical "Back to sign in" links.

- timestamp: 2026-05-30
  checked: messages/en.json lines 463-472
  found: Auth.forgot.back = "Back to sign in". Both elements resolve to identical text and both href to /login.
  implication: The two links are visually and functionally identical, confirming the user's "two buttons" report.

- timestamp: 2026-05-30
  checked: src/app/[locale]/(auth)/login/page.tsx (intended pattern)
  found: Login page renders exactly ONE persistent footer link in chrome (lines 24-32); LoginForm renders NO footer link in any state. Forgot-password DEVIATES by having the form add a second footer link in its success branch.
  implication: The intended single-link pattern is: chrome owns the footer link, the form does not. ForgotPasswordForm's success-state link is the redundant/duplicate element.

## Resolution

root_cause: |
  In the forgot-password success state, two identical "Back to sign in" links render simultaneously:
  (1) the page chrome's always-present footer link in src/app/[locale]/(auth)/forgot-password/page.tsx lines 25-32, and
  (2) the form's own success-state link in src/components/auth/ForgotPasswordForm.tsx lines 70-77.
  Both use Auth.forgot.back ("Back to sign in") and href /login. The chrome link is unconditional, so once the
  form switches to its submitted/success branch, the form's link stacks on top of the chrome link → two links.
  The redundant element is the form's success-state link (lines 70-77): the established pattern (login page +
  LoginForm) is that the page chrome owns the single footer back-link and the form renders none.
fix: (not applied — find_root_cause_only)
verification: (not applied)
files_changed: []
