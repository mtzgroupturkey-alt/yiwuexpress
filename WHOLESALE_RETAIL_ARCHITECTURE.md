# Wholesale/Retail Mode - System Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN INTERFACE                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Settings → General → Store Mode Selector                │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐          │  │
│  │  │ Wholesale  │ │   Retail   │ │    Both    │          │  │
│  │  │   (B2B)    │ │   (B2C)    │ │  (Hybrid)  │          │  │
│  │  └────────────┘ └────────────┘ └────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PUT Request   │
                    │ /api/settings/  │
                    │   store-mode    │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               SystemSettings Table                        │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ id: cuid                                           │  │  │
│  │  │ companyName: "YIWU EXPRESS"                       │  │  │
│  │  │ ...                                                │  │  │
│  │  │ storeMode: "WHOLESALE" | "RETAIL" | "BOTH"       │  │  │
│  │  │ createdAt: DateTime                               │  │  │
│  │  │ updatedAt: DateTime                               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   GET Request   │
                    │ /api/settings/  │
                    │   store-mode    │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CONTEXT PROVIDER                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            StoreModeContext                               │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ State:                                             │  │  │
│  │  │   storeMode: "WHOLESALE" | "RETAIL" | "BOTH"     │  │  │
│  │  │   isWholesale: boolean                            │  │  │
│  │  │   isRetail: boolean                               │  │  │
│  │  │   isBoth: boolean                                 │  │  │
│  │  │   loading: boolean                                │  │  │
│  │  │                                                    │  │  │
│  │  │ Helper Functions:                                 │  │  │
│  │  │   getDisplayPrice()                               │  │  │
│  │  │   shouldEnforceMOQ()                             │  │  │
│  │  │   getEffectiveMinOrderQty()                      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Product    │ │     Cart     │ │   Checkout   │
    │    Pages     │ │     Page     │ │     Page     │
    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔄 Data Flow Diagram

### 1. Admin Updates Store Mode

```
Admin UI
   │
   │ User selects mode
   │
   ▼
General Settings Page
   │
   │ handleSave()
   │
   ▼
PUT /api/settings/store-mode
   │
   │ { storeMode: "WHOLESALE" }
   │
   ▼
Prisma ORM
   │
   │ systemSettings.update()
   │
   ▼
PostgreSQL Database
   │
   │ UPDATE system_settings
   │ SET storeMode = 'WHOLESALE'
   │
   ▼
Success Response
   │
   │ { success: true, storeMode: "WHOLESALE" }
   │
   ▼
Admin UI
   │
   └─► Success Message Displayed
```

---

### 2. Frontend Fetches Store Mode

```
App Initialization
   │
   ▼
Root Layout (Provider)
   │
   ▼
StoreModeProvider
   │
   │ useEffect() on mount
   │
   ▼
GET /api/settings/store-mode
   │
   │ No body
   │
   ▼
Prisma ORM
   │
   │ systemSettings.findFirst()
   │
   ▼
PostgreSQL Database
   │
   │ SELECT * FROM system_settings LIMIT 1
   │
   ▼
Response
   │
   │ { success: true, storeMode: "WHOLESALE" }
   │
   ▼
StoreModeProvider
   │
   │ setStoreMode("WHOLESALE")
   │ setLoading(false)
   │
   ▼
Context Available
   │
   └─► All child components can access
```

---

### 3. Product Page Uses Store Mode

```
Product Detail Page
   │
   │ const { storeMode, isWholesale } = useStoreMode()
   │
   ▼
Context Hook
   │
   │ Returns cached state
   │ (no API call needed)
   │
   ▼
Product Component
   │
   │ getDisplayPrice(price, wholesalePrice, storeMode)
   │
   ▼
Helper Function
   │
   │ if (storeMode === "WHOLESALE" && wholesalePrice)
   │    return wholesalePrice
   │ else if (storeMode === "RETAIL")
   │    return price
   │ else if (storeMode === "BOTH")
   │    return { retail: price, wholesale: wholesalePrice }
   │
   ▼
Rendered UI
   │
   │ Wholesale Mode: "$45.00" (wholesale price)
   │ Retail Mode: "$59.99" (retail price)
   │ Both Mode: "Retail: $59.99 | Wholesale: $45.00"
   │
   └─► User sees appropriate pricing
```

---

### 4. Cart Validates MOQ

```
User clicks "Add to Cart"
   │
   │ quantity = 5, productId = "abc123"
   │
   ▼
Product Detail Page
   │
   │ handleAddToCart()
   │
   ▼
POST /api/cart
   │
   │ { productId: "abc123", quantity: 5 }
   │
   ▼
Cart API Handler
   │
   │ 1. Fetch product from DB
   │ 2. Fetch systemSettings.storeMode
   │ 3. Validate MOQ
   │
   ▼
MOQ Validation Logic
   │
   │ if (storeMode === "WHOLESALE" || storeMode === "BOTH")
   │    if (quantity < product.minOrderQty)
   │       return error
   │
   ▼
Validation Result
   │
   ├─► PASS: Add to cart
   │   │
   │   └─► Success Response
   │       { success: true, cart: {...} }
   │
   └─► FAIL: Return error
       │
       └─► Error Response
           { success: false, error: "Minimum order quantity is 10 units" }
```

---

## 📦 Component Hierarchy

```
RootLayout (/)
│
├─► StoreModeProvider
│   │
│   ├─► AdminAuthProvider
│   │   │
│   │   └─► Admin Pages
│   │       │
│   │       └─► Settings General Page
│   │           ├─► Store Mode Selector
│   │           └─► Save Button
│   │
│   └─► Public Pages
│       │
│       ├─► Product Detail Page
│       │   ├─► useStoreMode()
│       │   ├─► Price Display (mode-aware)
│       │   ├─► Quantity Selector (MOQ-aware)
│       │   └─► Add to Cart (validation)
│       │
│       ├─► Product Listing Page
│       │   └─► Product Cards
│       │       ├─► useStoreMode()
│       │       └─► Price Display (mode-aware)
│       │
│       ├─► Cart Page
│       │   ├─► useStoreMode()
│       │   └─► Cart Items (MOQ validated)
│       │
│       └─► Checkout Page
│           ├─► useStoreMode()
│           ├─► Shipping Form (always)
│           ├─► Company Form (wholesale only)
│           └─► Tax Exemption (wholesale only)
```

---

## 🗄️ Database Schema

```sql
-- SystemSettings table
CREATE TABLE system_settings (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'YIWU EXPRESS',
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  -- ... other company fields ...
  
  -- NEW FIELD
  store_mode TEXT NOT NULL DEFAULT 'WHOLESALE',
  -- Allowed values: 'WHOLESALE', 'RETAIL', 'BOTH'
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL
);

-- Product table (existing, no changes needed)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,              -- Retail price
  wholesale_price DECIMAL,              -- Wholesale price (optional)
  min_order_qty INTEGER DEFAULT 1,     -- Minimum order quantity
  stock INTEGER DEFAULT 0,
  -- ... other product fields ...
);
```

---

## 🔐 Security & Permissions

```
┌────────────────────────────────────────────────────────┐
│                  PERMISSION MATRIX                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  PUBLIC USERS (Customers)                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ✅ View products (mode-aware pricing)           │ │
│  │ ✅ Add to cart (subject to MOQ)                 │ │
│  │ ✅ View checkout (mode-aware fields)            │ │
│  │ ❌ View store mode setting                      │ │
│  │ ❌ Change store mode                            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ADMIN USERS                                          │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ✅ View products (all pricing)                   │ │
│  │ ✅ View store mode setting                       │ │
│  │ ✅ Change store mode                             │ │
│  │ ✅ Access admin settings                         │ │
│  │ ✅ View all orders                               │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🧩 Integration Points

### 1. Price Display
```
Input: product { price, wholesalePrice }, storeMode
Process: getDisplayPrice() helper function
Output: { displayPrice, priceType }
Used in: Product pages, cart, order summary
```

### 2. MOQ Enforcement
```
Input: quantity, product.minOrderQty, storeMode
Process: getEffectiveMinOrderQty() helper function
Output: effectiveMinQty (1 for retail, original for wholesale)
Used in: Quantity selector, cart validation
```

### 3. Checkout Fields
```
Input: storeMode
Process: Conditional rendering based on isWholesale
Output: Show/hide company fields, tax exemption
Used in: Checkout page
```

### 4. Cart Validation
```
Input: productId, quantity, storeMode (from DB)
Process: Server-side MOQ validation
Output: Success or error response
Used in: POST /api/cart endpoint
```

---

## 🎯 Decision Points

### When to Show Wholesale Pricing?
```
┌─────────────────┐
│   storeMode     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
WHOLESALE   RETAIL    BOTH
    │         │         │
    ▼         ▼         ▼
  Show      Show      Show
wholesale  retail    both
  price    price   options
```

### When to Enforce MOQ?
```
┌─────────────────┐
│   storeMode     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
WHOLESALE   RETAIL    BOTH
    │         │         │
    ▼         ▼         ▼
  Yes        No        Yes
(enforce   (MOQ=1)  (enforce
  MOQ)               MOQ)
```

### When to Show Company Fields?
```
┌─────────────────┐
│   storeMode     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
WHOLESALE   RETAIL    BOTH
    │         │         │
    ▼         ▼         ▼
  Yes        No        Yes
(required) (hidden)  (optional)
```

---

## 📊 State Management

### Context State
```typescript
interface StoreModeContextType {
  storeMode: 'WHOLESALE' | 'RETAIL' | 'BOTH'
  isWholesale: boolean      // true if WHOLESALE or BOTH
  isRetail: boolean         // true if RETAIL or BOTH
  isBoth: boolean           // true if BOTH
  loading: boolean          // true during initial fetch
  error: string | null      // error message if fetch fails
  refreshStoreMode: () => Promise<void>  // manual refresh
}
```

### Helper Functions
```typescript
// Returns the price to display based on mode
getDisplayPrice(
  price: number,
  wholesalePrice: number | null,
  storeMode: StoreMode
): { displayPrice: number; priceType: string }

// Returns true if MOQ should be enforced
shouldEnforceMOQ(storeMode: StoreMode): boolean

// Returns effective minimum order quantity
getEffectiveMinOrderQty(
  minOrderQty: number,
  storeMode: StoreMode
): number
```

---

## 🚀 Performance Optimization

### Caching Strategy
```
1. Initial Load:
   - Fetch store mode on app mount
   - Store in React Context (memory cache)
   - No subsequent API calls needed

2. Mode Change:
   - Admin updates mode via API
   - Context automatically refreshes
   - Public users get updated mode on next page load

3. Optimization:
   - Single API call per session
   - No prop drilling (Context API)
   - Helper functions are pure (no side effects)
```

---

## 🔄 Future Enhancements

### Phase 1 (Current)
- ✅ Database schema
- ✅ API endpoints
- ✅ Admin UI
- ✅ Context provider
- ✅ Helper functions

### Phase 2 (Next)
- [ ] Product page integration
- [ ] Cart MOQ validation
- [ ] Checkout conditional fields
- [ ] Price display updates

### Phase 3 (Later)
- [ ] User mode switching (for BOTH mode)
- [ ] Pricing calculator widget
- [ ] Bulk discount tiers
- [ ] Quote request for large orders

### Phase 4 (Advanced)
- [ ] Dynamic pricing rules engine
- [ ] Volume-based discounts
- [ ] Customer-specific pricing
- [ ] Contract pricing

---

## 📈 Monitoring & Analytics

### Key Metrics to Track
```
1. Store Mode Distribution
   - % of time in wholesale mode
   - % of time in retail mode
   - % of time in both mode

2. Conversion Rates by Mode
   - Wholesale conversion rate
   - Retail conversion rate
   - Average order value by mode

3. MOQ Impact
   - % of carts abandoned due to MOQ
   - Average MOQ vs actual order quantity
   - MOQ adjustment frequency

4. Checkout Behavior
   - % of wholesale customers completing company fields
   - % of tax exemption claims
   - Checkout abandonment by mode
```

---

**Last Updated:** July 14, 2026  
**Version:** 1.0.0  
**Status:** Architecture Documented - Ready for Implementation
