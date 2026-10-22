'use client'

import { useEffect, useRef, useState } from 'react'

import { IChevronDown } from '@/components/ui/icons'
import { media } from '@/lib/catalog'
import type { Category } from '@/lib/types'

type Props = {
  cats: Category[]
  topCats: Category[]
  subCats: Category[]
  selTop: number | null
  selSub: number | null
  /** The section in view while every category is shown. */
  displayActiveCat: string | null
  catImgs: Record<number, string>
  onChip: (id: number) => void
  onPickSub: (topId: number, subId: number) => void
  setSelSub: (id: number | null) => void
}

type SubDropdown = { catId: number; top: number; left: number }

// ── Category bar (top), its sub-category dropdown and the sub-category bar ──
export function CategoryBar({ cats, topCats, subCats, selTop, selSub, displayActiveCat, catImgs, onChip, onPickSub, setSelSub }: Props) {
  const [catStuck, setCatStuck] = useState(false)
  const catSentinelRef = useRef<HTMLDivElement>(null)
  const [subDropdown, setSubDropdown] = useState<SubDropdown | null>(null)
  const chipRefs = useRef<Record<number, HTMLButtonElement>>({})

  useEffect(() => {
    if (!subDropdown) return
    const close = () => setSubDropdown(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [subDropdown])

  const toggleSubDropdown = (catId: number, chipEl: HTMLElement) => {
    setSubDropdown(sd => {
      if (sd && sd.catId === catId) return null
      const rect = chipEl.getBoundingClientRect()
      return { catId, top: rect.bottom + 8, left: rect.left }
    })
  }

  const pickSubFromDropdown = (topId: number, subId: number) => {
    setSubDropdown(null)
    onPickSub(topId, subId)
  }

  useEffect(() => {
    const el = catSentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setCatStuck(!entry.isIntersecting),
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [cats])

  return <>
    {/* ── Category bar (top) ──────────────────────────────── */}
    <div ref={catSentinelRef}></div>
    {topCats.length > 0 && (
      <nav className={'cat-bar' + (catStuck ? ' cat-bar-stuck' : '')}>
        <div className="cat-bar-inner">
          {topCats.map(c => (
            <button key={c.id} ref={el => { if (el) chipRefs.current[c.id] = el }}
              className={'cat-chip' + ((selTop === c.id || (selTop === null && displayActiveCat === String(c.id)) || (subDropdown && subDropdown.catId === c.id)) ? ' active' : '')} onClick={() => onChip(c.id)}>
              {catImgs[c.id] && <img className="cat-chip-thumb" src={media(catImgs[c.id])} alt=""/>}
              {c.name}
              {cats.some(sc => sc.parentId === c.id) && <span className={'cat-chip-arrow' + (subDropdown && subDropdown.catId === c.id ? ' open' : '')}
                onClick={e => { e.stopPropagation(); toggleSubDropdown(c.id, chipRefs.current[c.id]) }}><IChevronDown s={11}/></span>}
            </button>))}
        </div>
      </nav>)}

    {/* ── Sub-category dropdown (chip strelkasi bosilganda) ── */}
    {subDropdown && <>
      <div className="cat-subdrop-overlay" onClick={() => setSubDropdown(null)}></div>
      <div className="cat-subdrop" style={{ top: subDropdown.top + 'px', left: subDropdown.left + 'px' }}>
        {cats.filter(sc => sc.parentId === subDropdown.catId).map(sub => (
          <button key={sub.id} className="cat-subdrop-item" onClick={() => pickSubFromDropdown(subDropdown.catId, sub.id)}>
            {catImgs[sub.id] && <img className="cat-subdrop-thumb" src={media(catImgs[sub.id])} alt=""/>}
            <span>{sub.name}</span>
          </button>))}
      </div>
    </>}

    {/* ── Sub-category bar (tanlangan top'da sub bo'lsa) ───── */}
    {subCats.length > 0 && (
      <nav className="cat-bar cat-bar-sub">
        <div className="cat-bar-inner">
          <button className={'cat-chip cat-chip-sub' + (selSub === null ? ' active' : '')} onClick={() => setSelSub(null)}>
            Barchasi
          </button>
          {subCats.map(c => (
            <button key={c.id} className={'cat-chip cat-chip-sub' + (selSub === c.id ? ' active' : '')} onClick={() => setSelSub(c.id)}>
              {c.name}
            </button>))}
        </div>
      </nav>)}
  </>
}
