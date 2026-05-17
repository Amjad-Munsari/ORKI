import type { Locale } from '@/types/domain';

type StockState = 'in-stock' | 'partial' | 'low-stock' | 'out-of-stock';

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
  if (state === 'in-stock') return null;

  if (context === 'card') {
    // Only OOS or Low Stock show badges on card. Partial OOS shows nothing (D-09).
    if (state === 'partial') return null;
    
    return (
      <div
        role="status"
        className={`absolute bottom-0 inset-inline-start-0 inset-inline-end-0 px-3 py-2 text-xs font-normal
                   ${state === 'out-of-stock' ? 'bg-black/80 text-white' : 'bg-white/10 text-white/80 backdrop-blur-sm'}`}
      >
        {state === 'out-of-stock' 
          ? (locale === 'ar' ? 'نفد المخزون' : 'Out of Stock')
          : (locale === 'ar' ? 'كمية محدودة' : 'Low Stock')}
      </div>
    );
  }

  // context === 'pdp'
  if (state === 'low-stock') {
    return (
      <p role="status" className="text-sm text-white/80 mt-2 font-medium">
        {locale === 'ar' ? 'الكمية محدودة - اطلب الآن' : 'Low stock - order now'}
      </p>
    );
  }

  if (state === 'partial') {
    return (
      <p role="status" className="text-sm text-white/60 mt-2">
        {locale === 'ar' ? 'بعض المقاسات نفدت' : 'Some sizes sold out'}
      </p>
    );
  }

  // state === 'out-of-stock' on PDP
  return (
    <p role="status" className="text-sm text-white/60 mt-2">
      {locale === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
    </p>
  );
}
