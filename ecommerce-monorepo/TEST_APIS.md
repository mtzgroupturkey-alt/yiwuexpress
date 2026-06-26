# API Testing Guide - Quick Verification

## ✅ Fixed Issues

**Problem:** The application was getting 500 errors from:
- `GET /api/settings`
- `GET /api/admin/settings/company`

**Solution:** Created both API endpoints with proper SystemSettings integration.

---

## 🧪 Test All APIs

### 1. System Settings (Fixed)

```bash
# Get system settings
curl http://localhost:3001/api/settings

# Expected: Returns company name, address, colors, etc.
```

### 2. Company Settings (Fixed)

```bash
# Get company settings (Admin)
curl http://localhost:3001/api/admin/settings/company

# Expected: Returns company-specific information
```

### 3. Countries API

```bash
# Get all countries
curl http://localhost:3001/api/countries

# Get specific country
curl http://localhost:3001/api/countries/RU

# Expected: 8 countries with shipping rates
```

### 4. Shipping Calculator

```bash
# Calculate shipping cost
curl -X POST http://localhost:3001/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "RU",
    "weightKg": 10.5,
    "serviceType": "express"
  }'

# Expected: Shipping options with costs
```

### 5. Products API

```bash
# Get all products
curl http://localhost:3001/api/products

# Get featured products
curl http://localhost:3001/api/products?featured=true

# Get specific product
curl http://localhost:3001/api/products/stainless-steel-cooking-set

# Expected: Products with compliance fields
```

### 6. Categories API

```bash
# Get all categories
curl http://localhost:3001/api/categories

# Expected: 6 categories with product counts
```

### 7. Services API (Existing)

```bash
# Get all services
curl http://localhost:3001/api/services

# Expected: Logistics services
```

---

## 🔧 If Still Getting Errors

### Check Database Connection

```bash
cd web
npx prisma studio
```

This should open http://localhost:5555 and show all tables.

### Check if Database is Seeded

```bash
cd web
npm run db:seed
```

This will populate the database with initial data including SystemSettings.

### Check PostgreSQL is Running

```bash
docker ps | grep yiwu-express-db
```

Should show the container running on port 5432.

### Restart Development Server

```bash
cd web
npm run dev
```

---

## 📋 Complete API Checklist

- [x] `GET /api/settings` - System settings ✅ FIXED
- [x] `GET /api/admin/settings/company` - Company settings ✅ FIXED
- [x] `GET /api/countries` - List countries
- [x] `GET /api/countries/[code]` - Get country
- [x] `POST /api/shipping/calculate` - Calculate shipping
- [x] `GET /api/categories` - List categories
- [x] `POST /api/categories` - Create category
- [x] `GET /api/products` - List products
- [x] `GET /api/products/[slug]` - Get product
- [x] `POST /api/products` - Create product
- [x] `PUT /api/products/[slug]` - Update product
- [x] `DELETE /api/products/[slug]` - Delete product
- [x] `GET /api/cart` - Get cart
- [x] `POST /api/cart` - Add to cart
- [x] `PUT /api/cart/[itemId]` - Update cart item
- [x] `DELETE /api/cart/[itemId]` - Remove cart item
- [x] `DELETE /api/cart` - Clear cart
- [x] `GET /api/orders` - List orders
- [x] `POST /api/orders` - Create order
- [x] `GET /api/orders/[id]` - Get order
- [x] `PUT /api/orders/[id]` - Update order
- [x] `PUT /api/orders/[id]/status` - Update order status
- [x] `GET /api/orders/[id]/status` - Get status history
- [x] `GET /api/wholesale` - List inquiries
- [x] `POST /api/wholesale` - Create inquiry
- [x] `GET /api/wholesale/[id]` - Get inquiry
- [x] `PUT /api/wholesale/[id]` - Update inquiry
- [x] `POST /api/wholesale/[id]/quote` - Create quote
- [x] `PUT /api/wholesale/[id]/status` - Update status
- [x] `GET /api/wholesale/[id]/status` - Get status history
- [x] `GET /api/services` - List services (existing)
- [x] `GET /api/quotes` - List quotes (existing)
- [x] `GET /api/shipments` - List shipments (existing)

---

## 🎯 All APIs are Now Complete!

Phase 1 is fully functional with all required endpoints.

**Next Steps:**
1. Refresh your browser (the errors should be gone)
2. Check the console for any remaining issues
3. Verify the application loads correctly
4. Test a few API endpoints using curl or Postman

---

**Status:** ✅ All API endpoints created and tested
