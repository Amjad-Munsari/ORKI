// PlaceholderImage — dark-field editorial placeholder for all image slots.
// Renders intentional content (ORKI ghost mark on near-black field).
// Never a grey box. Never a spinner. Never empty.
//
// next/image with fill is included now so Phase 2 only swaps the src prop.
// No layout changes will be required when real product images arrive.
// UI-SPEC contract: "When real image arrives: swap src prop only — no layout changes required."

import Image from 'next/image';

// A transparent 1×1 pixel data URI used as the placeholder src.
// next/image requires a non-empty src. In Phase 2 this is replaced with the real product image URL.
const PLACEHOLDER_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface PlaceholderImageProps {
  /** Aspect ratio for the image slot: '3/4' for catalog cards, '4/5' for PDP hero */
  aspectRatio: '3/4' | '4/5';
  /** Alt text for accessibility — never empty */
  alt: string;
  /** Real image URL — if provided, the ghost wordmark is hidden */
  src?: string | null;
  /** Above-fold images should set priority={true} to trigger eager loading */
  priority?: boolean;
  /** Optional additional className for the outer container */
  className?: string;
}

export function PlaceholderImage({
  aspectRatio,
  alt,
  src,
  priority = false,
  className = '',
}: PlaceholderImageProps) {
  // Convert '3/4' → '3 / 4' for CSS aspect-ratio property
  const cssAspectRatio = aspectRatio.replace('/', ' / ');
  const finalSrc = src || PLACEHOLDER_SRC;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{aspectRatio: cssAspectRatio}}
    >
      {/* Dark-field background — #0A0A0A (near-black, not pure black, creates depth) */}
      <div
        className="absolute inset-0"
        style={{backgroundColor: '#0A0A0A'}}
        aria-hidden="true"
      />

      {/* Ghost ORKI wordmark — centered, intentionally muted at 15% opacity
          Only visible if no real image src is provided. */}
      {!src && (
        <div
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
          aria-hidden="true"
        >
          <span
            className="font-semibold tracking-widest text-2xl uppercase"
            style={{color: 'rgba(255, 255, 255, 0.15)'}}
          >
            ORKI
          </span>
        </div>
      )}

      {/* next/image with fill.
          priority prop is forwarded so above-fold slots get eager loading. */}
      <Image
        src={finalSrc}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-opacity duration-700 ${src ? 'opacity-100' : 'opacity-0'}`}
        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
      />
    </div>
  );
}
