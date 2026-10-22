'use client'

import { useState } from 'react'

import { fmtQty } from '@/lib/format'

// ── QuantityInput ───────────────────────────────────────────────────────
// Keeps the text being typed locally, then applies a valid whole-number
// quantity on blur or Enter. This lets a customer replace "1" with "10"
// without the item disappearing while the field is temporarily empty.
type Props = {
  value: number
  max?: number
  className?: string
  onCommit: (qty: number) => void
  allowDecimal?: boolean
}

export function QuantityInput({ value, max = Infinity, className, onCommit, allowDecimal = false }: Props) {
  const [draft, setDraft] = useState(String(fmtQty(value)))
  // A new quantity from outside (the +/− buttons) replaces the draft.
  const [shown, setShown] = useState(value)
  if (shown !== value) { setShown(value); setDraft(String(fmtQty(value))) }

  const commit = () => {
    const raw = draft.trim()
    if (raw === '') { setDraft(String(fmtQty(value))); return }
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) { setDraft(String(fmtQty(value))); return }
    const min = allowDecimal ? 0.001 : 1
    const normalized = allowDecimal ? Math.round(parsed * 1000) / 1000 : Math.floor(parsed)
    const next = Math.min(Math.max(min, normalized), max)
    setDraft(String(fmtQty(next)))
    if (next !== value) onCommit(next)
  }

  return <input
    className={className}
    type="number"
    inputMode={allowDecimal ? 'decimal' : 'numeric'}
    min={allowDecimal ? '0.001' : '1'}
    max={Number.isFinite(max) ? max : undefined}
    step={allowDecimal ? '0.001' : '1'}
    aria-label="Miqdor"
    value={draft}
    onChange={e => setDraft(e.target.value)}
    onClick={e => e.stopPropagation()}
    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur() }}
    onBlur={commit}/>
}
