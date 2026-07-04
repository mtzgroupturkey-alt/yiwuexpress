# 🎯 LOGIN FLOW & DASHBOARD REDIRECT - VISUAL GUIDE

## 🔐 LOGIN PROCESS

```
┌─────────────────────────────────────────────────────────────┐
│                     YIWU EXPRESS LOGIN                      │
│                    (with Header & Footer)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Email:    [company@business.com        ]                 │
│   Password: [••••••••••••••••            ]                 │
│                                                             │
│   [x] Remember me          Forgot password?                │
│                                                             │
│   [        Sign In to Business Account          ]          │
│                                                             │
│   Don't have an account? Register your business            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    USER CLICKS LOGIN
                          ↓
                    API VALIDATES
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
         SUCCESS                    FAIL
              ↓                       ↓
    Check User Role          Show Error Message
              ↓                       ↓
    ┌─────────┼─────────┐      Try Again
    ↓         ↓         ↓
  ADMIN   SUPPLIER    USER
    ↓         ↓         ↓
  /admin  /dashboard  /dashboard
          /supplier   (Customer)
```

---

## 🏠 CUSTOMER DASHBOARD STRUCTURE

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Shop | Services | Network | [User Menu ▼]  │
├─────────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home / Dashboard                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MY DASHBOARD                                               │
│  Welcome back, John Doe!               [Back to Shop]       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   📦 0      │  │   ❤️ 0      │  │   📍 0      │        │
│  │ Total Orders│  │  Wishlist   │  │  Addresses  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  QUICK ACTIONS                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 📦       │ │ ❤️       │ │ 👤       │ │ 📍       │      │
│  │ My Orders│ │ Wishlist │ │ Profile  │ │ Addresses│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌──────────┐ ┌──────────┐                                 │
│  │ 🛍️       │ │ ⚙️       │                                 │
│  │   Shop   │ │ Settings │                                 │
│  └──────────┘ └──────────┘                                 │
│                                                             │
│  RECENT ACTIVITY                                            │
│  ┌───────────────────────────────────────────────────┐     │
│  │  📊 No recent activity                            │     │
│  │  Start shopping to see your activity here         │     │
│  │                                                    │     │
│  │           [Browse Products]                        │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: About | Contact | Terms | Privacy | © 2026        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 MY ORDERS PAGE

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Shop | Services | Network | [User Menu ▼]  │
├─────────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home / Dashboard / Orders                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← MY ORDERS                                                │
│  🔍 [Search orders...                    ]                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Order #ORD12345              [PAID]                 │   │
│  │ January 15, 2026                                    │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ 3 items          $299.99           👁️ View Details │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Order #ORD12344              [SHIPPED]              │   │
│  │ January 10, 2026                                    │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ 1 item           $49.99            👁️ View Details │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  --- Empty State (when no orders) ---                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            📦                                        │   │
│  │     No orders yet                                   │   │
│  │     When you place an order, it will appear here.  │   │
│  │                                                     │   │
│  │           [Browse Products]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: About | Contact | Terms | Privacy | © 2026        │
└─────────────────────────────────────────────────────────────┘
```

---

## ❤️ MY WISHLIST PAGE

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Shop | Services | Network | [User Menu ▼]  │
├─────────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home / Dashboard / Wishlist                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← MY WISHLIST (5 items)                                    │
│                                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │[img] │  │[img] │  │[img] │  │[img] │                   │
│  │      │  │      │  │      │  │      │                   │
│  │Smart │  │LED   │  │Coffee│  │Mixer │                   │
│  │Watch │  │Lamp  │  │Maker │  │      │                   │
│  │      │  │      │  │      │  │      │                   │
│  │$99.99│  │$29.99│  │$79.99│  │$49.99│                   │
│  │      │  │      │  │      │  │      │                   │
│  │[🛒Add]│  │[🛒Add]│  │[🛒Add]│  │[🛒Add]│                   │
│  │[🗑️]  │  │[🗑️]  │  │[🗑️]  │  │[🗑️]  │                   │
│  └──────┘  └──────┘  └──────┘  └──────┘                   │
│                                                             │
│  --- Empty State (when no wishlist items) ---               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            ❤️                                        │   │
│  │     Your wishlist is empty                          │   │
│  │     Start adding products you love.                 │   │
│  │                                                     │   │
│  │           [Browse Products]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: About | Contact | Terms | Privacy | © 2026        │
└─────────────────────────────────────────────────────────────┘
```

---

## 👤 MY PROFILE PAGE

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Shop | Services | Network | [User Menu ▼]  │
├─────────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home / Dashboard / Profile                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← MY PROFILE                                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  👤  John Doe                                       │   │
│  │      john@example.com                               │   │
│  │      [Customer]                                     │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │                                                     │   │
│  │  👤 Full Name                                       │   │
│  │  [John Doe                                    ]     │   │
│  │                                                     │   │
│  │  ✉️ Email Address                                   │   │
│  │  [john@example.com        ] (Cannot be changed)    │   │
│  │                                                     │   │
│  │  📱 Phone Number                                    │   │
│  │  [+1 234 567 8900                              ]    │   │
│  │                                                     │   │
│  │  🌍 Country                                         │   │
│  │  [United States                          ▼]        │   │
│  │                                                     │   │
│  │  [Save Changes]  [Change Password]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: About | Contact | Terms | Privacy | © 2026        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 MY ADDRESSES PAGE

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Shop | Services | Network | [User Menu ▼]  │
├─────────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home / Dashboard / Addresses                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← MY ADDRESSES                          [+ Add Address]    │
│                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐      │
│  │ 📍 John Doe [Default] │  │ 📍 Jane Doe          │      │
│  │                       │  │                       │      │
│  │ 123 Main Street       │  │ 456 Oak Avenue        │      │
│  │ New York, NY 10001    │  │ Boston, MA 02101      │      │
│  │ United States         │  │ United States         │      │
│  │ +1 234 567 8900       │  │ +1 987 654 3210       │      │
│  │                       │  │                       │      │
│  │ [✏️ Edit] [🗑️ Delete] │  │ [✏️ Edit] [✓ Default]│      │
│  └───────────────────────┘  └───────────────────────┘      │
│                                                             │
│  --- Add/Edit Address Form ---                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Add New Address                             [X]     │   │
│  │                                                     │   │
│  │  Full Name *        Phone *                         │   │
│  │  [John Doe    ]     [+1 234 567 8900]              │   │
│  │                                                     │   │
│  │  Address Line 1 *                                   │   │
│  │  [123 Main Street                             ]     │   │
│  │                                                     │   │
│  │  City *             State/Province                  │   │
│  │  [New York    ]     [NY              ]             │   │
│  │                                                     │   │
│  │  Postal Code *      Country *                       │   │
│  │  [10001       ]     [United States    ▼]           │   │
│  │                                                     │   │
│  │  [x] Set as default address                         │   │
│  │                                                     │   │
│  │  [✓ Save Address]  [Cancel]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: About | Contact | Terms | Privacy | © 2026        │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ SETTINGS PAGE

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Shop | Services | Network | [User Menu ▼]  │
├─────────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home / Dashboard / Settings                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← SETTINGS                                                 │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ 🛡️ Change Password │  │ Account Info       │            │
│  │                    │  │                    │            │
│  │ Current Password   │  │ Account Created    │            │
│  │ [•••••••••••]      │  │ Jan 1, 2026        │            │
│  │                    │  │                    │            │
│  │ New Password       │  │ Role               │            │
│  │ [•••••••••••]      │  │ [Customer]         │            │
│  │ Min 8 characters   │  │                    │            │
│  │                    │  │ Email              │            │
│  │ Confirm Password   │  │ john@example.com   │            │
│  │ [•••••••••••]      │  │                    │            │
│  │                    │  │                    │            │
│  │ [Update Password]  │  │                    │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: About | Contact | Terms | Privacy | © 2026        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 COLOR SCHEME

- **Primary:** `#1a3a5c` (Dark Blue)
- **Accent:** `#c9a84c` (Gold)
- **Success:** `#10b981` (Green)
- **Error:** `#ef4444` (Red)
- **Warning:** `#f59e0b` (Orange)
- **Gray:** `#6b7280` (Neutral)

---

## 📱 RESPONSIVE BREAKPOINTS

```
Mobile:  < 640px  (1 column)
Tablet:  640-1024px (2 columns)
Desktop: > 1024px (3-4 columns)
```

---

## 🔑 KEY FEATURES

✅ **Consistent Layout** - Header, Breadcrumb, Footer on all pages
✅ **Role-Based Redirect** - Smart routing based on user role
✅ **Loading States** - Smooth transitions and feedback
✅ **Empty States** - Friendly messages with actions
✅ **Form Validation** - Client-side and server-side
✅ **Security** - HttpOnly cookies, auth guards
✅ **Responsive** - Works on all devices
✅ **Accessible** - Semantic HTML and ARIA labels

---

**Generated:** July 3, 2026
**Status:** ✅ COMPLETE AND READY
