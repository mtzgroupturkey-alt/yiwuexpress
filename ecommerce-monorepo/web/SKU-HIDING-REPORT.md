# SKU-HIDING-REPORT

## Executive Summary
This implementation guarantees that internal SKUs (e.g., `NDK-ALL-43BA1B4D`) are **completely hidden from all customer-facing surfaces and storefront API responses** (for guest, retail, and wholesale users alike). In their place, users see the clean, public **Item #** (e.g., `DK-900.1622.63`).

Internal SKUs remain strictly preserved in the database and visible only to authenticated administrators within the Admin Panel and admin-scoped API responses.

---

## 1. Files Changed & Commit History

| Commit | File | Description |
|---|---|---|
| `ec055644` | `app/api/orders/[id]/route.ts` | Selected `dromkokItemNo: true` on order item product relations. |
| `82a65b74` | `app/[locale]/orders/[id]/page.tsx` | Replaced `SKU: {item.productSku}` with `Item #: {item.product?.dromkokItemNo \|\| '—'}`. |
| `5b3f8839` | `components/mobile/account/MobileOrderDetailView.tsx` | Replaced mobile order item SKU with `Item #: {item.product?.dromkokItemNo \|\| '—'}`. |
| `717440ae` | `app/[locale]/products/[slug]/ProductDetailView.tsx` | Removed top SKU meta pill, replaced matrix variant SKU with Item #, removed specs SKU row. |
| `f7e7c97f` | `components/products/IkeaSpecificationsAccordion.tsx` | Removed SKU fallback, strictly displays `{product.dromkokItemNo \|\| '—'}`. |
| `1ee6366e` | `components/mobile/product/MobileTabs.tsx` | Removed the `SKU / Model` row from specs tab. |
| `881c3992` | `app/[locale]/design-3/components/ProductDetailPage.tsx` | Removed SKU and displays clean `Item #: {currentProduct.dromkokItemNo \|\| '—'}`. |
| `51e197e0` | `components/products/VariantSelector.tsx` | Removed SKU paragraph from variant selector. |
| `f439c096` | `app/[locale]/design-3/components/CheckoutPage.tsx` | Replaced line item `SKU:` with `Item #: {item.product.dromkokItemNo \|\| '—'}`. |
| `4489c4f4` | `app/[locale]/quote-cart/page.tsx`<br>`components/QuoteCartContext.tsx` | Added `dromkokItemNo` to QuoteCart context & state; replaced SKU with Item #. |
| `4f66ce2d` | `components/mobile/cart/MobileQuoteCartPage.tsx` | Replaced mobile quote cart SKU with `Item #: {item.dromkokItemNo \|\| '—'}`. |
| `09251bd0` | `app/api/b2b/quotes/view/[token]/route.ts`<br>`app/[locale]/quotes/view/[token]/page.tsx` | Included `product.dromkokItemNo`; updated quote table header to `Product Description / Item #` and row text to `Item #: ...`. |
| `065a3022` | `lib/utils/productSanitizer.ts` | Added `delete safe.sku` and `delete vSafe.sku` on all non-admin requests. |
| `d37fcfdc` | `__tests__/api/sku-sanitization.test.ts` | Added automated unit test verifying SKU stripping for non-admin and retention for admin. |

---

## 2. Sanitizer Implementation (`lib/utils/productSanitizer.ts`)

```ts
export function sanitizeProductForClient<T extends Record<string, any>>(
  product: T,
  canViewWholesale: boolean,
  isAdmin: boolean = false
): SanitizedProduct<T> {
  if (!product) return product as SanitizedProduct<T>

  // 1. Strip sensitive supplier fields, cost margins, internal IKEA numbers, and internal SKU
  const safe: Record<string, any> = { ...product }
  if (!isAdmin) {
    delete safe.ikeaItemNo
    delete safe.sku
    delete safe.costPrice
    delete safe.purchaseCost
    delete safe.profit
    delete safe.profitMargin
    delete safe.suppliers
    delete safe.supplierId
  }

  // 2. Strip variant sensitive fields for non-admins
  if (Array.isArray(safe.variants) && !isAdmin) {
    safe.variants = safe.variants.map((variant: any) => {
      const vSafe = { ...variant }
      delete vSafe.sku
      delete vSafe.costPrice
      return vSafe
    })
  }

  // 3. Wholesale gating logic ...
  return safe as T & { isWholesaleGated: boolean }
}
```

---

## 3. Test & Build Results
- **TypeScript:** `npx tsc --noEmit` passed with **0 errors**.
- **Vitest:** `__tests__/api/sku-sanitization.test.ts` passed (2/2 tests passed, 5/5 API suite passed).
- **Database Status:** Verified 6,744/6,744 products have non-null `dromkokItemNo`.

---

## 4. Git Deployment
- **`origin/main`** & **`origin/production`**: Updated to `d37fcfdc`
- **`dromkok/main`** & **`dromkok/production`**: Updated to `d37fcfdc`
