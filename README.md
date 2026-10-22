# Lux Home — online do'kon (lux-home.uz)

Next.js ilova. ERP frontendiga bog'lanmagan — u faqat dukonline ERP
**Storefront API**ga API kalit orqali ulanadi. Kalit serverda turadi:
brauzer `/api/storefront/*` ga murojaat qiladi, server esa ERP'ga.

## Sozlash
`.env.example` dan `.env.local` yarating va kalitni kiriting:

```bash
DUKONLINE_STOREFRONT_KEY=sk_live_...   # SuperAdmin → tashkilot → Online Store
# DUKONLINE_API_URL=https://api.dukonline.uz/api   (ixtiyoriy)
```

Kalit `src/lib/storefront/server.ts` da ham yozilgan (hostingda o'zgaruvchi
bo'lmasa shu ishlatiladi). `DUKONLINE_STOREFRONT_KEY` berilsa, u ustun turadi.

## Ishga tushirish
```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npm run typecheck
```

## Qanday ishlaydi
```
Brauzer ──► /api/storefront/products|info|top-products|customer   (o'qish)
        ──► /api/storefront/login|orders                          (yozish)
                 │
                 └─ X-Storefront-Key ──► ERP /api/storefront/...
```
Bosh sahifa serverda katalog bilan tayyorlanadi va ERP'dan har daqiqada
yangilanadi. Mijoz kirgan bo'lsa (`sf_cust`), uning narxlari brauzerda
yuklanadi. Buyurtma ERP'da **Zakazlar** sahifasiga tushadi → tasdiqlanib
sotilganda o'sha filialda **Sale** bo'ladi va qoldiq kamayadi.

## Fayllar
- `src/app/(shop)/page.tsx` — bosh sahifa (katalog, mahsulot, savat, checkout, kabinet)
- `src/features/storefront/Storefront.tsx` — sahifa holati (savat, filtrlar, oynalar)
- `src/components/` — header, kategoriyalar, mahsulot kartasi va oynasi, savat, checkout, kabinet
- `src/styles/shop/` — do'kon dizayni (fayllar tartibi muhim, `index.css` ga qarang)
- `src/app/api/storefront/[endpoint]/route.ts` — ERP'ga proksi
- `src/app/privacy/` — maxfiylik siyosati (`/privacy.html` → `/privacy`)
