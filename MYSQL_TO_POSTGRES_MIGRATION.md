# ⚠️ Important: MySQL to PostgreSQL Migration

## The Challenge

Your setup has **different database systems**:
- **Localhost (WAMP):** MySQL
- **Production Server:** PostgreSQL

This means you cannot directly import a MySQL dump into PostgreSQL!

---

## 🎯 Recommended Approach (Easiest)

### Use Prisma to Sync Schema + Re-seed Data

This is the safest and easiest method:

**Step 1: Deploy Files Only**
```powershell
.\deploy-to-dromkok.ps1 -SkipDatabase
```

**Step 2: SSH into Server and Use Prisma**
```bash
ssh djdn@39.175.57.2

cd /www/wwwroot/www.dromkok.com/web

# Set database connection
export DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"

# Push schema to PostgreSQL
npx prisma db push --accept-data-loss

# Optional: Run seed script if you have one
npm run db:seed
```

**Step 3: Manually Add Important Data**

If you have critical data (products, users, orders):
1. Export from localhost MySQL as CSV
2. Import into production PostgreSQL

---

## 🔄 Alternative Methods

### Method 1: pgloader (Automatic Conversion)

```bash
# On production server
sudo apt install pgloader

# Convert database
pgloader mysql://root@localhost/yiwuexpress postgresql://ecommerce:ecommerce123@localhost/ecommerce
```

**Pros:** Automatic, handles most data types
**Cons:** Requires pgloader installation, may fail on complex schemas

### Method 2: Manual CSV Export/Import

**On Windows (Localhost):**
```bash
# Export to CSV
cd c:\wamp64\bin\mysql\mysql8.0.31\bin
.\mysql.exe -u root -e "SELECT * FROM products INTO OUTFILE 'c:/temp/products.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';" yiwuexpress
```

**On Server (Production):**
```bash
# Import CSV
/www/server/pgsql/bin/psql -U ecommerce -d ecommerce -c "\COPY products FROM '/tmp/products.csv' DELIMITER ',' CSV HEADER;"
```

### Method 3: Use Migration Tools

- **pgAdmin** - Has MySQL import wizard
- **DBeaver** - Can export/import between databases
- **DataGrip** - Has database migration features

---

## 📋 Step-by-Step: Recommended Workflow

### Phase 1: Deploy Code & Schema

1. **Deploy files without database:**
```powershell
cd c:\wamp64\www\yiwuexpress
.\deploy-to-dromkok.ps1 -SkipDatabase
```

2. **Create PostgreSQL schema via Prisma:**
```bash
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
export DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"
npx prisma db push --accept-data-loss
```

### Phase 2: Migrate Critical Data

**Option A: If you have seed scripts:**
```bash
npm run db:seed
npm run db:seed:products
npm run db:seed:categories
```

**Option B: Manual data entry:**
- Use admin panel to add products
- Import users if needed
- Recreate categories

**Option C: Export/Import specific tables:**
```bash
# Export from MySQL
mysqldump -u root yiwuexpress products > products.sql

# Convert SQL syntax (manual editing or tools)
# Import to PostgreSQL
/www/server/pgsql/bin/psql -U ecommerce -d ecommerce < products_converted.sql
```

---

## 🔍 Check Your Prisma Schema

Make sure `ecommerce-monorepo/web/prisma/schema.prisma` has:

```prisma
datasource db {
  provider = "postgresql"  // ← Should be postgresql
  url      = env("DATABASE_URL")
}
```

**NOT:**
```prisma
datasource db {
  provider = "mysql"  // ← Wrong for production!
}
```

If your schema says `mysql`, you need to:
1. Change to `postgresql`
2. Review data types (some MySQL types don't exist in PostgreSQL)
3. Test locally with PostgreSQL before deploying

---

## ⚠️ Common MySQL → PostgreSQL Differences

| MySQL | PostgreSQL | Notes |
|-------|------------|-------|
| `AUTO_INCREMENT` | `SERIAL` or `IDENTITY` | Prisma handles this |
| `TINYINT(1)` | `BOOLEAN` | Prisma handles this |
| `DATETIME` | `TIMESTAMP` | Different timezone handling |
| `TEXT` | `TEXT` | Same, but TEXT has no size limit in PostgreSQL |
| `` `backticks` `` | `"double quotes"` | Different identifier quoting |

Prisma usually handles these automatically!

---

## 🎯 Migration Decision Tree

```
Do you have a lot of important data in localhost MySQL?
├─ NO → Use Prisma db push + manual entry
│         ✅ Easiest, safest, recommended
│
└─ YES → Is it products, orders, users?
    ├─ Products only → Export CSV + import
    │                  ✅ Fast for bulk data
    │
    └─ Everything → Use pgloader
                    ⚠️ Requires installation
```

---

## 🚀 Quick Start (If Starting Fresh)

If you're okay starting with an empty database:

```powershell
# 1. Deploy files
.\deploy-to-dromkok.ps1 -SkipDatabase

# 2. SSH and setup schema
ssh djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
export DATABASE_URL="postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce"
npx prisma db push
npm run db:seed  # If you have seed script

# 3. Test site
curl http://localhost:3001

# Done!
```

---

## 📝 If You Need to Export Specific Data

### Export Products from MySQL

```bash
cd c:\wamp64\bin\mysql\mysql8.0.31\bin

# Export as SQL
.\mysqldump.exe -u root yiwuexpress products > c:\temp\products.sql

# Or export as CSV
.\mysql.exe -u root -e "SELECT * FROM products" yiwuexpress > c:\temp\products.csv
```

### Import to PostgreSQL

```bash
# Upload CSV to server
scp c:\temp\products.csv djdn@39.175.57.2:/tmp/

# SSH and import
ssh djdn@39.175.57.2
/www/server/pgsql/bin/psql -U ecommerce -d ecommerce

-- In psql:
\COPY products FROM '/tmp/products.csv' WITH CSV HEADER;
\q
```

---

## 🛠️ Tools That Can Help

1. **pgloader** (Command-line)
   - Automated MySQL → PostgreSQL
   - Handles most conversions

2. **DBeaver** (GUI, Free)
   - Visual database export/import
   - Supports both MySQL and PostgreSQL

3. **pgAdmin** (GUI, Free)
   - PostgreSQL management
   - Has import wizards

4. **DataGrip** (Paid)
   - Professional database tool
   - Built-in migration features

---

## 💡 Best Practice

For production deployment:

1. ✅ **Use Prisma schema as source of truth**
2. ✅ **Deploy schema via `npx prisma db push`**
3. ✅ **Use seed scripts for sample data**
4. ✅ **Manually migrate critical production data**
5. ✅ **Test thoroughly before going live**

---

## 🆘 Need Help?

If you're stuck with data migration:

1. List what data you need to migrate
2. Check if you have Prisma seed scripts
3. Consider if you can recreate the data
4. For large datasets, use pgloader or CSV export/import

---

**Remember:** The deployment script will skip database import if it detects the MySQL/PostgreSQL difference, so you'll need to handle data migration separately!

```powershell
# Deploy files only (safe)
.\deploy-to-dromkok.ps1 -SkipDatabase
```
