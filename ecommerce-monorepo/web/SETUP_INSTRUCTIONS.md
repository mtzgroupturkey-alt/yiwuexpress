# 🚀 Complete Setup Instructions

## Problem: No Products Page or Database Tables?

Follow these steps in order:

## Step 1: Verify Prerequisites

### Check if PostgreSQL is running
```bash
# Open Command Prompt and check:
pg_isready -h localhost -p 5432
```

**If PostgreSQL is NOT running:**
- Start WAMP/XAMPP PostgreSQL service
- OR start PostgreSQL service from Windows Services
- OR run: `net start postgresql-x64-15` (adjust version)

### Check Node.js
```bash
node --version
# Should show v18 or higher
```

## Step 2: Install Dependencies

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm install
```

**Wait for installation to complete** (may take 2-5 minutes)

## Step 3: Setup Database

### Option A: Use the Setup Script (Recommended)
```bash
# Double-click this file:
setup-database.bat
```

### Option B: Manual Setup
```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Create database tables
npx prisma db push --accept-data-loss

# 3. Add sample data
npx tsx prisma/seed-products.ts
```

## Step 4: Verify Database

### Check if tables exist
```bash
npx prisma studio
```

This opens a browser at `http://localhost:5555` where you can see:
- User table
- Product table
- Category table
- Order table
- Cart table
- Country table
- etc.

**Expected tables (21 total):**
- users
- products
- categories
- orders
- order_items
- carts
- cart_items
- countries
- shipping_rates
- wholesale_inquiries
- addresses
- notifications
- services
- quotes
- shipments
- company_infos
- system_settings
- permission_roles
- role_permissions
- user_permissions
- order_exceptions

## Step 5: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
> yiwu-express-web@1.0.0 dev
> node server.js

YIWU EXPRESS - Server Configuration
=====================================
Port: 3001
Database: Connected
Environment: development

Server ready!
- Local:   http://localhost:3001
- Network: http://YOUR_IP:3001
```

## Step 6: Test the Pages

### Test Customer Pages
1. Open browser: `http://localhost:3001/products`
2. You should see 5 sample products
3. Click on a product to view details
4. Try adding to cart (requires login)

### Test Admin Pages
1. Open: `http://localhost:3001/admin/products`
2. You should see the product list
3. Click "Add New Product"
4. Try creating a product

### Test Login
1. Go to: `http://localhost:3001/login`
2. Use test account:
   - Email: `customer@test.com`
   - Password: `password123`

## Troubleshooting

### Issue: "Failed to connect to database"

**Solution 1: Check DATABASE_URL**
```bash
# Open .env.local and verify:
DATABASE_URL="postgresql://postgres:balkhi123@localhost:5432/ecommerce"

# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

**Solution 2: Create database manually**
```sql
-- In pgAdmin or psql:
CREATE DATABASE ecommerce;
```

**Solution 3: Test connection**
```bash
# Try connecting with psql:
psql -U postgres -h localhost -p 5432 -d ecommerce
# Enter password when prompted
```

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npx prisma generate
```

### Issue: "Table does not exist"

**Solution:**
```bash
npx prisma db push --accept-data-loss
```

### Issue: "Port 3001 already in use"

**Solution 1: Kill the process**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill it (replace PID)
taskkill /PID <PID> /F
```

**Solution 2: Change port**
```bash
# In .env.local:
PORT=3002
```

### Issue: "Products page is blank"

**Cause:** No products in database

**Solution:**
```bash
# Run seed script:
npx tsx prisma/seed-products.ts

# OR add products manually in admin:
http://localhost:3001/admin/products/new
```

### Issue: "Cannot read properties of undefined"

**Cause:** API returning errors

**Solution:**
```bash
# Check browser console (F12)
# Check server logs in terminal
# Verify database has data:
npx prisma studio
```

## Quick Test Checklist

After setup, verify:

- [ ] PostgreSQL is running
- [ ] `npm install` completed
- [ ] `npx prisma generate` ran successfully
- [ ] `npx prisma db push` created tables
- [ ] Seed data added (5 products)
- [ ] Server starts on port 3001
- [ ] `/products` page loads and shows products
- [ ] `/admin/products` page loads
- [ ] Can create new product in admin
- [ ] Can login with test account

## Sample Data Included

After seeding, you'll have:

**Categories:**
- Electronics
- Clothing
- Home Goods

**Products:**
1. Wireless Bluetooth Headphones ($59.99)
2. USB-C Fast Charging Cable ($12.99)
3. Cotton T-Shirt - Unisex ($19.99)
4. Ceramic Coffee Mug Set ($24.99)
5. Portable Power Bank 20000mAh ($34.99)

**Countries:**
- United States (with shipping rates)
- China (with shipping rates)

**Test Users:**
- Customer: customer@test.com / password123
- Admin: admin@test.com / password123

## File Structure Check

Verify these files exist:

```
web/
├── app/
│   ├── products/
│   │   ├── page.tsx ✓ (Product listing)
│   │   └── [slug]/
│   │       └── page.tsx ✓ (Product detail)
│   ├── cart/
│   │   └── page.tsx ✓ (Shopping cart)
│   ├── checkout/
│   │   └── page.tsx ✓ (Checkout)
│   ├── orders/
│   │   ├── page.tsx ✓ (Order history)
│   │   └── [id]/
│   │       └── page.tsx ✓ (Order detail)
│   └── admin/
│       ├── products/
│       │   ├── page.tsx ✓ (Admin product list)
│       │   └── new/
│       │       └── page.tsx ✓ (Create product)
│       └── orders/
│           └── page.tsx ✓ (Admin order list)
├── components/
│   ├── ui/ ✓ (UI components)
│   ├── products/ ✓ (Product components)
│   └── cart/ ✓ (Cart components)
├── prisma/
│   ├── schema.prisma ✓
│   └── seed-products.ts ✓
├── .env.local ✓
└── package.json ✓
```

## Still Having Issues?

### Check Server Logs
Look at the terminal where you ran `npm run dev` for errors.

### Check Browser Console
Press F12 in browser, look for errors in Console tab.

### Check Database
```bash
npx prisma studio
```
Browse tables to verify data exists.

### Restart Everything
```bash
# 1. Stop server (Ctrl+C)
# 2. Restart PostgreSQL
# 3. Run setup again:
setup-database.bat
# 4. Start server:
npm run dev
```

## Need Help?

1. Run diagnostics: `check-setup.bat`
2. Check all files exist (see File Structure above)
3. Verify PostgreSQL is running
4. Check .env.local has correct DATABASE_URL
5. Try restarting everything

## Success! 🎉

When setup is complete, you should:
- See products at http://localhost:3001/products
- See admin panel at http://localhost:3001/admin/products
- Be able to login with test accounts
- Be able to add products to cart
- Be able to complete checkout

**Next:** Start adding your own products and testing the customer journey!
