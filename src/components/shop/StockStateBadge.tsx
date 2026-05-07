import type { Locale } from '@/types/domain';

type StockState = 'in-stock' | 'partial' | 'out-of-stock';

interface StockStateBadgeProps {
  state: StockState;
  locale: Locale;
  context: 'card' | 'pdp';
}

// Server Component — no interactive state, pure rendering.
// Three states × two contexts:
//   in-stock  → renders nothing in both contexts (default, no badge needed)
//   partial   → renders nothing on card, inline text on PDP
//   out-of-stock → overlay bar on card, inline text on PDP
export function StockStateBadge({ state, locale, context }: StockStateBadgeProps) {
  // in-stock: never render anything (default state, no badge needed per UI-SPEC)
  if (state === 'in-stock') return null;

  if (context === 'card') {
    // Only fully OOS shows badge on card. Partial OOS shows nothing on card (UI-SPEC D-09).
    if (state !== 'out-of-stock') return null;
    return (
      <div
        role="status"
        className="absolute bottom-0 inset-inline-start-0 inset-inline-end-0 px-3 py-2
                   bg-black/80 text-white text-xs font-normal"
      >
        {locale === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
      </div>
    );
  }

  // context === 'pdp'
  if (state === 'partial') {
    return (
      <p role="status" className="text-sm text-white/60 mt-2">
        {locale === 'ar' ? 'بعض المقاسات نفدت' : 'Some sizes sold out'}
      </p>
    );
  }

  // state === 'out-of-stock' on PDP
  return (
    <p role="status" className="text-sm text-destructive mt-2">
      {locale === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
    </p>
  );
}
