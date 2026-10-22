import type { CartItem } from './types'

type Num = number | string | null | undefined

export const som = (n: Num) => {
  const v = Math.round(Number(n) || 0)
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so\'m'
}

// Narxni O'Z valyutasida: USD → "$50", aks holda so'm.
export const money = (n: Num, cur?: string | null) => {
  if (!cur || cur === '' || cur === 'UZS') return som(n)
  const v = Math.round((Number(n) || 0) * 100) / 100
  let i: string, d: string
  if (Number.isInteger(v)) { i = v.toString(); d = '' } else { [i, d] = v.toFixed(2).split('.') }
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (cur === 'USD' ? '$' : cur + ' ') + i + (d ? '.' + d : '')
}

// Savat jami — valyuta bo'yicha guruhlab ("$52  +  300 000 so'm")
export const groupTotal = (items: CartItem[]) => {
  const t: Record<string, number> = {}
  ;(items || []).forEach(it => { const c = it.currency || ''; t[c] = (t[c] || 0) + (it.cur_price ?? it.price) * it.qty })
  const e = Object.entries(t)
  return e.length ? e.map(([c, v]) => money(v, c)).join('  +  ') : som(0)
}

// Og'irlik/o'lchov birlikmi (kg, gramm) — kasr miqdor bilan sotiladi
export const isWeightUnit = (name?: string | null) => /kilogram|kilogramm|gramm|\bkg\b|\bg\b/i.test((name || '').trim())

// Miqdorni ko'rsatish: butun bo'lsa "2", kasr bo'lsa "0.5"
export const fmtQty = (n: Num) => Number.isInteger(Number(n)) ? String(Number(n)) : String(+Number(n).toFixed(3))

const PM_LABELS: Record<string, string> = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma", credit: 'Nasiya', mixed: 'Aralash', click: 'Click', payme: 'Payme', uzum: 'Uzum', humo: 'Humo', uzcard: 'UzCard', installment: "Bo'lib to'lash", exchange_credit: 'Ayirboshlash' }
export const pmLabel = (m?: string | null) => (m && PM_LABELS[m]) || (m || '—')

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

/** "07 Sentabr 2026", or '' for a missing/bad date. */
export const fmtDate = (iso?: string | null) => {
  try {
    const d = new Date(iso as string)
    if (isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  } catch { return '' }
}
