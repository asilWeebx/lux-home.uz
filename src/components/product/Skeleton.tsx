// ── Skeleton ────────────────────────────────────────────────────────────
export function Skeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skel" style={{ aspectRatio: '1/1', borderRadius: 12 }}></div>
          <div className="skel" style={{ height: 14, width: '70%', borderRadius: 6 }}></div>
          <div className="skel" style={{ height: 12, width: '45%', borderRadius: 6 }}></div>
          <div className="skel" style={{ height: 18, width: '55%', borderRadius: 6 }}></div>
          <div className="skel" style={{ height: 36, borderRadius: 8 }}></div>
        </div>))}
    </div>
  )
}
