'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { CustomerPortal } from '@/components/account/CustomerPortal'
import { Login } from '@/components/account/Login'
import { CartSheet } from '@/components/cart/CartSheet'
import { Checkout } from '@/components/checkout/Checkout'
import { Success } from '@/components/checkout/Success'
import { BannerCarousel } from '@/components/layout/BannerCarousel'
import { BottomNav, type NavId } from '@/components/layout/BottomNav'
import { CategoryBar } from '@/components/layout/CategoryBar'
import { CategoryDrawer } from '@/components/layout/CategoryDrawer'
import { Header } from '@/components/layout/Header'
import { ProductDetail } from '@/components/product/ProductDetail'
import { ProductItem } from '@/components/product/ProductItem'
import { Skeleton } from '@/components/product/Skeleton'
import { DEMO_BANNERS } from '@/config/store'
import { api } from '@/lib/api'
import { buildCategories, isOutOfStock, media, searchSuggestions } from '@/lib/catalog'
import { clearCustomer, saveCustomer, useCustomer } from '@/lib/customer-store'
import { groupTotal, isWeightUnit } from '@/lib/format'
import { magicOrb } from '@/lib/magic-orb'
import type {
  Banner, CartItem, Customer, InitialData, OrderForm, PlacedOrder, Product,
  ProductsResponse, StoreInfo, TopProductsResponse, Unit, Variant,
} from '@/lib/types'

/**
 * The whole shop on one page, as on the old site: catalog, product overlay,
 * cart, checkout and the customer's account all open over the catalog.
 * The server renders it with the public catalog; a signed-in customer's
 * catalog (their prices) is loaded in the browser.
 */
export function Storefront({ initial }: { initial: InitialData }) {
  const [info,      setInfo]     = useState<StoreInfo | null>(initial.info)
  const [catalog,   setCatalog]  = useState<ProductsResponse>(initial.catalog)
  const [topIds,    setTopIds]   = useState<number[]>(initial.topIds || [])   // eng ko'p sotilgan tovar ID'lari (tavsiya)
  const [error,     setErr]      = useState('')

  const [search,    setSearch]   = useState('')
  const [selTop,    setSelTop]   = useState<number | null>(null)
  const [selSub,    setSelSub]   = useState<number | null>(null)

  const [cart,      setCart]     = useState<CartItem[]>([])
  const [cartOpen,  setCartOpen] = useState(false)
  const [chkOpen,   setChkOpen]  = useState(false)
  const [subbing,   setSubbing]  = useState(false)
  const [done,      setDone]     = useState<PlacedOrder | null>(null)

  const customer = useCustomer()
  const [loginOpen, setLoginOpen]= useState(false)
  const [portalOpen,setPortal]   = useState(false)
  const [srchOpen,  setSrchOpen] = useState(false)
  const [drawerOpen,  setDrawer]    = useState(false)
  const [navActive,   setNavActive] = useState<NavId>('home')
  const [detailProd,  setDetail]    = useState<Product | null>(null)

  const navCartRef = useRef<HTMLDivElement>(null)

  const [activeCat, setActiveCat] = useState<string | null>(null)
  // Each chip click is a new request (n), so clicking the same chip again scrolls again.
  const [scrollReq, setScrollReq] = useState<{ id: number; n: number } | null>(null)
  const scrollDone = useRef(0)
  const sectionRefs = useRef<Record<number, HTMLElement>>({})
  const pageTitleRef = useRef<HTMLHeadingElement>(null)

  const products = useMemo(() => catalog.results || [], [catalog])
  const showImages = catalog.show_images !== false
  const catImgs = useMemo(() => Object.fromEntries((catalog.category_images || []).map(c => [c.id, c.image])) as Record<number, string>, [catalog])
  const cats = useMemo(() => buildCategories(products), [products])

  // Store info and top products the server couldn't load, the browser loads, as the old site did.
  useEffect(() => {
    if (initial.info) return
    api<StoreInfo>('/info').then(setInfo).catch(() => {})
  }, [initial.info])

  // Eng ko'p sotilgan tovarlar (tavsiya bo'limi) — faqat ID'lar, yuklangan
  // mahsulotlar bilan solishtiriladi (topProducts)
  useEffect(() => {
    if (initial.topIds) return
    api<TopProductsResponse>('/top-products?limit=12').then(r => setTopIds(r.product_ids || [])).catch(() => {})
  }, [initial.topIds])

  // The catalog belongs to a customer (their prices) or to nobody (null).
  // The page arrives with the public one; a stored login loads its own.
  const code = customer?.customer_code ?? null
  const [catalogFor, setCatalogFor] = useState<string | null>(null)
  const [failedFor, setFailedFor] = useState<string | null | undefined>(undefined)
  const loading = catalogFor !== code && failedFor !== code

  useEffect(() => {
    if (catalogFor === code || failedFor === code) return
    let cancelled = false
    api<ProductsResponse>('/products' + (code ? '?customer_code=' + encodeURIComponent(code) : ''))
      .then(r => { if (cancelled) return; setCatalog(r); setCatalogFor(code); setErr('') })
      .catch(e => { if (cancelled) return; setErr((e as Error).message); setFailedFor(code) })
    return () => { cancelled = true }
  }, [code, catalogFor, failedFor])

  // dukonline.uz "Online do'kon → Bannerlar" bo'limidan yuklangan rasmlar bo'lsa
  // o'shalar ko'rsatiladi, hali hech narsa yuklanmagan bo'lsa — namuna rasmlar.
  const banners = useMemo<Banner[]>(() => {
    const fromApi = (info?.banners || [])
      .map(b => typeof b === 'string' ? b : (b.image_url || b.image || b.url || b.photo || b.file))
      .filter((b): b is string => !!b).map(media)
    return fromApi.length ? fromApi : DEMO_BANNERS
  }, [info])

  const doLogin = (c: Customer) => { setFailedFor(undefined); saveCustomer(c); setLoginOpen(false) }
  const logout  = () => { setFailedFor(undefined); clearCustomer() }

  // Top ID'larni yuklangan mahsulot obyektlariga bog'laymiz (rank tartibi saqlanadi)
  const topProducts = useMemo(() => {
    if (!topIds.length || !products.length) return []
    const byId = new Map(products.map(p => [p.id, p]))
    return topIds.map(id => byId.get(id)).filter((p): p is Product => !!p).filter(p => !isOutOfStock(p))
  }, [topIds, products])

  const topCats = useMemo(() => cats.filter(c => !c.parentId), [cats])
  const subCats = useMemo(() => selTop == null ? [] : cats.filter(c => c.parentId === selTop), [cats, selTop])
  // "Barchasi" olib tashlanganligi sababli, hech qaysi bo'lim scroll orqali
  // aniqlanmagan bo'lsa (masalan sahifa boshida) birinchi kategoriya yoritiladi
  const displayActiveCat = activeCat || (topCats[0] ? String(topCats[0].id) : null)

  const filtered = useMemo(() => {
    let l = products
    if (selSub)      l = l.filter(p => p.category_id === selSub)
    else if (selTop) l = l.filter(p => p.category_id === selTop || p.category_parent_id === selTop)
    if (search)      l = l.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    return l
  }, [products, selTop, selSub, search])

  // Qidiruv aniq mos kelmasa — nom/kategoriya so'zlari ustma-ust tushgan mahsulotlarni taklif qilamiz
  const searchFallback = useMemo(() => {
    if (!search || filtered.length > 0) return []
    return searchSuggestions(search, products, 8)
  }, [search, filtered, products])

  // "Barchasi" ko'rinishida mahsulotlarni top-kategoriya bo'yicha bo'limlarga guruhlash
  // (scroll qilganda cat-bar'da tegishli kategoriya avtomatik yoritiladi)
  const groupedSections = useMemo(() => {
    if (selTop !== null || search || topCats.length === 0) return null
    const byCat = new Map<number, Product[]>(topCats.map(c => [c.id, []]))
    filtered.forEach(p => {
      const topId = p.category_parent_id || p.category_id
      if (topId != null && byCat.has(topId)) byCat.get(topId)!.push(p)
    })
    return topCats.map(c => ({ cat: c, items: byCat.get(c.id) || [] })).filter(g => g.items.length > 0)
  }, [filtered, topCats, selTop, search])

  useEffect(() => {
    if (!groupedSections || groupedSections.length === 0) return
    const els = groupedSections.map(g => sectionRefs.current[g.cat.id]).filter(Boolean)
    if (!els.length) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveCat((entry.target as HTMLElement).dataset.catId ?? null) })
    }, { rootMargin: '-160px 0px -70% 0px', threshold: 0 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [groupedSections])

  useEffect(() => {
    if (!scrollReq || scrollReq.n === scrollDone.current) return
    scrollDone.current = scrollReq.n
    const el = sectionRefs.current[scrollReq.id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [scrollReq])

  const goToCat = (id: number) => {
    if (selTop !== null) { setSelTop(null); setSelSub(null) }
    setActiveCat(String(id))
    setScrollReq(r => ({ id, n: (r?.n ?? 0) + 1 }))
  }

  const pickSub = (topId: number, subId: number) => {
    setSelTop(topId); setSelSub(subId)
    pageTitleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const total = cart.reduce((s, it) => s + it.price * it.qty, 0)
  const count = cart.reduce((s, it) => s + it.qty, 0)

  function _orbBounce(fromEl: HTMLElement | null) {
    if (fromEl && navCartRef.current) {
      magicOrb(fromEl, navCartRef.current)
      setTimeout(() => {
        navCartRef.current?.classList.remove('nav-bounce')
        void navCartRef.current?.offsetWidth
        navCartRef.current?.classList.add('nav-bounce')
        setTimeout(() => navCartRef.current?.classList.remove('nav-bounce'), 550)
      }, 620)
    }
    if (navigator?.vibrate) navigator.vibrate(20)
  }

  function addToCart(p: Product, unit: Unit | null | undefined, fromEl: HTMLElement | null, qty = 1) {
    const key  = p.id + '_' + (unit?.unit_id ?? 'base')
    const mult = unit?.multiplier || 1
    // Og'irlik (kg) tovarda qoldiq kasr bo'lishi mumkin — floor qilmaymiz
    const weight = isWeightUnit(unit?.unit_name)
    const max  = p.stock_type === 'tracked' ? (weight ? p.stock / mult : Math.floor(p.stock / mult)) : Infinity
    if (max <= 0) return
    setCart(c => {
      const ex = c.find(x => x.key === key)
      if (ex) { if (ex.qty >= max) return c; return c.map(x => x.key === key ? { ...x, qty: Math.min(x.qty + qty, max) } : x) }
      return [...c, { key, product_id: p.id, unit_id: unit?.unit_id, variant_id: null, variant_name: '', unit_name: unit?.unit_name || 'dona', weight, name: p.name, price: unit?.price as number, currency: unit?.currency || '', cur_price: unit?.cur_price, qty: Math.min(qty, max), maxQty: max, image: p.image }]
    })
    _orbBounce(fromEl)
  }

  function addVariantToCart(p: Product, variant: Variant, qty: number, fromEl: HTMLElement | null) {
    const key = `${p.id}_v${variant.id}`
    const max = variant.stock != null ? Math.floor(variant.stock) : Infinity
    if (max <= 0) return
    setCart(c => {
      const ex = c.find(x => x.key === key)
      if (ex) return c.map(x => x.key === key ? { ...x, qty: Math.min(x.qty + qty, max) } : x)
      return [...c, { key, product_id: p.id, unit_id: null, variant_id: variant.id, variant_name: variant.name, unit_name: 'dona', name: p.name, price: variant.price, currency: variant.currency || '', cur_price: variant.cur_price, qty, maxQty: max === Infinity ? 9999 : max, image: p.image }]
    })
    _orbBounce(fromEl)
  }

  const updQty = (key: string, q: number) => setCart(c => { const it = c.find(x => x.key === key); if (!it) return c; const cap = it.maxQty ? Math.min(q, it.maxQty) : q; return cap <= 0 ? c.filter(x => x.key !== key) : c.map(x => x.key === key ? { ...x, qty: cap } : x) })
  const remItem = (key: string) => setCart(c => c.filter(x => x.key !== key))

  async function submitOrder(form: OrderForm) {
    setSubbing(true)
    try {
      const body = {
        ...form,
        customer_code: customer?.customer_code,
        items: cart.map(it => ({
          product_id: it.product_id,
          ...(it.variant_id ? { variant_id: it.variant_id } : {}),
          ...(it.unit_id    ? { unit_id:    it.unit_id }    : {}),
          qty: it.qty,
        }))
      }
      const order = await api<PlacedOrder>('/orders', { method: 'POST', body: JSON.stringify(body) })
      setCart([]); setChkOpen(false); setDone(order)
    } catch (e) { alert((e as Error).message) } finally { setSubbing(false) }
  }

  const catName = (selSub || selTop) ? cats.find(c => c.id === (selSub || selTop))?.name : null

  const item = (p: Product) => <ProductItem key={p.id} p={p} onAdd={addToCart} setQty={updQty} cart={cart} showImages={showImages}
    onDetail={setDetail}/>

  return <div>

    {/* ── Header ──────────────────────────────────────────── */}
    <Header storeName={info?.store} search={search} setSearch={setSearch} srchOpen={srchOpen} setSrchOpen={setSrchOpen}
      count={count} customer={customer} onCart={() => setCartOpen(true)} onPortal={() => setPortal(true)} onLogin={() => setLoginOpen(true)}/>

    {/* ── Banner carousel ──────────────────────────────────── */}
    <BannerCarousel banners={banners}/>

    <CategoryBar cats={cats} topCats={topCats} subCats={subCats} selTop={selTop} selSub={selSub}
      displayActiveCat={displayActiveCat} catImgs={catImgs} onChip={goToCat} onPickSub={pickSub} setSelSub={setSelSub}/>

    {/* ── Page body ───────────────────────────────────────── */}
    <main className="page-body">
      <h1 className="page-title" ref={pageTitleRef}>
        {catName || 'Katalog'}
        {!loading && <span>{filtered.length} ta mahsulot</span>}
      </h1>

      {/* Top tovarlar (tavsiya) — faqat bosh sahifada (filtr/qidiruvsiz) */}
      {!loading && !error && !search && selTop == null && selSub == null && topProducts.length > 0 && (
        <div className="top-rail-wrap">
          <div className="top-rail-head">
            <h2>Top tovarlar</h2>
            <span className="top-rail-badge">Eng ko&apos;p sotilgan</span>
          </div>
          <div className="top-rail">
            {topProducts.map(p => (
              <div className="top-rail-item" key={p.id}>
                <div className="top-rail-rank">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  TOP
                </div>
                <ProductItem p={p} onAdd={addToCart} setQty={updQty} cart={cart} showImages={showImages} onDetail={setDetail}/>
              </div>))}
          </div>
        </div>)}

      {/* States */}
      {loading && <Skeleton/>}
      {error   && <div className="product-grid"><div className="state-center">
        <div className="state-emoji">😕</div>
        <div className="state-text">Xatolik yuz berdi: {error}</div>
      </div></div>}
      {!loading && !error && filtered.length === 0 && searchFallback.length === 0 && <div className="product-grid"><div className="state-center">
        <div className="state-emoji">🔍</div>
        <div className="state-text">Mahsulot topilmadi</div>
      </div></div>}
      {!loading && !error && filtered.length === 0 && searchFallback.length > 0 && (
        <div>
          <div className="state-center" style={{ padding: '56px 20px 8px' }}>
            <div className="state-emoji">🔍</div>
            <div className="state-text">&quot;{search}&quot; bo&apos;yicha aniq mos kelmadi</div>
          </div>
          <div className="fallback-label">Shunga o&apos;xshash mahsulotlar</div>
          <div className="product-grid">
            {searchFallback.map(item)}
          </div>
        </div>)}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && groupedSections && (
        <div className="cat-sections">
          {groupedSections.map(g => (
            <section key={g.cat.id} id={'cat-sec-' + g.cat.id} data-cat-id={g.cat.id} className="cat-section"
              ref={el => { if (el) sectionRefs.current[g.cat.id] = el }}>
              <h2 className="cat-section-title">{g.cat.name}</h2>
              <div className="product-grid">
                {g.items.map(item)}
              </div>
            </section>))}
        </div>)}
      {!loading && !error && filtered.length > 0 && !groupedSections && (
        <div className="product-grid">
          {filtered.map(item)}
        </div>)}
    </main>

    {/* ── Modals ──────────────────────────────────────────── */}
    <CartSheet
      open={cartOpen} onClose={() => setCartOpen(false)}
      items={cart} setQty={updQty} remove={remItem}
      onCheckout={() => setChkOpen(true)}/>

    <Checkout
      open={chkOpen} onClose={() => setChkOpen(false)}
      total={total} totalStr={groupTotal(cart)} onSubmit={submitOrder} submitting={subbing} customer={customer}/>

    <Login open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={doLogin}/>

    <CustomerPortal
      open={portalOpen} onClose={() => setPortal(false)}
      customer={customer} onLogout={logout}/>

    {done && <Success order={done} onClose={() => setDone(null)}/>}

    {/* ── Product Detail ───────────────────── */}
    {detailProd && <ProductDetail
      product={detailProd}
      onClose={() => setDetail(null)}
      onAdd={addToCart}
      onAddVariant={addVariantToCart}
      cart={cart}
      allProducts={products}
      setCartQty={updQty}
      showImages={showImages}
      onSelect={setDetail}/>}

    {/* ── Category Drawer ───────────────────── */}
    <CategoryDrawer
      open={drawerOpen} onClose={() => setDrawer(false)}
      cats={cats} selTop={selTop} selSub={selSub} catImgs={catImgs}
      onSelect={(top, sub) => { setSelTop(top); setSelSub(sub); setNavActive('home') }}/>

    {/* ── Bottom Nav ────────────────────────── */}
    <BottomNav
      active={navActive}
      count={count}
      cartIconRef={navCartRef}
      onHome={() => { setSelTop(null); setSelSub(null); setActiveCat(null); setSearch(''); setSrchOpen(false); setNavActive('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      onSearch={() => { setSrchOpen(s => !s); setNavActive('search') }}
      onCart={() => { setCartOpen(true); setNavActive('cart'); setTimeout(() => setNavActive('home'), 300) }}
      onDrawer={() => { setDrawer(d => !d); setNavActive('catalog') }}/>
  </div>
}
