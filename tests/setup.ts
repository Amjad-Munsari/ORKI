// Vitest global setup. Add DOM matchers / polyfills here as the suite grows.
import { vi } from 'vitest';
import '@testing-library/react';

// `server-only` throws at import time when not running in an RSC environment.
// Vitest is not an RSC environment, so stub the module so files that begin
// with `import 'server-only'` (e.g. src/lib/orders/state-machine.ts,
// src/lib/orders/reference.ts) can be imported under unit tests.
vi.mock('server-only', () => ({}));

// Polyfill webcrypto for runners that lack it. Node 18+ has crypto.randomUUID natively.
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  globalThis.crypto = require('node:crypto').webcrypto as Crypto;
}
