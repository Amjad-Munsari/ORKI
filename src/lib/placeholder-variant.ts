// Deterministic placeholder-variant selection from product slug.
// Phase 11 D-04: pure function, SSR-stable, no random, no localStorage,
// no per-product field in data/products.ts. Same slug always returns the
// same variant index. Used by ProductCard and PDPGallery to pick a
// consistent visual treatment per product.

export type PlaceholderVariantIndex = 0 | 1 | 2 | 3;
export type PlaceholderVariantName = 'ghost' | 'color' | 'texture' | 'type';

const VARIANT_NAMES: readonly PlaceholderVariantName[] = [
  'ghost',
  'color',
  'texture',
  'type',
] as const;

/**
 * FNV-1a 32-bit hash, modulo 4. Deterministic, SSR-safe, dependency-free.
 * Returns 0..3 inclusive.
 */
export function getPlaceholderVariant(slug: string): PlaceholderVariantIndex {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return (hash % 4) as PlaceholderVariantIndex;
}

/**
 * Convenience: name form of the variant, for components that prefer
 * a named prop over an index.
 */
export function getPlaceholderVariantName(slug: string): PlaceholderVariantName {
  return VARIANT_NAMES[getPlaceholderVariant(slug)];
}
