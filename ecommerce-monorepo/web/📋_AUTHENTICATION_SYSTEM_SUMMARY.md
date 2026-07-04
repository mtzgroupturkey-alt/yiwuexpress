# 📋 AUTHENTICATION SYSTEM SUMMARY

Complete overview of the 3-role authentication system with security hardening.

---

## 🎯 SYSTEM OVERVIEW

**YIWU EXPRESS** now has a production-ready authentication system with:
- ✅ 3 user roles: **Customer**, **Supplier**, **Admin**
- ✅ JWT-based authentication with **httpOnly cookies**
- ✅ Role-based access control
- ✅ Rate limiting on sensitive endpoints
- ✅ Security hardening (OWASP best practices)
- ✅ Account enumeration protection
- ✅ IDOR protection

---

## 👥 USER ROLES

| Role | Value | Access | Registration |
|------|-------|--------|--------------|
| **Customer** | `USER` | `/dashboard` | ✅ Public registration |
| **Supplier** | `SUPPLIER` | `/dashboard/supplier` | ❌ Admin only |
| **Admin** | `ADMIN` | `/admin` | ❌ Database/seed only |

### Role Capabilities

**Customer (`USER`)**
- Browse products
- Add to cart/wishlist
- Place orders
- Track shipments
- Request quotes
- View own data only

**Supplier (`SUPPLIER`)**
- Manage own products
- View assigned orders
- Update inventory
- Manage supplier profile
- View supplier analytics

**Admin (`ADMIN`)**
- Full system access
- User management (create/edit/delete users)
- Product management (all suppliers)
- Order management (all orders)
- Settings & configuration
- Analytics & reports
- Cannot delete own account
- Cannot delete last active admin

---

## 🔐 SECURITY FEATURES

### 1. **httpOnly Cookies**
- ✅ Token stored in httpOnly cookie (not localStorage)
- ✅ JavaScript cannot access token (XSS protection)
- ✅ Cookie automatically sent with requests
- ✅ `secure: false` for localhost, `secure: true` for production
- ✅ `sameSite: 'lax'` prevents CSRF

### 2. **No Token in Response Body**
```json
// ❌ OLD (INSECURE)
{
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// ✅ NEW (SECURE)
{
  "user": {...}
}
// Token only in Set-Cookie header
```

### 3. **Rate Limiting**
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 15 minutes |
| Registration | 10 attempts | 1 hour |
| Admin API | 30 requests | 1 minute |
| General API | 60 requests | 1 minute |

**⚠️ Note:** In-memory rate limiter (resets on restart). Replace with Redis for production.

### 4. **Account Enumeration Protection**
```typescript
// ❌ OLD (REVEALS IF EMAIL EXISTS)
if (!user) return { error: "User not found" }
if (!validPassword) return { error: "Wrong password" }

// ✅ NEW (GENERIC MESSAGE)
if (!user || !validPassword) {
  return { error: "Invalid credentials" }
}
```

### 5. **Password Security**
- ✅ Minimum 8 characters (enforced)
- ✅ Hashed with bcrypt (salt rounds: 10)
- ✅ Never returned in API responses
- ✅ Always excluded from Prisma queries

### 6. **IDOR Protection**
Users can only access their own resources:
```typescript
// Orders - user can only see their own orders
const orders = await prisma.order.findMany({
  where: { userId: user.id } // ← Scoped to authenticated user
})

// Cart - user can only modify their own cart
const cart = await prisma.cartItem.delete({
  where: {
    id: itemId,
    userId: user.id // ← Prevents deleting other users' items
  }
})
```

### 7. **Role-Based Authorization**
```typescript
// Middleware checks role and redirects
if (pathname.startsWith('/admin') && role !== 'ADMIN') {
  return NextResponse.redirect(new URL('/unauthorized', req.url))
}

// API routes check role
const user = await requireRole(req, ['ADMIN'])
```

### 8. **Admin Protection**
- ❌ Admin cannot delete their own account
- ❌ Cannot delete/deactivate last active admin
- ❌ Cannot demote last active admin

### 9. **Soft Delete for Users with Orders**
```typescript
if (user.orders.length > 0) {
  // Soft delete - preserve order history
  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  })
} else {
  // Hard delete - no order history
  await prisma.user.delete({ where: { id } })
}
```

---

## 🏗️ ARCHITECTURE

### File Structure
```
ecommerce-monorepo/web/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts       # Login endpoint
│   │       ├── register/route.ts    # Registration endpoint
│   │       ├── logout/route.ts      # Logout endpoint
│   │       └── me/route.ts          # Get current user
│   ├── login/page.tsx               # Login page
│   ├── register/page.tsx            # Registration page
│   ├── dashboard/                   # Customer dashboard
│   ├── dashboard/supplier/          # Supplier dashboard
│   └── admin/                       # Admin panel
├── lib/
│   ├── auth.ts                      # Auth utilities
│   ├── rate-limit.ts                # Rate limiter
│   └── db.ts                        # Prisma client
├── hooks/
│   └── useAuth.ts                   # Auth hook (client-side)
├── components/
│   └── layout/
│       └── UserMenu.tsx             # User menu with role badge
├── middleware.ts                    # Route protection
├── prisma/
│   └── schema.prisma                # Database schema
└── .env.local                       # Environment variables
```

### Key Files

#### `lib/auth.ts`
Core authentication utilities:
- `hashPassword()` - Hash password with bcrypt
- `verifyPassword()` - Verify password
- `generateToken()` - Create JWT token
- `verifyToken()` - Verify JWT token (Node runtime)
- `verifyTokenEdge()` - Verify JWT token (Edge runtime, uses `jose`)
- `setAuthCookie()` - Set httpOnly cookie
- `clearAuthCookie()` - Clear cookie
- `getAuthUser()` - Get user from request
- `requireAuth()` - Require authentication
- `requireRole()` - Require specific role

#### `lib/rate-limit.ts`
In-memory rate limiter:
- `loginRateLimit()` - 5 attempts / 15 min
- `registerRateLimit()` - 10 attempts / 1 hour
- `adminRateLimit()` - 30 requests / 1 min
- `apiRateLimit()` - 60 requests / 1 min

#### `middleware.ts`
Route protection and redirects:
- Public routes: `/`, `/login`, `/register`, `/products/*`
- Auth routes: Protected when logged in (redirect to dashboard)
- Protected routes: Require authentication
- Role-based routes: Check user role

#### `hooks/useAuth.ts`
Client-side auth hook:
- `user` - Current user object
- `isLoading` - Loading state
- `login()` - Login function
- `logout()` - Logout function
- `register()` - Register function

---

## 🔄 AUTHENTICATION FLOW

### Login Flow
```
1. User enters email + password
   ↓
2. POST /api/auth/login
   ↓
3. Rate limit check (5/15min)
   ↓
4. Find user by email
   ↓
5. Check if account is active
   ↓
6. Verify password (bcrypt)
   ↓
7. Generate JWT token
   ↓
8. Set httpOnly cookie
   ↓
9. Return user object (no token)
   ↓
10. Client redirects based on role:
    - USER → /dashboard
    - SUPPLIER → /dashboard/supplier
    - ADMIN → /admin
```

### Registration Flow
```
1. User fills registration form
   ↓
2. POST /api/auth/register
   ↓
3. Rate limit check (10/1hour)
   ↓
4. Validate input (zod schema)
   ↓
5. Strip/ignore client-sent role
   ↓
6. Check if email exists
   ↓
7. Hash password (bcrypt)
   ↓
8. Create user (role: 'USER')
   ↓
9. Generate JWT token
   ↓
10. Set httpOnly cookie
   ↓
11. Return user object
   ↓
12. Client redirects to /dashboard
```

### Logout Flow
```
1. User clicks logout
   ↓
2. POST /api/auth/logout
   ↓
3. Clear httpOnly cookie
   ↓
4. Return success
   ↓
5. Client redirects to /
```

### Middleware Flow
```
1. User visits protected route
   ↓
2. Middleware intercepts request
   ↓
3. Get token from cookie
   ↓
4. Verify token (jose library)
   ↓
5. Check role for route
   ↓
6. Allow or redirect:
   - No token → /login
   - Wrong role → /unauthorized
   - Correct role → Allow
```

---

## 🗄️ DATABASE SCHEMA

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // Hashed with bcrypt
  name          String
  role          String    @default("USER") // USER, SUPPLIER, ADMIN
  phone         String?
  country       String?
  isActive      Boolean   @default(true)
  isVerified    Boolean   @default(false)
  lastLoginAt   DateTime?
  
  // Relations
  orders        Order[]
  cartItems     CartItem[]
  wishlistItems WishlistItem[]
  supplierProfile SupplierProfile?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### SupplierProfile Model
```prisma
model SupplierProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  companyName   String
  businessType  String?
  
  // Relations
  products      Product[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 🚦 API ENDPOINTS

### Authentication
| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/auth/login` | ❌ | 5/15min | Login |
| POST | `/api/auth/register` | ❌ | 10/hour | Register (customer) |
| POST | `/api/auth/logout` | ✅ | - | Logout |
| GET | `/api/auth/me` | ✅ | - | Get current user |
| GET | `/api/health` | ❌ | - | Health check |

### Admin - User Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | ADMIN | List all users |
| POST | `/api/admin/users` | ADMIN | Create user (any role) |
| GET | `/api/admin/users/[id]` | ADMIN | Get user details |
| PUT | `/api/admin/users/[id]` | ADMIN | Update user |
| DELETE | `/api/admin/users/[id]` | ADMIN | Delete user |

### Orders (IDOR Protected)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders` | USER+ | Get own orders |
| POST | `/api/orders` | USER+ | Create order |
| GET | `/api/orders/[id]` | USER+ | Get own order |
| PUT | `/api/orders/[id]` | USER+ | Update own order |

### Cart (IDOR Protected)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | USER+ | Get own cart |
| POST | `/api/cart` | USER+ | Add to cart |
| DELETE | `/api/cart/[itemId]` | USER+ | Remove from cart |

### Wishlist (IDOR Protected)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist` | USER+ | Get own wishlist |
| POST | `/api/wishlist` | USER+ | Add to wishlist |
| DELETE | `/api/wishlist/[productId]` | USER+ | Remove from wishlist |

---

## 🧪 TESTING

See `🧪_AUTHENTICATION_TESTING_GUIDE.md` for complete testing scenarios.

### Quick Test Commands

**Test Login (Success):**
```bash
curl -v http://localhost:3005/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'
```

**Test Login (Fail):**
```bash
curl http://localhost:3005/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"wrong"}'
```

**Test Rate Limit:**
```bash
for i in {1..6}; do
  curl http://localhost:3005/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
  echo ""
done
```

**Test Health:**
```bash
curl http://localhost:3005/api/health
```

---

## 📝 ENVIRONMENT VARIABLES

### Required
```env
# JWT Secret (required, min 32 chars)
JWT_SECRET=your-secret-key-here

# Database URL
DATABASE_URL=postgresql://user:password@localhost:5432/yiwuexpress

# Node Environment
NODE_ENV=development
```

### Optional
```env
# JWT Expiration (default: 7d)
JWT_EXPIRES_IN=7d

# Cookie Name (default: auth_token)
COOKIE_NAME=auth_token
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

### 1. Environment
- [ ] Generate strong JWT_SECRET (64+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Use production database URL
- [ ] Enable HTTPS (SSL certificate)

### 2. Security
- [ ] Replace in-memory rate limiter with Redis
- [ ] Enable email verification
- [ ] Set up password reset flow
- [ ] Configure CORS properly
- [ ] Review and update rate limits
- [ ] Set up monitoring/logging

### 3. Database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed admin user
- [ ] Backup strategy in place

### 4. Testing
- [ ] All test scenarios pass
- [ ] Security checklist complete
- [ ] Load testing completed
- [ ] Penetration testing (optional)

---

## 📚 DOCUMENTATION

| Document | Purpose |
|----------|---------|
| `📋_AUTHENTICATION_SYSTEM_SUMMARY.md` | This document - complete overview |
| `🧪_AUTHENTICATION_TESTING_GUIDE.md` | Step-by-step testing guide |
| `✅_LOGIN_FIX_COMPLETE.md` | Recent bug fix details |
| `✅_LOCALHOST_STATUS_REPORT.md` | Localhost security verification |
| `🎯_HTTP_VS_HTTPS_GUIDE.md` | HTTP vs HTTPS guide |
| `.env.example` | Environment variables template |

---

## 🎉 FEATURES SUMMARY

✅ **Complete**
- 3-role user system (Customer, Supplier, Admin)
- JWT authentication with httpOnly cookies
- Role-based access control
- Rate limiting on sensitive endpoints
- Account enumeration protection
- IDOR protection
- Password hashing (bcrypt)
- Secure cookie configuration
- Health check endpoint
- Admin user management
- Soft delete for users with orders
- Admin self-protection
- Last admin protection

🔄 **Future Enhancements**
- Email verification flow
- Password reset flow
- 2FA (Two-Factor Authentication)
- Redis-based rate limiting
- Session management
- OAuth integration (Google, GitHub)
- API key authentication
- Audit logging

---

## 🤝 SUPPORT

For issues or questions:
1. Check the testing guide: `🧪_AUTHENTICATION_TESTING_GUIDE.md`
2. Review security features in this document
3. Check server logs for errors
4. Verify environment variables
5. Test with curl commands

---

## 📄 LICENSE

This authentication system is part of the YIWU EXPRESS e-commerce platform.

---

**Last Updated:** [Auto-generated based on fix completion]  
**Version:** 1.0.0  
**Status:** ✅ Production Ready (with recommended Redis upgrade for rate limiting)
