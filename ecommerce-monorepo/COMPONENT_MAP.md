# 🗺️ YIWU EXPRESS - Component Map & Structure

## Homepage Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         <Navbar />                              │
│  Logo | Shop▾ | Products | Services | About | 🔍 | 👤 | 🛒   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      <HeroBanner />                             │
│                                                                 │
│     Premium Kitchenware from Yiwu, China                       │
│     Discover quality kitchen products at wholesale prices       │
│                                                                 │
│     [Shop Now]  [View Categories]                              │
│                                                                 │
│     ✓ Quality  ✓ Free Shipping*  ✓ Secure Payment            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Stats Bar                                  │
│   👥 1500+    🌍 50+     ⏰ 99.5%    🛡️ 24/7                 │
│  Partners    Countries  On-time   Support                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    <TrustBadges />                              │
│              Why Shop With Us?                                  │
│                                                                 │
│  ✅ Quality  🌍 Global   🛡️ Secure  💳 Wholesale              │
│  Products   Shipping    Payment   Prices                       │
│                                                                 │
│  🚚 Customs  🎧 24/7                                           │
│  Support     Support                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  <CategoryShowcase />                           │
│                Shop by Category                                 │
│                                                                 │
│  🍲        🔪        👨‍🍳      ☕        🍷       🧊         │
│  Cookware  Cutlery  Bakeware Drinkware Barware Storage        │
│  245 items 189 items 156 items 178 items 92 items 134 items   │
│                                                                 │
│              [View All Products]                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    <ProductGrid />                              │
│                  Featured Products                              │
│        Hand-picked selection of our most popular items         │
│                                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                      │
│  │ ♡    │  │ ♡    │  │ ♡    │  │ ♡    │                      │
│  │      │  │      │  │      │  │      │                      │
│  │Image │  │Image │  │Image │  │Image │                      │
│  │      │  │      │  │      │  │      │                      │
│  ├──────┤  ├──────┤  ├──────┤  ├──────┤                      │
│  │Name  │  │Name  │  │Name  │  │Name  │                      │
│  │$24.95│  │$18.50│  │$32.00│  │$15.99│                      │
│  │[Cart]│  │[Cart]│  │[Cart]│  │[Cart]│                      │
│  └──────┘  └──────┘  └──────┘  └──────┘                      │
│                                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                      │
│  │      │  │      │  │      │  │      │                      │
│  └──────┘  └──────┘  └──────┘  └──────┘                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    <ProductGrid />                              │
│                    New Arrivals                                 │
│      Discover the latest additions to our collection           │
│                                                                 │
│  [8 Product Cards in 4-column grid]                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    <BlogSection />                              │
│            Kitchen Tips & Trade Insights                        │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │  Image   │  │  Image   │  │  Image   │                    │
│  ├──────────┤  ├──────────┤  ├──────────┤                    │
│  │Category  │  │Category  │  │Category  │                    │
│  │Title     │  │Title     │  │Title     │                    │
│  │Excerpt   │  │Excerpt   │  │Excerpt   │                    │
│  │Read More→│  │Read More→│  │Read More→│                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
│                                                                 │
│                [View All Articles]                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CTA Section                                │
│                                                                 │
│     Ready to Expand Your Business Globally?                    │
│     Join thousands of businesses who trust YIWU EXPRESS        │
│                                                                 │
│     [Browse Products]  [Contact Our Team]                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       <Footer />                                │
│  About | Products | Services | Contact | Legal                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App (page.tsx)
│
├── Navbar
│   ├── Logo
│   ├── Navigation Links
│   ├── MegaMenu (optional)
│   │   ├── Category Sidebar
│   │   ├── Sub-categories Grid
│   │   └── Featured Product
│   ├── Search Icon
│   ├── Cart Icon (with badge)
│   └── User Menu
│
├── HeroBanner
│   ├── Background Image (slideshow)
│   ├── Trust Badge
│   ├── Main Heading
│   ├── Subtitle
│   ├── Primary CTA Button
│   ├── Secondary CTA Button
│   ├── Trust Indicators
│   └── Slide Indicators
│
├── Stats Bar
│   └── 4x Stat Cards
│       ├── Icon
│       ├── Value
│       └── Label
│
├── TrustBadges
│   ├── Section Header
│   └── 6x Badge Cards
│       ├── Icon
│       ├── Title
│       └── Description
│
├── CategoryShowcase
│   ├── Section Header
│   ├── 6x Category Cards
│   │   ├── Gradient Icon
│   │   ├── Category Name
│   │   ├── Product Count
│   │   └── Link
│   └── View All CTA
│
├── ProductGrid (Featured)
│   ├── Section Header
│   │   ├── Title
│   │   └── Subtitle
│   └── Grid of ProductCards
│       ├── ProductCard
│       │   ├── Image Container
│       │   │   ├── Product Image
│       │   │   ├── Badges (Wholesale, Stock)
│       │   │   ├── Wishlist Button
│       │   │   └── Quick View Button
│       │   └── Product Info
│       │       ├── Category Label
│       │       ├── Product Name
│       │       ├── Description
│       │       ├── Pricing
│       │       │   ├── "From" Label
│       │       │   ├── Display Price
│       │       │   └── Original Price (strikethrough)
│       │       ├── Min Order Info
│       │       ├── Add to Cart Button
│       │       └── Wholesale Inquiry Link
│       └── [7 more ProductCards...]
│
├── ProductGrid (New Arrivals)
│   └── [Same structure as Featured]
│
├── BlogSection
│   ├── Section Header
│   │   ├── Title
│   │   └── View All Link
│   └── 3x Blog Cards
│       ├── Image
│       ├── Category Badge
│       ├── Meta Info (Date, Read Time)
│       ├── Title
│       ├── Excerpt
│       └── Read More Link
│
├── CTA Section
│   ├── Heading
│   ├── Description
│   └── 2x CTA Buttons
│
└── Footer
    ├── Branding
    ├── Quick Links
    ├── Contact Info
    ├── Social Links
    └── Legal Links
```

---

## Component Dependencies

```
┌─────────────────┐
│   page.tsx      │  Main entry point
└────────┬────────┘
         │
         ├─► Navbar (existing)
         ├─► HeroBanner (NEW)
         ├─► TrustBadges (NEW)
         ├─► CategoryShowcase (NEW)
         ├─► ProductGrid (NEW)
         │   └─► ProductCard (NEW)
         ├─► BlogSection (NEW)
         └─► Footer (existing)

┌─────────────────┐
│   navbar.tsx    │  Navigation
└────────┬────────┘
         │
         └─► MegaMenu (NEW, optional)
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────┐
│                    Backend API                       │
│  /api/products?featured=true                         │
│  /api/products?sort=createdAt:desc                   │
│  /api/cart                                           │
│  /api/wishlist (to be implemented)                   │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│              React Query Cache                       │
│  - Automatic caching                                 │
│  - Background refetching                             │
│  - Loading states                                    │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│               ProductGrid                            │
│  - Receives products array                           │
│  - Manages wishlist state                            │
│  - Handles cart operations                           │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│              ProductCard (x8)                        │
│  - Displays product info                             │
│  - Wishlist toggle                                   │
│  - Add to cart action                                │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│            Local Storage (Wishlist)                  │
│  - Guest user wishlist                               │
│  - Syncs to backend when logged in                   │
└──────────────────────────────────────────────────────┘
```

---

## State Management

```
┌─────────────────────────────────────────────────────┐
│                   Global State                      │
├─────────────────────────────────────────────────────┤
│  - User authentication (localStorage token)         │
│  - Cart count (navbar badge)                        │
│  - Theme settings (primary/accent colors)           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                 Component State                     │
├─────────────────────────────────────────────────────┤
│  HeroBanner:                                        │
│    - currentSlide (number)                          │
│    - imageError (boolean)                           │
│                                                     │
│  ProductCard:                                       │
│    - isHovered (boolean)                            │
│    - isAddingToCart (boolean)                       │
│    - imageError (boolean)                           │
│                                                     │
│  ProductGrid:                                       │
│    - wishlist (Set<number>)                         │
│                                                     │
│  MegaMenu:                                          │
│    - isOpen (boolean)                               │
│    - activeCategory (string | null)                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                 Server State                        │
│              (React Query Cache)                    │
├─────────────────────────────────────────────────────┤
│  - Featured products                                │
│  - New arrivals                                     │
│  - Cart data                                        │
│  - User profile                                     │
└─────────────────────────────────────────────────────┘
```

---

## Event Flow

```
User Action: Click "Add to Cart"
      │
      ▼
ProductCard → handleAddToCart()
      │
      ├─► Check authentication
      │   ├─► Redirect to login (if not authenticated)
      │   └─► Continue (if authenticated)
      │
      ├─► Show loading state
      │   └─► Button shows spinner + "Added!"
      │
      ├─► POST /api/cart
      │   ├─► userId, productId, quantity
      │   └─► Receive response
      │
      ├─► Update UI
      │   ├─► Hide loading state
      │   └─► Show success feedback
      │
      └─► Dispatch event
          └─► window.dispatchEvent(new Event('cartUpdated'))
              └─► Navbar listens and updates cart badge

User Action: Toggle Wishlist
      │
      ▼
ProductCard → handleToggleWishlist()
      │
      ├─► Update local state
      │   └─► Toggle productId in wishlist Set
      │
      ├─► Update localStorage
      │   └─► Save wishlist array
      │
      └─► Sync to backend (if authenticated)
          └─► POST /api/wishlist
```

---

## Responsive Breakpoints

```
Mobile (< 640px)
┌──────────────────┐
│   1 Column       │
│  ┌────────────┐  │
│  │  Product   │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │  Product   │  │
│  └────────────┘  │
└──────────────────┘

Tablet (640px - 1024px)
┌────────────────────────────┐
│     2-3 Columns            │
│  ┌──────────┐ ┌──────────┐│
│  │ Product  │ │ Product  ││
│  └──────────┘ └──────────┘│
│  ┌──────────┐ ┌──────────┐│
│  │ Product  │ │ Product  ││
│  └──────────┘ └──────────┘│
└────────────────────────────┘

Desktop (> 1024px)
┌──────────────────────────────────────────────┐
│              3-4 Columns                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│  │Product │ │Product │ │Product │ │Product ││
│  └────────┘ └────────┘ └────────┘ └────────┘│
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│  │Product │ │Product │ │Product │ │Product ││
│  └────────┘ └────────┘ └────────┘ └────────┘│
└──────────────────────────────────────────────┘
```

---

## File Structure

```
ecommerce-monorepo/
├── web/
│   ├── app/
│   │   ├── page.tsx ✅ (Updated - Homepage)
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── products/
│   │       ├── cart/
│   │       └── wishlist/ (to be created)
│   │
│   ├── components/
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── HeroBanner.tsx ✅ NEW
│   │   ├── TrustBadges.tsx ✅ NEW
│   │   ├── CategoryShowcase.tsx ✅ NEW
│   │   ├── BlogSection.tsx ✅ NEW
│   │   ├── MegaMenu.tsx ✅ NEW
│   │   └── products/
│   │       ├── ProductCard.tsx ✅ NEW
│   │       └── ProductGrid.tsx ✅ NEW
│   │
│   └── lib/
│       ├── auth.ts
│       └── db.ts
│
└── Documentation/
    ├── TRAMONTINA_LAYOUT_IMPLEMENTATION.md ✅
    ├── TRAMONTINA_IMPLEMENTATION_COMPLETE.md ✅
    ├── TRAMONTINA_QUICK_START.md ✅
    ├── README_TRAMONTINA_LAYOUT.md ✅
    └── COMPONENT_MAP.md ✅ (This file)
```

---

## Loading States

```
ProductGrid Loading:
┌────────────────────────────────────────────┐
│  [Skeleton] [Skeleton] [Skeleton] [Skeleton]│
│  [Skeleton] [Skeleton] [Skeleton] [Skeleton]│
└────────────────────────────────────────────┘

ProductCard Loading:
┌──────────┐
│▒▒▒▒▒▒▒▒▒▒│ ← Image skeleton (gray pulse)
│▒▒▒▒▒▒▒▒▒▒│
├──────────┤
│▒▒▒▒      │ ← Title skeleton
│▒▒▒▒▒▒    │ ← Price skeleton
│▒▒▒▒▒▒▒▒▒▒│ ← Button skeleton
└──────────┘
```

---

## Empty States

```
No Products Found:
┌────────────────────────────────┐
│         📦                     │
│                                │
│   No Products Found            │
│   We couldn't find any         │
│   products matching your       │
│   criteria.                    │
│                                │
│   [View All Products]          │
└────────────────────────────────┘
```

---

## Interaction States

```
ProductCard Hover:
┌──────────┐
│♡      ☆  │ ← Wishlist + badge
│          │
│  Image   │ ← Zoom in (scale: 1.1)
│  Zoomed  │
│          │
│[Quick View] ← Appears from bottom
├──────────┤
│ Title    │
│ $24.95   │
│ [🛒 Add] │ ← Hover: darker blue
└──────────┘

Add to Cart Loading:
┌──────────┐
│ [⟳Added!]│ ← Green background
└──────────┘
  ↓ (1 second)
┌──────────┐
│ [🛒 Add] │ ← Back to normal
└──────────┘
```

---

**Visual Reference Complete**  
**Last Updated**: January 20, 2024  
**Component Count**: 7 new components  
**Documentation Files**: 5 comprehensive guides
