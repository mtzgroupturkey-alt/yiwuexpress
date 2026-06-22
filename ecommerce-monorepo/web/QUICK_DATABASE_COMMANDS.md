# Quick Database Commands Reference

## Important Notes

### Database Type
Your database is **SQLite** (not PostgreSQL), so:
- You cannot use pgAdmin (that's for PostgreSQL)
- Use **DB Browser for SQLite** instead (free download: https://sqlitebrowser.org/)
- Or use **Prisma Studio**: Run `npm run prisma:studio` from the web folder

### Database Location
```
web/prisma/dev.db
```

## How to Access the Database

### Option 1: Prisma Studio (Recommended)
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run prisma:studio
```
This opens a web interface at http://localhost:5555

### Option 2: DB Browser for SQLite
1. Download from https://sqlitebrowser.org/
2. Open `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db`
3. Use "Execute SQL" tab to run queries

### Option 3: Command Line
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma
sqlite3 dev.db
```

## Most Common Operations

### 1. View All Permission Roles
```sql
SELECT * FROM PermissionRole;
```

### 2. View Users with Their Roles
```sql
SELECT 
    u.email,
    u.name,
    u.role as system_role,
    pr.name as permission_role
FROM User u
LEFT JOIN PermissionRole pr ON u.roleId = pr.id;
```

### 3. Assign Administrator Role to a User
**First, get the role IDs:**
```sql
SELECT id, name FROM PermissionRole;
```

**Then assign (replace the IDs):**
```sql
UPDATE User 
SET roleId = '<COPY_ADMINISTRATOR_ROLE_ID_HERE>'
WHERE email = 'your-email@example.com';
```

**Example:**
```sql
-- If Administrator role ID is 'cmqpjiviu0009v19gp8fnf6lx'
UPDATE User 
SET roleId = 'cmqpjiviu0009v19gp8fnf6lx'
WHERE email = 'admin@yiwuexpress.com';
```

### 4. Remove Permission Role from User
```sql
UPDATE User 
SET roleId = NULL
WHERE email = 'user@example.com';
```

### 5. Auto-Assign Administrator Role to All ADMIN Users
```sql
UPDATE User 
SET roleId = (SELECT id FROM PermissionRole WHERE name = 'Administrator')
WHERE role = 'ADMIN' AND roleId IS NULL;
```

### 6. Check Who Has Which Permissions
```sql
SELECT 
    pr.name as role_name,
    rp.resource,
    rp.canView,
    rp.canCreate,
    rp.canEdit,
    rp.canDelete
FROM RolePermission rp
JOIN PermissionRole pr ON rp.roleId = pr.id
WHERE pr.name = 'Manager'
ORDER BY rp.resource;
```

### 7. Find Users Without Permission Roles
```sql
SELECT email, name, role 
FROM User 
WHERE roleId IS NULL;
```

## Re-seed Permission Roles

If you need to recreate the default permission roles, run:

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx ts-node prisma/seed-permissions.ts
```

This will create/update:
- Administrator (full access)
- Manager (most access except permissions management)
- Staff (handle quotes/shipments)
- Viewer (read-only)

## Default Permission Roles

### Administrator
- ✅ Full access to everything
- Use for: System admins

### Manager
- ✅ Manage users, services, quotes, shipments
- ✅ Edit company settings
- ❌ Cannot manage permissions
- ❌ Cannot delete users/services
- Use for: Department managers

### Staff
- ✅ View dashboard, users, services
- ✅ Create/edit quotes and shipments
- ❌ Cannot approve quotes
- ❌ Cannot access settings
- Use for: Customer service, operations team

### Viewer
- ✅ View-only access to most areas
- ❌ Cannot create or edit anything
- Use for: Auditors, read-only accounts

## Troubleshooting

### Tables Don't Exist
If permission tables don't exist, run migrations:
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma migrate deploy
```

### Need to Reset Everything
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma migrate reset
npx ts-node prisma/seed-permissions.ts
```
⚠️ **WARNING**: This deletes ALL data!

### Check Database Schema
```bash
npx prisma db pull
```

## Common Scenarios

### Scenario 1: New User Needs Manager Access
1. Create user in the app or via SQL
2. Get Manager role ID: `SELECT id FROM PermissionRole WHERE name = 'Manager'`
3. Assign: `UPDATE User SET roleId = '<MANAGER_ID>' WHERE email = 'newuser@example.com'`

### Scenario 2: Upgrade User from Staff to Manager
```sql
UPDATE User 
SET roleId = (SELECT id FROM PermissionRole WHERE name = 'Manager')
WHERE email = 'user@example.com';
```

### Scenario 3: Create Custom Role
Use the web interface at `http://localhost:3001/admin/settings/permissions` (easier than SQL)

Or see the full SQL file: `DATABASE_PERMISSIONS_QUERIES.sql`

## Files Reference

- **Schema**: `web/prisma/schema.prisma`
- **Database**: `web/prisma/dev.db`
- **Seed Script**: `web/prisma/seed-permissions.ts`
- **Full SQL Queries**: `web/DATABASE_PERMISSIONS_QUERIES.sql`
- **API Documentation**: `web/PERMISSIONS_SYSTEM.md`
