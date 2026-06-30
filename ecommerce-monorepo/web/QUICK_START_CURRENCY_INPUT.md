# ⚡ QUICK START - CURRENCY INPUT

## 🚀 GET STARTED IN 3 STEPS

### Step 1: Start Server
```bash
cd web
npm run dev
```

### Step 2: Open Browser
```
http://localhost:3000/admin/purchase-orders/new
```

### Step 3: Test Features
Look for "Purchase Currency & Exchange Rate" section and test:
- ✅ Select currency (CNY, EUR, GBP)
- ✅ See exchange rate update
- ✅ Toggle manual override
- ✅ Enter custom rate
- ✅ Click refresh button

---

## 💻 USE IN YOUR CODE

### Import
```tsx
import { CurrencyInput } from '@/components/ui/CurrencyInput'
```

### Basic Usage
```tsx
const [currency, setCurrency] = useState('USD')
const [rate, setRate] = useState(1)
const [amount, setAmount] = useState(0)

<CurrencyInput
  value={amount}
  currency={currency}
  onCurrencyChange={setCurrency}
  rate={rate}
  onRateChange={setRate}
  onChange={(val, curr, rate) => setAmount(val)}
/>
```

---

## 📋 PROPS REFERENCE

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` | Amount value |
| `currency` | `string` | Currency code (USD, CNY, etc.) |
| `onCurrencyChange` | `function` | Called when currency changes |
| `rate` | `number` | Exchange rate |
| `onRateChange` | `function` | Called when rate changes |
| `onChange` | `function` | Called on any change |
| `showRate` | `boolean` | Show exchange rate section |
| `showBaseConversion` | `boolean` | Show base currency conversion |

---

## 🎯 COMMON PATTERNS

### Pattern 1: Simple Currency Selector
```tsx
<CurrencyInput
  currency={currency}
  onCurrencyChange={setCurrency}
  showRate={false}
/>
```

### Pattern 2: With Exchange Rate
```tsx
<CurrencyInput
  currency={currency}
  onCurrencyChange={setCurrency}
  rate={rate}
  onRateChange={setRate}
  showRate={true}
/>
```

### Pattern 3: Full Featured
```tsx
<CurrencyInput
  label="Purchase Amount"
  value={amount}
  currency={currency}
  onCurrencyChange={setCurrency}
  rate={rate}
  onRateChange={setRate}
  onChange={(val, curr, rate) => {
    setAmount(val)
    setTotalUSD(val * rate)
  }}
  showRate={true}
  showBaseConversion={true}
/>
```

### Pattern 4: Display Only
```tsx
<CurrencyInput
  value={total}
  currency="CNY"
  disabled={true}
  showRate={true}
/>
```

---

## 🔌 API ENDPOINT

### Get Exchange Rate
```
GET /api/currency/rate?from=CNY&to=USD
```

**Response:**
```json
{
  "from": "CNY",
  "to": "USD",
  "rate": 0.1389,
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 TEST IT

### Quick Test Script
```bash
cd web
TEST-CURRENCY-INPUT.bat
```

### Manual Test
1. Open: `http://localhost:3000/admin/purchase-orders/new`
2. Find: "Purchase Currency & Exchange Rate" section
3. Test all features

---

## 📚 FULL DOCUMENTATION

- **Complete Guide:** `🎯_MULTI_CURRENCY_INPUT_COMPLETE.md`
- **Visual Guide:** `CURRENCY_INPUT_VISUAL_GUIDE.md`
- **Summary:** `🎉_MULTI_CURRENCY_INPUT_READY.md`

---

## 🎉 YOU'RE READY!

Start using the CurrencyInput component in your forms now!
