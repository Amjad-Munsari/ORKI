'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

export function CategoryDropdown({ label }: { label?: string }) {
  const t = useTranslations('Nav')

  return (
    <NavigationMenu className="max-w-max">
      <NavigationMenuList className="justify-start gap-0">
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className="bg-transparent text-white/60 hover:text-white hover:bg-transparent
                       data-popup-open:text-white data-popup-open:bg-transparent
                       text-base font-normal px-0
                       [&_svg]:hidden" // Hide the arrow icon
          >
            {label || t('categories')}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul
              className="min-w-[160px] bg-[#111111] border border-white/[0.12] rounded-lg py-2"
              role="menu"
            >
              <li role="none">
                <Link
                  href="/shop/tops"
                  role="menuitem"
                  className="block px-4 py-3 text-base font-normal text-white/60
                             hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
                >
                  {t('tops')}
                </Link>
              </li>
              <li role="none">
                <Link
                  href="/shop/bottoms"
                  role="menuitem"
                  className="block px-4 py-3 text-base font-normal text-white/60
                             hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
                >
                  {t('bottoms')}
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
