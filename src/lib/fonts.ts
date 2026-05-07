import { Geist, IBM_Plex_Sans_Arabic } from 'next/font/google';

// Geist — EN locale primary typeface.
// Use `variable` option (not `className`) so :lang(en) CSS selector controls application.
export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

// IBM Plex Sans Arabic — AR locale primary typeface.
// Mirrors Space Grotesk's geometric character in Arabic script.
// Note: The correct next/font/google export is IBM_Plex_Sans_Arabic (not IBM_Plex_Arabic).
export const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-ibm-plex-arabic',
});
