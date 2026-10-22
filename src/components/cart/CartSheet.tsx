'use client'

import { Fragment } from 'react'

import { QuantityInput } from '@/components/product/QuantityInput'
import { IBox, IX } from '@/components/ui/icons'
import { media } from '@/lib/catalog'
import { fmtQty, groupTotal, money, som } from '@/lib/format'
import type { CartItem } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  items: CartItem[]
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  onCheckout: () => void
}

// ── CartSheet ────────────────────────────────────────────────────────────
export function CartSheet({ open, onClose, items, setQty, remove, onCheckout }: Props) {
  if (!open) return null
  const count = items.reduce((s, i) => s + i.qty, 0)
  return (
    <div className="overlay-bg fade-in">
      <div className="overlay-dim" onClick={onClose}></div>
      <div className="cart-sheet-new slide-up">
        <div className="cart-handle"></div>
        <div className="cart-head-new">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="cart-title-new">Savatcha</span>
            {count > 0 && <span className="cart-count-chip">{count} ta</span>}
          </div>
          <button className="close-btn" onClick={onClose}><IX/></button>
        </div>

        <div className="cart-items-list">
          {items.length === 0
            ? <div className="cart-empty-new">
                <div className="cart-empty-icon">🛒</div>
                <div className="cart-empty-text">Savat bo&apos;sh</div>
                <div className="cart-empty-sub">Mahsulot qo&apos;shish uchun katalogga qayting</div>
              </div>
            : items.map((it, idx) => (
              <Fragment key={it.key}>
                <div className="cart-item-new">
                  <div className="cart-thumb-new">
                    {it.image
                      ? <img src={media(it.image)} alt={it.name}/>
                      : <IBox s={28}/>}
                  </div>
                  <div className="cart-info-new">
                    <div className="cart-name-new clamp2">{it.name}{it.variant_name ? ' · ' + it.variant_name : ''}</div>
                    <div className="cart-price-new">{it.currency === 'USD' && it.cur_price != null ? money(it.cur_price * it.qty, it.currency) : som(it.price * it.qty)}</div>
                    <div className="cart-unit-new">{it.currency === 'USD' && it.cur_price != null ? money(it.cur_price, it.currency) : som(it.price)} × {fmtQty(it.qty)} {it.unit_name}</div>
                  </div>
                  {it.weight
                    ? <div className="cart-qty-ctrl">
                        <input type="number" step="0.001" min="0" className="cart-qty-input"
                          defaultValue={it.qty}
                          onChange={e => setQty(it.key, +e.target.value || 0)}/>
                        <span className="cqu">{it.unit_name}</span>
                        <button className="cqb cqb-del" onClick={() => remove(it.key)}><IX s={12}/></button>
                      </div>
                    : <div className="cart-qty-ctrl">
                        <button className={'cqb' + (it.qty === 1 ? ' cqb-del' : '')}
                          onClick={() => it.qty === 1 ? remove(it.key) : setQty(it.key, it.qty - 1)}>
                          {it.qty === 1 ? <IX s={12}/> : <>−</>}
                        </button>
                        <QuantityInput className="cqn" value={it.qty} max={it.maxQty}
                          onCommit={qty => setQty(it.key, qty)}/>
                        <button className="cqb" onClick={() => setQty(it.key, it.qty + 1)}>+</button>
                      </div>}
                </div>
                {idx < items.length - 1 && <div className="cart-divider"></div>}
              </Fragment>))
          }
        </div>

        <div className="cart-footer-new">
          <div className="cart-total-card">
            <span className="cart-total-lbl">Jami summa</span>
            <span className="cart-total-val">{groupTotal(items)}</span>
          </div>
          <button className="cart-checkout-btn" disabled={items.length === 0}
            onClick={() => { onClose(); onCheckout() }}>
            Buyurtma berish
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
