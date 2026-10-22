import 'server-only'

import { ERP_API_URL } from '@/config/store'
import type { InitialData, Product, ProductsResponse, StoreInfo, TopProductsResponse, Unit, Variant } from '@/lib/types'

/*
 * Server-side access to the ERP storefront API. The storefront key stays on
 * the server: browsers talk to /api/storefront/*, which forwards here.
 */

const apiUrl = () => (process.env.DUKONLINE_API_URL || ERP_API_URL).replace(/\/+$/, '')

/*
 * The shop's storefront key. The hosting (a Vercel project we can't add
 * settings to) has no env var for it, so it lives here; it was already public
 * (the old static site sent it from the browser). DUKONLINE_STOREFRONT_KEY,
 * if set, wins — e.g. after the key is rotated in the ERP.
 */
const STOREFRONT_KEY = 'sk_live_a991ede3ce_418efa5a'

const storefrontKey = () => process.env.DUKONLINE_STOREFRONT_KEY || STOREFRONT_KEY

/*
 * api.dukonline.uz sits behind a filter that answers a bare 403 to Node's
 * default `User-Agent: node`. Naming the storefront is enough to pass.
 */
const USER_AGENT = 'dukonline-storefront/1.0 (lux-home)'

export type ErpFetchOptions = {
  method?: 'GET' | 'POST'
  body?: string
  /** Seconds the response may be reused (public catalog data); omit to never cache. */
  revalidate?: number
  /** Give up after this many ms. */
  timeout: number
}

export function erpFetch(path: string, { method = 'GET', body, revalidate, timeout }: ErpFetchOptions) {
  return fetch(apiUrl() + path, {
    method,
    body,
    headers: { 'Content-Type': 'application/json', 'X-Storefront-Key': storefrontKey(), 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(timeout),
    ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' as const }),
  })
}

/** How often the public catalog, store info and top products are re-read. */
export const CATALOG_REVALIDATE = 60

async function readJson<T>(path: string, timeout: number): Promise<T> {
  const r = await erpFetch(path, { revalidate: CATALOG_REVALIDATE, timeout })
  if (!r.ok) throw new Error(`ERP ${path} answered ${r.status}`)
  return r.json() as Promise<T>
}

const pickUnit = (u: Unit): Unit => ({
  unit_id: u.unit_id, unit_name: u.unit_name, multiplier: u.multiplier,
  price: u.price, original_price: u.original_price,
  currency: u.currency, cur_price: u.cur_price, cur_original_price: u.cur_original_price,
})

const pickVariant = (v: Variant): Variant => ({
  id: v.id, name: v.name,
  price: v.price, original_price: v.original_price,
  currency: v.currency, cur_price: v.cur_price, cur_original_price: v.cur_original_price,
  stock: v.stock, in_stock: v.in_stock,
})

// Only the fields the UI reads, so the page doesn't carry the full ERP payload.
const pickProduct = (p: Product): Product => ({
  id: p.id, name: p.name, description: p.description,
  category_id: p.category_id, category_name: p.category_name,
  category_parent_id: p.category_parent_id, category_parent_name: p.category_parent_name,
  image: p.image, stock_type: p.stock_type, stock: p.stock, in_stock: p.in_stock,
  has_variants: p.has_variants, variants: (p.variants || []).map(pickVariant), units: (p.units || []).map(pickUnit),
  discount_percent: p.discount_percent,
})

/**
 * The public catalog for the server-rendered page. Without the products the
 * page is useless, so their failure throws: `next build` fails (a deploy that
 * can't reach the ERP, or has no key, never goes live) and a failed
 * once-a-minute refresh keeps serving the last good page. Store info and top
 * products are extras; if they fail the browser loads them, as the old site did.
 */
export async function loadInitialData(): Promise<InitialData> {
  const [catalog, info, top] = await Promise.allSettled([
    readJson<ProductsResponse>('/storefront/products/', 20_000),
    readJson<StoreInfo>('/storefront/info/', 10_000),
    readJson<TopProductsResponse>('/storefront/top-products/?limit=12', 10_000),
  ])
  if (catalog.status === 'rejected') throw catalog.reason
  for (const r of [info, top]) if (r.status === 'rejected') console.error('[storefront]', r.reason)
  return {
    catalog: { results: (catalog.value.results || []).map(pickProduct), show_images: catalog.value.show_images, category_images: catalog.value.category_images || [] },
    info: info.status === 'fulfilled' ? info.value : null,
    topIds: top.status === 'fulfilled' ? (top.value.product_ids || []) : null,
  }
}
