# ⚡ QUICK COMMAND REFERENCE - User System

## 🚀 SETUP (Run Once)

### Windows
```bash
# Run the setup script
SETUP-USER-SYSTEM.bat

# Or manually:
cd web
npx prisma migrate dev --name add-user-roles-supplier-profile
npx prisma generate
npm run dev
```

### macOS/Linux
```bash
cd web
npx prisma migrate dev --name add-user-roles-supplier-profile
npx prisma generate
npm run dev
```

## 🧪 TESTING URLS

```
Homepage:           http://localhost:3000/
Register (Customer): http://localhost:3000/register
Login:              http://localhost:3000/login
Customer Dashboard: http://localhost:3000/dashboard
Supplier Dashboard: http://localhost:3000/dashboard/supplier
Admin Panel:        http://localhost:3000/admin
User Management:    http://localhost:3000/admin/users
```

## 🔑 TEST CREDENTIALS (After Setup)

### Create Test Admin (Via Prisma Studio)
```bash
npx prisma studio
# Open Users table
# Add new user:
# - email: admin@yiwu.com
# - password: (hash "admin123" with bcrypt)
# - role: ADMIN
# - name: Admin User
# - isActive: true
# - isVerified: true
```

### Or use SQL
```sql
-- Generate password hash for "admin123"
-- Use bcrypt with rounds=10

INSERT INTO "User" (id, email, password, name, role, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES (
  'admin_001',
  'admin@yiwu.com',
  '$2a$10$YourBcryptHashHere',  -- Hash for "admin123"
  'Admin User',
  'ADMIN',
  true,
  true,
  NOW(),
  NOW()
);
```

## 📊 DATABASE COMMANDS

### View Database
```bash
npx prisma studio
```

### Reset Database (WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Check Migration Status
```bash
npx prisma migrate status
```

## 🔍 DEBUGGING

### Check Database Connection
```bash
npx prisma db pull
```

### View Generated Prisma Client
```bash
npx prisma generate --help
```

### Clear Node Modules (if issues)
```bash
rmdir /s /q node_modules
npm install
```

## 📝 USEFUL NPM COMMANDS

### Start Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

## 🛠️ TROUBLESHOOTING

### "Prisma Client not found"
```bash
npx prisma generate
```

### "Database connection failed"
```bash
# Check .env file
# Verify DATABASE_URL is correct
```

### "Migration failed"
```bash
# Check Prisma schema syntax
npx prisma validate

# Force reset (WARNING: loses data)
npx prisma migrate reset --skip-seed
```

### "JWT_SECRET not defined"
```bash
# Add to .env:
JWT_SECRET=your-super-secret-key-here-change-in-production
```

## 📦 REQUIRED DEPENDENCIES

All should be installed, but if missing:

```bash
npm install zustand
npm install bcryptjs @types/bcryptjs
npm install jsonwebtoken @types/jsonwebtoken
npm install zod
npm install @prisma/client
npm install prisma --save-dev
```

## 🎯 COMMON WORKFLOWS

### Add New User (Admin)
1. Login as admin: http://localhost:3000/login
2. Go to: http://localhost:3000/admin/users
3. Click "Add User"
4. Select role, fill form, submit

### Create Supplier Account
1. Login as admin
2. Add User → Select "SUPPLIER"
3. Fill: name, email, password, company name, business type
4. Submit

### Test Customer Registration
1. Go to: http://localhost:3000/register
2. Fill: name, email, password
3. Submit → Should auto-login → Redirect to homepage
4. Check user menu → Should show "CUSTOMER" badge

### Test Role-Based Redirects
1. Login as CUSTOMER → Redirect to `/`
2. Login as SUPPLIER → Redirect to `/dashboard/supplier`
3. Login as ADMIN → Redirect to `/admin`

## 🔐 SECURITY CHECKS

### Verify Password Hashing
```typescript
// In browser console after login
localStorage.getItem('user')
// Should NOT contain plain text password
```

### Verify JWT Token
```typescript
// In browser console
const token = localStorage.getItem('token')
console.log(token)
// Should be a long JWT string
```

### Check User Permissions
```typescript
// Verify role in token
const user = JSON.parse(localStorage.getItem('user'))
console.log(user.role) // Should be USER, SUPPLIER, or ADMIN
```

## 📚 FILE LOCATIONS

### Key Files
```
web/
├── hooks/useAuth.ts                    # Auth state management
├── lib/auth.ts                         # Auth utilities
├── app/api/auth/
│   ├── login/route.ts                 # Login API
│   ├── register/route.ts              # Register API
│   └── me/route.ts                    # Current user API
├── app/api/admin/users/
│   ├── route.ts                       # List/Create users
│   └── [id]/route.ts                  # Get/Update/Delete user
├── components/layout/UserMenu.tsx      # User dropdown menu
├── app/dashboard/page.tsx             # Customer dashboard
├── app/dashboard/supplier/page.tsx    # Supplier dashboard
├── app/admin/users/page.tsx           # Admin user management
└── prisma/schema.prisma               # Database schema
```

## 🎨 UI TESTING

### Test User Menu
1. Login
2. Click user avatar (top right)
3. Should show:
   - User name & email
   - Role badge (colored)
   - Menu items
   - Logout button

### Test Dashboards
- Customer: Cards with orders, wishlist, addresses
- Supplier: Stats (products, sales, revenue, orders)
- Admin: Full system management

## 📊 API TESTING (Postman/cURL)

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### List Users (Admin)
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## ✅ SUCCESS INDICATORS

You know it's working when:
- ✅ No console errors in browser
- ✅ Registration creates user in database
- ✅ Login returns token
- ✅ Token stored in localStorage
- ✅ User menu shows correct role badge
- ✅ Redirects work based on role
- ✅ Admin can create users of any role
- ✅ Supplier shows company name
- ✅ Logout clears session

## 🆘 GET HELP

1. Check documentation:
   - 🎯_USER_SYSTEM_IMPLEMENTATION_COMPLETE.md
   - 🚀_NEXT_STEPS_USER_SYSTEM.md

2. Check logs:
   - Browser console (F12)
   - Terminal (server logs)
   - Prisma Studio for database

3. Common fixes:
   - Clear localStorage
   - Restart dev server
   - Clear browser cache
   - Re-run migration

---

**Quick Start:** Run `SETUP-USER-SYSTEM.bat` then `npm run dev`
