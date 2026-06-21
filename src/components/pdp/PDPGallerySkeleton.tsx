// PDPGallerySkeleton — static loading shell for the PDP gallery slot.
// D-13: no shimmer, no gradient sweep. Just `bg-white/[0.03]` rectangles
// at the correct aspect ratios so layout doesn't jump when the real
// gallery hydrates.

export function PDPGallerySkeleton() {
  return (
    <div
      className="flex flex-col gap-4 md:grid md:grid-cols-[80px_1fr] md:gap-6"
      role="status"
      aria-label="Loading product gallery"
    >
      {/* Thumb strip (desktop only) — 3 thumb shells at 3:4. Hidden on mobile. */}
      <div className="hidden md:flex md:flex-col md:gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-full bg-white/[0.03]"
            style={{ aspectRatio: '3 / 4' }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Main hero shell — 4:5 ratio. */}
      <div
        className="w-full bg-white/[0.03]"
        style={{ aspectRatio: '4 / 5' }}
        aria-hidden="true"
      />
    </div>
  )
}
