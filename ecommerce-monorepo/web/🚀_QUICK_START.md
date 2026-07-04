# 🚀 AUTHENTICATION SYSTEM - QUICK START

Get up and running with the authentication system in 5 minutes.

---

## ⚡ INSTANT SETUP

### 1. Start Server (30 seconds)
```bash
cd ecommerce-monorepo/web
npm run dev
```

Server starts at: **http://localhost:3005**

---

### 2. Create Test Users (2 minutes)

**Option A: Using Prisma Studio (Recommended)**
```bash
npx prisma studio
```
- Opens at http://localhost:5555
- Click "User" model
- Click "Add record"
- **Important:** Use bcrypt hash for password!

**Option B: Use Registration API (Customers Only)**
```bash
curl -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "customer@test.com",
    "password": "password123"
  }'
```

---

### 3. Test Login (1 minute)

**Browser:**
1. Go to http://localhost:3005/login
2. Enter: `customer@test.com` / `password123`
3. Click Login
4. ✅ Should redirect to `/dashboard`

**CLI:**
```bash
curl -v http://localhost:3005/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"password123"}'
```

---

## 🎯 QUICK TESTS

### ✅ Test Success Login
```bash
curl http://localhost:3005/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"password123"}'
```
**Expected:** `200 OK` + user object

---

### ❌ Test Wrong Password
```bash
curl http://localhost:3005/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"wrong"}'
```
**Expected:** `401` + `{"error": "Invalid credentials"}`

---

### ⏱️ Test Rate Limiting (Try 6 Times)
```bash
for i in {1..6}; do
  echo "Attempt $i:"
  curl http://localhost:3005/api/auth/login \
    -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\n"
done
```
**Expected:** 6th attempt returns `429 Too Many Requests`

---

### 🩺 Test Health
```bash
curl http://localhost:3005/api/health
```
**Expected:** `{"status": "ok", "database": "connected"}`

---

## 🔑 USER ROLES

| Role | Access | Registration |
|------|--------|--------------|
| **Customer** (`USER`) | `/dashboard` | ✅ Public |
| **Supplier** (`SUPPLIER`) | `/dashboard/supplier` | ❌ Admin only |
| **Admin** (`ADMIN`) | `/admin` | ❌ Database only |

---

## 🔐 SECURITY FEATURES

✅ **httpOnly Cookies** - Token safe from XSS  
✅ **Rate Limiting** - 5 login attempts / 15 min  
✅ **No Token in Response** - Only in cookie  
✅ **Account Enumeration Protection** - Generic errors  
✅ **IDOR Protection** - Users see only their data  
✅ **Password Hashing** - Bcrypt with salt  
✅ **Role-Based Access** - Protected routes  

---

## 🐛 TROUBLESHOOTING

### Issue: 500 Error on Login
```bash
# Check JWT_SECRET exists
cat .env.local | grep JWT_SECRET

# If missing, add it:
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local

# Restart server
npm run dev
```

---

### Issue: Cookie Not Set
Check browser DevTools:
1. F12 → Application → Cookies → http://localhost:3005
2. Look for `auth_token` cookie
3. Verify: HttpOnly ✅, Secure ❌ (localhost)

---

### Issue: Can't Access Admin Panel
- ✅ User role must be `ADMIN`
- ✅ Create admin via Prisma Studio (not registration API)
- ✅ Set `role: "ADMIN"` in database

---

## 📚 FULL DOCUMENTATION

| Document | What's Inside |
|----------|---------------|
| `📋_AUTHENTICATION_SYSTEM_SUMMARY.md` | Complete system overview |
| `🧪_AUTHENTICATION_TESTING_GUIDE.md` | 11 detailed test scenarios |
| `✅_LOGIN_FIX_COMPLETE.md` | Recent bug fixes |
| `.env.example` | Environment variables |

---

## 🎉 SUCCESS CRITERIA

Your system works if:
- [x] Server starts without errors
- [x] Login with correct credentials → 200 OK
- [x] Login with wrong password → 401 Error
- [x] 6th login attempt → 429 Rate Limited
- [x] Cookie `auth_token` is set
- [x] Health endpoint returns `ok`

---

## 🚀 NEXT STEPS

1. **Create test users** for all 3 roles
2. **Test login** in browser
3. **Test protected routes** (try accessing `/admin` as customer)
4. **Read full docs** for production deployment

---

**Need Help?**
- Check server logs for `[LOGIN]` errors
- Review `🧪_AUTHENTICATION_TESTING_GUIDE.md`
- Verify `.env.local` has `JWT_SECRET`

**Ready to Deploy?**
- See "Production Checklist" in `📋_AUTHENTICATION_SYSTEM_SUMMARY.md`

---

Happy Coding! 🎊
