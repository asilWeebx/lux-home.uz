import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import type { ReactNode } from 'react'

// The same five weights the old page loaded from Google Fonts. Fixed weights,
// not the variable font: the nav labels ask for 650, which these round to 700.
const manrope = Manrope({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Lux-Home.uz — Uy uchun tanlangan mahsulotlar',
  description: 'Lux Home — uy va oshxona uchun did bilan tanlangan mahsulotlar onlayn do‘koni.',
  icons: { icon: { url: '/logolux.png', type: 'image/png' } },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" className={manrope.variable}>
      <body>{children}</body>
    </html>
  )
}
