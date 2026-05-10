// Run once with: npx tsx scripts/generate-og-default.ts
// Outputs to public/og-default.png at exactly 1200x630.
//
// Path A — programmatic via @vercel/og (locked default per Plan 09-04 Issue #10).
// next/og is the runtime export shipped with Next.js 15; @vercel/og may need to be
// installed as a devDependency for the standalone script (`npm i -D @vercel/og`).
//
// Note: this file uses `React.createElement` instead of JSX so it compiles cleanly
// as a `.ts` file (esbuild does not enable JSX parsing for the .ts extension).
import { ImageResponse } from 'next/og';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import * as React from 'react';

async function main() {
  const img = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        },
      },
      React.createElement(
        'div',
        {
          style: {
            fontSize: 280,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.05em',
            lineHeight: 1,
          },
        },
        'ORKI'
      )
    ),
    { width: 1200, height: 630 }
  );
  const buf = Buffer.from(await img.arrayBuffer());
  const out = resolve(process.cwd(), 'public/og-default.png');
  writeFileSync(out, buf);
  console.log('Wrote', out, buf.length, 'bytes');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
