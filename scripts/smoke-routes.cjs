#!/usr/bin/env node
/**
 * Local smoke-runner for Phase 9 routes that do NOT require database access.
 * Boots `next dev` with stub env so src/lib/env.ts validation passes (STORAGE_URL
 * is a real URL, satisfying z.string().url(); runtime DB calls are not made on
 * any of the smoked routes).
 *
 * Smokes 5 DB-free routes: /robots.txt, /en/about, /en/contact,
 * /en/legal/privacy, /en/legal/terms. Each must return HTTP 200; the legal/about/
 * contact pages must emit a `<title>... | ORKI</title>` cascade (or for /robots.txt,
 * return text/plain content with at least one Disallow line).
 *
 * Sitemap and shop routes are NOT smoked here because they hit Drizzle. They remain
 * in 09-HUMAN-UAT.md under preview-deploy-only verification.
 *
 * Wired as `npm run smoke:routes`. Out-of-scope to modify src/lib/env.ts.
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');

const PORT = 3030; // avoid colliding with 3000 if dev is already running
const ROUTES = [
  { path: '/robots.txt',         expect: { status: 200, contains: 'Disallow:' } },
  { path: '/en/about',           expect: { status: 200, contains: '| ORKI</title>' } },
  { path: '/en/contact',         expect: { status: 200, contains: '| ORKI</title>' } },
  { path: '/en/legal/privacy',   expect: { status: 200, contains: '| ORKI</title>' } },
  { path: '/en/legal/terms',     expect: { status: 200, contains: '| ORKI</title>' } },
];

function fetchOnce(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { host: '127.0.0.1', port: PORT, path, headers: { 'user-agent': 'smoke-routes/1.0' } },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('request timeout')));
  });
}

async function waitForReady(deadlineMs) {
  const start = Date.now();
  while (Date.now() - start < deadlineMs) {
    try {
      const r = await fetchOnce('/robots.txt');
      if (r.status === 200) return;
    } catch (_) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`next dev did not become ready on :${PORT} within ${deadlineMs}ms`);
}

async function main() {
  const child = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      STORAGE_URL: 'stub://smoke-runner.local/db',
      DATABASE_URL: 'stub://smoke-runner.local/db',
      NODE_ENV: 'development',
    },
    shell: process.platform === 'win32',
  });

  let exitCode = 0;
  try {
    await waitForReady(60000);
    for (const route of ROUTES) {
      const { status, body } = await fetchOnce(route.path);
      const ok = status === route.expect.status && body.includes(route.expect.contains);
      const tag = ok ? 'PASS' : 'FAIL';
      console.log(`[smoke:routes] ${tag} ${route.path} status=${status} contains=${route.expect.contains}`);
      if (!ok) exitCode = 1;
    }
  } catch (err) {
    console.error('[smoke:routes] FAIL', err && err.message);
    exitCode = 1;
  } finally {
    child.kill('SIGTERM');
    // give next dev up to 5s to drain
    await new Promise((r) => setTimeout(r, 1500));
  }
  process.exit(exitCode);
}

main();
