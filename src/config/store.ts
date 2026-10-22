import type { Banner } from '@/lib/types'

/** The ERP's storefront API. The server can point elsewhere with DUKONLINE_API_URL. */
export const ERP_API_URL = 'https://api.dukonline.uz/api'

export const ACCENT = '#a67c49'
export const ACCENT_DARK = '#7d5835'

// Hozircha do'konda banner yuklanmagan bo'lsa ko'rsatiladigan namuna rasmlar
export const DEMO_BANNERS: Banner[] = [
  { image: '/assets/lux-home-hero-kitchen.jpg', title: 'Uy — har bir detalda go‘zallik' },
  { image: '/assets/lux-home-hero-tableware.jpg', title: 'Oshxonangiz uchun did bilan tanlangan buyumlar', align: 'right' },
  { image: '/assets/lux-home-hero-bath.jpg', title: 'Kundalik hayot uchun sokin va chiroyli yechimlar' },
]
