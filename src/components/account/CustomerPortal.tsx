'use client'

import { useEffect, useState } from 'react'

import { IX } from '@/components/ui/icons'
import { api } from '@/lib/api'
import { fmtDate as fmt, pmLabel, som } from '@/lib/format'
import type { Customer, CustomerData } from '@/lib/types'

const TABS = [
  { k: 'profile',  l: 'Hisobim',   icon: '👤' },
  { k: 'sales',    l: 'Xaridlar',  icon: '🧾' },
  { k: 'orders',   l: 'Zakazlar',  icon: '📦' },
  { k: 'payments', l: "To'lovlar", icon: '💳' },
]
const ST: Record<string, [string, string]> = {
  new:        ['Yangi',        '#3b82f6'],
  confirmed:  ['Tasdiqlangan', '#f59e0b'],
  sold:       ['Yetkazilgan',  '#22c55e'],
  cancelled:  ['Bekor',        '#9ca3af'],
}

type Props = { open: boolean; onClose: () => void; customer: Customer | null; onLogout: () => void }

// ── CustomerPortal ────────────────────────────────────────────────────────
export function CustomerPortal({ open, onClose, customer, onLogout }: Props) {
  const [data,    setData]  = useState<CustomerData | null>(null)
  const [err,     setErr]   = useState('')
  const [tab,     setTab]   = useState('profile')
  const [openSale, setOpenSale] = useState<number | null>(null)

  // Har ochilganda hisob qaytadan yuklanadi.
  const code = open ? customer?.customer_code ?? null : null
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  if (code !== loadedFor) {
    setLoadedFor(code)
    if (code) { setErr(''); setData(null) }
  }
  const [doneFor, setDoneFor] = useState<string | null>(null)
  const loading = !!code && doneFor !== code

  useEffect(() => {
    if (!code) return
    let cancelled = false
    api<CustomerData>('/customer?code=' + encodeURIComponent(code))
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setErr((e as Error).message) })
      .finally(() => { if (!cancelled) setDoneFor(code) })
    return () => { cancelled = true; setDoneFor(null) }
  }, [code])

  if (!open) return null

  return (
    <div className="overlay-bg fade-in">
      <div className="overlay-dim" onClick={onClose}></div>
      <div className="portal-sheet slide-up">
        <div className="portal-handle"></div>

        {/* Header */}
        <div className="portal-head">
          <span className="portal-title">Mening hisobim</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="portal-logout" onClick={() => { onLogout(); onClose() }}>Chiqish</button>
            <button className="close-btn" onClick={onClose}><IX/></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="portal-tabs">
          {TABS.map(t => (
            <button key={t.k} className={'portal-tab' + (tab === t.k ? ' active' : '')} onClick={() => setTab(t.k)}>
              {t.l}
            </button>))}
        </div>

        {/* Body */}
        <div className="portal-body">
          {loading && <div className="portal-loading">Yuklanmoqda...</div>}
          {err && <div className="err-box">{err}</div>}

          {/* Profile tab */}
          {data && tab === 'profile' && <>
            <div className="portal-profile-card">
              <div className="portal-avatar">{(data.customer.name || '?')[0].toUpperCase()}</div>
              <div className="portal-profile-info">
                <div className="portal-profile-label">Mijoz</div>
                <div className="portal-profile-name">{data.customer.name}</div>
                <div className="portal-profile-meta">{data.customer.code}{data.customer.phone ? ' · ' + data.customer.phone : ''}</div>
              </div>
            </div>
            <div className="portal-stat-grid">
              <div className={'portal-stat' + (((data.customer.debt ?? 0) > 0 || Object.keys(data.customer.currency_debts || {}).length > 0) ? ' debt' : '')}>
                <div className="portal-stat-label">Qarz</div>
                <div className="portal-stat-val">{som(data.customer.debt || 0)}</div>
                {Object.entries(data.customer.currency_debts || {}).map(([c, a], k) => (
                  <div key={k} className="portal-stat-val" style={{ fontSize: 14, marginTop: 2 }}>{a} {c}</div>))}
              </div>
              <div className={'portal-stat' + ((data.customer.credit ?? 0) > 0 ? ' credit' : '')}>
                <div className="portal-stat-label">Ortiqcha to&apos;lov</div>
                <div className="portal-stat-val">{som(data.customer.credit || 0)}</div>
              </div>
            </div>
            <div style={{ border: '1.5px solid #f0f0f0', borderRadius: 14, padding: '14px 16px', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Jami xarid qilingan</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{som(data.sales.reduce((s, x) => s + (x.total || 0), 0))}</span>
            </div>
          </>}

          {/* Sales tab */}
          {data && tab === 'sales' && <>
            {!data.sales.length
              ? <div className="portal-empty">🧾 Xaridlar yo&apos;q</div>
              : data.sales.map((s, i) => {
                  try {
                    const label = s.receipt_number || ('Xarid #' + (i + 1))
                    const dateStr = fmt(s.created_at)
                    const total = +(s.total ?? 0) || 0
                    const debt = +(s.debt ?? 0) || 0
                    const paid = +(s.paid ?? 0) || 0
                    const breakdown = s.payment_breakdown || []
                    const expanded = openSale === i
                    return (
                      <div key={i} style={{ border: '1.5px solid #eee', borderRadius: 14, overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', cursor: 'pointer', background: '#fff', minHeight: 52 }} onClick={() => setOpenSale(expanded ? null : i)}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 2 }}>{label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: '#999' }}>{dateStr}</span>
                              <span style={{ fontSize: 10, color: '#475569', background: '#f1f5f9', padding: '1px 6px', borderRadius: 5, fontWeight: 600 }}>{pmLabel(s.payment_method)}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: '#111', whiteSpace: 'nowrap' }}>{som(total)}</div>
                              {debt > 0 && <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap' }}>Qarz: {s.debt_currency && s.debt_currency_amount ? (s.debt_currency_amount + ' ' + s.debt_currency) : som(debt)}</div>}
                            </div>
                            <span style={{ display: 'inline-block', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', ...(expanded ? { borderBottom: '6px solid #bbb' } : { borderTop: '6px solid #bbb' }) }}></span>
                          </div>
                        </div>
                        {expanded && (
                          <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 16px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {s.items && s.items.map((it, j) => (
                              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: '#555' }}>{it.name || it.product_name || ''}</span>
                                <span style={{ color: '#111', fontWeight: 700 }}>{+(it.qty || it.quantity || 0)} {it.unit || it.unit_name || ''} × {som(+(it.price || 0))}</span>
                              </div>))}
                            <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: 4, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: '#999' }}>To&apos;lov usuli</span><span style={{ color: '#111', fontWeight: 700 }}>{pmLabel(s.payment_method)}</span></div>
                              {breakdown.length > 1 && breakdown.map((b, k) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: '#999' }}>   · {pmLabel(b.method)}</span><span style={{ color: '#111', fontWeight: 600 }}>{som(+(b.amount || 0))}</span></div>))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: '#999' }}>To&apos;landi</span><span style={{ color: '#111', fontWeight: 700 }}>{som(paid)}</span></div>
                              {debt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: '#ef4444' }}>Nasiya (qarz)</span><span style={{ color: '#ef4444', fontWeight: 700 }}>{s.debt_currency && s.debt_currency_amount ? (s.debt_currency_amount + ' ' + s.debt_currency) : som(debt)}</span></div>}
                              {debt > 0 && s.debt_currency && s.debt_currency_amount && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#b45309' }}><span>Qarz {s.debt_currency} da yozildi</span><span>kurs: {som(s.debt_rate || 0)} · ≈ {som(debt)}</span></div>}
                            </div>
                          </div>)}
                      </div>)
                  } catch { return <div key={i} style={{ color: '#999', fontSize: 12, padding: '10px 16px' }}>Xarid #{i + 1}</div> }
                })}
          </>}

          {/* Orders tab */}
          {data && tab === 'orders' && <>
            {!data.online_orders.length
              ? <div style={{ textAlign: 'center', padding: '48px 20px', color: '#ccc', fontSize: 14, fontWeight: 600 }}>📦 Zakazlar yo&apos;q</div>
              : data.online_orders.map((o, i) => {
                  const sColor = (ST[o.status ?? ''] || ['', '#999'])[1]
                  const sLabel = (ST[o.status ?? ''] || [o.status || '?'])[0]
                  return (
                    <div key={i} style={{ border: '1.5px solid #eee', borderRadius: 14, overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: '#fff', minHeight: 52 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{o.order_no || ('Zakaz #' + (i + 1))}</div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{o.created_at ? fmt(o.created_at) : ''}</div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#111', marginTop: 6 }}>{som(+(o.total || 0))}</div>
                        </div>
                        <span style={{ color: sColor, background: sColor + '1a', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 10px', flexShrink: 0 }}>{sLabel}</span>
                      </div>
                    </div>)
                })}
          </>}

          {/* Payments tab */}
          {data && tab === 'payments' && <>
            {!data.payments.length
              ? <div style={{ textAlign: 'center', padding: '48px 20px', color: '#ccc', fontSize: 14, fontWeight: 600 }}>💳 To&apos;lovlar yo&apos;q</div>
              : data.payments.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid #eee', borderRadius: 14, padding: '13px 16px', background: '#fff', flexShrink: 0 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#22c55e' }}>+{som(+(p.amount || 0))}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{p.created_at ? fmt(p.created_at) : ''}</div>
                    {p.note ? <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{p.note}</div> : null}
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>✓</div>
                </div>))}
          </>}
        </div>
      </div>
    </div>
  )
}
