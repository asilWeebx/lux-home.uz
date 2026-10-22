'use client'

import { useEffect, useRef } from 'react'

import { ICart, ISearch } from '@/components/ui/icons'
import type { Customer } from '@/lib/types'

type Props = {
  storeName?: string
  search: string
  setSearch: (q: string) => void
  srchOpen: boolean
  setSrchOpen: (open: boolean) => void
  count: number
  customer: Customer | null
  onCart: () => void
  onPortal: () => void
  onLogin: () => void
}

// ── Header ──────────────────────────────────────────────────────────────
export function Header({ storeName, search, setSearch, srchOpen, setSrchOpen, count, customer, onCart, onPortal, onLogin }: Props) {
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (srchOpen && searchRef.current) searchRef.current.focus() }, [srchOpen])

  return (
    <header className="site-header">
      <div className="header-inner">

        {srchOpen
          ? <>
              <div className="header-search fade-in" style={{ maxWidth: 'none', flex: 1 }}>
                <ISearch s={16}/>
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Mahsulot qidirish..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#111' }}/>
              </div>
              <button className="login-btn" onClick={() => { setSrchOpen(false); setSearch('') }}>Bekor</button>
            </>

          : <>
              <img className="header-logo-image" src="/logolux.png" alt={storeName || 'Lux Home'}/>

              <div className="header-search">
                <ISearch s={16}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mahsulot qidirish..."/>
              </div>

              <div className="header-actions">
                <button className="icon-btn mobile-search-trigger" onClick={() => setSrchOpen(true)} title="Qidirish">
                  <ISearch s={18}/>
                </button>
                <button className="icon-btn" onClick={onCart} title="Savat">
                  <ICart s={18}/>
                  {count > 0 && <span className="badge">{count > 9 ? '9+' : count}</span>}
                </button>
                {customer
                  ? <button className="avatar-btn" onClick={onPortal}>
                      {customer.name.charAt(0).toUpperCase()}
                    </button>
                  : <button className="login-btn" onClick={onLogin}>
                      Kirish
                    </button>}
              </div>
            </>}
      </div>
    </header>
  )
}
