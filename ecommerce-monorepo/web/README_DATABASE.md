# Database Management Guide

## 🚨 Important: Your Database is SQLite, NOT PostgreSQL

**You CANNOT use pgAdmin!** pgAdmin is for PostgreSQL only.

Your database is **SQLite**, which is a file-based database located at:
```
web/prisma/dev.db
```

## 📁 Files Created for You

I've created comprehensive guides to help you manage the database:

### 1. **HOW_TO_USE_SQLITE_BROWSER.md** ⭐ START HERE
- Complete step-by-step guide with screenshots descriptions
- How to download and install DB Browser for SQLite (free)
- How to view and edit data visually
- Common operations with exact steps
- Safety tips and troubleshooting

### 2. **QUICK_DATABASE_COMMANDS.md** 📋 QUICK REFERENCE
- Most common SQL queries
- Copy-paste ready commands
- Covers 90% of what you'll need
- Auto-assign roles to users
- View users and permissions

### 3. **DATABASE_PERMISSIONS_QUERIES.sql** 📚 COMPLETE REFERENCE
- Every possible query you might need
- Organized by category:
  - View existing data
  - Assign roles to users
  - Create new roles
  - Update permissions
  - Delete operations
  - Statistics and reports
  - Backup queries
- Includes safety warnings
- Well commented

## 🛠️ Three Ways to Access Your Database

### Option 1: DB Browser for SQLite (Recommended for Visual Editing)
```
1. Download from: https://sqlitebrowser.org/
2. Install (it's free)
3. Open: web/prisma/dev.db
4. Use Browse Data tab to see tables
5. Use Execute SQL tab to run queries
```
✅ Easy to use, visual interface, can't break things easily
❌ Need to download separate program

### Option 2: Prisma Studio (Recommended for Quick Viewing)
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run prisma:studio
```
Then open: http://localhost:5555

✅ Built-in, no download needed, very safe
❌ Limited features, can't run custom SQL

### Option 3: Command Line (Advanced Users)
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma
sqlite3 dev.db
```
✅ Fast, powerful, good for scripts
❌ Need to know SQLite commands, easy to make mistakes

## 🎯 Most Common Tasks

### Task 1: View All Users and Their Permission Roles

**Using DB Browser:**
1. Open dev.db
2. Click "Execute SQL" tab
3. Paste this:
```sql
SELECT 
    u.email,
    u.name,
    pr.name as permission_role
FROM User u
LEFT JOIN PermissionRole pr ON u.roleId = pr.id;
```
4. Click Execute

**Using Prisma Studio:**
1. Run `npm run prisma:studio`
2. Click "User" table
3. See roleId column

### Task 2: Assign Administrator Role to a User

**Step 1 - Get the role ID:**
```sql
SELECT id, name FROM PermissionRole WHERE name = 'Administrator';
```

**Step 2 - Assign to user:**
```sql
UPDATE User 
SET roleId = 'PASTE_THE_ID_FROM_STEP_1_HERE'
WHERE email = 'your-email@example.com';
```

**Step 3 - IMPORTANT: Click "Write Changes" in DB Browser!**

### Task 3: Assign Administrator Role to All Admin Users
```sql
UPDATE User 
SET roleId = (SELECT id FROM PermissionRole WHERE name = 'Administrator')
WHERE role = 'ADMIN' AND roleId IS NULL;
```

## 📊 Current Permission Roles

After running the seed script, you have these roles:

| Role | Description | Users Who Need It |
|------|-------------|-------------------|
| **Administrator** | Full access to everything | System admins |
| **Manager** | Manage users, services, quotes, shipments | Department managers |
| **Staff** | Handle quotes and shipments | Customer service, ops team |
| **Viewer** | Read-only access | Auditors, reporting users |

## 🔧 Database Maintenance

### Re-create Default Permission Roles
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx ts-node prisma/seed-permissions.ts
```

### Reset Database (⚠️ DELETES ALL DATA!)
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma migrate reset
```

### Run Migrations
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma migrate deploy
```

### Backup Database
Just copy the file:
```bash
copy web\prisma\dev.db web\prisma\dev.db.backup
```

## 🆘 Troubleshooting

### "Database is locked"
- Close the web dev server
- Close Prisma Studio if running
- Close DB Browser
- SQLite only allows one writer at a time

### "Permission roles not showing in UI"
1. Check if roles exist: `SELECT * FROM PermissionRole;`
2. If empty, run seed: `npx ts-node prisma/seed-permissions.ts`
3. Restart dev server
4. Clear browser cache

### "Changes not saving"
- In DB Browser: Must click "Write Changes" button!
- Or press Ctrl+S
- Or go to File → Write Changes

### "Can't find database file"
Location should be:
```
c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db
```

If missing, run migrations:
```bash
npx prisma migrate deploy
```

## 📖 Learn More

1. Read `HOW_TO_USE_SQLITE_BROWSER.md` for detailed visual guide
2. Read `QUICK_DATABASE_COMMANDS.md` for quick reference
3. Check `DATABASE_PERMISSIONS_QUERIES.sql` for advanced queries
4. SQLite documentation: https://www.sqlite.org/docs.html

## 🎓 Quick Start for Beginners

**Never used a database before?**

1. Download DB Browser for SQLite from https://sqlitebrowser.org/
2. Install it
3. Open the program
4. Click "Open Database"
5. Navigate to: `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db`
6. Click on "Browse Data" tab
7. In the dropdown, select "User" to see all users
8. Select "PermissionRole" to see all roles
9. That's it! You can now see your data

To make changes, read `HOW_TO_USE_SQLITE_BROWSER.md` step by step.

## ⚠️ Safety Reminders

1. **Always backup before making changes**
   ```bash
   copy web\prisma\dev.db web\prisma\dev.db.backup
   ```

2. **Test queries with SELECT before UPDATE/DELETE**
   ```sql
   -- First check what will be affected:
   SELECT * FROM User WHERE email = 'test@example.com';
   
   -- Then if correct, update:
   UPDATE User SET roleId = '...' WHERE email = 'test@example.com';
   ```

3. **Remember to Write Changes in DB Browser**
   - Changes are NOT automatic
   - Click the "Write Changes" button
   - Or press Ctrl+S

4. **Use the web interface when possible**
   - Go to http://localhost:3001/admin/settings/permissions
   - Safer than direct database edits
   - Has validation and error checking

## 💡 Pro Tips

- Use Prisma Studio for quick viewing (safer)
- Use DB Browser for bulk operations (more powerful)
- Use the web interface for creating roles (easiest)
- Keep backups before major changes
- Test on a copy of dev.db first

---

**Need help?** Check the other guide files or ask questions!
