import { Storefront } from '@/features/storefront/Storefront'
import { loadInitialData } from '@/lib/storefront/server'

// The public catalog is re-read from the ERP at most once a minute
// (CATALOG_REVALIDATE in lib/storefront/server.ts).
export const revalidate = 60

export default async function Home() {
  return <Storefront initial={await loadInitialData()}/>
}
