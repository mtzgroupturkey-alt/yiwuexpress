# WHOLESALE STOREFRONT FIX REPORT

## 1. Investigation Answers with Raw Evidence

### Q1 — What is the current storeMode?
Command executed:
```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.systemSettings.findUnique({where:{singletonKey:'SINGLETON'}}).then(s=>{console.log(JSON.stringify({storeMode:s?.storeMode,rfqModel:s?.rfqModel}));process.exit(0);});"
```
Raw output:
```json
{"storeMode":"WHOLESALE","rfqModel":"RFQ"}
```
**Conclusion**: The system is in pure **WHOLESALE** mode with RFQ model set to **RFQ** (Request for Quote).

---

### Q2 — What does ProductCard actually render?
Both product card hierarchies (`components/products/ProductCard.tsx` and `app/[locale]/design-3/components/UnifiedProductCard.tsx` on the home page) now dynamically inspect `isWholesaleActive` and `rfqModel`.

Raw code from `components/products/ProductCard.tsx`:
```tsx
{isWholesaleActive && !isInstant ? (
  <Button
    size="sm"
    onClick={handleAction}
    disabled={!product.isActive || product.stock === 0}
    className="w-full bg-[#00407a] hover:bg-[#003366] text-white flex items-center justify-center gap-1.5"
  >
    <FileText className="w-4 h-4" />
    <span>Request Quote</span>
  </Button>
) : (
  <Button
    size="sm"
    onClick={handleAction}
    disabled={!product.isActive || product.stock === 0}
    className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-1.5"
  >
    <ShoppingCart className="w-4 h-4" />
    <span>{isWholesaleActive ? 'Add to Wholesale Cart' : 'Add to Cart'}</span>
  </Button>
)}
```

Raw code from `app/[locale]/design-3/components/UnifiedProductCard.tsx`:
```tsx
{isWholesaleActive && !isInstant ? (
  <button
    type="button"
    disabled={isOutOfStock}
    onClick={handleAddToCart}
    className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-[#00407a] hover:bg-[#003366] text-white shadow-sm"
  >
    <FileText className="w-3.5 h-3.5" />
    <span>Request Quote</span>
  </button>
) : (
  <button
    type="button"
    disabled={isOutOfStock}
    onClick={handleAddToCart}
    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
      isWholesaleActive
        ? 'bg-amber-600 hover:bg-amber-700 text-white'
        : 'bg-[#00407a] hover:bg-[#003366] text-white'
    }`}
  >
    <ShoppingCart className="w-3.5 h-3.5" />
    <span>{isWholesaleActive ? 'Add to Wholesale Cart' : t('addToCart')}</span>
  </button>
)}
```

---

### Q3 — What does clicking "Add to Cart" / "Request Quote" actually do?
Raw handler from `components/products/ProductCard.tsx`:
```tsx
const handleAction = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  if (isWholesaleActive && !isInstant) {
    addQuoteItem({
      productId: product.id,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        wholesalePrice: product.wholesalePrice,
        minOrderQuantity: product.minOrderQuantity || 1,
        images: product.images,
        thumbnail: product.thumbnail || product.images?.[0]?.url,
        stock: product.stock,
      },
      quantity: Math.max(quantity, product.minOrderQuantity || 1),
      targetPrice: product.wholesalePrice || undefined,
    })
    toast.success('Added to quote request')
    return
  }

  addToCart(product.id, quantity)
}
```
**Conclusion**: In Wholesale RFQ mode, `addQuoteItem` is called and item is placed into `QuoteCartContext`. In Retail mode, `addToCart` is called.

---

### Q4 — What carts exist in the codebase?
- **Retail Cart**: `components/CartContext.tsx`
  - Client state + synchronization with server `/api/cart`.
  - Handles retail checkout, credit card, and PayPal flows.
- **Quote Cart (Wholesale RFQ)**: `components/QuoteCartContext.tsx`
  - Stores items specifically for RFQ submissions (`productId`, `quantity`, `targetPrice`, `notes`, `product` details).
  - Persists in `localStorage` under `yiwu_quote_cart_v1`.
  - Submits to `/api/b2b/quotes`.
- **Session Store**: `stores/storeSessionStore.ts`
  - Zustand store managing `storeMode` (`WHOLESALE` | `RETAIL` | `BOTH`) and `sessionMode` (`wholesale` | `retail`).
- **Separation**: Completely separate contexts and storage mechanisms. Wholesale RFQ requests never touch the retail cart table.

---

### Q5 — What does the header cart icon link to?
Both `components/layout/MainHeader.tsx` and `app/[locale]/design-3/components/Header.tsx` morph dynamically based on `isWholesaleActive`:

- **Wholesale Active (RFQ mode)**:
  - Icon: `FileText` (clipboard / quote document).
  - Badge: Displays `quoteCount` (items in QuoteCart).
  - Target: Links directly to `/[locale]/quote-cart`.
  - Label: `"Quote Request"`.
- **Retail Active**:
  - Icon: `ShoppingCart`.
  - Badge: Displays `cartCount` (items in Retail Cart).
  - Target: Opens retail cart drawer or links to `/[locale]/cart`.

---

### Q6 — Does /quote-cart exist and work?
- Path: `app/[locale]/quote-cart/page.tsx`.
- **Functionality**:
  - Displays all quote items with MOQ indicators, target price fields, notes, and remove/quantity update buttons.
  - Automatically prefills user profile data (company name, email, phone) if authenticated.
  - Contains quote request submission form: `customerNotes`, `targetBudget`, `expectedDeliveryDate`.
  - Submits via POST to `/api/b2b/quotes`.
  - On success: clears quote cart, shows toast notification, and redirects to quote status page `/quotes/[id]`.

---

### Q7 — What is the session mode switcher?
- **Hybrid Mode (`storeMode === 'BOTH'`)**:
  - Toggle button rendered in `components/layout/MainHeader.tsx` with `ArrowLeftRight` icon.
  - Switches `sessionMode` between `'retail'` and `'wholesale'`.
  - Persisted in cookie: `store_session_mode=wholesale|retail; path=/; max-age=2592000; SameSite=Lax` (30 days).
  - SSR Read: `app/[locale]/layout.tsx` reads `cookies().get('store_session_mode')` and initializes `SessionModeProvider` server-side, eliminating hydration layout shifts.
- **Single-Channel Mode (`WHOLESALE` or `RETAIL`)**:
  - Toggle button is completely hidden (`canToggle = isBoth = false`).
  - Store and context lock session mode (`storeMode === 'WHOLESALE' ? 'wholesale' : 'retail'`).

---

## 2. Completed Fix Commits

| Commit Hash | Commit Message | Files Changed |
|-------------|----------------|---------------|
| `aa46bdb` | `fix(storefront): product card respects wholesale mode` | `UnifiedProductCard.tsx`, `ProductCard.tsx`, `design3ProductAdapter.ts`, `design-3/types.ts`, `app/[locale]/page.tsx` |
| `d26e78f` | `fix(storefront): header cart button morphs by session mode` | `Header.tsx`, `MainHeader.tsx` |
| `6852ec1` | `fix(storefront): block /cart access in wholesale mode` | `app/[locale]/cart/page.tsx` |
| `200d337` | `fix(storefront): wire /quote-cart submit to /api/b2b/quotes` | `app/[locale]/quote-cart/page.tsx` |
| `5e39bbd` | `fix(storefront): persist session mode in cookie` | `SessionModeContext.tsx`, `storeSessionStore.ts`, `StoreSessionProvider.tsx`, `layout.tsx` |
| `c965f25` | `fix(storefront): lock mode when storeMode is single-channel` | `app/[locale]/checkout/page.tsx` |

---

## 3. Verification Evidence

### TypeScript Typecheck:
```bash
npx tsc --noEmit
# Exit code 0 (0 errors)
```

### Vitest Suite (All 13 test files, 53 tests):
```bash
npx vitest run
# Output:
# Test Files  13 passed (13)
#      Tests  53 passed (53)
#   Duration  5.94s
```
