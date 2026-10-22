// Brauzerdan ERP'ga so'rov — /api/storefront/* orqali (kalit serverda qoladi).
export const api = async <T>(path: string, o: RequestInit = {}): Promise<T> => {
  const r = await fetch('/api/storefront' + path, { ...o, headers: { 'Content-Type': 'application/json' } })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Xatolik')
  return r.json()
}

// Koordinatani manzil matniga (OpenStreetMap Nominatim — bepul, kalitsiz).
export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=uz,ru`, { headers: { 'Accept': 'application/json' } })
    if (!r.ok) return null
    const d = await r.json()
    return d.display_name || null
  } catch { return null }
}
