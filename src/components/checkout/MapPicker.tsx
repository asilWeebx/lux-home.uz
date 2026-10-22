'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'

import { ICrosshair, IPin, IX } from '@/components/ui/icons'
import { ACCENT } from '@/config/store'
import { reverseGeocode } from '@/lib/api'

type LatLng = { lat: number; lng: number }

type Props = {
  open: boolean
  initial: LatLng | null
  onPick: (lat: number, lng: number, address: string | null) => void
  onClose: () => void
}

// ── Xarita picker (Leaflet + OSM) ────────────────────────────────────────
export function MapPicker({ open, initial, onPick, onClose }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const ctrRef = useRef<LatLng>(initial && initial.lat != null ? initial : { lat: 41.311081, lng: 69.240562 })
  const [addr, setAddr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !boxRef.current) return
    let cancelled = false
    let map: LeafletMap | null = null
    let t: ReturnType<typeof setTimeout> | undefined
    let sizeTimer: ReturnType<typeof setTimeout> | undefined
    // Leaflet touches `window` on import, so it loads in the browser only.
    import('leaflet').then(({ default: L }) => {
      if (cancelled || !boxRef.current) return
      const c = ctrRef.current
      map = L.map(boxRef.current, { attributionControl: false }).setView([c.lat, c.lng], 16)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      mapRef.current = map
      const m = map
      const resolve = async () => {
        const p = m.getCenter()
        ctrRef.current = { lat: p.lat, lng: p.lng }
        setLoading(true)
        const a = await reverseGeocode(p.lat, p.lng)
        setAddr(a); setLoading(false)
      }
      m.on('moveend', () => { clearTimeout(t); t = setTimeout(resolve, 350) })
      sizeTimer = setTimeout(() => { m.invalidateSize(); resolve() }, 120)
    })
    return () => { cancelled = true; clearTimeout(t); clearTimeout(sizeTimer); map?.remove(); mapRef.current = null }
  }, [open])

  if (!open) return null
  const locate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      p => mapRef.current && mapRef.current.setView([p.coords.latitude, p.coords.longitude], 17),
      () => {}, { enableHighAccuracy: true, timeout: 15000 })
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000' }}>
      <div ref={boxRef} style={{ position: 'absolute', inset: 0 }}></div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-100%)', pointerEvents: 'none', zIndex: 500, color: '#e0362a' }}><IPin s={38}/></div>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, left: 16, zIndex: 600, width: 44, height: 44, borderRadius: 22, border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.3)' }}><IX s={18}/></button>
      <button onClick={locate} style={{ position: 'absolute', right: 16, bottom: 190, zIndex: 600, width: 46, height: 46, borderRadius: 23, border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.3)' }}><ICrosshair s={20}/></button>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '18px 18px 0 0', padding: '18px 20px calc(18px + env(safe-area-inset-bottom))', zIndex: 600 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: .6, marginBottom: 8 }}>TANLANGAN JOY</div>
        <div style={{ background: '#f4f4f4', borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 700, color: '#222', marginBottom: 14, lineHeight: 1.4 }}>{loading ? 'Aniqlanmoqda...' : (addr || 'Manzil aniqlanmadi (koordinata saqlanadi)')}</div>
        <button onClick={() => onPick(ctrRef.current.lat, ctrRef.current.lng, addr)} style={{ width: '100%', height: 52, border: 'none', borderRadius: 14, background: ACCENT, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Shu yerni tanlash</button>
      </div>
    </div>
  )
}
