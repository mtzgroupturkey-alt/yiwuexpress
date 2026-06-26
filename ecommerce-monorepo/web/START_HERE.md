# 🚀 START HERE - Quick Setup Guide

## You're seeing no products or database tables?

**Run this ONE command:**

```bash
SETUP-COMPLETE.bat
```

Double-click the file `SETUP-COMPLETE.bat` in this folder, and it will:
1. ✓ Install all dependencies
2. ✓ Generate Prisma client
3. ✓ Create all database tables (21 tables)
4. ✓ Add 5 sample products
5. ✓ Create test user accounts
6. ✓ Set up countries with shipping rates

**Total time: 3-5 minutes**

---

## Manual Setup (if script doesn't work)

### Step 1: Install
```bash
npm install
```

### Step 2: Setup Database
```bash
npx prisma generate
npx prisma db push --accept-data-loss
npx tsx prisma/seed-products.ts
```

### Step 3: Start Server
```bash
npm run dev
```

---

## After Setup - Test Pages

### Customer Pages (TEST THESE)
- **Products:** http://localhost:3001/products
- **Product Detail:** Click any product
- **Cart:** http://localhost:3001/cart (requires login)
- **Checkout:** http://localhost:3001/checkout (requires items in cart)
- **Orders:** http://localhost:3001/orders (requires login)

### Admin Pages (TEST THESE)
- **Products List:** http://localhost:3001/admin/products
- **Add Product:** http://localhost:3001/admin/products/new
- **Orders List:** http://localhost:3001/admin/orders

### Login
- **Login Page:** http://localhost:3001/login
- **Test Customer:** customer@test.com / password123
- **Test Admin:** admin@test.com / password123

---

## What You'll See

After setup, you should have:

**5 Sample Products:**
1. Wireless Bluetooth Headphones ($59.99)
2. USB-C Fast Charging Cable ($12.99)
3. Cotton T-Shirt ($19.99)
4. Ceramic Coffee Mug Set ($24.99)
5. Portable Power Bank ($34.99)

**3 Categories:**
- Electronics
- Clothing
- Home Goods

**Database Tables Created:**
- products
- categories
- orders
- carts
- users
- countries
- And 15 more...

---

## Troubleshooting

### "PostgreSQL not running"
**Fix:** Start PostgreSQL service in WAMP/XAMPP or Windows Services

### "Database connection failed"
**Fix:** Check `.env.local` file:
```
DATABASE_URL="postgresql://postgres:balkhi123@localhost:5432/ecommerce"
```

### "Products page is blank"
**Fix:** Run seed script:
```bash
npx tsx prisma/seed-products.ts
```

### "Port 3001 in use"
**Fix:** Change port in `.env.local`:
```
PORT=3002
```

---

## Quick Checklist

Before asking for help, verify:

- [x] PostgreSQL is running
- [x] Ran `npm install`
- [x] Ran `npx prisma generate`
- [x] Ran `npx prisma db push`
- [x] Ran seed script
- [x] Server started with `npm run dev`
- [x] Visited http://localhost:3001/products

---

## Need More Help?

1. **Run diagnostics:** `check-setup.bat`
2. **Read full guide:** `SETUP_INSTRUCTIONS.md`
3. **Check implementation:** `IMPLEMENTATION_GUIDE.md`

---

## Success Indicators

You know setup worked when:
- ✓ Products page shows 5 items
- ✓ You can click a product and see details
- ✓ You can login with test account
- ✓ Admin panel shows product list
- ✓ You can create a new product

**Everything working? Great! Start customizing!**
