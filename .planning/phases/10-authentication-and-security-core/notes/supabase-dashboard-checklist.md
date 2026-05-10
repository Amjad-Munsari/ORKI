# Phase 10 — Supabase Manual Ops Checklist

The following operations live in the Supabase dashboard / Management API and
CANNOT be scripted from the codebase. They are required for Phase 10 to claim
SEC-03 / SEC-07 / SEC-09 successfully.

**Project ref:** `gkcaakimmvsctwpvccwt`

## Item 1 — Pre-migration probe (Wave 0)

- Already executed in Task 2.1.
- Result captured in `notes/wave-0-probe.md`.
- [x] Done — see `notes/wave-0-probe.md`

## Item 2 — Disable email confirmation

- Per `10-CONTEXT.md` decision: new accounts can sign in immediately after signup.
- **Action:** Supabase Dashboard → Authentication → Settings → Email Auth → toggle "Confirm email" OFF.
- **Verify:** signup via the production `/signup` form (after Plan 10-04) results in a usable session WITHOUT a confirmation email click.
- [ ] Done

## Item 3 — Set sign-up/sign-in dashboard rate limit

- Per `10-RESEARCH.md` §8 R1+R2: the dashboard "Rate limit for sign-ups and sign-ins" setting is reportedly under-enforced at default; explicit override is required.
- **Action:** Supabase Dashboard → Authentication → Rate Limits → set "Rate limit for sign-ups and sign-ins" to **5 per 5 minutes per IP**.
- **Verify:** from one IP, 6 rapid sign-in attempts return HTTP 429 on the 6th. Plan 10-07 documents this as the manual SEC-07 verification.
- [ ] Done

## Item 4 — PATCH four rate limits via Management API

- Per `10-RESEARCH.md` §2.2: the Management API exposes four rate-limit knobs that should be tightened from defaults.
- **Action:** run the following with a Supabase access token (created in Account → Access Tokens):

  ```bash
  curl -X PATCH "https://api.supabase.com/v1/projects/gkcaakimmvsctwpvccwt/config/auth" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "rate_limit_email_sent": 5,
      "rate_limit_token_refresh": 150,
      "rate_limit_otp": 30,
      "rate_limit_verify": 30
    }'
  ```

- **Verify:** GET the same endpoint, confirm the four keys returned match.

  ```bash
  curl -s "https://api.supabase.com/v1/projects/gkcaakimmvsctwpvccwt/config/auth" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    | jq '{rate_limit_email_sent, rate_limit_token_refresh, rate_limit_otp, rate_limit_verify}'
  ```
- [ ] Done

## Item 5 — (Reference) Email template AR variant

- Out of Phase 10 scope; tracked in launch checklist. Sender domain (DKIM/SPF) also deferred.

---

**Reminder for Plan 10-07 verifier:** items 2, 3, 4 must be ticked off before the SEC-07 manual verification step runs.
