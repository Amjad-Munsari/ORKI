'use client'
import { useState } from 'react'
import { SizeSelector } from './SizeSelector'
import { AddToCartButton } from './AddToCartButton'
import { StockStateBadge } from '@/components/shop/StockStateBadge'
import { getStockState } from '@/lib/products-logic'
import type { Product, Locale } from '@/types/domain'

interface PDPInfoPanelProps {
  product: Product
  locale: Locale
}

export function PDPInfoPanel({ product, locale }: PDPInfoPanelProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const stockState = getStockState(product)
  const isFullyOOS = stockState === 'out-of-stock'

  const formattedPrice = new Intl.NumberFormat('ar-SA-u-nu-latn', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(product.price)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">
        {product.name[locale]}
      </h1>

      <p className="text-sm text-white/60">{formattedPrice}</p>

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
