# PRODUCT DATA SOURCE AUDIT & FIX PLAN

**Project:** Yiwu Express Storefront  
**Date:** September 18, 2026  
**Scope:** Storefront product data sources, database inventory, mock files, and component data flows.

---

## 1. Executive Summary

- **Single Source of Truth:** The PostgreSQL database via Prisma (`prisma.product`, `prisma.productVariant`, `prisma.category`) contains **55 active products**, **174 variants**, and **41 categories**. All 55 products have valid prices, images, slugs, and categories.
- **Homepage Status (`/` and `/[locale]`):** The live homepage (`app/[locale]/page.tsx`) is already **primarily dynamic**. It fetches up to 60 products directly from the database via `/api/products?limit=60&locale=${locale}` and distributes them to `FlashDeals`, `FreshSupermarketSection`, `PopularElectronics`, `BestSellersSection`, and `WeeklyBargainsSection`.
- **Critical Contaminations Found:**
  1. **`/store` Catalog Page (`app/[locale]/store/page.tsx`):** Blends live database products with 30 phantom static products from `ALL_PRODUCTS` (`app/[locale]/design-3/data/catalogData.ts`). Customers browsing the store see products that do not exist in the database (e.g. Lavazza coffee, Monini olive oil, Ariel pods).
  2. **Product Detail Page (`app/[locale]/products/[slug]/page.tsx`):** If a slug is not found in the database, it falls back to searching `ALL_PRODUCTS` and defaults to `PHILIPS_PDP_PRODUCT`.
  3. **Related Products Carousel (`app/[locale]/design-3/components/ProductDetailPage.tsx`):** Line 900 hardcodes `{SIMILAR_COFFEE_MACHINES.map(...)}`. Every single product in the store displays 4 static coffee machines as "similar products", ignoring the existing `/api/products/[slug]/related` database endpoint.
  4. **Electronics Landing Page (`app/[locale]/electronics/page.tsx`):** 100% static fixture page importing 24 Russian products from `data/products.ts`, completely bypassing the database.
  5. **Brand Zones (`app/[locale]/design-3/components/BrandZones.tsx`):** Hardcodes 6 brand zone buttons from `catalogData.ts`.
  6. **Design Showcases (`design-2`, `design-3`, `figma-store`):** Standalone prototype routes that intentionally use static mock fixtures.

---

## 2. Discovery Findings (Phases 1.1 – 1.7)

### 1.1 Product Data Source Commands (Raw Evidence)

#### A. Array assignments `products = [`
```bash
git grep -n -E "products\s*=\s*\[" -- "app/**" "components/**"
```
**Raw output:**
```
app/api/admin/seed-orders/route.ts:113:      products = [product1, product2, product3]
```

#### B. Mock / Sample product constants
```bash
git grep -n -E "MOCK_|mockProducts|sampleProducts|dummyProducts|fakeProducts|seedProducts|staticProducts|demoProducts|GROCERY_CATALOG|CATALOG_PRODUCTS|PRODUCTS\s=" -- "app/**" "components/**"
```
**Raw output:**
```
app/[locale]/design-2/page.tsx:185:const ALL_PRODUCTS = [
app/[locale]/design-3/data/groceryCatalogData.ts:3:export const GROCERY_CATALOG_PRODUCTS: Product[] = [
app/[locale]/design-3/page.tsx:40:import { GROCERY_CATALOG_PRODUCTS } from './data/groceryCatalogData';
app/[locale]/design-3/page.tsx:163:      ...GROCERY_CATALOG_PRODUCTS,
app/[locale]/design-3/page.tsx:172:    [PHILIPS_PDP_PRODUCT, ...GROCERY_CATALOG_PRODUCTS, ...ALL_PRODUCTS].forEach((p) => {
app/[locale]/design-3/page.tsx:468:                products={GROCERY_CATALOG_PRODUCTS}
app/[locale]/figma-store/page.tsx:184:const ALL_PRODUCTS = [
components/storefront/Design3Storefront.tsx:39:import { GROCERY_CATALOG_PRODUCTS } from '@/app/[locale]/design-3/data/groceryCatalogData';
components/storefront/Design3Storefront.tsx:159:      ...GROCERY_CATALOG_PRODUCTS,
components/storefront/Design3Storefront.tsx:167:    [PHILIPS_PDP_PRODUCT, ...GROCERY_CATALOG_PRODUCTS, ...ALL_PRODUCTS].forEach((p) => {
components/storefront/Design3Storefront.tsx:456:              products={GROCERY_CATALOG_PRODUCTS}
```

#### C. Imports from mock / data files
```bash
git grep -n -E "from '\./data/|from '@/data/|from '\.\./data/|from '@/lib/mock|from '\./mock" -- "app/**" "components/**"
```
**Raw output:**
```
app/[locale]/design-3/components/BrandZones.tsx:5:import { BRAND_ZONES } from '../data/catalogData';
app/[locale]/design-3/components/CatalogModal.tsx:3:import { DEPARTMENTS } from '../data/catalogData';
app/[locale]/design-3/components/ProductDetailPage.tsx:28:import { PHILIPS_PDP_PRODUCT, SIMILAR_COFFEE_MACHINES } from '../data/pdpData';
app/[locale]/design-3/page.tsx:38:} from './data/catalogData';
app/[locale]/design-3/page.tsx:39:import { PHILIPS_PDP_PRODUCT } from './data/pdpData';
app/[locale]/design-3/page.tsx:40:import { GROCERY_CATALOG_PRODUCTS } from './data/groceryCatalogData';
app/[locale]/electronics/page.tsx:35:import { PRODUCTS_DATA, BRANDS, CUSTOMER_REVIEWS, ProductItem } from '@/data/products'
components/electronics/ElectronicsProductCard.tsx:6:import { ProductItem } from '@/data/products'
```

#### D. API Fetch calls `/api/products`
```bash
git grep -n "/api/products" -- "app/**" "components/**"
```
**Raw output:**
```
app/[locale]/page.tsx:64:      const res = await fetch(`/api/products?limit=60&locale=${locale}`);
app/[locale]/products/[slug]/ProductDetailView.tsx:136:      const response = await fetch(`/api/products/${slug}/related?limit=4&locale=${encodeURIComponent(locale)}`)
app/[locale]/products/[slug]/page.tsx:28:      const res = await fetch(`/api/products/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`);
app/[locale]/products/page.tsx:101:        const response = await fetch(`/api/products?${catParam}&locale=${locale}&limit=1`)
app/[locale]/products/page.tsx:162:      const response = await fetch(`/api/products?${params}&locale=${locale}`, { signal })
app/[locale]/quotes/page.tsx:42:      fetch(`/api/products/${productSlug}`)
app/[locale]/store/page.tsx:40:      const res = await fetch(`/api/products?limit=100&locale=${locale}`);
app/admin/products/new/page.tsx:172:      const response = await fetch('/api/products', {
components/home/AllProductsSection.tsx:48:      const response = await fetch(`/api/products?page=${currentPage}&limit=${limit}`)
components/home/BestSellers.tsx:44:    queryFn: () => api.get(`/api/products?sort=popular&limit=8&locale=${locale}`),
components/home/FeaturedProducts.tsx:18:    queryFn: () => api.get(`/api/products?featured=true&limit=8&locale=${locale}`),
components/home/FlashDealsSection.tsx:30:    queryFn: () => api.get(`/api/products?onSale=true&limit=4&locale=${locale}`),
components/home/MarketplaceTabbedShowcase.tsx:19:    activeTab === 'bestseller' ? `/api/products?featured=true&limit=8&locale=${locale}` :
components/home/NewArrivals.tsx:18:    queryFn: () => api.get(`/api/products?sort=newest&limit=8&locale=${locale}`),
components/home/SpecialOffers.tsx:14:    queryFn: () => api.get('/api/products?onSale=true&limit=8'),
```

#### E. Prisma queries `prisma.product.findMany / findUnique`
```bash
git grep -n -E "prisma\.product\.(findMany|findUnique)" -- "app/**"
```
**Raw output:**
```
app/api/admin/products/route.ts:69:      prisma.product.findMany({
app/api/b2b/quotes/route.ts:80:    const products = await prisma.product.findMany({
app/api/cart/route.ts:123:    const product = await prisma.product.findUnique({
app/api/orders/route.ts:178:      const product = await prisma.product.findUnique({
app/api/products/[slug]/related/route.ts:42:      relatedProducts = await prisma.product.findMany({
app/api/products/flash-sales/route.ts:10:    const products = await prisma.product.findMany({
app/api/products/latest/route.ts:12:    const products = await prisma.product.findMany({
app/api/products/route.ts:464:    const products = await prisma.product.findMany({
app/api/products/route.ts:683:    const productWithAttributes = await prisma.product.findUnique({
```

---

### 1.2 Homepage Data Source (`app/[locale]/page.tsx`)

In `app/[locale]/page.tsx`, products are queried dynamically:
```tsx
// app/[locale]/page.tsx lines 60-69
const { data: productsData, isLoading: isProductsLoading } = useQuery({
  queryKey: ['products', 'design3-home', locale],
  queryFn: async () => {
    const res = await fetch(`/api/products?limit=60&locale=${locale}`);
    if (!res.ok) return null;
    return res.json();
  },
  staleTime: 5 * 60 * 1000,
});
```

Component data breakdown on the homepage:

| Component | Source of Products | DB? | Static? | API? | Raw Code Evidence |
|-----------|-------------------|-----|---------|------|-------------------|
| `HeroBanner` | `/api/hero-slides` | Yes (fallback in code) | Fallback slides | API | `useQuery({ queryKey: ['hero-slides'], queryFn: ... })` (Line 190) |
| `CategoryGrid` | `dbCategories` | Yes | No | `/api/categories` | `<CategoryGrid categories={activeCategories} ... />` (Line 716) |
| `FlashDeals` | `activeFlashDeals` | Yes | No | Filtered `dbProducts` | `deals={selectedCategory ? activeFlashDeals.filter(...) : activeFlashDeals}` (Line 728) |
| `TrustFeatures` | Informational cards | N/A | Static UI icons | No | Static trust text/icons |
| `FreshSupermarketSection` | `activeKitchenProducts` | Yes | No | Filtered `dbProducts` | `products={activeKitchenProducts}` (Line 756) |
| `PopularElectronics` | `activeElectronicsProducts` | Yes | No | Filtered `dbProducts` | `products={activeElectronicsProducts}` (Line 774) |
| `BestSellersSection` | `activeBestSellers` | Yes | No | Sliced `dbProducts` (12) | `products={activeBestSellers}` (Line 790) |
| `BrandZones` | `BRAND_ZONES` | No | Yes | None | `import { BRAND_ZONES } from '../data/catalogData'` (BrandZones.tsx Line 5) |
| `WeeklyBargainsSection` | `allCatalogProducts` | Yes | No | Mapped `dbProducts` | `products={allCatalogProducts}` (Line 816) |
| Search Filter View | `searchResults` | Yes | No | Filtered `dbProducts` | `allProducts.filter(p => p.name.includes(...))` (Line 460) |

---

### 1.3 Product API Endpoints

All endpoints under `app/api/products/` query Prisma directly:

1. **`GET /api/products`** (`app/api/products/route.ts`):
   - **Backend:** Prisma `prisma.product.findMany` with pagination, category resolution, attributes, search, and sorting.
   - **Response Shape:**
     ```json
     {
       "success": true,
       "data": [ { "id": "...", "name": "...", "price": 24.99, "stock": 50, ... } ],
       "pagination": { "page": 1, "limit": 20, "total": 55, "totalPages": 3 }
     }
     ```
2. **`GET /api/products/[slug]`** (`app/api/products/[slug]/route.ts`):
   - **Backend:** Prisma `prisma.product.findUnique` with images, category, variants, and translations.
   - **Response Shape:**
     ```json
     { "success": true, "data": { "id": "...", "name": "...", "slug": "...", "variants": [...] } }
     ```
3. **`GET /api/products/[slug]/related`** (`app/api/products/[slug]/related/route.ts`):
   - **Backend:** Prisma `prisma.product.findMany` filtering by category ID and excluding the current product ID.
4. **`GET /api/products/flash-sales`** (`app/api/products/flash-sales/route.ts`):
   - **Backend:** Prisma `prisma.product.findMany` where `isFlashSale: true`.
5. **`GET /api/products/latest`** (`app/api/products/latest/route.ts`):
   - **Backend:** Prisma `prisma.product.findMany` ordered by `createdAt: desc`.

---

### 1.4 Mock Data Files List

Found files defining static catalog/mock products:
1. `app/[locale]/design-3/data/catalogData.ts` (30 products across `FLASH_DEALS`, `POPULAR_ELECTRONICS`, `CATALOG_ADDITIONAL_PRODUCTS`, `ALL_PRODUCTS`)
2. `app/[locale]/design-3/data/groceryCatalogData.ts` (15 grocery products)
3. `app/[locale]/design-3/data/pdpData.ts` (`PHILIPS_PDP_PRODUCT` + 4 `SIMILAR_COFFEE_MACHINES`)
4. `data/products.ts` (24 electronics products in Russian, used by `/electronics`)
5. `data/general-products.ts` (24 general marketplace products in Russian, orphaned)
6. `lib/seed-data/sample-products.ts` (Used by seed scripts)

---

### 1.5 Prisma Schema Models & Relations

#### Product Model (`prisma/schema.prisma:406`):
- **Core Fields:** `id`, `sku`, `name`, `slug`, `description`, `price`, `compareAtPrice`, `costPrice`, `wholesalePrice`, `minOrderQty`, `stock`, `lowStockThreshold`, `weightKg`, `dimensions`, `images`, `thumbnail`, `isActive`, `isFeatured`, `isNewArrival`, `isFlashSale`.
- **Relations:**
  - `category`: `@relation(fields: [categoryId], references: [id])`
  - `variants`: `ProductVariant[]`
  - `warehouseStocks`: `WarehouseStock[]` (relates to warehouses for stock counts and inventory reservations)
  - `productQuoteItems`: `ProductQuoteItem[]` (relates to RFQ B2B quote system)

#### ProductVariant Model (`prisma/schema.prisma:723`):
- `id`, `productId`, `sku`, `attributes` (Json), `price`, `comparePrice`, `costPrice`, `stock`, `images`, `isActive`.

#### Category Model (`prisma/schema.prisma:362`):
- `id`, `name`, `slug`, `description`, `image`, `icon`, `parentId`, `level`, `displayOrder`, `menuOrder`, `isActive`, `showInMenu`, `isFeatured`. Self-referential hierarchy via `parent` and `children`.

---

### 1.6 Database Product Counts (Raw Evidence)

Command:
```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();Promise.all([p.product.count(),p.productVariant.count(),p.category.count()]).then(([prod,var_,cat])=>{console.log('Products:',prod);console.log('Variants:',var_);console.log('Categories:',cat);process.exit(0)})"
```
**Raw output:**
```
Products: 55
Variants: 174
Categories: 41
```

---

### 1.7 Database Product Sample (Raw Evidence)

Command:
```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.product.findMany({take:5,select:{id:true,name:true,slug:true,price:true,isActive:true,categoryId:true}}).then(products=>{console.log(JSON.stringify(products,null,2));process.exit(0)})"
```
**Raw output:**
```json
[
  {
    "id": "cmu12sl880008w4awsohkbbt9",
    "name": "Premium Cotton T-Shirt - Unisex",
    "slug": "premium-cotton-t-shirt-unisex",
    "price": 24.99,
    "isActive": true,
    "categoryId": "cmu12s7210000w4kkv8rexpa9"
  },
  {
    "id": "cmu12sl8k000mw4awqwfm876h",
    "name": "Classic Denim Jeans - Straight Cut",
    "slug": "classic-denim-jeans-straight-cut",
    "price": 59.99,
    "isActive": true,
    "categoryId": "cmu12s7210000w4kkv8rexpa9"
  },
  {
    "id": "cmu12sl8p0010w4awb72ruf5a",
    "name": "Elegant Summer Dress",
    "slug": "elegant-summer-dress",
    "price": 49.99,
    "isActive": true,
    "categoryId": "cmu12s7210000w4kkv8rexpa9"
  },
  {
    "id": "cmu12sl8v001ew4awtc4b09tt",
    "name": "Comfortable Running Shoes",
    "slug": "comfortable-running-shoes",
    "price": 79.99,
    "isActive": true,
    "categoryId": "cmu12s7210000w4kkv8rexpa9"
  },
  {
    "id": "cmu12sl90001sw4aw9azuf7qb",
    "name": "Wireless Bluetooth Headphones - Noise Cancelling",
    "slug": "wireless-bluetooth-headphones-noise-cancelling",
    "price": 129.99,
    "isActive": true,
    "categoryId": "cmu12s7250001w4kkk0bxn248"
  }
]
```

---

## 3. Phase 2 Analysis & Answers (Q1 – Q6)

### Q1 — Are all products from the DB?
**Partially.**
- **Homepage (`/`)**: Yes, all product cards and sections receive `dbProducts`.
- **Products Catalog (`/products`)**: Yes, 100% DB via `/api/products`.
- **Store Catalog (`/store`)**: **No**. Appends 30 static phantom products from `ALL_PRODUCTS`.
- **Product Detail Page (`/products/[slug]`)**: **Partially**. Product details come from DB, but related products section is hardcoded to 4 static coffee machines. Missing slugs fall back to mock data.
- **Electronics Page (`/electronics`)**: **No**. 100% static mock data (24 Russian items).

### Q2 — Which pages use static mock data?
1. `app/[locale]/store/page.tsx` (Lines 11, 84): Merges `ALL_PRODUCTS` into DB catalog.
2. `app/[locale]/products/[slug]/page.tsx` (Lines 10-11, 42-48): Falls back to `ALL_PRODUCTS` and `PHILIPS_PDP_PRODUCT`.
3. `app/[locale]/design-3/components/ProductDetailPage.tsx` (Lines 28, 900): Maps over `SIMILAR_COFFEE_MACHINES`.
4. `app/[locale]/electronics/page.tsx` (Lines 35, 120-400): Renders `PRODUCTS_DATA`.
5. `app/[locale]/design-3/components/BrandZones.tsx` (Line 5): Renders `BRAND_ZONES`.

### Q3 — How many products does each source show?
- **Database (`prisma.product`)**: 55 products.
- **`catalogData.ts` (`ALL_PRODUCTS`)**: 30 products (6 flash deals + 8 electronics + 16 additional).
- **`groceryCatalogData.ts`**: 15 products.
- **`pdpData.ts`**: 5 products (1 PDP + 4 similar).
- **`data/products.ts`**: 24 products.
- **`data/general-products.ts`**: 24 products (orphaned).

### Q4 — What is the storefront's intended product source?
The architecture was clearly intended to be **100% Database**. The Next.js API endpoints (`/api/products`, `/api/products/[slug]`, `/api/products/[slug]/related`, `/api/categories`) are fully implemented and robustly query Prisma. The static files were created as UI mockups during the Design-3 interface design sprint and were carelessly left as fallbacks or merged into production pages (`/store`, `ProductDetailPage.tsx`).

### Q5 — Do any products appear on the storefront that are NOT in the DB?
**Yes.**
- On `/store`: All 30 products from `catalogData.ts` (e.g. *Lavazza Qualità Oro Whole Coffee Beans 1kg*, *Monini Classico Extra Virgin Olive Oil 1L*, *Ariel All-in-1 PODS*, *Dreame D10s Plus*).
- On any Product Detail Page: The 4 coffee machines from `SIMILAR_COFFEE_MACHINES` (*De'Longhi Magnifica S Smart*, *Philips Series 2200*, *Krups Arabica EA8110*, *Siemens EQ.6 Plus*).
- On `/electronics`: All 24 Russian products (e.g. *Apple iPhone 16 Pro Max 256GB Desert Titanium*, *MacBook Pro 14" M4 Pro*, *Sony WH-1000XM5 Black*).

### Q6 — Do any DB products fail to appear on the storefront?
**No.** All 55 products in the database have `isActive: true`, valid categories, images, and prices. On `/products` and `/store`, all 55 appear. On the homepage, `/api/products?limit=60` retrieves all 55 products, where they populate the various department sections.

---

## 4. Component-by-Component Data Source Table

| Page / Component | File Path | Current Data Source | Classification | Action Required |
|---|---|---|---|---|
| **Homepage** | `app/[locale]/page.tsx` | DB via `/api/products?limit=60` | Live DB | Keep as is |
| **Store Catalog** | `app/[locale]/store/page.tsx` | DB + `ALL_PRODUCTS` (merged) | Mixed / Contaminated | **Fix:** Remove `ALL_PRODUCTS`, use only `dbProducts` |
| **Products Page** | `app/[locale]/products/page.tsx` | DB via `/api/products` | Live DB | Keep as is |
| **Product Detail Route** | `app/[locale]/products/[slug]/page.tsx` | DB + sample fallback | Mixed | **Fix:** Remove mock fallback; show 404 if not found |
| **PDP Similar Products** | `design-3/components/ProductDetailPage.tsx` | `SIMILAR_COFFEE_MACHINES` | 100% Static Mock | **Fix:** Fetch live related products from `/api/products/[slug]/related` |
| **Electronics Store** | `app/[locale]/electronics/page.tsx` | `data/products.ts` | 100% Static Mock | **Fix:** Migrate to query `/api/products?category=electronics` or redirect to `/store?department=Electronics` |
| **Brand Zones** | `design-3/components/BrandZones.tsx` | `BRAND_ZONES` (catalogData) | Static Mock | **Fix:** Fetch dynamic brands from DB or retain as static brand directory |
| **Design-3 Showcase** | `app/[locale]/design-3/page.tsx` | `catalogData`, `groceryCatalogData` | Intentional Prototype | No change (Showcase route) |
| **Design-2 Showcase** | `app/[locale]/design-2/page.tsx` | Hardcoded array | Intentional Prototype | No change (Showcase route) |
| **Figma Showcase** | `app/[locale]/figma-store/page.tsx` | Hardcoded array | Intentional Prototype | No change (Showcase route) |
| **Layout Header** | `components/layout/Design3LayoutHeader.tsx`| Unused import of `ALL_PRODUCTS` | Dead Import | **Fix:** Remove unused import |

---

## 5. Fix Plan

### Fix 1 — Clean `/store` Catalog Page (`app/[locale]/store/page.tsx`)
- **Option B (Replace static data with DB fetch):**
  - Delete `import { ALL_PRODUCTS, FLASH_DEALS } from '@/app/[locale]/design-3/data/catalogData'`.
  - In `catalogProducts`, change:
    ```typescript
    // BEFORE:
    const list = dbProducts.length > 0 ? [...dbProducts, ...ALL_PRODUCTS] : ALL_PRODUCTS;
    // AFTER:
    const list = dbProducts;
    ```
  - Result: Only real DB products are displayed in the store catalog.

### Fix 2 — Clean Product Detail Page Route (`app/[locale]/products/[slug]/page.tsx`)
- **Option B:**
  - Delete imports of `PHILIPS_PDP_PRODUCT` and `ALL_PRODUCTS`.
  - In `mappedProduct`, if the product is not found in `responseData`, return `null` and render the project's standard 404 / `notFound()` state rather than serving a fake coffee machine.

### Fix 3 — Connect PDP Similar Products to Live DB (`app/[locale]/design-3/components/ProductDetailPage.tsx`)
- **Option B:**
  - Remove `SIMILAR_COFFEE_MACHINES` import and rendering.
  - Call the existing endpoint `/api/products/${product.slug}/related?limit=4&locale=${locale}`.
  - Map results via `mapDbProductToDesign3` and render the real related products matching the viewed product's actual category.

### Fix 4 — Electronics Page (`app/[locale]/electronics/page.tsx`)
- **Option B / C:**
  - Option 1: Update `/electronics` to fetch from `/api/products?department=Electronics%20%26%20Phones&limit=24`.
  - Option 2: Redirect `/electronics` to `/[locale]/store?department=Electronics%20%26%20Phones`.

### Fix 5 — Clean Dead Imports in Layout Header (`Design3LayoutHeader.tsx`)
- Remove unused import of `FLASH_DEALS` and `ALL_PRODUCTS`.

---

## 6. Migration Order

1. **Step 1:** Fix `app/[locale]/store/page.tsx` (remove `ALL_PRODUCTS` merger).
2. **Step 2:** Fix `app/[locale]/products/[slug]/page.tsx` (remove mock fallback).
3. **Step 3:** Fix `ProductDetailPage.tsx` (connect Related Products to `/api/products/[slug]/related`).
4. **Step 4:** Clean `Design3LayoutHeader.tsx` (remove dead mock imports).
5. **Step 5:** Decide on `/electronics` (update to live API or redirect).

---

## 7. Verification Plan

1. **Verification for `/store`:**
   - Search for `"Lavazza"` or `"Monini"` on `/store`.
   - **Expected:** Neither appear unless explicitly added to the database.
   - Verify that all 55 DB products appear in their correct categories.
2. **Verification for PDP:**
   - Navigate to `/products/classic-denim-jeans-straight-cut`.
   - **Expected:** The "Related Products" section displays apparel/clothing items from the database, NOT coffee machines.
3. **Verification for non-existent slug:**
   - Navigate to `/products/fake-non-existent-product`.
   - **Expected:** Returns 404, not Philips coffee machine.
4. **Automated Tests & Build:**
   - Run `npx tsc --noEmit` to guarantee zero type errors.
   - Run `npx vitest run` to ensure all tests pass.

---

## 8. Risks & Mitigations

- **Risk:** Empty related products if a DB category has only 1 product.
  - **Mitigation:** Fall back to popular/featured DB products if related query returns fewer than 2 items.
- **Risk:** Stale cache during navigation.
  - **Mitigation:** TanStack Query keys are already scoped with `locale` and slug.
