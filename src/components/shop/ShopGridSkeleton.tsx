// ShopGridSkeleton — static 8-card shell at 3:4 ratio matching ProductGrid's column system.
// D-13: no shimmer, no gradient sweep. Just `bg-white/[0.03]` rectangles.
// Used as the <Suspense fallback> wrapping ShopGridSection.

export function ShopGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="w-full bg-white/[0.03]"
          style={{ aspectRatio: '3 / 4' }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
