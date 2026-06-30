# 💰 MULTI-CURRENCY MANAGEMENT SYSTEM

## ✅ STATUS: READY FOR SETUP

**Implementation Date:** June 29, 2026  
**Status:** Code Complete - Ready for Database Migration  

---

## 🎯 OBJECTIVE

Complete multi-currency management system for YIWU EXPRESS that handles:

- **Purchase Currency:** CNY (buy from suppliers in China)
- **Sales Currency:** USD (sell to international customers)
- **Mixed Transactions:** Buy in CNY, sell in USD (or both)
- **Exchange Rate Management:** Real-time or manual rate updates
- **Profit Calculation:** Automatically calculate profit in base currency

---

## 📋 CURRENCY SCENARIOS

### Scenario 1: Buy CNY → Sell USD
```
Purchase from Supplier: ¥500 CNY
     ↓ Exchange Rate: 1 USD = 7.2 CNY
     ↓ Cost in USD: $69.44
     ↓ Sell to Customer: $150.00 USD
     ↓ Profit: $80.56 USD
```

### Scenario 2: Buy USD → Sell USD
```
Purchase from Supplier: $50.00 USD
     ↓ Sell to Customer: $150.00 USD
     ↓ Profit: $100.00 USD
```

### Scenario 3: Buy CNY → Sell CNY
```
Purchase from Supplier: ¥500 CNY
     ↓ Sell to Customer (China): ¥1,200 CNY
     ↓ Profit: ¥700 CNY
     ↓ Convert to USD for reporting: 700 / 7.2 = $97.22 USD
```

---

## 🗄️ DATABASE SCHEMA

### New Models Added

#### 1. Currency Model
```prisma
model Currency {
  id                    String    @id @default(cuid())
  code                  String    @unique // USD, CNY, EUR, etc.
  name                  String    // US Dollar, Chinese Yuan, etc.
  symbol                String    // $, ¥, €, ₽, etc.
  symbolPosition        String    @default("before") // before, after
  decimalPlaces         Int       @default(2)
  isBase                Boolean   @default(false) // Base currency for reporting
  isActive              Boolean   @default(true)
  exchangeRate          Float?    // Rate against base currency
  exchangeRateUpdatedAt DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

#### 2. ExchangeRateHistory Model
```prisma
model ExchangeRateHistory {
  id           String   @id @default(cuid())
  fromCurrency String
  toCurrency   String
  rate         Float
  date         DateTime @default(now())
  source       String?  // "manual", "api", "admin"
  notes        String?
  createdAt    DateTime @default(now())
}
```

### Updated Models

#### Product Model - Added Fields
```prisma
purchaseCurrency     String?  // Currency used for purchases (CNY)
purchasePrice        Float?   // Price in purchase currency
prices               Json?    // Multi-currency prices
```

#### Order Model - Added Fields
```prisma
currency       String   @default("USD") // Sales currency
exchangeRate   Float?   // Rate used at time of order
purchaseCost   Float?   // Cost in base currency
profit         Float?   // Profit in base currency
profitMargin   Float?   // Profit percentage
```

#### PurchaseOrder Model - Added Fields
```prisma
exchangeRate   Float?   // Rate used at time of purchase
costInBase     Float?   // Total cost converted to base currency
```

---

## 📁 FILES CREATED

### Core System Files

1. **`prisma/schema.prisma`** (Updated)
   - Added Currency and ExchangeRateHistory models
   - Updated Product, Order, PurchaseOrder models
   - Added currency tracking fields

2. **`prisma/seed-currencies.ts`**
   - Seeds 6 major currencies
   - Creates initial exchange rate history
   - Sets USD as base currency

3. **`lib/currency-service.ts`**
   - Currency conversion logic
   - Exchange rate management
   - Currency formatting
   - Rate history tracking

4. **`lib/profit-calculator.ts`**
   - Order profit calculation
   - Period profit reporting
   - Multi-currency cost tracking
   - Margin analysis

### API Routes

1. **`app/api/currencies/route.ts`**
   - GET: Fetch all currencies
   - Filter by active status

2. **`app/api/admin/currencies/rate/route.ts`**
   - POST: Update exchange rates manually
   - Creates rate history

3. **`app/api/currency/convert/route.ts`**
   - POST: Convert between currencies
   - Returns conversion details

### Setup Scripts

1. **`SETUP-CURRENCY-SYSTEM.bat`**
   - Runs database migration
   - Generates Prisma client
   - Seeds currencies
   - All-in-one setup

---

## 💱 SUPPORTED CURRENCIES

| Code | Name | Symbol | Position | Decimals | Rate (vs USD) |
|------|------|--------|----------|----------|---------------|
| USD | US Dollar | $ | before | 2 | 1.0 (Base) |
| CNY | Chinese Yuan | ¥ | before | 2 | 7.2 |
| EUR | Euro | € | before | 2 | 0.92 |
| RUB | Russian Ruble | ₽ | after | 2 | 92.50 |
| GBP | British Pound | £ | before | 2 | 0.79 |
| JPY | Japanese Yen | ¥ | before | 0 | 149.50 |

---

## 🔧 SETUP INSTRUCTIONS

### Method 1: Automated Setup (Recommended)

```cmd
cd ecommerce-monorepo\web
SETUP-CURRENCY-SYSTEM.bat
```

### Method 2: Manual Setup

```cmd
# Step 1: Run migration
npx prisma migrate dev --name add-multi-currency

# Step 2: Generate Prisma client
npx prisma generate

# Step 3: Seed currencies
npx ts-node prisma/seed-currencies.ts
```

---

## 🚀 USAGE EXAMPLES

### 1. Currency Conversion

```typescript
import { currencyService } from '@/lib/currency-service'

// Convert CNY to USD
const usdAmount = await currencyService.convert(500, 'CNY', 'USD')
// Result: 69.44

// Get conversion details
const result = await currencyService.convertWithDetails(500, 'CNY', 'USD')
// {
//   amount: 500,
//   from: 'CNY',
//   to: 'USD',
//   converted: 69.44,
//   rate: 0.1389
// }
```

### 2. Format Currency

```typescript
// Format with symbol
const formatted = await currencyService.formatAmount(150.50, 'USD')
// Result: "$150.50"

const formatted2 = await currencyService.formatAmount(1080, 'CNY')
// Result: "¥1080.00"
```

### 3. Update Exchange Rate

```typescript
// Update CNY rate to 7.3
await currencyService.updateRate('CNY', 7.3, 'Updated from central bank')
```

### 4. Calculate Order Profit

```typescript
import { profitCalculator } from '@/lib/profit-calculator'

const profit = await profitCalculator.calculateOrderProfit(order)
// {
//   orderId: "...",
//   salesRevenue: 150.00,
//   purchaseCost: 69.44,
//   profit: 80.56,
//   profitMargin: 53.71,
//   salesCurrency: "USD",
//   purchaseCurrency: "CNY",
//   baseCurrency: "USD"
// }
```

---

## 📊 API ENDPOINTS

### Get All Currencies
```
GET /api/currencies
GET /api/currencies?active=true

Response:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "exchangeRate": 1.0,
      "isBase": true
    }
  ]
}
```

### Convert Currency
```
POST /api/currency/convert

Body:
{
  "amount": 500,
  "from": "CNY",
  "to": "USD"
}

Response:
{
  "success": true,
  "data": {
    "amount": 500,
    "from": "CNY",
    "to": "USD",
    "converted": 69.44,
    "rate": 0.1389
  }
}
```

### Update Exchange Rate (Admin)
```
POST /api/admin/currencies/rate

Body:
{
  "code": "CNY",
  "rate": 7.3,
  "notes": "Updated manually"
}

Response:
{
  "success": true,
  "message": "Exchange rate updated successfully"
}
```

---

## 💡 KEY FEATURES

### ✅ Multi-Currency Support
- Buy from suppliers in CNY
- Sell to customers in USD, EUR, GBP, etc.
- Track costs and revenue in different currencies

### ✅ Exchange Rate Management
- Manual rate updates
- Historical rate tracking
- Rate change notifications
- Source tracking (manual, API, admin)

### ✅ Automatic Conversion
- Convert between any currencies
- Uses base currency (USD) for calculations
- Accurate cross-currency rates

### ✅ Profit Calculation
- Calculate profit in base currency
- Track purchase costs vs sales revenue
- Automatic margin calculation
- Support for mixed currency transactions

### ✅ Reporting
- All reports in base currency
- Period profit summaries
- Average profit margins
- Cost analysis

---

## 🎯 USE CASES

### 1. Purchase Order in CNY
```
1. Supplier currency: CNY
2. Create PO: ¥3,600 CNY
3. System converts: $500 USD (at rate 7.2)
4. Stores both amounts for tracking
```

### 2. Sales Order in USD
```
1. Customer currency: USD
2. Product cost: ¥720 CNY (¥100/unit × 7.2)
3. Selling price: $150 USD
4. Profit: $150 - $100 = $50 USD
```

### 3. Mixed Currency Reporting
```
Monthly Report (in USD):
- Sales (USD): $10,000
- Sales (CNY): ¥21,600 → $3,000
- Total Revenue: $13,000
- Purchase Costs: $6,000
- Total Profit: $7,000
- Margin: 53.8%
```

---

## 🔒 DATA INTEGRITY

### Exchange Rate Tracking
- All rate changes logged
- Historical rates preserved
- Source attribution (manual/API)
- Timestamp on all changes

### Transaction Snapshots
- Orders store rate at time of transaction
- Purchase orders store rate at time of purchase
- Historical accuracy maintained
- Audit trail complete

### Base Currency Consistency
- All reporting in base currency (USD)
- Consistent profit calculations
- Accurate cross-period comparisons
- No currency drift

---

## 📈 PROFIT CALCULATION LOGIC

### Formula
```
Sales Revenue (in base) - Purchase Cost (in base) = Profit

Where:
- Sales Revenue = Order Total × Exchange Rate (if not USD)
- Purchase Cost = Sum of (Item Cost × Quantity)
- Profit Margin = (Profit / Sales Revenue) × 100
```

### Example Calculation
```
Order:
- Customer pays: $150 USD
- Product cost: ¥720 CNY
- Exchange rate: 7.2

Calculations:
1. Sales Revenue: $150 USD (no conversion)
2. Purchase Cost: ¥720 / 7.2 = $100 USD
3. Profit: $150 - $100 = $50 USD
4. Margin: ($50 / $150) × 100 = 33.33%
```

---

## 🚦 TESTING

### Test Scenarios

#### 1. Basic Conversion
```typescript
// Test: CNY to USD
const result = await currencyService.convert(720, 'CNY', 'USD')
expect(result).toBe(100)
```

#### 2. Same Currency
```typescript
// Test: USD to USD (should return same)
const result = await currencyService.convert(100, 'USD', 'USD')
expect(result).toBe(100)
```

#### 3. Rate Update
```typescript
// Test: Update and verify
await currencyService.updateRate('CNY', 7.5)
const rate = await currencyService.getRate('CNY', 'USD')
expect(rate).toBeCloseTo(0.1333, 4)
```

#### 4. Profit Calculation
```typescript
// Test: Order profit
const order = {
  id: '123',
  total: 150,
  currency: 'USD',
  items: [
    { product: { costPrice: 50 }, quantity: 2 }
  ]
}
const profit = await profitCalculator.calculateOrderProfit(order)
expect(profit.profit).toBe(50)
expect(profit.profitMargin).toBeCloseTo(33.33, 2)
```

---

## ✅ COMPLETION CHECKLIST

### Database
- [x] Currency model created
- [x] ExchangeRateHistory model created
- [x] Product model updated
- [x] Order model updated
- [x] PurchaseOrder model updated

### Services
- [x] CurrencyService implemented
- [x] ProfitCalculator implemented
- [x] Conversion logic complete
- [x] Formatting logic complete

### API Routes
- [x] GET /api/currencies
- [x] POST /api/admin/currencies/rate
- [x] POST /api/currency/convert

### Data Seeding
- [x] Currency seeder created
- [x] 6 major currencies included
- [x] Exchange rates set
- [x] History tracking enabled

### Documentation
- [x] Setup instructions
- [x] Usage examples
- [x] API documentation
- [x] Testing scenarios

---

## 🎊 NEXT STEPS

### 1. Run Setup
```cmd
cd ecommerce-monorepo\web
SETUP-CURRENCY-SYSTEM.bat
```

### 2. Verify Setup
- Check database for Currency table
- Verify 6 currencies seeded
- Check exchange rates

### 3. Start Using
- Purchase orders can use CNY
- Sales orders can use USD
- System calculates profit automatically

### 4. Future Enhancements
- [ ] Admin UI for currency management
- [ ] Automatic rate updates from API
- [ ] Currency selector in product forms
- [ ] Multi-currency price display
- [ ] Currency conversion widget

---

## 📞 SUPPORT

### Common Issues

**Issue: Migration fails**
```
Solution: Ensure PostgreSQL is running
Check: DATABASE_URL in .env.local
```

**Issue: Seed fails**
```
Solution: Run migration first
Command: npx prisma migrate dev
```

**Issue: Rates not updating**
```
Solution: Check API endpoint
Verify: Admin authentication enabled
```

---

## 🎉 SUMMARY

**Status:** ✅ READY FOR SETUP

**What's Included:**
- ✅ Complete database schema
- ✅ Currency service with conversion
- ✅ Profit calculation engine
- ✅ API endpoints for management
- ✅ 6 major currencies seeded
- ✅ Exchange rate history tracking
- ✅ Automated setup script

**What You Can Do:**
- Buy in CNY, sell in USD
- Automatic profit calculation
- Multi-currency support
- Historical rate tracking
- Accurate reporting in base currency

---

**Ready to Setup?** Run: `SETUP-CURRENCY-SYSTEM.bat`

**ENJOY YOUR MULTI-CURRENCY SYSTEM! 💰🌍**
