'use client'

import { useState } from 'react'

import { media } from '@/lib/catalog'
import type { Category } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  cats: Category[]
  selTop: number | null
  selSub: number | null
  onSelect: (top: number, sub: number | null) => void
  catImgs: Record<number, string>
}

// ── CategoryDrawer ────────────────────────────────────────────────────
export function CategoryDrawer({ open, onClose, cats, selTop, selSub, onSelect, catImgs }: Props) {
  const [q, setQ] = useState('')
  const [exp, setExp] = useState<Record<number, boolean>>({})
  const ql = q.trim().toLowerCase()
  const childrenOf = (id: number) => cats.filter(c => c.parentId === id)
  const pick = (top: number, sub: number | null) => { onSelect(top, sub); onClose() }

  let tops = cats.filter(c => !c.parentId)
  if (ql) tops = tops.filter(t => t.name.toLowerCase().includes(ql) || childrenOf(t.id).some(s => s.name.toLowerCase().includes(ql)))

  return <>
    <div className={'drawer-overlay' + (open ? ' open' : '')} onClick={onClose}></div>
    <div className={'cat-drawer' + (open ? ' open' : '')}>
      <div className="cat-drawer-head">
        <h2>Katalog</h2>
        <div className="cat-drawer-search">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Bo'limlarni qidirish..."/>
        </div>
      </div>
      <div className="cat-drawer-list">
        {tops.map(t => {
          const subs = childrenOf(t.id)
          const parentActive = selTop === t.id && selSub == null
          if (subs.length === 0) return (
            <div key={t.id} className="drawer-cat-item">
              <button className={'drawer-cat-btn' + (parentActive ? ' dc-active' : '')} onClick={() => pick(t.id, null)}>
                {catImgs[t.id] && <img className="dc-thumb" src={media(catImgs[t.id])} alt=""/>}
                <span className="dc-label">{t.name}</span>
                <span className="dc-dot"></span>
              </button>
            </div>)
          const isOpen = exp[t.id] || (ql && subs.some(s => s.name.toLowerCase().includes(ql)))
          const vSubs = subs.filter(s => !ql || s.name.toLowerCase().includes(ql))
          return (
            <div key={t.id} className="drawer-cat-item">
              <button className={'drawer-cat-btn' + (parentActive ? ' dc-active' : '')}
                onClick={() => setExp(e => ({ ...e, [t.id]: !isOpen }))}>
                {catImgs[t.id] && <img className="dc-thumb" src={media(catImgs[t.id])} alt=""/>}
                <span className="dc-label">{t.name}</span>
                <span className={'dc-chevron' + (isOpen ? ' open' : '')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </span>
              </button>
              {isOpen && <>
                <button className={'dc-sub' + (parentActive ? ' dc-active' : '')} onClick={() => pick(t.id, null)}>
                  <span className="dc-bar"></span><span className="dc-label">Hammasi</span>
                </button>
                {vSubs.map(s => (
                  <button key={s.id} className={'dc-sub' + (selSub === s.id ? ' dc-active' : '')} onClick={() => pick(t.id, s.id)}>
                    <span className="dc-bar"></span>
                    {catImgs[s.id] && <img className="dc-thumb" src={media(catImgs[s.id])} alt=""/>}
                    <span className="dc-label">{s.name}</span>
                  </button>))}
              </>}
            </div>)
        })}
      </div>
    </div>
  </>
}
