'use client'

import { useEffect, useRef, useState, type PointerEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

import { IX, IZoomIn, IZoomOut } from '@/components/ui/icons'

// ── ImgLightbox — rasmni to‘liq ekranda kattalashtirib ko‘rish ────────
const ZOOM_MIN = 1, ZOOM_MAX = 6

export function ImgLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [zoom, setZoom]         = useState(1)
  const [pos, setPos]           = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragSt   = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const pinchSt  = useRef<{ d: number; z: number; p: { x: number; y: number } } | null>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  const clampZ = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
  const reset  = () => { setZoom(1); setPos({ x: 0, y: 0 }) }
  const rel = (cx: number, cy: number) => {
    const r = stageRef.current!.getBoundingClientRect()
    return { x: cx - (r.left + r.width / 2), y: cy - (r.top + r.height / 2) }
  }
  const zoomAt = (cx: number, cy: number, factor: number) => {
    const nz = clampZ(zoom * factor)
    if (nz === zoom) return
    if (nz === ZOOM_MIN) { reset(); return }
    const c = rel(cx, cy), k = nz / zoom
    setPos({ x: c.x - (c.x - pos.x) * k, y: c.y - (c.y - pos.y) * k })
    setZoom(nz)
  }
  const step = (dir: number) => zoomAt(window.innerWidth / 2, window.innerHeight / 2, dir > 0 ? 1.45 : 1 / 1.45)

  // ESC — yopish, fon scroll’ini blokirovka qilish
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [])

  // G‘ildirak bilan zoom (kursur nuqtasi atrofida)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15) }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  // Mobil — ikki barmoq bilan chimchilash (pinch-zoom)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const start = (e: TouchEvent) => { if (e.touches.length === 2) pinchSt.current = { d: dist(e.touches), z: zoom, p: { ...pos } } }
    const move  = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchSt.current) {
        e.preventDefault()
        const s  = pinchSt.current
        const nz = clampZ(s.z * dist(e.touches) / s.d)
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
        const c  = rel(cx, cy), k = nz / s.z
        setPos({ x: c.x - (c.x - s.p.x) * k, y: c.y - (c.y - s.p.y) * k })
        setZoom(nz)
      }
    }
    const end = () => { pinchSt.current = null }
    el.addEventListener('touchstart',  start, { passive: true })
    el.addEventListener('touchmove',   move,  { passive: false })
    el.addEventListener('touchend',    end)
    el.addEventListener('touchcancel', end)
    return () => {
      el.removeEventListener('touchstart',  start)
      el.removeEventListener('touchmove',   move)
      el.removeEventListener('touchend',    end)
      el.removeEventListener('touchcancel', end)
    }
  })

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return
    e.preventDefault()
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId)
    dragSt.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y }
    setDragging(true)
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragSt.current) return
    const d = dragSt.current
    setPos({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) })
  }
  const onUp = () => { dragSt.current = null; setDragging(false) }
  const onDbl = (e: MouseEvent<HTMLDivElement>) => { if (zoom > 1) reset(); else zoomAt(e.clientX, e.clientY, 2.5 / zoom) }

  return createPortal(
    <div className="lb-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="lb-top">
        <div className="lb-title">{alt || 'Mahsulot rasmi'}</div>
        <div className="lb-actions">
          <button className="lb-btn" title="Kichraytirish" onClick={() => step(-1)} disabled={zoom <= ZOOM_MIN}><IZoomOut s={18}/></button>
          <button className="lb-zoom-label" title="Boshlang‘ich holatga qaytarish" onClick={reset}>{Math.round(zoom * 100)}%</button>
          <button className="lb-btn" title="Kattalashtirish" onClick={() => step(1)} disabled={zoom >= ZOOM_MAX}><IZoomIn s={18}/></button>
          <button className="lb-btn" title="Yopish (ESC)" onClick={onClose}><IX s={17}/></button>
        </div>
      </div>
      <div ref={stageRef}
        className={'lb-stage' + (zoom > 1 ? ' zoomed' : '') + (dragging ? ' dragging' : '')}
        onClick={e => { if (zoom === 1 && e.target === stageRef.current) onClose() }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onDoubleClick={onDbl}>
        <img className={dragging ? 'no-anim' : ''} src={src} alt={alt} draggable={false}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})` }}/>
      </div>
      <div className="lb-bottom">Ikki marta bosing yoki g‘ildirak bilan kattalashtiring · Zoom holatda sudrab ko‘ring · ESC — yopish</div>
    </div>, document.body)
}
