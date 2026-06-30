# 🚀 START HERE - Multi-Currency System Setup

## ⚡ QUICK START (2 Minutes)

**Status:** ✅ Ready to Setup

---

## 🎯 WHAT YOU'LL GET

- 💰 Buy in **CNY** (Chinese Yuan) from suppliers
- 💵 Sell in **USD** (US Dollar) to customers  
- 🌍 Support for **EUR, GBP, RUB, JPY**
- 📊 Automatic **profit calculation** in base currency
- 💱 **Exchange rate management**
- 📈 **Historical rate tracking**

---

## 🚀 SETUP (One Command)

### Step 1: Run Setup Script

```cmd
cd ecommerce-monorepo\web
SETUP-CURRENCY-SYSTEM.bat
```

**This will:**
1. ✅ Create database tables (Currency, ExchangeRateHistory)
2. ✅ Update existing tables (Product, Order, PurchaseOrder)
3. ✅ Generate Prisma client
4. ✅ Seed 6 currencies with exchange rates

**Time:** ~2 minutes

---

## ✅ VERIFY SETUP

### Step 2: Test the System

```cmd
TEST-CURRENCY-SYSTEM.bat
```

**You should see:**
```
Currencies in database: 6
✅ Base currency: USD - US Dollar

USD   $   US Dollar             Rate: 1 (BASE)
CNY   ¥   Chinese Yuan          Rate: 7.2
EUR   €   Euro                  Rate: 0.92
GBP   £   British Pound         Rate: 0.79
JPY   ¥   Japanese Yen          Rate: 149.5
RUB   ₽   Russian Ruble         Rate: 92.5
```

---

## 🎯 START USING

### Step 3: Start Development Server

```cmd
npm run dev
```

### Step 4: Test API

**Get Currencies:**
```
http://localhost:3005/api/currencies
```

**Convert Currency:**
```bash
POST http://localhost:3005/api/currency/convert
Body: {
  "amount": 720,
  "from": "CNY",
  "to": "USD"
}

Response: {
  "amount": 720,
  "from": "CNY",
  "to": "USD",
  "converted": 100,
  "rate": 0.1389
}
```

---

## 💡 USAGE IN CODE

### Convert Currency
```typescript
import { currencyService } from '@/lib/currency-service'

// Convert ¥720 CNY to USD
const usdAmount = await currencyService.convert(720, 'CNY', 'USD')
console.log(usdAmount) // 100.00
```

### Calculate Order Profit
```typescript
import { profitCalculator } from '@/lib/profit-calculator'

const profit = await profitCalculator.calculateOrderProfit(order)
console.log(profit)
// {
//   salesRevenue: 150.00,
//   purchaseCost: 100.00,
//   profit: 50.00,
//   profitMargin: 33.33
// }
```

### Format Currency
```typescript
const formatted = await currencyService.formatAmount(150.50, 'USD')
console.log(formatted) // "$150.50"
```

---

## 📊 EXAMPLE SCENARIO

### Buy in CNY, Sell in USD

```
1. Purchase from Supplier (China)
   - Cost: ¥720 CNY
   - Exchange Rate: 1 USD = 7.2 CNY
   - Cost in USD: $100

2. Sell to Customer (USA)
   - Price: $150 USD

3. Profit (Automatic)
   - Revenue: $150
   - Cost: $100
   - Profit: $50
   - Margin: 33.33%
```

**All calculations done automatically by the system!**

---

## 🎯 SUPPORTED CURRENCIES

| Currency | Code | Symbol | Rate (vs USD) |
|----------|------|--------|---------------|
| US Dollar | USD | $ | 1.0 (Base) |
| Chinese Yuan | CNY | ¥ | 7.2 |
| Euro | EUR | € | 0.92 |
| British Pound | GBP | £ | 0.79 |
| Japanese Yen | JPY | ¥ | 149.50 |
| Russian Ruble | RUB | ₽ | 92.50 |

---

## 🔧 UPDATE EXCHANGE RATES

### Via API (Admin)
```bash
POST /api/admin/currencies/rate
Body: {
  "code": "CNY",
  "rate": 7.3,
  "notes": "Updated from central bank"
}
```

### Via Code
```typescript
import { currencyService } from '@/lib/currency-service'

await currencyService.updateRate('CNY', 7.3, 'Manual update')
```

---

## 📚 DOCUMENTATION

**Full Documentation:**
- `💰_MULTI_CURRENCY_SYSTEM.md` - Complete guide
- `✅_CURRENCY_SYSTEM_READY.md` - Implementation details

**Setup Scripts:**
- `SETUP-CURRENCY-SYSTEM.bat` - One-click setup
- `TEST-CURRENCY-SYSTEM.bat` - Verify installation

**Code:**
- `lib/currency-service.ts` - Currency operations
- `lib/profit-calculator.ts` - Profit calculations

---

## ✅ CHECKLIST

Setup complete when you see:
- [x] 6 currencies in database
- [x] USD set as base currency
- [x] Exchange rates populated
- [x] API endpoints working
- [x] Test conversions successful

---

## 🎊 YOU'RE READY!

**The system is ready to use!**

### What You Can Do Now:
- ✅ Create purchase orders in CNY
- ✅ Create sales orders in USD  
- ✅ Calculate profits automatically
- ✅ Convert between currencies
- ✅ Track exchange rate history
- ✅ Generate reports in base currency

---

## 🚀 QUICK COMMANDS

```cmd
# Setup (first time only)
SETUP-CURRENCY-SYSTEM.bat

# Test
TEST-CURRENCY-SYSTEM.bat

# Start server
npm run dev

# Check currencies
curl http://localhost:3005/api/currencies
```

---

**Ready?** Run: `SETUP-CURRENCY-SYSTEM.bat`

**ENJOY YOUR MULTI-CURRENCY SYSTEM! 💰🌍**
