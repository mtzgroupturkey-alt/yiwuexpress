# 💱 CURRENCY INPUT - VISUAL GUIDE

## 🎯 COMPONENT OVERVIEW

The CurrencyInput component provides a complete multi-currency input solution with automatic exchange rate display and manual override capabilities.

---

## 📸 COMPONENT STATES

### 1. BASIC INPUT (USD - No Exchange Rate)
```
┌────────────────────────────────────────────────┐
│ Amount                            💰 USD $     │
├────────────────────────────────────────────────┤
│                                                 │
│  [100.00              ]  [$ USD       ▼]      │
│                                                 │
└────────────────────────────────────────────────┘
```
When currency = base currency, no exchange rate is shown.

---

### 2. WITH AUTOMATIC EXCHANGE RATE (CNY)
```
┌────────────────────────────────────────────────┐
│ Amount                            💰 CNY ¥     │
├────────────────────────────────────────────────┤
│                                                 │
│  [10,000.00           ]  [¥ CNY       ▼]      │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ 🔄 Exchange Rate  1 CNY = 0.1389 USD       │ │
│ │                           🔄   Manual ⚪   │ │
│ │                                            │ │
│ │ 1 CNY = 0.1389 USD                        │ │
│ │ Updated: January 15, 2024                 │ │
│ │                                            │ │
│ │ ─────────────────────────────────────────  │ │
│ │ Base Currency Value     1,389.00 USD      │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**Features Shown:**
- ✅ Currency symbol badge (¥ CNY)
- ✅ Exchange rate display
- ✅ Refresh button (🔄)
- ✅ Manual toggle (off)
- ✅ Rate timestamp
- ✅ Base conversion

---

### 3. MANUAL RATE OVERRIDE (ENABLED)
```
┌────────────────────────────────────────────────┐
│ Amount                            💰 CNY ¥     │
├────────────────────────────────────────────────┤
│                                                 │
│  [10,000.00           ]  [¥ CNY       ▼]      │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ 🔄 Exchange Rate  1 CNY = 0.1500 USD       │ │
│ │                           🔄   Manual ⚫   │ │
│ │                                            │ │
│ │ 1 CNY = [0.1500    ] USD (manual override)│ │
│ │                                            │ │
│ │ ─────────────────────────────────────────  │ │
│ │ Base Currency Value     1,500.00 USD      │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**Features Shown:**
- ✅ Manual toggle (ON - dark)
- ✅ Editable rate input field
- ✅ Manual override indicator
- ✅ Real-time conversion update

---

### 4. LOADING STATE
```
┌────────────────────────────────────────────────┐
│ Amount                                         │
├────────────────────────────────────────────────┤
│                                                 │
│  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   │
│                                                 │
└────────────────────────────────────────────────┘
```
Pulsing gray animation while loading currencies.

---

## 🎨 PURCHASE ORDER INTEGRATION

### FULL PURCHASE ORDER VIEW
```
┌────────────────────────────────────────────────────┐
│ 📦 Create Purchase Order                          │
├────────────────────────────────────────────────────┤
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │ Order Information                            │  │
│ ├──────────────────────────────────────────────┤  │
│ │                                              │  │
│ │ Supplier *                                   │  │
│ │ [Select Supplier...              ▼]         │  │
│ │                                              │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │ Purchase Currency & Exchange Rate            │  │
│ │                                💰 CNY ¥      │  │
│ ├──────────────────────────────────────────────┤  │
│ │                                              │  │
│ │ [0.00               ]  [¥ CNY       ▼]      │  │
│ │                                              │  │
│ │ ┌──────────────────────────────────────────┐│  │
│ │ │ Exchange Rate  1 CNY = 0.1389 USD        ││  │
│ │ │                     🔄        Manual ⚪  ││  │
│ │ │                                          ││  │
│ │ │ 1 CNY = 0.1389 USD                      ││  │
│ │ │ Updated: Jan 15, 2024                   ││  │
│ │ └──────────────────────────────────────────┘│  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │ Order Items                    [+ Add Product]│ │
│ ├──────────────────────────────────────────────┤  │
│ │                                              │  │
│ │ Product A                            [🗑]    │  │
│ │ SKU: PRD-001                                 │  │
│ │                                              │  │
│ │ Quantity    Unit Price (CNY)   Total (CNY)  │  │
│ │ [10   ]     [500.00      ]     5,000.00     │  │
│ │                                              │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │ Order Totals                                 │  │
│ ├──────────────────────────────────────────────┤  │
│ │                                              │  │
│ │ Subtotal (CNY):                   10,000.00 │  │
│ │ Tax (CNY):                            500.00 │  │
│ │ Shipping (CNY):                       200.00 │  │
│ │ Discount (CNY):                      -100.00 │  │
│ │ ──────────────────────────────────────────── │  │
│ │ Total (CNY):                      10,600.00 │  │
│ │ ──────────────────────────────────────────── │  │
│ │ Exchange Rate:         1 CNY = 0.1389 USD   │  │
│ │ Total (USD):                    $1,472.34   │  │
│ │                                              │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│                         [Cancel]  [Create Order]   │
└────────────────────────────────────────────────────┘
```

---

## 🔄 INTERACTION FLOW

### 1. SELECT CURRENCY
```
Click Currency Dropdown
         ↓
┌────────────────────┐
│ $ USD              │
│ ¥ CNY              │ ← Select
│ € EUR              │
│ £ GBP              │
└────────────────────┘
         ↓
Exchange Rate Loads Automatically
```

### 2. REFRESH RATE
```
Current Rate: 1 CNY = 0.1389 USD
         ↓
Click Refresh Icon 🔄
         ↓
[Loading...]
         ↓
Updated Rate: 1 CNY = 0.1391 USD
```

### 3. MANUAL OVERRIDE
```
Auto Rate: 1 CNY = 0.1389 USD
         ↓
Toggle Manual ON ⚫
         ↓
┌────────────────────────────┐
│ 1 CNY = [0.1389  ] USD    │
│         ^^^^^^^^           │
│         Editable           │
└────────────────────────────┘
         ↓
Type New Rate: 0.1500
         ↓
Conversion Updates: 10,000 CNY = $1,500 USD
```

---

## 🎯 USE CASES

### USE CASE 1: Purchase Order in CNY
**Scenario:** Buying products from Chinese supplier

1. Select Supplier
2. Currency auto-shows CNY (if supplier default)
3. Exchange rate loads: 1 CNY = 0.1389 USD
4. Add products with CNY prices
5. See totals in both CNY and USD
6. **Result:** Clear understanding of costs in both currencies

---

### USE CASE 2: Manual Rate for Future Order
**Scenario:** Creating order for future delivery with negotiated rate

1. Select currency: CNY
2. System shows current rate: 0.1389
3. Toggle Manual Override ON
4. Enter negotiated rate: 0.1400
5. Order uses custom rate
6. **Result:** Future-proof pricing with agreed rate

---

### USE CASE 3: Multi-Currency Product Pricing
**Scenario:** Setting product prices in different markets

1. Enter product cost price: 500 CNY
2. See USD equivalent: $69.45
3. Set markup in USD
4. See final price in both currencies
5. **Result:** Accurate multi-currency pricing

---

## 📊 COMPONENT PROPS CHEATSHEET

```typescript
// Minimal - Just currency selection
<CurrencyInput
  currency={currency}
  onCurrencyChange={setCurrency}
/>

// Standard - With exchange rate
<CurrencyInput
  value={amount}
  currency={currency}
  onCurrencyChange={setCurrency}
  rate={rate}
  onRateChange={setRate}
  showRate={true}
/>

// Full Featured - Everything
<CurrencyInput
  label="Purchase Amount"
  value={amount}
  onChange={(val, curr, rate) => {
    setAmount(val)
    setCurrency(curr)
    setRate(rate)
  }}
  currency={currency}
  onCurrencyChange={setCurrency}
  rate={rate}
  onRateChange={setRate}
  showRate={true}
  showBaseConversion={true}
  baseCurrency="USD"
  placeholder="0.00"
/>

// Display Only
<CurrencyInput
  value={amount}
  currency={currency}
  disabled={true}
  showRate={true}
/>

// Filtered Currencies
<CurrencyInput
  currency={currency}
  onCurrencyChange={setCurrency}
  availableCurrencies={['USD', 'CNY', 'EUR']}
/>
```

---

## 🎨 COLOR SCHEME

| Element | Color | Usage |
|---------|-------|-------|
| Primary | `#1a3a5c` | Buttons, active states |
| Success | `#10b981` | USD totals, positive |
| Gray-50 | `#f9fafb` | Rate section background |
| Gray-500 | `#6b7280` | Secondary text |
| Gray-600 | `#4b5563` | Label text |
| Red-500 | `#ef4444` | Discounts, errors |

---

## ✅ ACCESSIBILITY

- ✅ Keyboard navigable
- ✅ Screen reader compatible
- ✅ ARIA labels on inputs
- ✅ Clear visual feedback
- ✅ High contrast ratios
- ✅ Focus indicators

---

## 🚀 PERFORMANCE

- ✅ Rate caching (1 hour stale time)
- ✅ Lazy loading of currencies
- ✅ Debounced calculations
- ✅ Memoized components
- ✅ Efficient re-renders

---

## 📱 RESPONSIVE DESIGN

### Desktop (>1024px)
```
┌──────────────────────────────────┐
│ [Amount Input    ] [Currency ▼] │
│ Exchange Rate Section            │
└──────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌──────────────────────────────────┐
│ [Amount Input    ] [Currency ▼] │
│ Exchange Rate Section            │
└──────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────┐
│ [Amount Input  ] │
│ [Currency  ▼]    │
│ Exchange Rate    │
│ Section          │
└──────────────────┘
```

Inputs stack vertically on mobile for better usability.

---

## 🎉 QUICK START

### 1. Import Component
```tsx
import { CurrencyInput } from '@/components/ui/CurrencyInput'
```

### 2. Add to Form
```tsx
const [currency, setCurrency] = useState('CNY')
const [rate, setRate] = useState(7.2)
const [amount, setAmount] = useState(0)

<CurrencyInput
  value={amount}
  currency={currency}
  onCurrencyChange={setCurrency}
  rate={rate}
  onRateChange={setRate}
  onChange={(val) => setAmount(val)}
/>
```

### 3. Use Values
```tsx
const totalInUSD = amount * rate
console.log(`${amount} ${currency} = $${totalInUSD} USD`)
```

---

## 🔍 TROUBLESHOOTING

### Issue: Exchange rate not loading
**Solution:** Check that:
- Currency exists in database
- Currency has `isActive: true`
- Exchange rate is set
- API endpoint is accessible

### Issue: Manual rate not working
**Solution:** 
- Ensure toggle is ON (dark/checked)
- Enter rate greater than 0.0001
- Check that input has focus

### Issue: Currencies not showing
**Solution:**
- Verify `/api/currencies?active=true` returns data
- Check database has active currencies
- Ensure Prisma client is connected

---

## 📚 RELATED DOCUMENTATION

- [Currency System Complete](🎉_CURRENCY_COMPLETE.md)
- [Multi-Currency System](💰_MULTI_CURRENCY_SYSTEM.md)
- [Exchange Rate Service](📡_AUTO_EXCHANGE_RATES.md)
- [Purchase System](🚀_PURCHASE_SYSTEM_QUICK_START.md)

---

**Ready to use! Test it now at:**
```
http://localhost:3000/admin/purchase-orders/new
```
