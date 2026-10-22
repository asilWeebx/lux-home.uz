'use client'

import { useEffect, useRef, useState } from 'react'

import { media } from '@/lib/catalog'
import type { Banner } from '@/lib/types'

// ── Banner karusel (avtomatik aylanadi) ─────────────────────────────────────
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const n = banners ? banners.length : 0

  // Yangi bannerlar kelsa — birinchisidan boshlanadi.
  const [shown, setShown] = useState(banners)
  if (shown !== banners) { setShown(banners); setIdx(0) }

  const resume = () => {
    clearInterval(timerRef.current)
    if (n > 1) timerRef.current = setInterval(() => setIdx(i => (i + 1) % n), 4000)
  }
  useEffect(() => {
    clearInterval(timerRef.current)
    if (n > 1) timerRef.current = setInterval(() => setIdx(i => (i + 1) % n), 4000)
    return () => clearInterval(timerRef.current)
  }, [n])

  if (!n) return null
  const go = (d: number) => setIdx(i => (i + d + n) % n)

  return (
    <div className="banner-wrap">
      <div className="banner-viewport" onMouseEnter={() => clearInterval(timerRef.current)} onMouseLeave={resume}>
        <div className="banner-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {banners.map((b, i) => {
            const src = typeof b === 'string' ? b : (b.image || b.url || b.photo)
            const title = typeof b === 'string' ? '' : (b.title || '')
            const align = typeof b === 'string' ? 'left' : (b.align || 'left')
            return <div key={i} className={'banner-slide' + (align === 'right' ? ' banner-align-right' : '')}>
              <img src={media(src)} alt={title} loading={i === 0 ? 'eager' : 'lazy'}/>
              {title && <div className={'banner-title ' + align}>{title}</div>}
            </div>
          })}
        </div>
        {n > 1 && <>
          <button className="banner-arrow prev" onClick={() => go(-1)} aria-label="Oldingi banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="banner-arrow next" onClick={() => go(1)} aria-label="Keyingi banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div className="banner-dots">
            {banners.map((_, i) => <button key={i} className={'banner-dot' + (i === idx ? ' active' : '')} onClick={() => setIdx(i)} aria-label={'Banner ' + (i + 1)}></button>)}
          </div>
        </>}
      </div>
    </div>
  )
}
