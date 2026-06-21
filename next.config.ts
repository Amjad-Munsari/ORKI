import './src/lib/env';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Phase 10 Plan 07 — Security headers (RESEARCH §2.4).
 *
 * Six headers attached to every response via Next.js `headers()`:
 *   - Content-Security-Policy (CSP) — script/style/img/connect/frame allowlists
 *   - Strict-Transport-Security (HSTS) — force HTTPS for 2 years, includeSubDomains, preload
 *   - X-Frame-Options DENY — defence-in-depth alongside CSP frame-ancestors 'none'
 *   - X-Content-Type-Options nosniff
 *   - Referrer-Policy strict-origin-when-cross-origin
 *   - Permissions-Policy — deny camera/microphone/geolocation/payment
 *
 * The CSP recipe is the verbatim production policy from RESEARCH §2.4. The
 * `'unsafe-inline'` posture for both `script-src` and `style-src` is a
 * deliberate Phase-10 simplification (RESEARCH §8 R4) — Vercel + next-intl +
 * base-ui + motion all emit inline styles/scripts and per-route nonce upgrade
 * is explicitly out of scope. Trade-off documented in 10-VERIFICATION.md.
 *
 * Preview-only branch: when `process.env.VERCEL_ENV === 'preview'` the Vercel
 * preview toolbar is served from `https://vercel.live`; that origin is added
 * to BOTH `script-src` and `connect-src` so the toolbar loads on preview
 * deploys without leaking into the production CSP (RESEARCH §2.4 footgun #2).
 */
const isPreview = process.env.VERCEL_ENV === 'preview';
const isProd = process.env.NODE_ENV === 'production';
const previewScripts = isPreview ? ' https://vercel.live' : '';
const previewConnect = isPreview ? ' https://vercel.live' : '';

// WR-01 (Phase 10 review): script-src carries 'unsafe-inline' as a deliberate
// Phase-10 trade-off. Residual risk: any successful XSS becomes immediately
// exploitable because the attacker's injected <script> would be permitted by
// CSP. Mitigation deferred to Phase 11 — a full nonce migration must thread
// per-request nonces through Vercel Analytics, base-ui, next-intl scripts
// (multi-day refactor, out of Phase 10 scope per 10-VERIFICATION.md
// deviations). Note: 'strict-dynamic' is intentionally NOT present alongside
// 'unsafe-inline' (that combination would silently neuter both directives).
// Phase 11 follow-up: see 10-REVIEW.md WR-01 for the migration plan.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${previewScripts}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://images.unsplash.com https://gkcaakimmvsctwpvccwt.supabase.co`,
  `font-src 'self' data:`,
  `connect-src 'self' https://gkcaakimmvsctwpvccwt.supabase.co wss://gkcaakimmvsctwpvccwt.supabase.co https://vitals.vercel-insights.com${previewConnect}`,
  `frame-src 'none'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join('; ');

// WR-02 (Phase 10 review): HSTS is production-only. Shipping a 2-year HSTS
// with preload from `next dev` is harmless on localhost itself, but if a
// developer ever tunnels their dev server through an HTTPS reverse proxy
// (ngrok, Tailscale Funnel) the response can pin HSTS on a real hostname
// for two years. Gate the directive on NODE_ENV === 'production'.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
