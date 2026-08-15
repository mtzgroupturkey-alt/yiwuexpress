# Wholesale/Retail Mode - Quick Reference Card

## 🎯 At a Glance

| Component | Status | File Path |
|-----------|--------|-----------|
| Database Schema | ✅ Done | `prisma/schema.prisma` |
| API Endpoint | ✅ Done | `app/api/settings/store-mode/route.ts` |
| Admin UI | ✅ Done | `app/admin/settings/general/page.tsx` |
| Context Provider | ✅ Done | `contexts/StoreModeContext.tsx` |
| Navigation | ✅ Done | `app/admin/layout.tsx` |

---

## 📋 Store Modes

| Mode | Value | MOQ | Pricing | Use Case |
|------|-------|-----|---------|----------|
| **Wholesale** | `"WHOLESALE"` | Enforced | Wholesale only | B2B suppliers |
| **Retail** | `"RETAIL"` | Not enforced | Retail only | B2C consumers |
| **Both** | `"BOTH"` | Enforced | Both shown | Hybrid model |

---

## 🔑 Context Hook Usage

```tsx
import { useStoreMode } from '@/contexts/StoreModeContext'

// In your component
const { 
  storeMode,      // "WHOLESALE" | "RETAIL" | "BOTH"
  isWholesale,    // true if WHOLESALE or BOTH
  isRetail,       // true if RETAIL or BOTH
  isBoth,         // true if BOTH
  loading,        // true during fetch
  error           // error message or null
} = useStoreMode()
```

---

## 🛠️ Helper Functions

### 1. Get Display Price
```tsx
import { getDisplayPrice } from '@/contexts/StoreModeContext'

const { displayPrice, priceType } = getDisplayPrice(
  product.price,          // 59.99
  product.wholesalePrice, // 45.00
  storeMode              // "WHOLESALE"
)
// Returns: { displayPrice: 45.00, priceType: "wholesale" }
```

### 2. Check MOQ Enforcement
```tsx
import { shouldEnforceMOQ } from '@/contexts/StoreModeContext'

const enforce = shouldEnforceMOQ(storeMode)
// WHOLESALE → true
// RETAIL → false
// BOTH → true
```

### 3. Get Effective Min Quantity
```tsx
import { getEffectiveMinOrderQty } from '@/contexts/StoreModeContext'

const minQty = getEffectiveMinOrderQty(
  product.minOrderQty, // 10
  storeMode           // "RETAIL"
)
// WHOLESALE → 10
// RETAIL → 1 (overrides product MOQ)
// BOTH → 10
```

---

## 🌐 API Endpoints

### GET Store Mode
```bash
GET /api/settings/store-mode

Response:
{
  "success": true,
  "storeMode": "WHOLESALE",
  "settings": { "storeMode": "WHOLESALE" }
}
```

### UPDATE Store Mode
```bash
PUT /api/settings/store-mode
Content-Type: application/json

{
  "storeMode": "RETAIL"
}

Response:
{
  "success": true,
  "storeMode": "RETAIL",
  "message": "Store mode updated successfully"
}
```

---

## 💻 Code Snippets

### Product Price Display
```tsx
const { storeMode } = useStoreMode()
const { displayPrice, priceType } = getDisplayPrice(
  product.price,
  product.wholesalePrice,
  storeMode
)

return (
  <div>
    <p className="price">${displayPrice.toFixed(2)}</p>
    {priceType === 'wholesale' && <Badge>Wholesale</Badge>}
    {priceType === 'retail' && <Badge>Retail</Badge>}
  </div>
)
```

### Quantity Selector
```tsx
const { storeMode } = useStoreMode()
const minQty = getEffectiveMinOrderQty(product.minOrderQty, storeMode)

return (
  <input
    type="number"
    min={minQty}
    value={quantity}
    onChange={(e) => setQuantity(Math.max(minQty, parseInt(e.target.value)))}
  />
)
```

### Conditional Company Fields
```tsx
const { isWholesale } = useStoreMode()

return (
  <form>
    {/* Always show shipping */}
    <ShippingAddress />
    
    {/* Only show in wholesale mode */}
    {isWholesale && (
      <div>
        <input name="companyName" required />
        <input name="taxId" />
        <input name="businessLicense" />
      </div>
    )}
  </form>
)
```

---

## 🔍 Debugging Checklist

### Issue: Store mode not updating
- [ ] Check database: `SELECT store_mode FROM system_settings;`
- [ ] Check API response: `GET /api/settings/store-mode`
- [ ] Verify Context Provider is in root layout
- [ ] Clear browser cache and refresh

### Issue: Prices not changing
- [ ] Verify `product.wholesalePrice` exists in database
- [ ] Check if you're using `getDisplayPrice()` helper
- [ ] Confirm `storeMode` is correct via `console.log`
- [ ] Check component is inside `StoreModeProvider`

### Issue: MOQ not enforced
- [ ] Verify store mode is WHOLESALE or BOTH
- [ ] Check `product.minOrderQty` value
- [ ] Ensure you're using `getEffectiveMinOrderQty()`
- [ ] Add server-side validation in cart API

---

## 📊 Decision Table

| Scenario | Wholesale Mode | Retail Mode | Both Mode |
|----------|----------------|-------------|-----------|
| Show wholesale price | ✅ Yes | ❌ No | ✅ Yes (with retail) |
| Show retail price | ❌ No | ✅ Yes | ✅ Yes (with wholesale) |
| Enforce MOQ | ✅ Yes | ❌ No | ✅ Yes |
| Allow qty = 1 | ❌ No | ✅ Yes | ❌ No |
| Show company fields | ✅ Required | ❌ Hidden | ✅ Optional |
| Tax exemption option | ✅ Yes | ❌ No | ✅ Yes |

---

## 🎨 UI Patterns

### Badge for Mode Type
```tsx
{storeMode === 'WHOLESALE' && <Badge color="blue">B2B</Badge>}
{storeMode === 'RETAIL' && <Badge color="green">B2C</Badge>}
{storeMode === 'BOTH' && <Badge color="purple">Hybrid</Badge>}
```

### Price Comparison (Both Mode)
```tsx
{isBoth && (
  <div className="price-comparison">
    <div className="retail">
      <span>Retail:</span>
      <strong>${product.price}</strong>
    </div>
    <div className="wholesale">
      <span>Wholesale (MOQ {product.minOrderQty}):</span>
      <strong>${product.wholesalePrice}</strong>
      <span className="savings">Save {savingsPercent}%</span>
    </div>
  </div>
)}
```

### MOQ Warning
```tsx
{shouldEnforceMOQ(storeMode) && product.minOrderQty > 1 && (
  <div className="alert">
    ⚠️ Minimum order: {product.minOrderQty} units
  </div>
)}
```

---

## 🧪 Testing Commands

### Check Database
```sql
-- View current mode
SELECT store_mode FROM system_settings;

-- View products with wholesale pricing
SELECT sku, name, price, wholesale_price, min_order_qty 
FROM products 
WHERE wholesale_price IS NOT NULL;
```

### Test API
```bash
# Get current mode
curl http://localhost:3001/api/settings/store-mode

# Change to wholesale
curl -X PUT http://localhost:3001/api/settings/store-mode \
  -H "Content-Type: application/json" \
  -d '{"storeMode": "WHOLESALE"}'

# Change to retail
curl -X PUT http://localhost:3001/api/settings/store-mode \
  -H "Content-Type: application/json" \
  -d '{"storeMode": "RETAIL"}'

# Change to both
curl -X PUT http://localhost:3001/api/settings/store-mode \
  -H "Content-Type: application/json" \
  -d '{"storeMode": "BOTH"}'
```

---

## 📁 File Structure

```
ecommerce-monorepo/web/
├── prisma/
│   └── schema.prisma                     [✅ Modified]
├── contexts/
│   └── StoreModeContext.tsx              [✅ NEW]
├── app/
│   ├── admin/
│   │   ├── layout.tsx                    [✅ Modified]
│   │   └── settings/
│   │       ├── layout.tsx                [✅ Modified]
│   │       └── general/
│   │           └── page.tsx              [✅ NEW]
│   └── api/
│       └── settings/
│           └── store-mode/
│               └── route.ts              [✅ NEW]
└── [Integration needed]
    ├── app/products/[slug]/page.tsx      [⏳ Pending]
    ├── app/cart/page.tsx                 [⏳ Pending]
    ├── app/checkout/page.tsx             [⏳ Pending]
    └── app/layout.tsx                    [⏳ Needs Provider]
```

---

## ⚡ Quick Commands

### Admin Access
```
URL: http://localhost:3001/admin/settings/general
Nav: Admin → Settings → General → Store Mode
```

### Database Migration
```bash
cd ecommerce-monorepo/web
npm run db:push
```

### Start Dev Server
```bash
cd ecommerce-monorepo/web
npm run dev
```

---

## 📞 Common Questions

**Q: Can I switch modes without losing data?**  
A: Yes! Mode changes are non-destructive. Products retain all pricing data.

**Q: What happens to existing orders?**  
A: Existing orders are unaffected. Mode only affects new orders.

**Q: Can customers see the store mode?**  
A: No, mode is admin-only. Customers only see the pricing/MOQ results.

**Q: Does Both mode require extra setup?**  
A: No, it works automatically. Just ensure products have both prices.

**Q: Can I have different modes per product?**  
A: No, mode is global. But you can use Both mode for flexibility.

**Q: How do I add wholesale price to existing products?**  
A: Update via Admin → Products → Edit → Set Wholesale Price field.

---

## 🎓 Learning Path

1. **Week 1:** Understand the architecture
   - Read `WHOLESALE_RETAIL_ARCHITECTURE.md`
   - Test mode changes in admin panel
   - Explore API endpoints

2. **Week 2:** Integration basics
   - Add StoreModeProvider to root layout
   - Update one product page
   - Test price display

3. **Week 3:** Advanced integration
   - Cart MOQ validation
   - Checkout conditional fields
   - Both mode implementation

4. **Week 4:** Testing & optimization
   - End-to-end testing
   - Performance optimization
   - User acceptance testing

---

## 🚨 Emergency Rollback

If something goes wrong, revert to wholesale-only:

```sql
-- Direct database update
UPDATE system_settings 
SET store_mode = 'WHOLESALE' 
WHERE id = (SELECT id FROM system_settings LIMIT 1);
```

Or via admin:
```
1. Go to /admin/settings/general
2. Select "Wholesale Only (B2B)"
3. Click "Save Changes"
```

---

## 📚 Full Documentation

- **Implementation Summary:** `WHOLESALE_RETAIL_IMPLEMENTATION_SUMMARY.md`
- **Integration Guide:** `WHOLESALE_RETAIL_INTEGRATION_GUIDE.md`
- **Architecture:** `WHOLESALE_RETAIL_ARCHITECTURE.md`
- **This Card:** `WHOLESALE_RETAIL_QUICK_REFERENCE.md`

---

**Version:** 1.0.0  
**Last Updated:** July 14, 2026  
**Print this card and keep it handy!** 📌
