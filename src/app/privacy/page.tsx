import type { Metadata } from 'next'

import { PrivacyEn, PrivacyRu, PrivacyUz } from './content'
import { PrivacyShell } from './PrivacyShell'

export const metadata: Metadata = {
  title: 'Privacy Policy — Lux-Home',
  description: 'Privacy Policy for the Lux-Home (lux-home.uz) app and website / Политика конфиденциальности / Maxfiylik siyosati',
}

export default function PrivacyPage() {
  return <PrivacyShell en={<PrivacyEn/>} uz={<PrivacyUz/>} ru={<PrivacyRu/>}/>
}
