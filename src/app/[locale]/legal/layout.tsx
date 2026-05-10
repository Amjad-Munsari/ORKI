import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LegalLayout({ children }: Props) {
  // Pass-through. The LegalArticle wrapper inside each /legal/{privacy,terms,cookies}/page.tsx
  // owns the visual chrome (max-w-[768px], min-h-screen, eyebrow + h1 + last-updated + body slot).
  return <>{children}</>;
}
