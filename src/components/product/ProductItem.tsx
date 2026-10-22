'use client'

import { useRef, useState, type MouseEvent } from 'react'

import { IBox, ICaret, IZoomIn } from '@/components/ui/icons'
import { media } from '@/lib/catalog'
import { isWeightUnit, money } from '@/lib/format'
import type { CartItem, Product, Unit } from '@/lib/types'

import { ImgLightbox } from './ImgLightbox'
import { QuantityInput } from './QuantityInput'

export type AddToCart = (p: Product, unit: Unit | null | undefined, fromEl: HTMLElement | null, qty?: number) => void
export type SetCartQty = (key: string, qty: number) => void

type Props = {
  p: Product
  onAdd: AddToCart
  setQty: SetCartQty
  cart: CartItem[]
  showImages: boolean
  onDetail: (p: Product) => void
}

// ── ProductItem ────────────────────────────────────────────────────────
export function ProductItem({ p, onAdd, setQty, cart, showImages, onDetail }: Props) {
  const hasVariants = !!(p.has_variants && p.variants?.length)

  const _firstAvail = !hasVariants && p.stock_type === 'tracked'
    ? (p.units?.find(u => Math.floor(p.stock / (u.multiplier || 1)) > 0) || p.units?.[0])
    : p.units?.[0]
  const [unitId, setUnitId] = useState(_firstAvail?.unit_id ?? null)
  const [added, setAdded]   = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  const unit   = !hasVariants ? (p.units?.find(u => u.unit_id === unitId) || p.units?.[0]) : null
  const mult   = unit?.multiplier || 1
  const isWeight = isWeightUnit(unit?.unit_name)
  const maxQty = hasVariants
    ? (p.in_stock ? 1 : 0)
    : (p.stock_type === 'tracked' ? (isWeight ? p.stock / mult : Math.floor(p.stock / mult)) : Infinity)
  const cartKey = p.id + '_' + (unit?.unit_id ?? 'base')
  const inCart = !hasVariants ? (cart.find(x => x.key === cartKey)?.qty || 0) : 0
  const out    = hasVariants ? !p.in_stock : maxQty <= 0

  const displayPrice = hasVariants
    ? (p.variants[0]?.price ?? 0)
    : (unit?.price ?? 0)
  // Valyuta: USD tovar $ da, aks holda so'm
  const dispCur = hasVariants ? (p.variants[0]?.currency ?? '') : (unit?.currency ?? '')
  const dispVal = hasVariants ? (p.variants[0]?.cur_price ?? displayPrice) : (unit?.cur_price ?? displayPrice)
  const dispOrigVal = hasVariants ? (p.variants[0]?.cur_original_price ?? null) : (unit?.cur_original_price ?? null)

  const handleAdd = (e: MouseEvent) => {
    e.stopPropagation()
    if (out || added || hasVariants) return
    onAdd(p, unit, addBtnRef.current)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="product-item fade-up" onClick={() => onDetail(p)}>
      {/* Image */}
      <div className="product-img-wrap">
        {showImages && p.image
          ? <img src={media(p.image)} alt={p.name} loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }}/>
          : <IBox s={48}/>}
        {showImages && p.image && (
          <button className="card-zoom-btn" title="Kattalashtirib ko‘rish"
            onClick={e => { e.stopPropagation(); setZoomOpen(true) }}><IZoomIn s={15}/></button>)}
        {out && <div className="stock-out-overlay"><span className="stock-out-tag">Tugadi</span></div>}
        {inCart > 0 && <div className="in-cart-dot">{inCart}</div>}
      </div>

      {/* Name */}
      <div className="product-name clamp2">{p.name}</div>

      {/* Meta: stock info */}
      {!hasVariants && p.stock_type === 'tracked' && !out && (
        <div className="product-meta">{maxQty} {unit?.unit_name || 'dona'} mavjud</div>)}
      {out && <div className="product-meta" style={{ color: '#e53e3e' }}>Sotib bo&apos;lindi</div>}
      {hasVariants && !out && (
        <div className="product-meta">{p.variants.filter(v => v.in_stock).length} variant mavjud</div>)}

      {/* Price */}
      <div className="product-price">
        {dispOrigVal != null && <span className="price-orig-strike">{hasVariants ? 'dan ' + money(dispOrigVal, dispCur) : money(dispOrigVal, dispCur)}</span>}
        {hasVariants ? 'dan ' + money(dispVal, dispCur) : money(dispVal, dispCur)}
        {p.discount_percent > 0 && <span className="disc-badge">−{Math.round(p.discount_percent)}%</span>}
      </div>

      {/* Unit selector (non-variant only) */}
      {!hasVariants && p.units?.length > 1 && (
        <div className="unit-row" onClick={e => e.stopPropagation()}>
          <span className="unit-label">Birlik:</span>
          <div className="unit-select-wrap">
            <select className="unit-select" value={unitId ?? ''} onChange={e => setUnitId(+e.target.value)}>
              {p.units.map(u => <option key={u.unit_id ?? 'base'} value={u.unit_id ?? ''}>{u.unit_name}</option>)}
            </select>
            <span className="unit-caret"><ICaret s={11}/></span>
          </div>
        </div>)}

      {/* Controls */}
      <div className="controls-row" onClick={e => e.stopPropagation()}>
        {hasVariants
          ? <button className="add-btn" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); onDetail(p) }}
              disabled={out}>
              {out ? 'Tugadi' : 'Tanlang'}
            </button>
          : inCart > 0
            // Savatda bo'lsa — Uzumdek +/- stepper (cart qty'ni boshqaradi)
            ? <div className="qty-wrap">
                <button className="qty-btn" onClick={e => { e.stopPropagation(); setQty(cartKey, inCart - 1) }}>−</button>
                <QuantityInput className="qty-num" value={inCart} max={maxQty} allowDecimal={isWeight}
                  onCommit={qty => setQty(cartKey, qty)}/>
                <button className="qty-btn" onClick={e => { e.stopPropagation(); if (maxQty === Infinity || inCart < maxQty) onAdd(p, unit, addBtnRef.current) }}>+</button>
              </div>
            // Savatda yo'q — bitta "Savatga" tugmasi
            : <button ref={addBtnRef} className={'add-btn' + (out ? ' btn-tugadi' : added ? ' btn-added' : '')} style={{ flex: 1 }} onClick={handleAdd} disabled={out}>
                {out ? 'Tugadi' : added ? '✓' : 'Savatga'}
              </button>}
      </div>

      {zoomOpen && p.image && <ImgLightbox
        src={media(p.image)} alt={p.name} onClose={() => setZoomOpen(false)}/>}
    </div>
  )
}
