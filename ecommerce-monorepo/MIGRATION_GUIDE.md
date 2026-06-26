# YIWU EXPRESS - Database Migration Guide

## Overview
This guide will help you migrate from SQLite to PostgreSQL and apply all Phase 1 enhancements.

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- PostgreSQL 15 running (via Docker)

---

## Step 1: Start PostgreSQL Container

Navigate to the docker directory and start PostgreSQL:

```bash
cd docker
docker-compose up -d
```

Verify the container is running:
```bash
docker ps
```

You should see `yiwu-express-db` container running on port 5432.

---

## Step 2: Update Environment Variables

The `.env.local` file has been updated with the PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:balkhi123@localhost:5432/ecommerce"
```

---

## Step 3: Generate Prisma Client

Navigate to the web directory:

```bash
cd ../web
```

Generate the Prisma Client for the new schema:

```bash
npx prisma generate
```

---

## Step 4: Create Database Tables

Apply the schema to PostgreSQL:

```bash
npx prisma db push
```

This command will:
- Create all tables in PostgreSQL
- Apply all new models (Country, ShippingRate, Product, Order, etc.)
- Set up relationships and indexes

---

## Step 5: Seed the Database

Populate the database with initial data:

```bash
npm run db:seed
```

This will seed:
- ✅ System settings
- ✅ 8 target countries (Russia, Belarus, Turkmenistan, Afghanistan, Kazakhstan, Uzbekistan, Tajikistan, Kyrgyzstan)
- ✅ Shipping rates
- ✅ Categories
- ✅ Products with compliance fields (HS codes, weight, dimensions, customs values)
- ✅ Admin and customer users
- ✅ Logistics services
- ✅ Sample quotes and shipments

---

## Step 6: Verify the Migration

Open Prisma Studio to inspect the data:

```bash
npx prisma studio
```

This will open a web interface at `http://localhost:5555` where you can browse all tables and data.

---

## Login Credentials

After seeding, you can log in with:

**Admin Account:**
- Email: `admin@yiwuexpress.com`
- Password: `admin123`

**Customer Account:**
- Email: `user@example.com`
- Password: `password123`

---

## What Changed in Phase 1

### Database Provider
- ✅ Migrated from SQLite to PostgreSQL

### New Models Added
1. **Country** - Complete country configuration with shipping, customs, and payment settings
2. **ShippingRate** - Detailed shipping rates per country and carrier
3. **Category** - Product categories
4. **Product** - Full e-commerce products with compliance fields (HS codes, weight, dimensions, etc.)
5. **Order** - Complete order system with 20+ status workflow
6. **OrderItem** - Order line items
7. **OrderException** - Exception handling for orders
8. **Cart** - Shopping cart
9. **CartItem** - Cart items
10. **WholesaleInquiry** - B2B wholesale inquiry system
11. **Address** - Customer address management
12. **Notification** - User notification system

### Enhanced Fields
- Products now include compliance data for international shipping
- Orders support complete tracking history
- Users have addresses, carts, and notifications
- Countries have shipping methods, customs rules, and payment methods

---

## Troubleshooting

### PostgreSQL Connection Issues

If you get connection errors:

1. Check if PostgreSQL is running:
   ```bash
   docker ps
   ```

2. Check PostgreSQL logs:
   ```bash
   docker logs yiwu-express-db
   ```

3. Verify connection string in `.env.local`

### Schema Issues

If you need to reset the database:

```bash
# Drop all tables and recreate
npx prisma db push --force-reset

# Re-seed
npm run db:seed
```

### Port Conflicts

If port 5432 is already in use:

1. Stop other PostgreSQL instances
2. Or modify `docker-compose.yml` to use a different port

---

## Next Steps

After successful migration, you can:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the application:
   - Web: `http://localhost:3001`
   - Prisma Studio: `http://localhost:5555`

3. Continue with Phase 2-11 implementations

---

## Backup and Restore

### Backup PostgreSQL Database

```bash
docker exec yiwu-express-db pg_dump -U postgres ecommerce > backup.sql
```

### Restore PostgreSQL Database

```bash
docker exec -i yiwu-express-db psql -U postgres ecommerce < backup.sql
```

---

## Production Considerations

For production deployment:

1. Update `DATABASE_URL` with production PostgreSQL credentials
2. Change `JWT_SECRET` to a strong random value
3. Enable SSL for database connections
4. Set up automated backups
5. Configure connection pooling
6. Set up monitoring and alerts

---

**Need Help?** Contact: info@yiwuexpress.com
