#!/usr/bin/env node
/**
 * CI guard: fail the build if any [AR-LEGAL-REVIEW] or [USER-CONFIRM placeholder
 * remains in messages/{en,ar}.json. Wired as `npm run check:legal-placeholders`.
 * Pre-launch the team must strip all placeholders; the guard ensures none ship.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const FILES = ['messages/en.json', 'messages/ar.json'];
const PATTERN = /\[AR-LEGAL-REVIEW\]|\[USER-CONFIRM/;

let bad = false;
for (const rel of FILES) {
  const abs = path.resolve(process.cwd(), rel);
  const text = fs.readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (PATTERN.test(lines[i])) {
      console.error(`${rel}:${i + 1}: ${lines[i].trim()}`);
      bad = true;
    }
  }
}

if (bad) {
  console.error('\n[check:legal-placeholders] FAIL — strip [AR-LEGAL-REVIEW] / [USER-CONFIRM before launch.');
  process.exit(1);
}
console.log('[check:legal-placeholders] OK — no placeholders found.');
