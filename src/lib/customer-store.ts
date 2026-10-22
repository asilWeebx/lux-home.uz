'use client'

import { useSyncExternalStore } from 'react'

import type { Customer } from './types'

/*
 * The signed-in customer, kept in localStorage under the old site's key
 * `sf_cust` so existing logins carry over. Read through useSyncExternalStore:
 * the server (and the first render in the browser) sees no customer.
 */

const KEY = 'sf_cust'
const listeners = new Set<() => void>()
let cachedRaw: string | null | undefined
let cachedValue: Customer | null = null

function read(): Customer | null {
  let raw: string | null = null
  try { raw = localStorage.getItem(KEY) } catch { /* storage blocked */ }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    try { cachedValue = JSON.parse(raw || 'null') } catch { cachedValue = null }
  }
  return cachedValue
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const useCustomer = () => useSyncExternalStore(subscribe, read, () => null)

export function saveCustomer(c: Customer) {
  localStorage.setItem(KEY, JSON.stringify(c))
  listeners.forEach(l => l())
}

export function clearCustomer() {
  localStorage.removeItem(KEY)
  listeners.forEach(l => l())
}
