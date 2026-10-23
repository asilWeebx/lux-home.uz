/*
 * The parts of the dukonline ERP storefront API this site reads. Product
 * fields the UI doesn't use (sku, images[], attributes…) are left out on
 * purpose: the server trims the catalog to these before sending it to the
 * browser (see lib/storefront/server.ts).
 */

export type Unit = {
  unit_id: number | null
  unit_name: string
  multiplier: number
  price: number
  original_price: number | null
  currency: string
  cur_price: number | null
  cur_original_price: number | null
}

export type Variant = {
  id: number
  name: string
  price: number
  original_price: number | null
  currency: string
  cur_price: number | null
  cur_original_price: number | null
  stock: number | null
  in_stock: boolean
}

export type Product = {
  id: number
  name: string
  description: string
  category_id: number | null
  category_name: string | null
  category_parent_id: number | null
  category_parent_name: string | null
  image: string | null
  stock_type: string
  stock: number
  in_stock: boolean
  has_variants: boolean
  variants: Variant[]
  units: Unit[]
  discount_percent: number
}

export type CategoryImage = { id: number; image: string }

export type ProductsResponse = {
  results: Product[]
  show_images?: boolean
  category_images?: CategoryImage[]
}

export type Banner = string | { image?: string; url?: string; photo?: string; title?: string; align?: string }

export type StoreInfo = {
  organization?: string
  store?: string
  currency?: string
  banners?: (string | Record<string, string | undefined>)[]
}

export type TopProductsResponse = { product_ids?: number[] }

export type Category = { id: number; name: string; parentId: number | null }

export type CartItem = {
  key: string
  product_id: number
  unit_id: number | null | undefined
  variant_id: number | null
  variant_name: string
  unit_name: string
  weight?: boolean
  name: string
  price: number
  currency: string
  cur_price: number | null | undefined
  qty: number
  maxQty: number
  image: string | null
}

/** What /storefront/login/ returns, kept in localStorage as `sf_cust`. */
export type Customer = {
  customer_code: string
  name: string
  phone?: string
  customer_name?: string
  phone_number?: string
}

export type SaleItem = {
  name?: string
  product_name?: string
  qty?: number
  quantity?: number
  unit?: string
  unit_name?: string
  price?: number
}

export type Sale = {
  receipt_number?: string
  created_at?: string
  total?: number
  debt?: number
  paid?: number
  payment_method?: string
  payment_breakdown?: { method?: string; amount?: number }[]
  debt_currency?: string
  debt_currency_amount?: number | string
  debt_rate?: number
  items?: SaleItem[]
}

export type OnlineOrder = { order_no?: string; created_at?: string; total?: number; status?: string }

export type Payment = { amount?: number; created_at?: string; note?: string }

/** What /storefront/customer/?code= returns (the customer portal). */
export type CustomerData = {
  customer: {
    name?: string
    customer_name?: string
    code?: string
    phone?: string
    phone_number?: string
    debt?: number
    credit?: number
    currency_debts?: Record<string, number | string>
    currency_advances?: Record<string, number>
  }
  sales: Sale[]
  online_orders: OnlineOrder[]
  payments: Payment[]
}

export type OrderForm = {
  customer_name: string
  phone: string
  delivery_type: string
  payment_method: string
  address?: string
  landmark?: string
  latitude?: number
  longitude?: number
}

export type PlacedOrder = { order_no?: string }

/** What the server rendered the page with; info and top products may be missing. */
export type InitialData = {
  catalog: ProductsResponse
  info: StoreInfo | null
  topIds: number[] | null
}
