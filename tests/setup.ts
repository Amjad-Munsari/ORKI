// Vitest global setup. Add DOM matchers / polyfills here as the suite grows.
import '@testing-library/react';

// Polyfill webcrypto for runners that lack it. Node 18+ has crypto.randomUUID natively.
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  globalThis.crypto = require('node:crypto').webcrypto as Crypto;
}
