# 🎯 USER SYSTEM ARCHITECTURE

## 📊 SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     YIWU EXPRESS                            │
│                  E-COMMERCE PLATFORM                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │CUSTOMER │        │SUPPLIER │        │  ADMIN  │
   │  (USER) │        │         │        │         │
   └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                   │
        │ Public           │ Admin             │ Admin
        │ Registration     │ Creates           │ Creates
        │                  │                   │
        └──────────┬───────┴───────┬───────────┘
                   │               │
              ┌────▼───────────────▼────┐
              │   AUTHENTICATION API    │
              │  (JWT + Bcrypt + Zod)   │
              └────┬────────────────┬───┘
                   │                │
        ┌──────────▼────┐    ┌─────▼──────────┐
        │  Login API    │    │  Register API  │
        │  /api/auth/   │    │  /api/auth/    │
        │  login        │    │  register      │
        └──────┬────────┘    └────────────────┘
               │
               │ Returns JWT Token + User
               │
        ┌──────▼──────────────────────────────┐
        │      CLIENT STATE MANAGEMENT        │
        │         (Zustand + Persist)         │
        │       hooks/useAuth.ts              │
        └──────┬──────────────────────────────┘
               │
               │ Stores: user, token, isAuthenticated
               │
    ┌──────────┴──────────┬─────────────────┐
    │                     │                 │
┌───▼───┐           ┌────▼────┐      ┌────▼────┐
│USER   │           │SUPPLIER │      │ ADMIN   │
│MENU   │           │DASHBOARD│      │ PANEL   │
└───────┘           └─────────┘      └─────────┘
```

## 🔐 AUTHENTICATION FLOW

```
┌──────────┐
│  VISITOR │
└────┬─────┘
     │
     │ Clicks Register/Login
     │
     ▼
┌─────────────────┐
│  LOGIN PAGE     │
│  /login         │──────┐
└────┬────────────┘      │
     │                   │
     │ Submit Form       │ Submit Form
     │                   │
     ▼                   ▼
┌──────────────────────────────────────┐
│  POST /api/auth/login                │
│  POST /api/auth/register (Customer)  │
└────┬─────────────────────────────────┘
     │
     │ 1. Validate Input (Zod)
     │ 2. Check User Exists
     │ 3. Verify Password (Bcrypt)
     │ 4. Generate JWT Token
     │
     ▼
┌─────────────────────────────────┐
│  Response:                      │
│  {                              │
│    user: { id, name, role },    │
│    token: "jwt.token.here"      │
│  }                              │
└────┬────────────────────────────┘
     │
     │ Store in localStorage
     │ Update Zustand state
     │
     ▼
┌──────────────────────────────┐
│  REDIRECT BASED ON ROLE:     │
│  - CUSTOMER  → /             │
│  - SUPPLIER  → /dashboard/   │
│                supplier       │
│  - ADMIN     → /admin        │
└──────────────────────────────┘
```

## 👥 USER ROLES & PERMISSIONS

```
┌────────────────────────────────────────────────────────────┐
│                        USER ROLES                          │
├────────────┬──────────────┬──────────────┬────────────────┤
│   ROLE     │ HOW CREATED  │   REDIRECT   │   DASHBOARD    │
├────────────┼──────────────┼──────────────┼────────────────┤
│ CUSTOMER   │ Public       │ /            │ /dashboard     │
│ (USER)     │ /register    │ (Homepage)   │                │
├────────────┼──────────────┼──────────────┼────────────────┤
│ SUPPLIER   │ Admin        │ /dashboard/  │ /dashboard/    │
│            │ creates      │ supplier     │ supplier       │
├────────────┼──────────────┼──────────────┼────────────────┤
│ ADMIN      │ Admin        │ /admin       │ /admin         │
│            │ creates      │              │                │
└────────────┴──────────────┴──────────────┴────────────────┘
```

## 🗄️ DATABASE SCHEMA

```
┌──────────────────────────────────────┐
│              User                    │
├──────────────────────────────────────┤
│ id                  String (PK)      │
│ email               String (Unique)  │
│ password            String (Hashed)  │
│ name                String           │
│ role                String           │◄─┐
│ phone               String?          │  │
│ country             String?          │  │
│ isActive            Boolean          │  │
│ isVerified          Boolean          │  │
│ lastLoginAt         DateTime?        │  │
│ supplierId          String? (FK)     │──┐
│ createdAt           DateTime         │  │
│ updatedAt           DateTime         │  │
└──────────────────────────────────────┘  │
                                          │
                    ┌─────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│         SupplierProfile              │
├──────────────────────────────────────┤
│ id                  String (PK)      │
│ companyName         String           │
│ businessType        String?          │
│   - MANUFACTURER                     │
│   - WHOLESALER                       │
│   - DISTRIBUTOR                      │
│ taxId               String?          │
│ phone               String?          │
│ address             String?          │
│ description         String?          │
│ logo                String?          │
│ isActive            Boolean          │
│ createdAt           DateTime         │
│ updatedAt           DateTime         │
└──────────────────────────────────────┘
```

## 🎨 UI COMPONENTS

```
┌────────────────────────────────────────────────────────┐
│                  MainHeader.tsx                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   Logo   │  │   Nav    │  │    UserMenu      │   │
│  └──────────┘  └──────────┘  └────────┬─────────┘   │
│                                         │             │
└─────────────────────────────────────────┼─────────────┘
                                          │
                              ┌───────────▼───────────┐
                              │   UserMenu.tsx        │
                              ├───────────────────────┤
                              │ • User Avatar         │
                              │ • Name & Email        │
                              │ • Role Badge          │
                              │   └─ CUSTOMER (Green) │
                              │   └─ SUPPLIER (Blue)  │
                              │   └─ ADMIN (Red)      │
                              │ • Menu Items          │
                              │   └─ Dashboard        │
                              │   └─ Orders           │
                              │   └─ Wishlist         │
                              │   └─ Profile          │
                              │ • Logout Button       │
                              └───────────────────────┘
```

## 🚀 API ENDPOINTS

```
PUBLIC ENDPOINTS
├── POST   /api/auth/register        (Customer Registration)
└── POST   /api/auth/login           (All Roles)

PROTECTED ENDPOINTS (Requires JWT Token)
├── GET    /api/auth/me              (Current User Info)
├── PUT    /api/auth/me              (Update Profile)
└── ...

ADMIN ENDPOINTS (Requires ADMIN Role)
├── GET    /api/admin/users          (List Users)
│          ?page=1&limit=10&search=john&role=USER
├── POST   /api/admin/users          (Create User - Any Role)
├── GET    /api/admin/users/:id      (Get User Details)
├── PUT    /api/admin/users/:id      (Update User)
└── DELETE /api/admin/users/:id      (Delete User)
```

## 📱 USER JOURNEYS

### CUSTOMER JOURNEY
```
1. Visit Website
   └─► /

2. Click Register
   └─► /register

3. Fill Form
   ├─ Name
   ├─ Email
   ├─ Password
   ├─ Phone (optional)
   └─ Country (optional)

4. Submit
   ├─ Account Created
   ├─ Auto-Login
   └─► Redirect to /

5. Browse Products
   ├─ Add to Cart
   ├─ Add to Wishlist
   └─ Place Order

6. Access Dashboard
   └─► /dashboard
       ├─ View Orders
       ├─ Manage Wishlist
       ├─ Update Profile
       └─ Manage Addresses
```

### SUPPLIER JOURNEY
```
1. Admin Creates Account
   └─► /admin/users → Add User
       ├─ Select Role: SUPPLIER
       ├─ Company Name
       ├─ Business Type
       └─ Tax ID

2. Supplier Receives Email
   (Future: Email with credentials)

3. Supplier Logs In
   └─► /login
       └─► Redirect to /dashboard/supplier

4. Supplier Dashboard
   ├─ Add Products
   ├─ Manage Inventory
   ├─ Fulfill Orders
   ├─ View Analytics
   └─ Manage Payouts
```

### ADMIN JOURNEY
```
1. Admin Logs In
   └─► /login
       └─► Redirect to /admin

2. Admin Panel
   ├─ User Management
   │  ├─ Create Users (All Roles)
   │  ├─ Edit Users
   │  ├─ Activate/Deactivate
   │  └─ Delete Users
   ├─ Product Management
   ├─ Order Management
   ├─ Settings
   └─ Reports
```

## 🔄 STATE MANAGEMENT (Zustand)

```typescript
// hooks/useAuth.ts
interface AuthState {
  user: User | null              // Current user object
  token: string | null           // JWT token
  isLoading: boolean             // Loading state
  isAuthenticated: boolean       // Auth status
  
  // Actions
  login: (email, password) => Promise<User>
  register: (data) => Promise<User>
  logout: () => void
  updateUser: (data) => void
  checkAuth: () => Promise<void>
}

// Persisted in localStorage
{
  "user": { "id": "...", "role": "USER", ... },
  "token": "eyJhbGc...",
  "isAuthenticated": true
}
```

## 🎯 ROLE-BASED FEATURES

```
┌────────────────────────────────────────────────────────┐
│                  FEATURE ACCESS MATRIX                 │
├──────────────────┬──────────┬──────────┬──────────────┤
│     FEATURE      │ CUSTOMER │ SUPPLIER │    ADMIN     │
├──────────────────┼──────────┼──────────┼──────────────┤
│ Browse Products  │    ✅    │    ✅    │      ✅      │
│ Add to Cart      │    ✅    │    ✅    │      ✅      │
│ Place Orders     │    ✅    │    ✅    │      ✅      │
│ Wishlist         │    ✅    │    ❌    │      ❌      │
│ Order History    │    ✅    │    ❌    │      ✅      │
│ Add Products     │    ❌    │    ✅    │      ✅      │
│ Manage Inventory │    ❌    │    ✅    │      ✅      │
│ View Analytics   │    ❌    │    ✅    │      ✅      │
│ User Management  │    ❌    │    ❌    │      ✅      │
│ System Settings  │    ❌    │    ❌    │      ✅      │
└──────────────────┴──────────┴──────────┴──────────────┘
```

## 🛡️ SECURITY LAYERS

```
┌──────────────────────────────────────────────────────┐
│              SECURITY ARCHITECTURE                   │
└──────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐     ┌───▼────┐     ┌───▼────┐
   │Password │     │  JWT   │     │ Role   │
   │Hashing  │     │ Tokens │     │ Check  │
   │(Bcrypt) │     │        │     │        │
   └────┬────┘     └───┬────┘     └───┬────┘
        │              │              │
        │ Salt: 10     │ Expires: 7d  │ Middleware
        │              │              │
        ▼              ▼              ▼
   Secure DB      httpOnly       Protected
   Storage        Cookie         Routes
```

## 📦 FILE STRUCTURE

```
web/
├── hooks/
│   └── useAuth.ts                 # Auth state management
├── lib/
│   └── auth.ts                    # Auth utilities (JWT, hash)
├── components/
│   └── layout/
│       └── UserMenu.tsx           # User dropdown
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── me/route.ts
│   │   └── admin/
│   │       └── users/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx              # Customer dashboard
│   │   └── supplier/
│   │       └── page.tsx          # Supplier dashboard
│   └── admin/
│       └── users/page.tsx        # User management
└── prisma/
    └── schema.prisma             # Database schema
```

---

**Architecture Status:** ✅ Complete & Ready
**Last Updated:** 2026-07-03
