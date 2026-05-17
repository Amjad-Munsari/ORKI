// PlaceholderImage — dark-field editorial placeholder for all image slots.
// Phase 11 D-01/D-02/D-04: 4 deterministic variants (ghost / color / texture / type)
// selected from product slug via getPlaceholderVariant(). Real image swap-in path
// preserved: when `src` is provided, the placeholder fades out and Image takes over.

import Image from 'next/image';
import type { PlaceholderVariantName } from '@/lib/placeholder-variant';

const PLACEHOLDER_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface PlaceholderImageProps {
  /** Aspect ratio for the image slot: '3/4' for catalog cards, '4/5' for PDP hero */
  aspectRatio: '3/4' | '4/5';
  /** Alt text for accessibility — never empty */
  alt: string;
  /** Real image URL — if provided, the placeholder treatment fades out */
  src?: string | null;
  /** Above-fold images should set priority={true} to trigger eager loading */
  priority?: boolean;
  /** Optional additional className for the outer container */
  className?: string;
  /** Variant picked per-product via getPlaceholderVariant(slug). Defaults to 'ghost'. */
  variant?: PlaceholderVariantName;
}

export function PlaceholderImage({
  aspectRatio,
  alt,
  src,
  priority = false,
  className = '',
  variant = 'ghost',
}: PlaceholderImageProps) {
  const cssAspectRatio = aspectRatio.replace('/', ' / ');
  const finalSrc = src || PLACEHOLDER_SRC;
  const hasRealImage = Boolean(src);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: cssAspectRatio }}
    >
      {/* Variant treatments are mutually exclusive. All render under the optional
          real image, which fades in on top when `src` is provided. */}
      {!hasRealImage && variant === 'ghost' && <GhostMark />}
      {!hasRealImage && variant === 'color' && <ColorBlock />}
      {!hasRealImage && variant === 'texture' && <GrainTexture />}
      {!hasRealImage && variant === 'type' && <TypographicMark />}

      <Image
        src={finalSrc}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-opacity duration-700 ${hasRealImage ? 'opacity-100' : 'opacity-0'}`}
        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
      />
    </div>
  );
}

/* ------------------ Variant renderers ------------------ */

function GhostMark() {
  return (
    <>
      <div
        className="absolute inset-0 bg-[var(--color-placeholder-bg)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
        aria-hidden="true"
      >
        <span
          className="font-semibold tracking-widest text-2xl uppercase"
          style={{ color: 'var(--color-placeholder-mark)' }}
        >
          ORKI
        </span>
      </div>
    </>
  );
}

function ColorBlock() {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      aria-hidden="true"
    >
      <div className="flex-1" style={{ backgroundColor: '#0A0A0A' }} />
      <div className="flex-1" style={{ backgroundColor: '#111111' }} />
      <div className="flex-1" style={{ backgroundColor: '#1A1A1A' }} />
    </div>
  );
}

function GrainTexture() {
  return (
    <>
      <div
        className="absolute inset-0 bg-[var(--color-placeholder-bg)]"
        aria-hidden="true"
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
        aria-hidden="true"
      >
        <filter id="orki-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="2"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#orki-grain)" />
      </svg>
    </>
  );
}

function TypographicMark() {
  return (
    <>
      <div
        className="absolute inset-0 bg-[var(--color-placeholder-bg)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="font-bold tracking-[0.15em] uppercase leading-none"
          style={{
            color: 'rgba(255, 255, 255, 0.06)',
            fontSize: '15vw',
          }}
        >
          ORKI
        </span>
      </div>
    </>
  );
}
