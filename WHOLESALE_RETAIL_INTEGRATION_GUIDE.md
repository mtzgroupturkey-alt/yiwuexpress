# Wholesale/Retail Mode - Quick Integration Guide

## 🎯 Purpose
This guide shows you exactly how to integrate the store mode functionality into your product pages, cart, and checkout.

---

## Step 1: Add StoreModeProvider to Root Layout

**File:** `ecommerce-monorepo/web/app/layout.tsx`

```tsx
import { StoreModeProvider } from '@/contexts/StoreModeContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreModeProvider>
          {/* Your existing providers */}
          {children}
        </StoreModeProvider>
      </body>
    </html>
  )
}
```

---

## Step 2: Update Product Detail Page

**File:** `ecommerce-monorepo/web/app/products/[slug]/page.tsx`

### 2.1 Add Imports
```tsx
import { useStoreMode, getDisplayPrice, getEffectiveMinOrderQty } from '@/contexts/StoreModeContext'
```

### 2.2 Update Component
```tsx
export default function ProductDetailPage() {
  // ... existing code ...
  
  // ADD THIS: Get store mode
  const { storeMode, isWholesale, isRetail, isBoth } = useStoreMode()
  
  // ... existing state ...
  
  useEffect(() => {
    if (slug) {
      fetchProduct()
      fetchRelatedProducts()
      setViewingCount(Math.floor(Math.random() * 35) + 12)
    }
  }, [slug])

  const fetchProduct = async () => {
    // ... existing fetch code ...
    
    if (data.success) {
      setProduct(data.data)
      
      // UPDATE THIS: Use effective min order quantity based on store mode
      const effectiveMinQty = getEffectiveMinOrderQty(data.data.minOrderQty || 1, storeMode)
      setQuantity(effectiveMinQty)
      
      setError('')
    }
  }

  // ... rest of component ...
}
```

### 2.3 Update Price Display Section

Find the price section (around line 400) and replace with:

```tsx
{/* Price Section - Mode-Aware */}
<div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100">
  {(() => {
    const { displayPrice, priceType } = getDisplayPrice(
      product.price,
      product.wholesalePrice,
      storeMode
    )

    return (
      <>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-gradient-gold">
            ${displayPrice.toFixed(2)}
          </span>
          {priceType === 'wholesale' && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              Wholesale Price
            </Badge>
          )}
          {product.compareAtPrice && (
            <>
              <span className="text-lg text-gray-400 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                SAVE {discount}%
              </Badge>
            </>
          )}
        </div>
        
        {priceType === 'retail' && (
          <p className="text-xs text-gray-600">Retail price (excluding taxes)</p>
        )}
        
        {priceType === 'wholesale' && (
          <p className="text-xs text-gray-600">Wholesale price - Business customers only</p>
        )}
        
        {priceType === 'both' && isBoth && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-1">Pricing Options:</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Retail:</span>
                <span className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</span>
              </div>
              {product.wholesalePrice && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Wholesale (MOQ: {product.minOrderQty}):</span>
                  <span className="text-sm font-bold text-blue-700">${product.wholesalePrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )
  })()}
</div>
```

### 2.4 Update Wholesale Price Section

Replace the existing wholesale price section (around line 430):

```tsx
{/* Wholesale Price - Only show in wholesale/both modes */}
{(isWholesale || isBoth) && product.wholesalePrice && storeMode !== 'RETAIL' && (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-4 mb-4 shadow-sm">
    <div className="flex items-center gap-2 mb-1">
      <div className="bg-blue-600 rounded-full p-1.5">
        <Package className="w-4 h-4 text-white" />
      </div>
      <p className="text-xs font-semibold text-blue-900">
        {storeMode === 'WHOLESALE' ? 'Wholesale Pricing' : 'Bulk Order Discount Available'}
      </p>
    </div>
    <p className="text-2xl font-bold text-blue-700 mb-1">
      ${product.wholesalePrice.toFixed(2)}
    </p>
    <p className="text-xs text-blue-600 font-medium">
      Minimum Order: {product.minOrderQty} units • Save up to {Math.round((1 - product.wholesalePrice / product.price) * 100)}%
    </p>
  </div>
)}
```

### 2.5 Update Quantity Selector

Replace the quantity selector section (around line 500):

```tsx
{/* Quantity Selector - Mode-Aware */}
<div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
  {(() => {
    const effectiveMinQty = getEffectiveMinOrderQty(product.minOrderQty, storeMode)
    
    return (
      <>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Select Quantity 
          {effectiveMinQty > 1 && (
            <span className="text-xs text-gray-600 font-normal">
              (Minimum: {effectiveMinQty} units)
            </span>
          )}
          {storeMode === 'RETAIL' && product.minOrderQty > 1 && (
            <span className="text-xs text-green-600 font-normal ml-2">
              ✓ Retail mode: No minimum required
            </span>
          )}
        </label>
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= effectiveMinQty}
            className="h-10 w-10 rounded-lg border hover:border-primary-500 hover:bg-primary-50"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (val >= effectiveMinQty && val <= product.stock) {
                setQuantity(val)
              }
            }}
            min={effectiveMinQty}
            className="w-20 text-center border border-gray-300 rounded-lg py-2 text-base font-bold focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition-all"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= product.stock}
            className="h-10 w-10 rounded-lg border hover:border-primary-500 hover:bg-primary-50"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {/* ... rest of quantity selector ... */}
      </>
    )
  })()}
</div>
```

---

## Step 3: Update Cart API (Server-Side MOQ Validation)

**File:** `ecommerce-monorepo/web/app/api/cart/route.ts`

### 3.1 Add MOQ Validation

```tsx
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity } = body

    // ... existing auth code ...

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // NEW: Fetch store mode
    const settings = await prisma.systemSettings.findFirst()
    const storeMode = settings?.storeMode || 'WHOLESALE'

    // NEW: Validate MOQ based on store mode
    if (storeMode === 'WHOLESALE' || storeMode === 'BOTH') {
      const minQty = product.minOrderQty || 1
      
      if (quantity < minQty) {
        return NextResponse.json(
          {
            success: false,
            error: `Minimum order quantity is ${minQty} units for this product in ${storeMode.toLowerCase()} mode`
          },
          { status: 400 }
        )
      }
    }

    // ... rest of cart logic ...
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## Step 4: Update Checkout Page (Conditional Fields)

**File:** `ecommerce-monorepo/web/app/checkout/page.tsx`

### 4.1 Add Store Mode Check

```tsx
import { useStoreMode } from '@/contexts/StoreModeContext'

export default function CheckoutPage() {
  const { storeMode, isWholesale, isRetail } = useStoreMode()
  
  // ... existing state ...
  
  return (
    <div>
      {/* Shipping Address - Always shown */}
      <div className="space-y-4">
        <h3>Shipping Address</h3>
        {/* ... existing fields ... */}
      </div>

      {/* Company Information - Only in Wholesale/Both mode */}
      {isWholesale && (
        <div className="space-y-4 mt-6">
          <h3>Company Information</h3>
          <input
            type="text"
            name="companyName"
            placeholder="Company Name *"
            required={isWholesale}
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="text"
            name="businessLicense"
            placeholder="Business License Number"
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="text"
            name="taxId"
            placeholder="Tax ID / VAT Number"
            className="w-full px-4 py-2 border rounded"
          />
          
          {/* Tax Exemption - Wholesale only */}
          {storeMode === 'WHOLESALE' && (
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="taxExempt" />
                <span>I have a tax exemption certificate</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Different billing section based on mode */}
      {isWholesale ? (
        <div className="space-y-4 mt-6">
          <h3>Billing Address (Required for Business)</h3>
          {/* Separate billing address fields */}
        </div>
      ) : (
        <div className="mt-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="sameBilling" defaultChecked />
            <span>Billing address same as shipping</span>
          </label>
        </div>
      )}

      {/* ... rest of checkout ... */}
    </div>
  )
}
```

---

## Step 5: Update Product Cards (if you have them)

**File:** `ecommerce-monorepo/web/components/products/ProductCard.tsx`

```tsx
import { useStoreMode, getDisplayPrice } from '@/contexts/StoreModeContext'

export default function ProductCard({ product }) {
  const { storeMode } = useStoreMode()
  const { displayPrice, priceType } = getDisplayPrice(
    product.price,
    product.wholesalePrice,
    storeMode
  )

  return (
    <div className="product-card">
      {/* ... image ... */}
      
      <div className="price-section">
        <p className="price">${displayPrice.toFixed(2)}</p>
        {priceType === 'wholesale' && (
          <span className="badge">Wholesale</span>
        )}
        {priceType === 'both' && product.wholesalePrice && (
          <p className="text-xs text-gray-600">
            From ${product.wholesalePrice.toFixed(2)} (bulk)
          </p>
        )}
      </div>

      {/* MOQ Badge - Only in wholesale/both mode */}
      {(storeMode === 'WHOLESALE' || storeMode === 'BOTH') && product.minOrderQty > 1 && (
        <div className="moq-badge">
          MOQ: {product.minOrderQty} units
        </div>
      )}
    </div>
  )
}
```

---

## 🧪 Testing Your Integration

### Test Scenario 1: Wholesale Mode
1. Go to `/admin/settings/general`
2. Select "Wholesale Only (B2B)"
3. Save changes
4. Visit a product page
5. ✅ Should show wholesale price (if available)
6. ✅ Should enforce MOQ
7. ✅ Should show company fields at checkout

### Test Scenario 2: Retail Mode
1. Go to `/admin/settings/general`
2. Select "Retail Only (B2C)"
3. Save changes
4. Visit a product page
5. ✅ Should show retail price
6. ✅ Should allow quantity = 1
7. ✅ Should NOT show company fields at checkout

### Test Scenario 3: Both Mode
1. Go to `/admin/settings/general`
2. Select "Both (Hybrid)"
3. Save changes
4. Visit a product page
5. ✅ Should show both prices
6. ✅ Should allow quantity = 1
7. ✅ Should optionally show company fields

---

## 🚨 Common Issues & Solutions

### Issue 1: "useStoreMode must be used within a StoreModeProvider"
**Solution:** Make sure `StoreModeProvider` is added to root layout (Step 1)

### Issue 2: Prices not updating after mode change
**Solution:** Call `refreshStoreMode()` from the hook or refresh the page

### Issue 3: MOQ still enforced in retail mode
**Solution:** Check that you're using `getEffectiveMinOrderQty()` helper

### Issue 4: Both mode showing same price twice
**Solution:** Check that product has both `price` and `wholesalePrice` fields

---

## 📋 Integration Checklist

- [ ] Step 1: StoreModeProvider added to root layout
- [ ] Step 2: Product detail page updated
- [ ] Step 3: Cart API MOQ validation added
- [ ] Step 4: Checkout conditional fields implemented
- [ ] Step 5: Product cards updated (if applicable)
- [ ] Tested wholesale mode end-to-end
- [ ] Tested retail mode end-to-end
- [ ] Tested both mode end-to-end
- [ ] Verified MOQ enforcement works
- [ ] Verified company fields appear/disappear correctly

---

## 💡 Pro Tips

1. **Cache store mode:** The context provider automatically caches the mode, so you don't need to worry about excessive API calls

2. **Use helper functions:** Always use `getDisplayPrice()` and `getEffectiveMinOrderQty()` instead of manual if/else logic

3. **Test mode switching:** Make sure to test switching between modes and refreshing pages

4. **Mobile responsive:** Test all three modes on mobile devices

5. **Loading states:** The context provider has a `loading` state you can use to show skeletons

---

## 🎨 UI/UX Recommendations

### Wholesale Mode
- Show "B2B" badge prominently
- Emphasize bulk savings
- Show MOQ clearly
- Use professional, business-focused language

### Retail Mode
- Show "Shop Now" CTAs
- Emphasize free shipping (if applicable)
- Use consumer-friendly language
- Make single-unit purchases easy

### Both Mode
- Show pricing comparison table
- Add "Switch to Business Pricing" toggle
- Clearly label which price applies
- Provide savings calculator

---

**Need Help?** Refer to the main implementation summary: `WHOLESALE_RETAIL_IMPLEMENTATION_SUMMARY.md`
