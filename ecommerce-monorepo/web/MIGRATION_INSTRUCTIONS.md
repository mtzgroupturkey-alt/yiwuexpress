# 🔄 DATABASE MIGRATION INSTRUCTIONS

## Phase 1 Enhanced Models Migration

This migration adds the following new models:
1. **ProductVariant** - Product variants with SKU and attributes
2. **TieredPrice** - Volume-based pricing tiers
3. **Return** - Returns and refunds system
4. **EmailLog** - Email notification tracking
5. **ActivityLog** - Admin activity audit trail

### Additional Changes:
- Added `resetToken` and `resetTokenExpiry` to User model (password reset)
- Added `variantId` support to CartItem and OrderItem
- Added new relations to existing models

---

## Step 1: Generate Migration

```bash
cd web
npx prisma migrate dev --name add_phase1_enhanced_models
```

This will:
- Create a new migration file
- Apply the migration to your database
- Regenerate Prisma Client

---

## Step 2: Verify Migration

Check that all new tables were created:

```sql
-- Run in PostgreSQL
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('product_variants', 'tiered_prices', 'returns', 'email_logs', 'activity_logs')
ORDER BY tablename;
```

Expected output:
```
activity_logs
email_logs
product_variants
returns
tiered_prices
```

---

## Step 3: Verify User Table Updates

```sql
-- Check User table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('resetToken', 'resetTokenExpiry');
```

---

## Step 4: Run Prisma Generate

```bash
npx prisma generate
```

---

## Troubleshooting

### If migration fails:

**Option 1: Reset database (DEV ONLY)**
```bash
npx prisma migrate reset
```

**Option 2: Manual fix**
```bash
npx prisma db push --skip-generate
npx prisma generate
```

**Option 3: Check connection**
```bash
npx prisma db pull
```

---

## Rollback (if needed)

To rollback the last migration:

```bash
# View migrations
npx prisma migrate resolve --rolled-back 20231223000000_add_phase1_enhanced_models

# Or reset completely
npx prisma migrate reset
```

---

## Post-Migration Tasks

1. ✅ Run migration
2. ✅ Verify tables exist
3. ✅ Regenerate Prisma Client
4. ✅ Update seed data (run `npm run db:seed`)
5. ✅ Restart Next.js server

---

## Expected Tables After Migration

Total tables: ~25

**Core:**
- User, Service, Quote, Shipment, CompanyInfo

**Products:**
- Product, Category, ProductVariant, TieredPrice

**Orders:**
- Order, OrderItem, OrderException, Return

**Shopping:**
- Cart, CartItem

**Logistics:**
- Country, ShippingRate

**B2B:**
- WholesaleInquiry

**User Management:**
- Address, Notification

**Admin:**
- SystemSettings, PermissionRole, RolePermission, UserPermission
- EmailLog, ActivityLog

---

**Run this now:**
```bash
cd web
npx prisma migrate dev --name add_phase1_enhanced_models
npx prisma generate
npm run dev
```
