import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center', background: '#fbf8f3', color: '#2d211f', fontFamily: 'var(--font-manrope), -apple-system, sans-serif' }}>
      <div style={{ fontSize: 44 }}>🔍</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Sahifa topilmadi</h1>
      <Link href="/" style={{ color: '#7d5835', fontWeight: 600 }}>Do‘konga qaytish</Link>
    </main>
  )
}
