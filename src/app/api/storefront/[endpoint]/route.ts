import type { NextRequest } from 'next/server'

import { CATALOG_REVALIDATE, erpFetch } from '@/lib/storefront/server'

/*
 * The browser's door to the ERP storefront API (the key stays on the server).
 * Only the endpoints the site uses are forwarded, with only the query
 * parameters they take. The ERP's status and JSON body are passed through
 * unchanged: the UI shows its `error` text as-is.
 */

const READS: Record<string, { path: string; query: string[] }> = {
  info: { path: '/storefront/info/', query: [] },
  products: { path: '/storefront/products/', query: ['customer_code'] },
  'top-products': { path: '/storefront/top-products/', query: ['limit'] },
  customer: { path: '/storefront/customer/', query: ['code'] },
}

const WRITES: Record<string, { path: string; timeout: number }> = {
  login: { path: '/storefront/login/', timeout: 30_000 },
  // As long as the function may run: an order is never abandoned early.
  orders: { path: '/storefront/orders/', timeout: 60_000 },
}

// Placing an order may take the ERP a while; the platform must not cut it
// short (a shopper told "failed" after the order went through orders again).
export const maxDuration = 60

const notFound = () => Response.json({ error: 'Topilmadi' }, { status: 404 })

async function forward(path: string, options: Parameters<typeof erpFetch>[1]) {
  try {
    const r = await erpFetch(path, options)
    return new Response(await r.text(), {
      status: r.status,
      headers: { 'Content-Type': r.headers.get('content-type') || 'application/json' },
    })
  } catch (e) {
    console.error('[storefront]', path, e)
    const timedOut = e instanceof DOMException && e.name === 'TimeoutError'
    return Response.json({ error: 'Server bilan bog‘lanib bo‘lmadi' }, { status: timedOut ? 504 : 502 })
  }
}

export async function GET(request: NextRequest, ctx: RouteContext<'/api/storefront/[endpoint]'>) {
  const { endpoint } = await ctx.params
  const read = READS[endpoint]
  if (!read) return notFound()

  const params = new URLSearchParams()
  for (const name of read.query) {
    const value = request.nextUrl.searchParams.get(name)
    if (value) params.set(name, value)
  }
  const query = params.toString()
  // Per-customer data (their prices, their account) is never cached.
  const personal = params.has('customer_code') || endpoint === 'customer'
  return forward(read.path + (query ? '?' + query : ''), {
    revalidate: personal ? undefined : CATALOG_REVALIDATE,
    timeout: 20_000,
  })
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/storefront/[endpoint]'>) {
  const { endpoint } = await ctx.params
  const write = WRITES[endpoint]
  if (!write) return notFound()
  return forward(write.path, { method: 'POST', body: await request.text(), timeout: write.timeout })
}
