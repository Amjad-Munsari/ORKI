'use client'
import { X } from 'lucide-react'
import type { Locale } from '@/types/domain'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Saudi market unisex streetwear measurements
const measurements = [
  { size: 'XS', chest: '86–91', waist: '71–76', hip: '86–91', length: '68' },
  { size: 'S',  chest: '91–97', waist: '76–81', hip: '91–97', length: '70' },
  { size: 'M',  chest: '97–102', waist: '81–86', hip: '97–102', length: '72' },
  { size: 'L',  chest: '102–107', waist: '86–91', hip: '102–107', length: '74' },
  { size: 'XL', chest: '107–112', waist: '91–97', hip: '107–112', length: '76' },
]

interface SizeGuideModalProps {
  locale: Locale
}

export function SizeGuideModal({ locale }: SizeGuideModalProps) {
  const headers = locale === 'ar'
    ? ['المقاس', 'الصدر (سم)', 'الخصر (سم)', 'الوركين (سم)', 'الطول (سم)']
    : ['Size', 'Chest (cm)', 'Waist (cm)', 'Hip (cm)', 'Length (cm)']

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="text-sm font-medium text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors duration-150 min-h-[44px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            {locale === 'ar' ? 'دليل المقاسات' : 'Size Guide'}
          </button>
        }
      />
      <DialogContent
        showCloseButton={false}
        className="max-w-[480px] bg-[#111111] border border-white/[0.12] rounded-xl p-6"
      >
        <DialogHeader className="flex flex-row items-center justify-between mb-6">
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
            {locale === 'ar' ? 'دليل المقاسات' : 'Size Guide'}
          </DialogTitle>
          <DialogClose
            render={
              <button
                type="button"
                aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
                className="flex items-center justify-center min-h-[44px] min-w-[44px]
                           text-white/60 hover:text-white transition-colors duration-150"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            }
          />
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {headers.map(h => (
                  <th key={h} className="pb-3 text-start font-semibold text-white">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {measurements.map(row => (
                <tr key={row.size} className="border-b border-white/[0.08] last:border-0">
                  <td className="py-3 text-white">{row.size}</td>
                  <td className="py-3 text-white/60">{row.chest}</td>
                  <td className="py-3 text-white/60">{row.waist}</td>
                  <td className="py-3 text-white/60">{row.hip}</td>
                  <td className="py-3 text-white/60">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
