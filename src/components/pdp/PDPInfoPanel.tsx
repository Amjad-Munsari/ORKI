'use client'
import { useState } from 'react'
import { SizeSelector } from './SizeSelector'
import { AddToCartButton } from './AddToCartButton'
import { StockStateBadge } from '@/components/shop/StockStateBadge'
import { getStockState } from '@/lib/products-logic'
import { formatPriceSAR } from '@/lib/format-price'
import type { Product, Locale } from '@/types/domain'

function lowestInStock(sizes: Product['sizes']): number {
  const stocks = sizes.filter(s => s.stock > 0).map(s => s.stock)
  return stocks.length > 0 ? Math.min(...stocks) : 0
}

interface PDPInfoPanelProps {
  product: Product
  locale: Locale
}

export function PDPInfoPanel({ product, locale }: PDPInfoPanelProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const stockState = getStockState(product)
  const isFullyOOS = stockState === 'out-of-stock'

  const formattedPrice = formatPriceSAR(product.price, locale)

  const lowest = lowestInStock(product.sizes)
  const showPassiveLowStock = lowest > 0 && lowest <= 5 && !isFullyOOS

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-tight">
          {product.name[locale]}
        </h1>
        <p
          className="text-2xl font-semibold text-white tabular-nums font-[family-name:var(--font-geist)]"
          dir="ltr"
        >
          {formattedPrice}
        </p>
        {showPassiveLowStock && (
          <p
            role="status"
            className="inline-flex items-center gap-2 self-start text-[11px] font-mono uppercase tracking-widest text-white bg-white/[0.08] px-3 py-1.5 rounded-full"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-white" />
            {locale === 'ar' ? 'كمية محدودة' : 'Limited stock'}
          </p>
        )}
      </header>

      {product.description?.[locale] && (
        <p className="text-base text-white/70 leading-relaxed max-w-prose">
          {product.description[locale]}
        </p>
      )}

      {!isFullyOOS && (
        <>
          <SizeSelector
            sizes={product.sizes}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
            locale={locale}
          />
          {selectedSize && (() => {
            const size = product.sizes.find(s => s.label === selectedSize);
            if (size && size.stock > 0 && size.stock <= 5) {
              return (
                <p className="text-xs text-white/80 font-mono uppercase tracking-widest -mt-4 animate-in fade-in slide-in-from-top-1">
                  {locale === 'ar' 
                    ? `متبقي ${size.stock} قطع فقط` 
                    : `ONLY ${size.stock} LEFT`}
                </p>
              );
            }
            return null;
          })()}
        </>
      )}

      {isFullyOOS ? (
        <button
          type="button"
          disabled
          className="w-full h-[52px] rounded-lg bg-transparent border border-white/20
                     text-white/40 cursor-not-allowed font-semibold text-base"
        >
          {locale === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
        </button>
      ) : (
        <AddToCartButton
          product={product}
          selectedSize={selectedSize}
          locale={locale}
        />
      )}

      <p className="text-sm text-white/60">
        {locale === 'ar'
          ? 'إرجاع مجاني خلال 14 يوماً بدون أي أسئلة.'
          : 'Free returns within 14 days. No questions asked.'}
      </p>

      <StockStateBadge state={stockState} locale={locale} context="pdp" />
    </div>
  )
}
