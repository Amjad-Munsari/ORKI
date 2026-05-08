# Security Exceptions — ORKI

This document tracks known security vulnerabilities that are intentionally ignored or deferred with technical justification.

## Audit Log: 2026-05-08

**Command:** `npm audit --audit-level=moderate`
**Status:** 6 moderate vulnerabilities found.

### 1. esbuild (<=0.24.2)
- **Severity:** Moderate
- **Dependency Path:** `drizzle-kit` → `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils` → `esbuild`
- **Issue:** Development server response reading vulnerability.
- **Justification:** This affects the development server only (not production). `drizzle-kit` is a devDependency. The recommended fix (`npm audit fix --force`) attempts to downgrade `drizzle-kit` to 0.18.1, which would break compatibility with the current Drizzle schema and migrations (0.31.x). 
- **Action:** Accept risk for local development; monitor for `drizzle-kit` updates that bump `esbuild`.

### 2. postcss (<8.5.10)
- **Severity:** Moderate
- **Dependency Path:** `next` → `postcss`
- **Issue:** XSS via unescaped `</style>` tags in CSS stringification.
- **Justification:** Affects CSS generation. The recommended fix (`npm audit fix --force`) attempts to downgrade `next` to 9.3.3, which is a massive breaking change for the project (Next.js 15). 
- **Action:** Defer until `next` releases a patch update with the fixed `postcss` version. Risk is low as CSS is generated at build time from trusted source files.
