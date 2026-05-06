import { Space_Grotesk, IBM_Plex_Sans_Arabic } from 'next/font/google';

// Space Grotesk — EN locale primary typeface.
// Use `variable` option (not `className`) so :lang(en) CSS selector controls application.
// This prevents specificity conflicts in bilingual font switching.
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-space-grotesk',
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
