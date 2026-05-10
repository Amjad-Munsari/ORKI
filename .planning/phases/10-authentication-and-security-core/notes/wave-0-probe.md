# Phase 10 Wave-0 SQL Probe

**Date run:** 2026-05-10
**Run by:** user (Supabase SQL Editor) — verified by executor before Task 2.2
**Connection:** Supabase project `gkcaakimmvsctwpvccwt` — production
**Probe SQL:** RESEARCH §2.1 (corrected — see Notes for the planning-bug correction)

## Result

- [x] **0 rows returned — SAFE TO PROCEED with Task 2.2 migration**
- [ ] N rows returned — HALT, do not run migration. Surface to user. Action: …

## Probe SQL (as executed)

```sql
SELECT 'carts' AS tbl, id, user_id FROM public.carts
WHERE user_id IS NOT NULL
  AND user_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
UNION ALL
SELECT 'orders', id::text, user_id FROM public.orders
WHERE user_id IS NOT NULL
  AND user_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
```

## Raw output

```
(0 rows)
```

Both `public.carts.user_id` and `public.orders.user_id` columns returned zero non-null,
non-uuid-pattern rows. Phase 8 was guest-only — both columns are universally NULL or
already uuid-castable, so the `ALTER COLUMN ... USING user_id::uuid` in Task 2.2 will
not raise.

## Notes

- **Planning-bug correction:** The probe originally drafted in RESEARCH §2.1 referenced
  the columns `customer_id` and `audit_log` which do **not** exist in the public schema.
  The corrected probe (above) uses the actual column names `carts.user_id` and
  `orders.user_id`. Both ran clean. Future readers: do not re-run the original RESEARCH
  §2.1 SQL verbatim — it will error on missing columns. The corrected probe is the
  source of truth.
- This probe was executed against the **production** Supabase pooler (the same
  `DATABASE_URL` Drizzle uses), per user authorization in the runtime notes.
- Plan 10-02 Task 2.2 is now cleared to run the ALTERs.
