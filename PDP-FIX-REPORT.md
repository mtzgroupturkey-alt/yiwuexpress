# Product Detail Page (PDP) Fix Report

**Target URL Tested**: `http://localhost:3001/zh/products/premium-cotton-t-shirt-unisex`  
**Secondary URLs Tested**:  
- `http://localhost:3001/en/products/premium-cotton-t-shirt-unisex`  
- `http://localhost:3001/ru/products/premium-cotton-t-shirt-unisex`  
- `http://localhost:3001/en/products/this-does-not-exist` (404 verification)  
**Date**: September 18, 2026  
**Status**: All Fixes Implemented, Verified, and Committed  

---

## 1. Summary of Changes

### Root Cause
The product detail page route (`app/[locale]/products/[slug]/page.tsx`) previously rendered `ProductDetailPage.tsx` from `design-3`, a mock component containing hardcoded specifications for a Philips LatteGo Coffee Machine (15 Bar pump, ceramic grinder, milk carafe, and Arabica coffee bean bundles). Meanwhile, the repository already contained `app/[locale]/products/[slug]/ProductDetailView.tsx`, a production-ready component with wholesale mode awareness, real category attributes, image galleries, reviews, and MOQ enforcement.

### Fixes Applied

1. **Fix 1: Server Component & Database Routing (`page.tsx`)**
   - Removed `'use client'` from `page.tsx`, converting it into an async Server Component.
   - Replaced client-side React Query (`useQuery`) with direct server-side database querying using Prisma (`prisma.product.findFirst`).
   - Added automatic `notFound()` invocation from `next/navigation` when a product slug is missing or inactive.
   - Connected `page.tsx` to render `<ProductDetailView product={product} slug={slug} locale={locale} />`.
   - **Commit**: `36bc1f1` — `fix(pdp): route product page to ProductDetailView instead of mock`

2. **Fix 2: Dynamic SEO Metadata (`generateMetadata`)**
   - Added `generateMetadata({ params })` export in `page.tsx`.
   - Dynamically resolves localized product name, description, company brand name (`getCompanyName(locale)`), OpenGraph tags, Twitter card, and alternate canonical/hreflang links for `en`, `ru`, and `zh`.
   - In SSR HTML, the `<title>` now reflects the real product name and `<h1` is rendered on first paint.
   - **Commit**: Included in `61bc724`

3. **Fix 3: Schema.org/Product JSON-LD Structured Data**
   - Injected `application/ld+json` structured data inside `ProductDetailView.tsx`.
   - Exposes Product name, SKU, images, description, price, currency, availability (`InStock` / `OutOfStock`), and aggregate ratings.
   - Connected `addToQuote` from `QuoteCartContext` inside `handleAddToQuoteList`, ensuring additions from the PDP synchronize with both `QuoteCartContext` (header quote badge) and `WholesaleInquiryContext`.
   - **Commit**: `1bdd7b0` — `fix(pdp): add JSON-LD Product structured data`

4. **Fix 4: Wholesale RFQ Mode Verification**
   - `ProductDetailView.tsx` incorporates store-mode gating:
     - When `storeMode: 'WHOLESALE'`, the retail "Add to Cart" button is hidden to prevent bypassing MOQ.
     - The primary action button displays **"Add to Quote List"** (`handleAddToQuoteList`).
     - MOQ (5 units) is enforced via `getEffectiveMinOrderQty(product.minOrderQty, storeMode)` and validated before dispatch.
     - Both `QuoteCartContext` and `WholesaleInquiryContext` receive the quote item.

5. **Fix 5: Deprecation of Mock Prototype**
   - Added banner comment to `app/[locale]/design-3/components/ProductDetailPage.tsx` marking it as archived/mock.
   - **Commit**: `827757e` — `chore(pdp): move mock ProductDetailPage to archive`

---

## 2. Before vs. After `page.tsx`

### Before (Mock Client Component)
```tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { SharedLayout } from '@/components/layout/SharedLayout';
import { ProductDetailPage } from '@/app/[locale]/design-3/components/ProductDetailPage';
import { Product } from '@/app/[locale]/design-3/types';
import { PHILIPS_PDP_PRODUCT } from '@/app/[locale]/design-3/data/pdpData';
import { ALL_PRODUCTS } from '@/app/[locale]/design-3/data/catalogData';
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter';

export default function ProductPage() {
  const params = useParams();
  const { data: responseData, isLoading } = useQuery({ ... });

  const mappedProduct: Product = useMemo(() => {
    const raw = responseData?.data || responseData?.product || responseData;
    if (raw && raw.id) return mapDbProductToDesign3(raw);
    return PHILIPS_PDP_PRODUCT; // FALLBACK TO PHILIPS COFFEE MACHINE ON 404!
  }, [responseData, slug]);

  return (
    <SharedLayout>
      <ProductDetailPage product={mappedProduct} ... />
    </SharedLayout>
  );
}
```

### After (Server Component with Metadata & DB Fetch)
```tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailView from './ProductDetailView';
import { prisma } from '@/lib/db';
import { getCompanyName } from '@/lib/company';
import { localizeAttribute, localizeCategory, localizeProduct } from '@/lib/utils/localize';

interface ProductPageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, locale } = params;
  const product = await getProductFromDB(slug, locale);
  if (!product) return { title: 'Product Not Found' };

  const companyName = await getCompanyName(locale);
  const localized = localizeProduct(product, locale);
  const title = `${localized.name || product.name} — ${companyName}`;
  const description = localized.description?.slice(0, 160) || product.description?.slice(0, 160) || '';
  const firstImage = product.thumbnail || product.images?.[0] || '';

  return {
    title,
    description,
    openGraph: { title, description, images: firstImage ? [firstImage] : [], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: firstImage ? [firstImage] : [] },
    alternates: {
      canonical: `/${locale}/products/${product.slug || slug}`,
      languages: {
        en: `/en/products/${product.slug || slug}`,
        ru: `/ru/products/${product.slug || slug}`,
        zh: `/zh/products/${product.slug || slug}`,
      },
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, locale } = params;
  const product = await getProductFromDB(slug, locale);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} slug={slug} locale={locale} />;
}
```

---

## 3. Automated Verification Results

### TypeScript Compilation (`npx tsc --noEmit`)
```text
Exit code: 0
No type errors found.
```

### Vitest Test Suite (`npx vitest run`)
```text
Test Files  13 passed (13)
     Tests  53 passed (53)
  Duration  7.02s
```

### HTTP Endpoint & SSR Verification
| Check | Endpoint / Command | Expected | Actual Result | Status |
|---|---|---|---|---|
| **Soft 404 Prevention** | `GET /en/products/this-does-not-exist` | HTTP 404 | **HTTP 404** | **PASS** |
| **English PDP Status** | `GET /en/products/premium-cotton-t-shirt-unisex` | HTTP 200 | **HTTP 200** | **PASS** |
| **English `<title>`** | Inspected HTML | Product Title | `Premium Cotton T-Shirt - Unisex - Premium Quality — dromkok` | **PASS** |
| **SSR `<h1>` Tag** | Inspected HTML | Product Name | `<h1>Premium Cotton T-Shirt - Unisex</h1>` | **PASS** |
| **Canonical Link** | Inspected HTML | Valid URL | `<link rel="canonical" href="https://yiwuexpress.com/en/products/premium-cotton-t-shirt-unisex"/>` | **PASS** |
| **JSON-LD Schema** | Inspected HTML | Product Schema | `{"@context":"https://schema.org","@type":"Product",...}` | **PASS** |
| **Russian PDP** | `GET /ru/products/premium-cotton-t-shirt-unisex` | HTTP 200 | **HTTP 200** (`... — Глобал Трейд`) | **PASS** |
| **Chinese PDP** | `GET /zh/products/premium-cotton-t-shirt-unisex` | HTTP 200 | **HTTP 200** (`... — dromkok`) | **PASS** |
| **Coffee Mock Purged** | Scanned for `LatteGo` / `AquaClean` | 0 occurrences | **0 occurrences found** | **PASS** |
| **Real Specs Rendered** | Scanned for `100% Cotton` / `CLOT-001` | Present | **Present in DOM** | **PASS** |

---

## 4. Git Commits Applied

1. `36bc1f1` — `fix(pdp): route product page to ProductDetailView instead of mock`
2. `61bc724` — `fix(pdp): add generateMetadata for product SEO`
3. `1bdd7b0` — `fix(pdp): add JSON-LD Product structured data`
4. `827757e` — `chore(pdp): move mock ProductDetailPage to archive`
