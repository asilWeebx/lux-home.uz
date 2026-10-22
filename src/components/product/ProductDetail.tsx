'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { IBox, IZoomIn } from '@/components/ui/icons'
import { media, similarProducts } from '@/lib/catalog'
import { fmtQty, isWeightUnit, money } from '@/lib/format'
import type { CartItem, Product, Variant } from '@/lib/types'

import { ImgLightbox } from './ImgLightbox'
import { ProductItem, type AddToCart, type SetCartQty } from './ProductItem'

export type AddVariantToCart = (p: Product, variant: Variant, qty: number, fromEl: HTMLElement | null) => void

type Props = {
  product: Product
  onClose: () => void
  onAdd: AddToCart
  onAddVariant: AddVariantToCart
  cart: CartItem[]
  allProducts: Product[]
  setCartQty: SetCartQty
  showImages: boolean
  onSelect: (p: Product) => void
}

// ── ProductDetail ─────────────────────────────────────────────────────
export function ProductDetail({ product, onClose, onAdd, onAddVariant, cart, allProducts, setCartQty, showImages, onSelect }: Props) {
  const p = product
  const hasVariants = !!(p.has_variants && p.variants?.length)
  const similar = useMemo(() => similarProducts(p, allProducts || [], 10), [p, allProducts])

  const _firstInStock = hasVariants
    ? (p.variants.find(v => v.in_stock) || p.variants[0])
    : null
  const [variantId, setVariantId] = useState(_firstInStock?.id ?? null)

  const _firstAvail = !hasVariants && p.stock_type === 'tracked'
    ? (p.units?.find(u => Math.floor(p.stock / (u.multiplier || 1)) > 0) || p.units?.[0])
    : p.units?.[0]
  const [unitId, setUnitId] = useState(_firstAvail?.unit_id ?? null)
  const [qty,    setQty]    = useState(1)
  const [added,  setAdded]  = useState(false)
  const addRef = useRef<HTMLButtonElement>(null)
  const [zoomOpen, setZoomOpen] = useState(false)

  const selVariant = hasVariants ? (p.variants.find(v => v.id === variantId) || p.variants[0]) : null
  const unit = !hasVariants ? (p.units?.find(u => u.unit_id === unitId) || p.units?.[0]) : null

  const displayPrice    = hasVariants ? (selVariant?.price ?? 0) : (unit?.price ?? 0)
  // Valyuta: USD tovar $ da, aks holda so'm
  const dispCur = hasVariants ? (selVariant?.currency ?? '') : (unit?.currency ?? '')
  const dispVal = hasVariants ? (selVariant?.cur_price ?? displayPrice) : (unit?.cur_price ?? displayPrice)
  const dispOrigVal = hasVariants ? (selVariant?.cur_original_price ?? null) : (unit?.cur_original_price ?? null)
  const mult   = unit?.multiplier || 1
  const isWeight = !hasVariants && isWeightUnit(unit?.unit_name)  // kg tovar — kasr miqdor
  const maxQty = hasVariants
    ? (selVariant?.in_stock ? (selVariant.stock != null ? Math.floor(selVariant.stock) : Infinity) : 0)
    : (p.stock_type === 'tracked' ? (isWeight ? p.stock / mult : Math.floor(p.stock / mult)) : Infinity)
  const cartKey = hasVariants ? `${p.id}_v${variantId}` : `${p.id}_${unit?.unit_id ?? 'base'}`
  const inCart = cart.find(x => x.key === cartKey)?.qty || 0
  const out    = maxQty <= 0

  const handleAdd = () => {
    if (out || added) return
    const q = isWeight ? Math.max(0.001, +qty || 0) : Math.max(1, Math.round(+qty || 1))
    if (!q) return
    if (hasVariants) {
      onAddVariant(p, selVariant!, q, addRef.current)
    } else {
      onAdd(p, unit, addRef.current, q)   // addToCart endi qty qabul qiladi (kasr ham)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  return (
    <div className="detail-overlay">
      <div className="detail-topbar">
        <button className="detail-back" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Boshqa mahsulotlar
        </button>
        <button className="detail-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="detail-body">
        {/* Image */}
        <div className={'detail-img-side' + (p.image ? ' zoomable' : '')}
          onClick={p.image ? () => setZoomOpen(true) : undefined}>
          {p.image
            ? <img src={media(p.image)} alt={p.name}/>
            : <IBox s={100}/>}
          {p.image && <div className="img-zoom-hint"><IZoomIn s={13}/>Kattalashtirish</div>}
        </div>

        {/* Info */}
        <div className="detail-info-side">
          {p.category_name && <div className="detail-cat">{p.category_name}</div>}
          <h1 className="detail-name">{p.name}</h1>
          <div className="detail-price">
            {dispOrigVal && <span className="price-orig-strike">{money(dispOrigVal, dispCur)}</span>}
            {money(dispVal, dispCur)}
            {p.discount_percent > 0 && <span className="disc-badge">−{Math.round(p.discount_percent)}%</span>}
          </div>

          {/* Variant picker */}
          {hasVariants && <>
            <div className="detail-unit-label">Variant tanlang</div>
            <div className="detail-unit-select">
              {p.variants.map(v => (
                <button key={v.id}
                  className={'detail-unit-chip variant-chip' + (variantId === v.id ? ' active' : '') + (v.in_stock ? '' : ' unavailable')}
                  onClick={() => { if (v.in_stock) { setVariantId(v.id); setQty(1) } }}>
                  <span className="vc-name">{v.name}</span>
                  {(v.cur_original_price ?? v.original_price) != null && <span className="vc-orig">{money(v.cur_original_price ?? v.original_price, v.currency)}</span>}
                  <span className="vc-price">{money(v.cur_price ?? v.price, v.currency)}</span>
                  {v.stock != null ? <span className="vc-stock">{Math.floor(v.stock)} ta</span> : null}
                  {!v.in_stock ? <span className="vc-out">Tugadi</span> : null}
                </button>))}
            </div>
          </>}

          {/* Unit chips (non-variant) */}
          {!hasVariants && p.units?.length > 1 && <>
            <div className="detail-unit-label">Birlik tanlang</div>
            <div className="detail-unit-select">
              {p.units.map(u => (
                <button key={u.unit_id ?? 'base'}
                  className={'detail-unit-chip' + (unitId === u.unit_id ? ' active' : '')}
                  onClick={() => { setUnitId(u.unit_id); setQty(1) }}>
                  {u.unit_name}
                </button>))}
            </div>
          </>}

          {/* Stock */}
          {hasVariants && !out && selVariant?.stock != null && (
            <div className="detail-stock ok">✓ Stokda: {Math.floor(selVariant.stock)} ta</div>)}
          {hasVariants && out && (
            <div className="detail-stock out">❌ Stokda yo&apos;q</div>)}
          {!hasVariants && p.stock_type === 'tracked' && (
            <div className={'detail-stock' + (out ? ' out' : ' ok')}>
              {out ? '❌ Stokda yo\'q' : '✓ Stokda: ' + fmtQty(maxQty) + ' ' + (unit?.unit_name || 'dona')}
            </div>)}

          {/* In cart badge */}
          {inCart > 0 && (
            <div className="detail-added-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Savatda: {fmtQty(inCart)} {isWeight ? (unit?.unit_name || 'kg') : 'ta'}
            </div>)}

          {/* Qty + Add */}
          <div className="detail-controls">
            {isWeight
              ? <div className="detail-qty-wrap weight">
                  <input type="number" step="0.001" min="0" className="detail-qty-input"
                    defaultValue="1" placeholder="0.5"
                    onChange={e => setQty(+e.target.value || 0)}/>
                  <span className="detail-qty-unit">{unit?.unit_name || 'kg'}</span>
                </div>
              : <div className="detail-qty-wrap">
                  <button className="detail-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span className="detail-qty-num">{qty}</span>
                  <button className="detail-qty-btn" onClick={() => setQty(q => maxQty === Infinity ? q + 1 : Math.min(q + 1, maxQty - inCart))}>+</button>
                </div>}
            <button ref={addRef} className={'detail-add-btn' + (added ? ' btn-added' : '')} onClick={handleAdd} disabled={out}>
              {added
                ? <><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Qo&apos;shildi!</>
                : <><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C5.18 13.55 5 13.76 5 14c0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg> {out ? 'Stokda yo\'q' : 'Savatga qo\'shish'}</>}
            </button>
          </div>

          {/* Description */}
          {p.description && <p className="detail-desc">{p.description}</p>}
        </div>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div className="detail-similar">
          <div className="detail-similar-title">O&apos;xshash mahsulotlar</div>
          <div className="detail-similar-rail">
            {similar.map(sp => (
              <div className="detail-similar-item" key={sp.id}>
                <ProductItem p={sp} onAdd={onAdd} setQty={setCartQty} cart={cart} showImages={showImages} onDetail={onSelect}/>
              </div>))}
          </div>
        </div>)}

      {zoomOpen && p.image && <ImgLightbox
        src={media(p.image)} alt={p.name} onClose={() => setZoomOpen(false)}/>}
    </div>
  )
}
