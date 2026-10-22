import { ERP_API_URL } from '@/config/store'
import type { Category, Product } from './types'

// Mahsulot butunlay tugaganmi (variant/birlikdan qat'i nazar)
export const isOutOfStock = (p: Product) => (p.has_variants && p.variants?.length)
  ? !p.in_stock
  : (p.stock_type === 'tracked' && (p.stock ?? 0) <= 0)

// ERP media paths are relative to its host; the site's own photos live in /assets/.
export const media = (u?: string | null) => !u ? '' : (/^(https?:|data:|blob:)/.test(u) || u.startsWith('/assets/')) ? u : ERP_API_URL.replace(/\/api\/?$/, '') + u

// Bir xil narxdagi mahsulotni tez topish uchun taxminiy narx
const approxPrice = (p: Product) => p.units?.[0]?.price ?? p.variants?.[0]?.price ?? 0

// O'xshash mahsulotlar: bir xil kategoriya (avval o'z kategoriyasi, keyin ota-kategoriya),
// narxi yaqinroqlari birinchi bo'lib chiqadi. Backend chaqiruvisiz, xotiradagi ro'yxatdan.
export const similarProducts = (p: Product | null, all: Product[], limit = 10) => {
  if (!p) return []
  const sameCat: Product[] = [], sameParent: Product[] = []
  for (const x of all) {
    if (x.id === p.id) continue
    if (p.category_id && x.category_id === p.category_id) sameCat.push(x)
    else if (p.category_parent_id && x.category_parent_id === p.category_parent_id) sameParent.push(x)
  }
  const basePrice = approxPrice(p)
  const byCloseness = (list: Product[]) => [...list].sort((a, b) => Math.abs(approxPrice(a) - basePrice) - Math.abs(approxPrice(b) - basePrice))
  return [...byCloseness(sameCat), ...byCloseness(sameParent)].slice(0, limit)
}

// Qidiruvga aniq mos kelmagan taqdirda: nom/kategoriya so'zlari mos kelgan mahsulotlarni taklif qilish
export const searchSuggestions = (query: string, all: Product[], limit = 8) => {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const scored: [Product, number][] = []
  for (const p of all) {
    const hay = (p.name + ' ' + (p.category_name || '') + ' ' + (p.category_parent_name || '')).toLowerCase()
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0)
    if (score > 0) scored.push([p, score])
  }
  scored.sort((a, b) => b[1] - a[1])
  return scored.slice(0, limit).map(s => s[0])
}

// Kategoriya daraxti: leaf (o'z parent'i bilan) + parent kategoriyalar
export const buildCategories = (list: Product[]): Category[] => {
  const map = new Map<number, Category>()
  list.forEach(p => {
    if (p.category_id && p.category_name) map.set(p.category_id, { id: p.category_id, name: p.category_name, parentId: p.category_parent_id || null })
    if (p.category_parent_id && p.category_parent_name && !map.has(p.category_parent_id))
      map.set(p.category_parent_id, { id: p.category_parent_id, name: p.category_parent_name, parentId: null })
  })
  return [...map.values()]
}
