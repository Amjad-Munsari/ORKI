import { Link } from '@/i18n/navigation';
import { PlaceholderImage } from '@/components/PlaceholderImage';
import { StockStateBadge } from '@/components/shop/StockStateBadge';
import { getStockState } from '@/lib/products-logic';
import { getPlaceholderVariantName } from '@/lib/placeholder-variant';
import { formatPriceSAR } from '@/lib/format-price';
import type { Product, Locale } from '@/types/domain';

interface ProductCardProps {
  product: Product;
  locale: Locale;
  priority?: boolean;
}

// Server Component — no 'use client'. Pure rendering with hover effects via CSS classes.
//
// Group hover pattern (Tailwind): 'group' on the outer Link enables group-hover:*
// on all child elements simultaneously — image zoom + name underline fire together (D-09, ANIM-03).
export function ProductCard({ product, locale, priority = false }: ProductCardProps) {
  const stockState = getStockState(product);
  const variant = getPlaceholderVariantName(product.slug);

  // SAR price with Western numerals + the new SAMA Riyal glyph (formatPriceSAR).
  const formattedPrice = formatPriceSAR(product.price, locale);

  return (
    // 'group' on the outer Link enables group-hover on child elements (Tailwind group pattern).
    // Link from @/i18n/navigation — preserves locale prefix in URL (e.g., /en/shop/... or /ar/shop/...).
    <Link
      href={`/shop/${product.category}/${product.slug}`}
      className="group block"
    >
      {/* Image wrapper: overflow-hidden clips the scale transform so it doesn't bleed outside the card.
          bg-[#111111] provides the near-black surface behind PlaceholderImage. */}
      <div className="relative overflow-hidden bg-[#111111]">
        <PlaceholderImage
          aspectRatio="3/4"
          alt={product.name[locale]}
          src={product.images[0]}
          priority={priority}
          variant={variant}
          // D-09, ANIM-03: image zoom on hover.
          // cardHover preset = 0.3s duration, ease-out — expressed as Tailwind duration-300 ease-out.
          // motion-safe: prefix disables scale when prefers-reduced-motion: reduce is active.
          // group-hover:scale-[1.04] fires when hovering anywhere on the card (via group on Link).
          className="transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.04]"
        />
        {/* OOS overlay badge — absolute positioned inside the image container.
            Only renders for 'out-of-stock' in card context (partial OOS shows nothing on card). */}
        <StockStateBadge state={stockState} locale={locale} context="card" />
      </div>

      {/* Product info below image — no physical margin/padding classes */}
      <div className="pt-3 pb-4">
        {/* D-09, ANIM-03: name underline on hover fires simultaneously with image zoom.
            decoration-white and underline-offset-[3px] per UI-SPEC. */}
        <p className="text-base font-normal text-white line-clamp-2
                      group-hover:underline decoration-white underline-offset-[3px]">
          {product.name[locale]}
        </p>
        <p className="text-sm font-normal text-white/60 mt-1">{formattedPrice}</p>
      </div>
    </Link>
  );
}
