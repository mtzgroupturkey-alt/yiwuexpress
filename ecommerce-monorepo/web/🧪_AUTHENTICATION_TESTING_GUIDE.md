# 🧪 AUTHENTICATION TESTING GUIDE

Complete guide to test the 3-role authentication system with security features.

---

## 🚀 QUICK START

### 1. Start the Development Server
```bash
cd ecommerce-monorepo/web
npm run dev
```

Server should start at: **http://localhost:3005**

---

## 👥 TEST USERS

You'll need test users for each role. Create them via Prisma Studio or registration:

### Using Prisma Studio (Recommended for Admin)
```bash
npx prisma studio
```

Create users with these details:

| Role | Email | Password | Role Value |
|------|-------|----------|------------|
| Customer | customer@test.com | password123 | `USER` |
| Supplier | supplier@test.com | password123 | `SUPPLIER` |
| Admin | admin@test.com | password123 | `ADMIN` |

**⚠️ Important:** Password must be **hashed with bcrypt** (use registration API to auto-hash)

### Using Registration API (Customers Only)
```bash
curl -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "customer@test.com",
    "password": "password123",
    "phone": "+1234567890",
    "country": "US"
  }'
```

**Note:** Registration always creates `USER` role (customer) - cannot create admins or suppliers this way.

---

## 🧪 TEST SCENARIOS

### ✅ Scenario 1: Successful Login (Customer)

**Steps:**
1. Go to http://localhost:3005/login
2. Enter:
   - Email: `customer@test.com`
   - Password: `password123`
3. Click "Login"

**Expected:**
- ✅ Redirect to `/dashboard`
- ✅ See "Welcome, Test Customer"
- ✅ Role badge: "Customer" (blue)
- ✅ Cookie `auth_token` set in browser
- ✅ No errors in console

**Browser DevTools Check:**
1. Open DevTools (F12)
2. Go to **Application** → **Cookies** → `http://localhost:3005`
3. Find cookie: `auth_token`
4. Verify:
   - ✅ `HttpOnly`: checked
   - ✅ `Secure`: unchecked (localhost HTTP)
   - ✅ `SameSite`: Lax
   - ✅ `Expires`: ~7 days from now

---

### ✅ Scenario 2: Successful Login (Supplier)

**Steps:**
1. Go to http://localhost:3005/login
2. Enter:
   - Email: `supplier@test.com`
   - Password: `password123`
3. Click "Login"

**Expected:**
- ✅ Redirect to `/dashboard/supplier`
- ✅ See supplier dashboard
- ✅ Role badge: "Supplier" (green)
- ✅ Cookie `auth_token` set

---

### ✅ Scenario 3: Successful Login (Admin)

**Steps:**
1. Go to http://localhost:3005/login
2. Enter:
   - Email: `admin@test.com`
   - Password: `password123`
3. Click "Login"

**Expected:**
- ✅ Redirect to `/admin`
- ✅ See admin panel
- ✅ Role badge: "Admin" (red)
- ✅ Cookie `auth_token` set

---

### ❌ Scenario 4: Failed Login (Wrong Password)

**Steps:**
1. Go to http://localhost:3005/login
2. Enter:
   - Email: `customer@test.com`
   - Password: `wrongpassword`
3. Click "Login"

**Expected:**
- ❌ Alert: "Invalid credentials"
- ❌ Stay on login page
- ❌ No cookie set
- ✅ No indication whether email exists (security feature)

---

### ❌ Scenario 5: Failed Login (Non-Existent Email)

**Steps:**
1. Go to http://localhost:3005/login
2. Enter:
   - Email: `nonexistent@test.com`
   - Password: `password123`
3. Click "Login"

**Expected:**
- ❌ Alert: "Invalid credentials" (same as wrong password)
- ❌ Stay on login page
- ❌ No cookie set
- ✅ **Account enumeration protection** - attacker can't tell if email exists

---

### ⏱️ Scenario 6: Rate Limiting

**Steps:**
1. Try to login with wrong credentials **6 times** quickly
2. On the 6th attempt, check the response

**Expected:**
- ❌ Alert: "Too many requests. Please try again in X seconds"
- ❌ HTTP Status: `429 Too Many Requests`
- ⏱️ Must wait 15 minutes OR use different IP

**CLI Test:**
```bash
# Try 6 times quickly
for i in {1..6}; do
  echo "Attempt $i:"
  curl http://localhost:3005/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\n"
done
```

**Expected Output:**
- Attempts 1-5: `{"error": "Invalid credentials"}`
- Attempt 6: `{"error": "Too many requests", "retryAfter": 900}`

---

### ✅ Scenario 7: Registration (New Customer)

**Steps:**
1. Go to http://localhost:3005/register
2. Enter:
   - Name: `New Customer`
   - Email: `newuser@test.com`
   - Password: `password123`
   - Phone: `+1234567890`
   - Country: `US`
3. Click "Register"

**Expected:**
- ✅ Redirect to `/dashboard`
- ✅ Role: `USER` (customer)
- ✅ Cookie `auth_token` set
- ✅ Success message

**Security Check:**
Try sending `"role": "ADMIN"` in registration:
```bash
curl -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hacker",
    "email": "hacker@test.com",
    "password": "password123",
    "role": "ADMIN"
  }'
```

**Expected:**
- ✅ User created with `role: "USER"` (not ADMIN)
- ✅ **Security feature**: Client-sent role is ALWAYS ignored

---

### 🚪 Scenario 8: Logout

**Steps:**
1. Login as any user
2. Click on user menu (top right)
3. Click "Logout"

**Expected:**
- ✅ Redirect to homepage (`/`)
- ✅ Cookie `auth_token` cleared
- ✅ Can't access protected pages
- ✅ UserMenu shows "Login" button

---

### 🔒 Scenario 9: Protected Routes (Not Logged In)

**Steps:**
1. Make sure you're logged out
2. Try to visit these URLs directly:
   - http://localhost:3005/dashboard
   - http://localhost:3005/dashboard/supplier
   - http://localhost:3005/admin

**Expected:**
- ✅ Redirect to `/login`
- ✅ URL shows attempted destination: `/login?from=/dashboard`

---

### 🔒 Scenario 10: Role-Based Access (Wrong Role)

**Steps:**
1. Login as **Customer** (`USER` role)
2. Try to visit:
   - http://localhost:3005/admin
   - http://localhost:3005/dashboard/supplier

**Expected:**
- ✅ Redirect to `/unauthorized` or `/dashboard`
- ✅ Error: "Access denied"

---

### 🩺 Scenario 11: Health Check

**CLI Test:**
```bash
curl http://localhost:3005/api/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-15T10:30:00.000Z",
  "database": "connected"
}
```

---

## 🔍 DEBUGGING TIPS

### Check Server Logs
Look for these log messages:
```
[LOGIN] Error: ...
Failed to update lastLoginAt: ...
Registration error: ...
Could not start rate limit cleanup interval: ...
```

### Check Browser Console
Look for these errors:
```
POST http://localhost:3005/api/auth/login 500
POST http://localhost:3005/api/auth/login 401
POST http://localhost:3005/api/auth/login 429
```

### Check Network Tab
1. Open DevTools → **Network**
2. Filter: **XHR/Fetch**
3. Look for:
   - `/api/auth/login` - should return 200 on success
   - Check response: should NOT contain `token` field
   - Check cookies: should contain `auth_token`

### Verify JWT Secret
```bash
# Check .env.local file
cat .env.local | grep JWT_SECRET
```

**Expected:**
```
JWT_SECRET=your-secret-key-here
```

If missing:
```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
```

---

## 🛠️ TROUBLESHOOTING

### Issue: 500 Internal Server Error on Login

**Possible Causes:**
1. Missing `JWT_SECRET` in `.env.local`
2. Database connection issue
3. Rate limiter initialization error

**Fix:**
```bash
# 1. Check JWT_SECRET
cat .env.local | grep JWT_SECRET

# 2. Test database connection
npx prisma db push

# 3. Restart dev server
npm run dev
```

---

### Issue: Cookie Not Set

**Possible Causes:**
1. `secure: true` on localhost (should be `false`)
2. Browser blocking cookies
3. SameSite misconfiguration

**Fix:**
Check `lib/auth.ts`:
```typescript
export function setAuthCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: isProduction, // ← Should be false in development
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
}
```

---

### Issue: Rate Limit Not Working

**Symptoms:**
- Can login unlimited times with wrong password
- No 429 errors

**Possible Causes:**
1. Rate limiter import commented out
2. `setInterval` error in rate-limit.ts

**Fix:**
Check `app/api/auth/login/route.ts`:
```typescript
import { loginRateLimit } from '@/lib/rate-limit' // ← Should NOT be commented

export async function POST(request: NextRequest) {
  const rateLimitResponse = loginRateLimit(request) // ← Should be active
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  // ...
}
```

---

### Issue: Can't Create Admin Users

**This is CORRECT behavior!**

- ❌ Cannot create admin via `/api/auth/register`
- ✅ Must create admin via:
  1. Prisma Studio
  2. Database seed script
  3. Admin promotion endpoint (if you create one)

**Why?** Security - anyone can access the registration endpoint.

---

## ✅ SECURITY CHECKLIST

After testing, verify these security features:

- [ ] Token stored in **httpOnly cookie** (not localStorage)
- [ ] Token **NOT in JSON response body**
- [ ] Rate limiting: **5 login attempts / 15min**
- [ ] Registration rate limiting: **10 attempts / hour**
- [ ] Generic error messages (no account enumeration)
- [ ] Password minimum: **8 characters**
- [ ] Password never returned in API responses
- [ ] Registration always creates `USER` role
- [ ] Client-sent `role` is ignored/stripped
- [ ] Cookie `secure: false` on localhost
- [ ] Cookie `secure: true` in production
- [ ] Inactive accounts cannot login
- [ ] JWT signed with `JWT_SECRET`
- [ ] Protected routes redirect to `/login`
- [ ] Wrong role access denied

---

## 🎉 SUCCESS CRITERIA

Your authentication system is working correctly if:

1. ✅ All 11 test scenarios pass
2. ✅ All security checklist items verified
3. ✅ No console errors
4. ✅ Cookies set properly
5. ✅ Role-based redirects work
6. ✅ Rate limiting functions
7. ✅ Health check returns `ok`

---

## 📚 RELATED DOCS

- `✅_LOGIN_FIX_COMPLETE.md` - Recent fix details
- `✅_LOCALHOST_STATUS_REPORT.md` - Localhost security verification
- `lib/auth.ts` - Authentication utilities
- `lib/rate-limit.ts` - Rate limiting implementation
- `middleware.ts` - Route protection

---

## 🚀 PRODUCTION DEPLOYMENT

Before going to production:

1. **Generate Strong JWT Secret**
   ```bash
   openssl rand -base64 64
   ```

2. **Update Production .env**
   ```
   JWT_SECRET=<generated-secret-here>
   NODE_ENV=production
   DATABASE_URL=<production-db-url>
   ```

3. **Replace In-Memory Rate Limiter**
   - Current implementation resets on restart
   - Use Redis-based rate limiting (e.g., `@upstash/ratelimit`)

4. **Enable HTTPS**
   - Cookies will have `secure: true`
   - Use SSL certificate

5. **Set Up Email Verification**
   - Currently `isVerified: false` but not enforced
   - Implement email verification flow

---

Happy Testing! 🎊
