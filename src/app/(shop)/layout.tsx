import type { ReactNode } from 'react'

// The map picker's styles came first on the old page, then the shop's own.
import 'leaflet/dist/leaflet.css'
import '@/styles/shop/index.css'

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children
}
