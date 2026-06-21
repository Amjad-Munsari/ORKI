import { readFileSync, existsSync } from 'fs'

const r = (f) => readFileSync(f, 'utf8')
const pdpPage = "src/app/[locale]/shop/[category]/[slug]/page.tsx"
const infoPanel = "src/components/pdp/PDPInfoPanel.tsx"
const catDD = "src/components/nav/CategoryDropdown.tsx"
const cartBadge = "src/components/nav/CartBadge.tsx"
const navbar = "src/components/nav/Navbar.tsx"

const checks = [
  ['PDP page exists',                 existsSync(pdpPage)],
  ['PDP has JSON-LD',                 r(pdpPage).includes('application/ld+json')],
  ['PDP has XSS replace',             r(pdpPage).includes('replace(/<')],
  ['PDP has notFound x2',             (r(pdpPage).match(/notFound/g)||[]).length >= 2],
  ['PDP has PDPLayout',               r(pdpPage).includes('PDPLayout')],
  ['PDP has PDPGallery',              r(pdpPage).includes('PDPGallery')],
  ['PDP has PDPInfoPanel',            r(pdpPage).includes('PDPInfoPanel')],
  ['PDPInfoPanel exists',             existsSync(infoPanel)],
  ["PDPInfoPanel 'use client'",       r(infoPanel).startsWith("'use client'")],
  ['PDPInfoPanel selectedSize x2',    (r(infoPanel).match(/selectedSize/g)||[]).length >= 2],
  ['PDPInfoPanel returnPolicy',       r(infoPanel).includes('Free returns within 14 days')],
  ['CategoryDropdown exists',         existsSync(catDD)],
  ["CategoryDropdown 'use client'",   r(catDD).startsWith("'use client'")],
  ['CategoryDropdown NavigationMenu x3', (r(catDD).match(/NavigationMenu/g)||[]).length >= 3],
  ['CategoryDropdown i18n/navigation', r(catDD).includes("from '@/i18n/navigation'")],
  ['CategoryDropdown /shop/tops',     r(catDD).includes('/shop/tops')],
  ['CategoryDropdown /shop/bottoms',  r(catDD).includes('/shop/bottoms')],
  ['CartBadge exists',                existsSync(cartBadge)],
  ["CartBadge 'use client'",          r(cartBadge).startsWith("'use client'")],
  ['CartBadge useCartStore',          r(cartBadge).includes('useCartStore')],
  ['CartBadge AnimatePresence',       r(cartBadge).includes('AnimatePresence')],
  ['CartBadge badgePop',              r(cartBadge).includes('badgePop')],
  ['CartBadge inset-inline-end',      r(cartBadge).includes('inset-inline-end')],
  ['Navbar CategoryDropdown x2',      (r(navbar).match(/CategoryDropdown/g)||[]).length >= 2],
  ['Navbar CartBadge x2',             (r(navbar).match(/CartBadge/g)||[]).length >= 2],
  ['Navbar no /shop/tops direct link', !r(navbar).includes('href="/shop/tops"')],
  ['Navbar no /shop/bottoms direct link', !r(navbar).includes('href="/shop/bottoms"')],
]

let failed = 0
for (const [name, pass] of checks) {
  console.log((pass ? '✓ PASS' : '✗ FAIL') + ' ' + name)
  if (!pass) failed++
}
console.log('\n' + (failed === 0 ? '✅ All checks passed!' : `❌ ${failed} check(s) FAILED`))
process.exit(failed > 0 ? 1 : 0)
