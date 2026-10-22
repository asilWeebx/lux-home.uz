'use client'

import { useEffect, useState } from 'react'

import { IX } from '@/components/ui/icons'
import { api } from '@/lib/api'
import { som } from '@/lib/format'
import type { Customer, CustomerData, OrderForm } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  total: number
  totalStr: string
  onSubmit: (form: OrderForm) => void
  submitting: boolean
  customer: Customer | null
}

// ── Checkout ─────────────────────────────────────────────────────────────
export function Checkout({ open, onClose, total, totalStr, onSubmit, submitting, customer }: Props) {
  const [name,  setName]  = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [err, setErr] = useState('')

  // Checkout stays mounted while its sheet is closed, so its initial state may
  // predate a CUST login. Refresh the account data every time checkout opens.
  const [openedFor, setOpenedFor] = useState<string | null>(null)
  const fallbackName = customer?.name || customer?.customer_name || ''
  const fallbackPhone = customer?.phone || customer?.phone_number || ''
  const openKey = open ? [customer?.customer_code, customer?.name, customer?.phone].join('\u0000') : null
  if (openKey !== openedFor) {
    setOpenedFor(openKey)
    if (openKey !== null) { setName(fallbackName); setPhone(fallbackPhone); setErr('') }
  }

  useEffect(() => {
    if (!open || !customer?.customer_code) return
    let cancelled = false
    api<CustomerData>('/customer?code=' + encodeURIComponent(customer.customer_code))
      .then(data => {
        if (cancelled) return
        const profile = (data?.customer || data || {}) as CustomerData['customer']
        setName(profile.name || profile.customer_name || fallbackName)
        setPhone(profile.phone || profile.phone_number || fallbackPhone)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open, customer?.customer_code, customer?.name, customer?.phone, fallbackName, fallbackPhone])

  if (!open) return null

  // Faqat ism va telefon so'raladi; yetkazish va to'lovni operator qo'ng'iroqda
  // kelishadi. ERP bu ikki maydonni kutgani uchun standart qiymat yuboriladi.
  const go = () => {
    if (!name.trim() || !phone.trim()) { setErr('Ism va telefon raqami majburiy'); return }
    onSubmit({
      customer_name: name.trim(), phone: phone.trim(),
      delivery_type: 'pickup', payment_method: 'cash',
    })
  }

  return (
    <div className="overlay-bg fade-in">
      <div className="overlay-dim" onClick={onClose}></div>
      <div className="bottom-sheet slide-up" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="sheet-handle"></div>
        <div className="sheet-header">
          <div className="sheet-title">Buyurtmani rasmiylashtirish</div>
          <button className="close-btn" onClick={onClose}><IX/></button>
        </div>
        <div style={{ padding: '0 20px 36px', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8, flex: 1, overflowY: 'auto', minHeight: 0 }}>

          <div className="form-field">
            <label className="form-label">Ismingiz</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ism Familiya"/>
          </div>
          <div className="form-field">
            <label className="form-label">Telefon raqam</label>
            <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 000 00 00"/>
          </div>

          {err && <div className="err-box">{err}</div>}
        </div>
        <div style={{ padding: '12px 20px calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(150,150,150,.2)', flexShrink: 0, background: 'inherit' }}>
          <div className="total-row" style={{ marginBottom: 12 }}>
            <span className="total-label">Jami</span>
            <span className="total-val">{totalStr || som(total)}</span>
          </div>
          <button className="primary-btn" onClick={go} disabled={submitting}>
            {submitting ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}
