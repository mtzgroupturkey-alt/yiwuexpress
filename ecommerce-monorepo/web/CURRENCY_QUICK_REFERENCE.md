# 💰 CURRENCY SYSTEM - QUICK REFERENCE

## 🚀 QUICK START

```cmd
cd ecommerce-monorepo\web
npm run dev
```

Server: http://localhost:3005

---

## 📊 AVAILABLE CURRENCIES

| Code | Name | Symbol | Rate |
|------|------|--------|------|
| USD | US Dollar | $ | 1.0 (BASE) |
| CNY | Chinese Yuan | ¥ | 7.2 |
| EUR | Euro | € | 0.92 |
| GBP | British Pound | £ | 0.79 |
| JPY | Japanese Yen | ¥ | 149.5 |
| RUB | Russian Ruble | ₽ | 92.5 |

---

## 🔧 API ENDPOINTS

### Get All Currencies
```
GET /api/currencies
GET /api/currencies?active=true
```

### Convert Currency
```
POST /api/currency/convert
Body: {
  "amount": 720,
  "from": "CNY",
  "to": "USD"
}
```

### Update Exchange Rate (Admin)
```
POST /api/admin/currencies/rate
Body: {
  "code": "CNY",
  "rate": 7.3,
  "notes": "Updated from bank"
}
```

---

## 💻 CODE EXAMPLES

### Convert Currency
```typescript
import { currencyService } from '@/lib/currency-service'

const usd = await currencyService.convert(720, 'CNY', 'USD')
// Result: 100.00
```

### Format Amount
```typescript
const formatted = await currencyService.formatAmount(150, 'USD')
// Result: "$150.00"
```

### Calculate Profit
```typescript
import { profitCalculator } from '@/lib/profit-calculator'

const profit = await profitCalculator.calculateOrderProfit(order)
// { profit: 50, profitMargin: 33.33, ... }
```

### Update Rate
```typescript
await currencyService.updateRate('CNY', 7.3, 'Manual update')
```

---

## 🧪 TEST COMMANDS

```cmd
# Test system
TEST-CURRENCY-SYSTEM.bat

# Check currencies
curl http://localhost:3005/api/currencies

# Test conversion (PowerShell)
curl -Method POST -Uri "http://localhost:3005/api/currency/convert" `
  -ContentType "application/json" `
  -Body '{"amount":720,"from":"CNY","to":"USD"}'
```

---

## 📁 KEY FILES

### Services
- `lib/currency-service.ts` - Currency operations
- `lib/profit-calculator.ts` - Profit calculations

### API Routes
- `app/api/currencies/route.ts`
- `app/api/currency/convert/route.ts`
- `app/api/admin/currencies/rate/route.ts`

### Database
- `prisma/schema.prisma` - Currency models
- `prisma/seed-currencies.ts` - Seeder

---

## 💡 COMMON SCENARIOS

### Buy CNY → Sell USD
```
Purchase: ¥720 CNY
  ↓ Rate: 7.2
Cost: $100 USD
  ↓ Markup
Price: $150 USD
  ↓ Profit
Profit: $50 (33.33%)
```

### Update Exchange Rate
```
1. Check current: GET /api/currencies
2. Update: POST /api/admin/currencies/rate
3. Verify: GET /api/currencies
```

### Calculate Order Profit
```
Order Total: $150 USD
Product Cost: ¥720 CNY → $100 USD
Profit: $50 USD (33.33% margin)
```

---

## 🔧 TROUBLESHOOTING

**Prisma Error?**
```cmd
# Stop dev server
npx prisma generate
npm run dev
```

**No Currencies?**
```cmd
npx ts-node prisma/seed-currencies.ts
```

**Wrong Rate?**
```
POST /api/admin/currencies/rate
Body: { "code": "CNY", "rate": 7.3 }
```

---

## 📚 DOCUMENTATION

- `💰_MULTI_CURRENCY_SYSTEM.md` - Full documentation
- `🚀_START_HERE_CURRENCY.md` - Setup guide
- `🎉_CURRENCY_SYSTEM_COMPLETE.md` - Completion report

---

## ✅ STATUS

🟢 **SYSTEM ONLINE**  
🟢 **6 CURRENCIES ACTIVE**  
🟢 **ALL APIs WORKING**  
🟢 **CONVERSIONS ACCURATE**  

**Ready for multi-currency trading! 🌍💰**
