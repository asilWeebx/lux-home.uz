'use client'

import type { ReactNode, RefObject } from 'react'

export type NavId = 'home' | 'search' | 'cart' | 'catalog'

type Props = {
  active: NavId
  count: number
  cartIconRef: RefObject<HTMLDivElement | null>
  onHome: () => void
  onSearch: () => void
  onCart: () => void
  onDrawer: () => void
}

// ── BottomNav ──────────────────────────────────────────────────────────
export function BottomNav({ active, count, cartIconRef, onHome, onSearch, onCart, onDrawer }: Props) {
  const items: { id: NavId; label: string; onClick: () => void; ref?: RefObject<HTMLDivElement | null>; icon: ReactNode }[] = [
    { id: 'home',    label: 'Asosiy',  onClick: onHome,
      icon: <path d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5zM12 3L2 12h3v8h14v-8h3L12 3z"/> },
    { id: 'search',  label: 'Qidiruv', onClick: onSearch,
      icon: <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/> },
    { id: 'cart',    label: 'Savat',   onClick: onCart,   ref: cartIconRef,
      icon: <path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C5.18 13.55 5 13.76 5 14c0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/> },
    { id: 'catalog', label: 'Katalog', onClick: onDrawer,
      icon: <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/> },
  ]
  return (
    <nav className="bottom-nav" aria-label="Asosiy navigatsiya">
      {items.map(it => (
        <button key={it.id}
          aria-label={it.label}
          aria-current={active === it.id ? 'page' : undefined}
          className={'nav-btn' + (active === it.id ? ' nav-active' : '')}
          onClick={it.onClick}>
          <div className="nav-icon-wrap" ref={it.ref || null}>
            <svg viewBox="0 0 24 24" style={{ width: 21, height: 21, fill: 'currentColor' }}>
              {it.icon}
            </svg>
            {it.id === 'cart' && (
              <span className={'nav-cart-badge' + (count > 0 ? ' show' : '')}>{count > 9 ? '9+' : count}</span>)}
          </div>
          <span className="nav-label">{it.label}</span>
        </button>))}
    </nav>
  )
}
