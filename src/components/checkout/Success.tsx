import { ACCENT_DARK } from '@/config/store'
import type { PlacedOrder } from '@/lib/types'

// ── Success ────────────────────────────────────────────────────────────────
export function Success({ order, onClose }: { order: PlacedOrder; onClose: () => void }) {
  return (
    <div className="modal-center fade-in">
      <div className="modal-card pop-in">
        <div className="success-icon">✅</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#111', marginBottom: 8 }}>Buyurtma qabul qilindi!</div>
        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>Buyurtma raqami</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: ACCENT_DARK, marginBottom: 8 }}>{order.order_no}</div>
        <div style={{ color: '#bbb', fontSize: 13, marginBottom: 28 }}>Do&apos;kon tez orada siz bilan bog&apos;lanadi</div>
        <button className="dark-btn" onClick={onClose}>Xaridni davom ettirish</button>
      </div>
    </div>
  )
}
