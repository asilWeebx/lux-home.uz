'use client'

import { useState } from 'react'

import { IX } from '@/components/ui/icons'
import { api } from '@/lib/api'
import type { Customer } from '@/lib/types'

// ── Login ──────────────────────────────────────────────────────────────────
export function Login({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: (c: Customer) => void }) {
  const [code, setCode] = useState('')
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  if (!open) return null
  const go = async () => {
    if (!code.trim()) { setErr('ID kiriting'); return }
    setBusy(true); setErr('')
    try { onLogin(await api<Customer>('/login', { method: 'POST', body: JSON.stringify({ code: code.trim() }) })) }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="modal-center fade-in">
      <div className="modal-card pop-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#111' }}>Mijoz sifatida kirish</div>
          <button className="close-btn" onClick={onClose}><IX/></button>
        </div>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 20, textAlign: 'left' }}>Do&apos;kondan olgan ID raqamingizni kiriting</p>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') go() }}
          placeholder="CUST-XXXXXX"
          style={{ width: '100%', height: 48, border: '1.5px solid #e5e5e5', borderRadius: 10, paddingLeft: 14, fontSize: 15, fontFamily: 'monospace', letterSpacing: 2, color: '#111', background: '#fafafa', marginBottom: err ? 10 : 0 }}/>
        {err && <div className="err-box" style={{ marginBottom: 10 }}>{err}</div>}
        <button className="primary-btn" style={{ marginTop: 12 }} onClick={go} disabled={busy}>
          {busy ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>
      </div>
    </div>
  )
}
