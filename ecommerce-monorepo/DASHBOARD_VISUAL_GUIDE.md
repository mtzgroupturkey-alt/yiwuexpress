# Dashboard Layout Visual Guide 🎨

## Page Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN HEADER                             │
│  ┌─────┐                                      🔍 🛒(3) 👤 ☰    │
│  │ LOGO│  HOME  SHOP  SERVICES  ABOUT  CONTACT                  │
│  └─────┘                                                         │
├─────────────────────────────────────────────────────────────────┤
│  BREADCRUMB:  🏠 > Dashboard > Orders                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      PAGE CONTENT AREA                          │
│                                                                 │
│                   (Individual dashboard pages                   │
│                    render their content here)                   │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                           FOOTER                                │
│  Logo & Info  │  Quick Links  │  Support  │  Contact           │
│                                                                 │
│  © 2025 YIWU EXPRESS. All rights reserved.                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Main Header (Always Visible)

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──────┐                                                        │
│ │ LOGO │  [HOME] [SHOP] [SERVICES] [ABOUT] [CONTACT]           │
│ │      │                                                        │
│ │  YE  │     [  Search for products...  🔍  ]                  │
│ └──────┘                                                        │
│                                          [🌐 EN] [🛒 3] [👤] [☰]│
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Company logo (clickable → home)
- Navigation links (Home, Shop, Services, About, Contact)
- Search bar (desktop) / Search icon (mobile)
- Language selector (EN, CN, etc.)
- Shopping cart with badge count
- User menu dropdown
- Mobile hamburger menu

### 2. Breadcrumb Section

```
┌─────────────────────────────────────────────────────────────────┐
│  🏠 > Dashboard > Orders                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Auto-generated examples:**
- `/dashboard` → 🏠 > Dashboard
- `/dashboard/orders` → 🏠 > Dashboard > Orders
- `/dashboard/profile` → 🏠 > Dashboard > Profile
- `/dashboard/addresses` → 🏠 > Dashboard > Addresses

### 3. Page Content Area

This is where individual dashboard pages render their content.

**Example: Dashboard Home**
```
┌─────────────────────────────────────────────────────────────────┐
│  My Dashboard                                [Back to Shop]     │
│  Welcome back, John!                                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │  📦 5    │  │  ❤️ 12   │  │  📍 2    │                     │
│  │  Orders  │  │ Wishlist │  │ Addresses│                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
│                                                                 │
│  Quick Actions                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│  │ 📦 Orders  │ │ ❤️ Wishlist│ │ 👤 Profile │                 │
│  │ View orders│ │ Saved items│ │ Edit info  │                 │
│  └────────────┘ └────────────┘ └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

**Example: Orders Page**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← My Orders                                                    │
│  [  Search orders...  🔍  ]                                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Order #12345                          [DELIVERED]         │  │
│  │ December 15, 2024                                         │  │
│  │ 3 items  •  $125.00                    [View Details →]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Order #12344                          [SHIPPED]           │  │
│  │ December 10, 2024                                         │  │
│  │ 1 item  •  $45.00                      [View Details →]  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Footer (Always Visible)

```
┌─────────────────────────────────────────────────────────────────┐
│                         🌐 GLOBE ANIMATION                      │
│  ┌──────┐    Quick Links      Support         Get In Touch     │
│  │ LOGO │    Air Freight      Track Ship      📍 Yiwu, China   │
│  │  YE  │    Sea Freight      Get Quote       📞 +86 579...    │
│  └──────┘    Customs          FAQ             ✉️ info@...      │
│  YIWU EXPRESS  Warehousing     Support                          │
│  Global Trade  Sourcing        Contact         🔗 Social Links  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  © 2025 YIWU EXPRESS. All rights reserved.                      │
│  Privacy Policy  •  Terms  •  Cookies  •  Sitemap               │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flow Examples

### Flow 1: Accessing Dashboard

```
User clicks "Dashboard" in user menu
         ↓
    /dashboard
         ↓
┌──────────────────────┐
│   MAIN HEADER        │
├──────────────────────┤
│ 🏠 > Dashboard       │
├──────────────────────┤
│                      │
│  My Dashboard        │
│  Welcome, John!      │
│                      │
│  [Stats Cards]       │
│  [Quick Actions]     │
│                      │
├──────────────────────┤
│   FOOTER             │
└──────────────────────┘
```

### Flow 2: Viewing Orders

```
User clicks "My Orders" card
         ↓
 /dashboard/orders
         ↓
┌──────────────────────┐
│   MAIN HEADER        │
├──────────────────────┤
│ 🏠 > Dashboard >     │
│      Orders          │
├──────────────────────┤
│                      │
│  ← My Orders         │
│  [Search Box]        │
│                      │
│  [Order #12345]      │
│  [Order #12344]      │
│  [Order #12343]      │
│                      │
├──────────────────────┤
│   FOOTER             │
└──────────────────────┘
```

### Flow 3: Editing Profile

```
User clicks "Profile" in dashboard
         ↓
 /dashboard/profile
         ↓
┌──────────────────────┐
│   MAIN HEADER        │
├──────────────────────┤
│ 🏠 > Dashboard >     │
│      Profile         │
├──────────────────────┤
│                      │
│  ← My Profile        │
│                      │
│  [Avatar]            │
│  John Doe            │
│  john@email.com      │
│                      │
│  [Edit Form]         │
│  Name: [____]        │
│  Phone: [____]       │
│  [Save Changes]      │
│                      │
├──────────────────────┤
│   FOOTER             │
└──────────────────────┘
```

---

## Responsive Behavior

### Desktop View (≥ 1024px)

```
┌───────────────────────────────────────────────────────────┐
│ LOGO  HOME  SHOP  SERVICES  ABOUT  CONTACT  [Search]     │
│                                     🌐 EN  🛒  👤         │
├───────────────────────────────────────────────────────────┤
│ 🏠 > Dashboard > Orders                                   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                    [Full Width Content]                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1023px)

```
┌─────────────────────────────────────────────────┐
│ LOGO  HOME  SHOP  [Search]   🛒  👤  ☰          │
├─────────────────────────────────────────────────┤
│ 🏠 > Dashboard > Orders                         │
├─────────────────────────────────────────────────┤
│                                                 │
│         [Responsive Content]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Mobile View (< 768px)

```
┌─────────────────────────────┐
│ LOGO    🔍  🛒  👤  ☰       │
├─────────────────────────────┤
│ 🏠 > Dashboard              │
├─────────────────────────────┤
│                             │
│    [Stacked Content]        │
│                             │
└─────────────────────────────┘

When hamburger clicked:
┌─────────────────────────────┐
│ LOGO    🔍  🛒  👤  ✕       │
├─────────────────────────────┤
│ HOME                        │
│ SHOP                        │
│ SERVICES                    │
│ ABOUT                       │
│ CONTACT                     │
│ WHOLESALE                   │
└─────────────────────────────┘
```

---

## Color Scheme

### Primary Colors
- **Navy Blue**: `#1a3a5c` - Headers, buttons, links
- **Gold**: `#c9a84c` - Accents, highlights, badges
- **White**: `#ffffff` - Backgrounds, cards
- **Gray**: `#f9fafb` - Page background

### Text Colors
- **Dark**: `#111827` - Main text
- **Medium**: `#6b7280` - Secondary text
- **Light**: `#9ca3af` - Disabled text

### State Colors
- **Success**: `#10b981` - Completed, delivered
- **Warning**: `#f59e0b` - Pending, processing
- **Error**: `#ef4444` - Cancelled, failed
- **Info**: `#3b82f6` - Shipped, in transit

---

## Interactive Elements

### User Menu Dropdown

```
Closed State:
┌─────┐
│ 👤  │
└─────┘

Open State:
┌─────────────────────┐
│ 👤 John Doe         │
│    Customer         │
├─────────────────────┤
│ 📊 Dashboard        │
│ 📦 Orders           │
│ ❤️ Wishlist         │
│ 👤 Profile          │
│ 📍 Addresses        │
│ ⚙️ Settings         │
├─────────────────────┤
│ 🚪 Logout           │
└─────────────────────┘
```

### Breadcrumb Navigation

```
Clickable:           Non-clickable:
🏠 > Dashboard   >   [Orders]
 ↑        ↑              ↑
Link    Link      Current Page
```

### Cart Badge

```
Empty:              With Items:
┌─────┐            ┌─────┐
│ 🛒  │            │ 🛒③ │
└─────┘            └─────┘
```

---

## Animation & Transitions

### Header Scroll Behavior
- On scroll down: Header becomes sticky with blur effect
- Announcement bar slides up and hides
- Logo slightly reduces size
- Shadow appears under header

### Breadcrumb Hover
- Links change color from gray → navy blue
- Smooth 200ms transition

### Footer
- Background globe slowly rotates
- Gradient orbs pulse gently
- Social icons scale up on hover

---

## Accessibility Features

✅ **Semantic HTML**: Proper header, nav, main, footer tags
✅ **ARIA Labels**: All icons have descriptive labels
✅ **Keyboard Navigation**: Tab through all interactive elements
✅ **Focus Indicators**: Clear focus rings on inputs/buttons
✅ **Color Contrast**: WCAG AA compliant text contrast
✅ **Responsive Text**: Scalable font sizes
✅ **Alt Text**: All images have descriptive alt text

---

## Status Indicators

### Order Status Colors
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ PENDING  │  │  PAID    │  │ SHIPPED  │  │DELIVERED │
│  Yellow  │  │   Blue   │  │  Purple  │  │  Green   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘

┌──────────┐
│CANCELLED │
│   Red    │
└──────────┘
```

### Badge Styles
```
Default Address:       Cart Count:        Notification:
┌─────────┐           ┌───┐              ┌───┐
│ DEFAULT │           │ 3 │              │ ! │
│  Navy   │           │Red│              │Red│
└─────────┘           └───┘              └───┘
```

---

## Page-Specific Layouts

### Dashboard Home
- 3-column stats cards
- 3-column quick action cards
- Full-width recent activity section

### Orders List
- Search bar at top
- Stacked order cards
- Each card shows: order number, date, status, total, view link

### Wishlist
- 4-column grid (desktop)
- 2-column grid (tablet)
- 1-column grid (mobile)
- Product cards with image, name, price, actions

### Profile & Settings
- Centered max-width form (640px)
- 2-column input groups
- Large save button at bottom

### Addresses
- 2-column grid for address cards
- Full-width add/edit form when active
- Default badge on primary address

---

## Summary

This layout system provides:
✅ Consistent navigation across all dashboard pages
✅ Clear location awareness with breadcrumbs
✅ Professional, polished design
✅ Responsive on all devices
✅ Accessible to all users
✅ Easy to maintain and extend

All dashboard pages automatically inherit this layout without any additional code!
