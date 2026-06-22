# How to Use DB Browser for SQLite with Your Database

## Download and Install

1. Go to: https://sqlitebrowser.org/
2. Download "DB Browser for SQLite" for Windows
3. Install it (it's free and open source)

## Open Your Database

1. Launch DB Browser for SQLite
2. Click **"Open Database"** button
3. Navigate to: `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db`
4. Click Open

## Interface Overview

### Browse Data Tab
- View table data in spreadsheet format
- Click dropdown to select table (e.g., "User", "PermissionRole")
- See all rows and columns
- Can edit data directly (be careful!)

### Execute SQL Tab
- Run SQL queries
- Copy queries from `DATABASE_PERMISSIONS_QUERIES.sql`
- Results appear below
- Can export results to CSV

### Database Structure Tab
- See all tables
- View column definitions
- Check indexes and constraints

## Step-by-Step: Assign Permission Role to User

### Step 1: Find the User
1. Go to **"Browse Data"** tab
2. Select **"User"** table from dropdown
3. Find your user by email
4. Note their `id` (something like: cmqpjiviu0009v19gp8fnf6lx)

### Step 2: Find the Role ID
1. Still in **"Browse Data"** tab
2. Select **"PermissionRole"** table from dropdown
3. You'll see:
   - Administrator
   - Manager
   - Staff
   - Viewer
4. Note the `id` of the role you want (e.g., Administrator's ID)

### Step 3: Assign the Role
1. Go to **"Execute SQL"** tab
2. Type this query (replace the values):
```sql
UPDATE User 
SET roleId = 'PASTE_ROLE_ID_HERE'
WHERE email = 'user@example.com';
```

3. Click **▶ Execute** button (or press F5)
4. You should see: "Query executed successfully. Rows affected: 1"

### Step 4: Save Changes
1. Click **"Write Changes"** button (💾 icon in toolbar)
2. Or press Ctrl+S
3. **Important**: Changes are NOT saved until you click this!

### Step 5: Verify
1. Go back to **"Browse Data"** tab
2. Select **"User"** table
3. Find your user
4. Check the `roleId` column - it should now have the role ID

## Common Queries to Run

### View All Users with Their Roles
```sql
SELECT 
    u.email,
    u.name,
    u.role as system_role,
    pr.name as permission_role
FROM User u
LEFT JOIN PermissionRole pr ON u.roleId = pr.id
ORDER BY u.email;
```

### See What Permissions a Role Has
```sql
SELECT 
    resource,
    canView,
    canCreate,
    canEdit,
    canDelete
FROM RolePermission
WHERE roleId = (SELECT id FROM PermissionRole WHERE name = 'Manager')
ORDER BY resource;
```

### Find All Administrator Role ID
```sql
SELECT id, name, description 
FROM PermissionRole 
WHERE name = 'Administrator';
```

### Assign Administrator to All ADMIN Users
```sql
UPDATE User 
SET roleId = (SELECT id FROM PermissionRole WHERE name = 'Administrator')
WHERE role = 'ADMIN';
```
**Remember to click "Write Changes"!**

## Visual Example

```
╔════════════════════════════════════════════════╗
║  DB Browser for SQLite                         ║
╠════════════════════════════════════════════════╣
║  [Open] [Save] [Execute SQL] [Browse Data]     ║
╠════════════════════════════════════════════════╣
║  Table: User                              ▼    ║
╠═══════════╦══════════════════╦══════════════╦══╣
║ id        ║ email            ║ name         ║..║
╠═══════════╬══════════════════╬══════════════╬══╣
║ cmqp...   ║ admin@test.com   ║ Admin User   ║..║
║ cmqr...   ║ user@test.com    ║ Regular User ║..║
╚═══════════╩══════════════════╩══════════════╩══╝
```

## Tips and Tricks

### 1. Filter Data
- In Browse Data tab, use the filter box at the top
- Example: Filter User table by email containing "admin"

### 2. Sort Columns
- Click column headers to sort
- Click again to reverse sort

### 3. Search
- Use Ctrl+F to search within current table

### 4. Export Data
- File → Export → Table as CSV file
- Great for backups or Excel analysis

### 5. SQL History
- Your previous queries are saved
- Press Up arrow in Execute SQL tab to cycle through

### 6. Multiple Queries
- Separate queries with semicolons
- Highlight one query to run only that one

### 7. Save Commonly Used Queries
- Save SQL file in your project
- Copy/paste when needed

## Safety Tips

### ⚠️ ALWAYS Backup First
Before making changes:
1. File → Export → Database to SQL file
2. Or copy `dev.db` to `dev.db.backup`

### ⚠️ Test with SELECT First
Before UPDATE/DELETE:
```sql
-- Test what will be affected:
SELECT * FROM User WHERE email = 'test@example.com';

-- If correct, then UPDATE:
UPDATE User SET roleId = '...' WHERE email = 'test@example.com';
```

### ⚠️ Use Transactions
For multiple operations:
```sql
BEGIN TRANSACTION;

UPDATE User SET roleId = '...' WHERE id = '...';
UPDATE User SET roleId = '...' WHERE id = '...';

-- Check results first, then:
COMMIT;  -- To save
-- or
ROLLBACK;  -- To undo
```

### ⚠️ Remember to Write Changes
- Changes are NOT saved automatically
- Must click "Write Changes" button
- Or use: File → Write Changes
- Or press: Ctrl+S

## Troubleshooting

### "Database is locked"
- Close the web dev server first
- Or close Prisma Studio if open
- SQLite allows only one writer at a time

### "No such table"
- Make sure you opened the correct dev.db file
- Run migrations: `npx prisma migrate deploy`

### "Changes not showing in app"
- Did you click "Write Changes"?
- Restart the web dev server
- Clear browser cache

### "Syntax error"
- SQLite uses different syntax than PostgreSQL
- Check quotes: SQLite uses single quotes for strings
- Use `datetime('now')` not `NOW()`

## Alternative: Prisma Studio

If DB Browser is confusing, try Prisma Studio instead:

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run prisma:studio
```

Opens at http://localhost:5555
- Easier interface
- Can't make mistakes
- No SQL needed
- But limited functionality

## Need Help?

1. Check: `DATABASE_PERMISSIONS_QUERIES.sql` for more examples
2. Check: `QUICK_DATABASE_COMMANDS.md` for common operations
3. Check SQLite documentation: https://www.sqlite.org/docs.html
4. DB Browser docs: https://sqlitebrowser.org/

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│ VIEW ROLES:                                     │
│ SELECT * FROM PermissionRole;                   │
├─────────────────────────────────────────────────┤
│ VIEW USERS WITH ROLES:                          │
│ SELECT u.email, pr.name as role                 │
│ FROM User u                                     │
│ LEFT JOIN PermissionRole pr ON u.roleId=pr.id; │
├─────────────────────────────────────────────────┤
│ ASSIGN ROLE:                                    │
│ UPDATE User                                     │
│ SET roleId = '<ROLE_ID>'                        │
│ WHERE email = 'user@example.com';               │
├─────────────────────────────────────────────────┤
│ REMOVE ROLE:                                    │
│ UPDATE User SET roleId = NULL                   │
│ WHERE email = 'user@example.com';               │
└─────────────────────────────────────────────────┘

📌 Database Location:
   web/prisma/dev.db

💾 ALWAYS CLICK "WRITE CHANGES" AFTER UPDATES!
```
