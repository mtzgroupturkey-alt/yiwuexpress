# 🔧 Admin API Troubleshooting Guide

## Current Issue: API Routes Returning 404/500 Errors

### Quick Fix Steps:

## 1. **Test Basic API Connection**
```
GET http://localhost:3000/api/admin/test
```
This should return: `{ "message": "Admin API is working" }`

## 2. **Check Database Connection**
Run this command to test the database:
```bash
cd web
npx prisma db push
npx prisma generate
```

## 3. **Seed the Database**
Create admin user and sample data:
```bash
cd web
npx prisma db seed
```

## 4. **Restart Development Server**
```bash
cd web
npm run dev
```

## 5. **Test Login Process**

### Step 1: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yiwuexpress.com",
    "password": "admin123"
  }'
```

Expected response:
```json
{
  "user": { "role": "ADMIN", "email": "admin@yiwuexpress.com" },
  "token": "eyJ..."
}
```

### Step 2: Test Admin API with Token
```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 6. **Common Issues & Solutions**

### Issue: `404 Not Found`
**Cause:** API route files not properly structured
**Solution:** 
- Check that all route files are named `route.ts` (not `routes.ts`)
- Verify file paths match URL structure
- Restart development server

### Issue: `500 Internal Server Error`
**Cause:** Database connection or import errors
**Solution:**
1. Check `.env` file has correct DATABASE_URL
2. Run `npx prisma generate`
3. Check console for specific error messages

### Issue: `401 Unauthorized`
**Cause:** Missing or invalid JWT token
**Solution:**
1. Login first to get valid token
2. Include token in Authorization header: `Bearer TOKEN`
3. Check JWT_SECRET in .env file

### Issue: `403 Forbidden`
**Cause:** User doesn't have ADMIN role
**Solution:**
- Use admin credentials: `admin@yiwuexpress.com` / `admin123`
- Check user role in database

## 7. **Database Schema Issues**

If you get Prisma errors, reset the database:
```bash
cd web
npx prisma db push --force-reset
npx prisma db seed
```

## 8. **Environment Variables**

Verify these are set in `.env`:
```env
DATABASE_URL="postgresql://postgres:balkhi123@localhost:5432/ecommerce"
JWT_SECRET="yiwu-express-super-secret-key-2024"
JWT_EXPIRES_IN="7d"
```

## 9. **Manual Database Check**

Connect to PostgreSQL and verify:
```sql
-- Check if admin user exists
SELECT * FROM "User" WHERE role = 'ADMIN';

-- Check if tables exist
\dt
```

## 10. **Complete Reset (If All Else Fails)**

```bash
cd web

# 1. Reset database
npx prisma db push --force-reset

# 2. Generate Prisma client
npx prisma generate

# 3. Seed with admin user
npx prisma db seed

# 4. Restart server
npm run dev
```

## 11. **Test Endpoints Individually**

After server restart, test each endpoint:

1. **Basic Test:** `GET /api/admin/test`
2. **Auth:** `POST /api/auth/login`
3. **Stats:** `GET /api/admin/stats` (with token)
4. **Services:** `GET /api/admin/services` (with token)
5. **Users:** `GET /api/admin/users` (with token)

## 12. **Admin Login Credentials**

- **URL:** `http://localhost:3000/auth/login`
- **Email:** `admin@yiwuexpress.com`
- **Password:** `admin123`

## Expected Behavior After Fix:

✅ Login redirects to `/admin` dashboard  
✅ Dashboard shows statistics and data  
✅ All admin pages (Services, Quotes, Shipments, Users) load properly  
✅ CRUD operations work without errors  
✅ No 404 or 500 errors in browser console  

## Still Having Issues?

1. Check browser Network tab for exact error messages
2. Check terminal console for server-side errors
3. Verify PostgreSQL is running on port 5432
4. Ensure all dependencies are installed: `npm install`