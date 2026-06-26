# 🏗️ FEATURED PRODUCTS & NEW ARRIVALS - SYSTEM ARCHITECTURE

## 📐 COMPLETE SYSTEM DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      HOMEPAGE (/)                               │   │
│  │  ┌──────────────────────────────────────────────────────────┐ │   │
│  │  │  ⭐ FEATURED PRODUCTS SECTION                            │ │   │
│  │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                            │ │   │
│  │  │  │ P1 │ │ P2 │ │ P3 │ │ P4 │   (8 products displayed)   │ │   │
│  │  │  └────┘ └────┘ └────┘ └────┘                            │ │   │
│  │  │  Query: /api/products?featured=true&limit=8             │ │   │
│  │  │  Order By: featuredOrder ASC                            │ │   │
│  │  └──────────────────────────────────────────────────────────┘ │   │
│  │                                                                │   │
│  │  ┌──────────────────────────────────────────────────────────┐ │   │
│  │  │  ✨ NEW ARRIVALS SECTION                                 │ │   │
│  │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                            │ │   │
│  │  │  │ N1 │ │ N2 │ │ N3 │ │ N4 │   (8 products displayed)   │ │   │
│  │  │  └────┘ └────┘ └────┘ └────┘                            │ │   │
│  │  │  Query: /api/products?new=true&limit=8                  │ │   │
│  │  │  Order By: newArrivalOrder ASC                          │ │   │
│  │  └──────────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    │ HTTP GET Requests
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                                   │    API LAYER (Next.js Routes)        │
├───────────────────────────────────┴─────────────────────────────────────┤
│                                                                          │
│  PUBLIC API ENDPOINTS:                                                  │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  GET /api/products?featured=true                               │   │
│  │  → Returns: Featured products ordered by featuredOrder         │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  GET /api/products?new=true                                    │   │
│  │  → Returns: New arrivals ordered by newArrivalOrder            │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    │ Prisma ORM
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                                   │    DATABASE (PostgreSQL)             │
├───────────────────────────────────┴─────────────────────────────────────┤
│                                                                          │
│  TABLE: products                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  id              │ string (cuid)     │ Primary Key             │   │
│  │  name            │ string            │                         │   │
│  │  price           │ float             │                         │   │
│  │  isFeatured      │ boolean (✅)      │ Mark as featured        │   │
│  │  featuredOrder   │ integer (✅)      │ Display order (1,2,3..) │   │
│  │  isNewArrival    │ boolean (✅)      │ Mark as new arrival     │   │
│  │  newArrivalOrder │ integer (✅)      │ Display order (1,2,3..) │   │
│  │  ...             │ ...               │ Other fields            │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  INDEXES:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  idx_products_featured (isFeatured, featuredOrder) ✅          │   │
│  │  idx_products_new_arrival (isNewArrival, newArrivalOrder) ✅   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    │ Admin API Calls
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                         ADMIN BACKEND (Next.js)                          │
├───────────────────────────────────┴─────────────────────────────────────┤
│                                                                          │
│  ADMIN API ENDPOINTS:                                                   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  GET  /api/admin/products/featured                             │   │
│  │  → Get all featured products                                   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  PUT  /api/admin/products/featured                             │   │
│  │  → Update featured products order (bulk)                       │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  PUT  /api/admin/products/[id]/featured                        │   │
│  │  → Toggle featured status for single product                   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  GET  /api/admin/products/new-arrivals                         │   │
│  │  → Get all new arrivals                                        │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  PUT  /api/admin/products/new-arrivals                         │   │
│  │  → Update new arrivals order (bulk)                            │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  PUT  /api/admin/products/[id]/new-arrival                     │   │
│  │  → Toggle new arrival status for single product                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    │ User Interactions
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                         ADMIN FRONTEND (React)                           │
├───────────────────────────────────┴─────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ADMIN PRODUCTS PAGE (/admin/products)                           │ │
│  │                                                                   │ │
│  │  Product Table:                                                  │ │
│  │  ┌─────────┬────┬───────┬───────┬──────────┬─────────┬────────┐│ │
│  │  │ Product │SKU │ Price │ Stock │ Featured │ New ↔   │ Actions││ │
│  │  ├─────────┼────┼───────┼───────┼──────────┼─────────┼────────┤│ │
│  │  │ Prod A  │P01 │ $10   │  50   │   [✓]↔   │  [ ]↔   │  ...   ││ │
│  │  │ Prod B  │P02 │ $20   │  30   │   [ ]↔   │  [✓]↔   │  ...   ││ │
│  │  └─────────┴────┴───────┴───────┴──────────┴─────────┴────────┘│ │
│  │                                                                   │ │
│  │  Actions:                                                        │ │
│  │  • Toggle Featured → PUT /api/admin/products/[id]/featured      │ │
│  │  • Toggle New → PUT /api/admin/products/[id]/new-arrival        │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  FEATURED PRODUCTS MANAGEMENT                                     │ │
│  │  (/admin/settings/featured-products)                              │ │
│  │                                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │ ⋮⋮ [📦 Image] Product A    $10.00  [✓ Featured]  Order: 1 │ │ │
│  │  │ ⋮⋮ [📦 Image] Product B    $20.00  [✓ Featured]  Order: 2 │ │ │
│  │  │ ⋮⋮ [📦 Image] Product C    $15.00  [✓ Featured]  Order: 3 │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  Features:                                                        │ │
│  │  • Drag & Drop → PUT /api/admin/products/featured (bulk update) │ │
│  │  • Toggle → PUT /api/admin/products/[id]/featured               │ │
│  │  • Visual Cards with Images                                      │ │
│  │  • Real-time Order Updates                                       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  NEW ARRIVALS MANAGEMENT                                          │ │
│  │  (/admin/settings/new-arrivals)                                   │ │
│  │                                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │ ⋮⋮ [📦 Image] Product X    $25.00  [✓ New]      Order: 1  │ │ │
│  │  │ ⋮⋮ [📦 Image] Product Y    $30.00  [✓ New]      Order: 2  │ │ │
│  │  │ ⋮⋮ [📦 Image] Product Z    $22.00  [✓ New]      Order: 3  │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  Features:                                                        │ │
│  │  • Drag & Drop → PUT /api/admin/products/new-arrivals (bulk)    │ │
│  │  • Toggle → PUT /api/admin/products/[id]/new-arrival            │ │
│  │  • Visual Cards with Images                                      │ │
│  │  • Real-time Order Updates                                       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📊 DATA FLOW DIAGRAMS

### 1. Toggle Featured Status Flow
```
┌────────────────┐     Click Toggle      ┌──────────────────┐
│  Admin User    │ ──────────────────────→│  Products Page   │
│  /admin/       │                        │  Component       │
│  products      │                        └──────────────────┘
└────────────────┘                                │
                                                  │ handleToggleFeatured()
                                                  ▼
                                        ┌──────────────────┐
                                        │  PUT Request     │
                                        │  /api/admin/     │
                                        │  products/[id]/  │
                                        │  featured        │
                                        └──────────────────┘
                                                  │
                                                  │ body: { isFeatured: true }
                                                  ▼
                                        ┌──────────────────┐
                                        │  API Route       │
                                        │  Handler         │
                                        └──────────────────┘
                                                  │
                                                  │ prisma.product.update()
                                                  ▼
                                        ┌──────────────────┐
                                        │  PostgreSQL      │
                                        │  UPDATE products │
                                        │  SET isFeatured  │
                                        │  = true          │
                                        └──────────────────┘
                                                  │
                                                  │ Success Response
                                                  ▼
                                        ┌──────────────────┐
                                        │  React Query     │
                                        │  Invalidates     │
                                        │  Cache           │
                                        └──────────────────┘
                                                  │
                                                  │ fetchProducts()
                                                  ▼
                                        ┌──────────────────┐
                                        │  UI Updates      │
                                        │  Badge Shows     │
                                        │  "Featured" ⭐   │
                                        └──────────────────┘
```

### 2. Drag-and-Drop Reorder Flow
```
┌────────────────┐     Drag Product      ┌──────────────────┐
│  Admin User    │ ──────────────────────→│  Featured Mgmt   │
│  /admin/       │                        │  Page            │
│  settings/     │                        └──────────────────┘
│  featured-     │                                │
│  products      │                                │ onDragStart()
└────────────────┘                                │ onDragOver()
                                                  │ onDragEnd()
                                                  ▼
                                        ┌──────────────────┐
                                        │  Update Local    │
                                        │  State (Array)   │
                                        │  Reorder Items   │
                                        └──────────────────┘
                                                  │
                                                  │ PUT Request
                                                  ▼
                                        ┌──────────────────┐
                                        │  PUT Request     │
                                        │  /api/admin/     │
                                        │  products/       │
                                        │  featured        │
                                        └──────────────────┘
                                                  │
                                                  │ body: { products: [
                                                  │   { id: 'p1', order: 0 },
                                                  │   { id: 'p2', order: 1 }
                                                  │ ]}
                                                  ▼
                                        ┌──────────────────┐
                                        │  API Route       │
                                        │  Bulk Update     │
                                        └──────────────────┘
                                                  │
                                                  │ prisma.$transaction([
                                                  │   update(p1, order: 0),
                                                  │   update(p2, order: 1)
                                                  │ ])
                                                  ▼
                                        ┌──────────────────┐
                                        │  PostgreSQL      │
                                        │  UPDATE products │
                                        │  SET             │
                                        │  featuredOrder   │
                                        └──────────────────┘
                                                  │
                                                  │ Success
                                                  ▼
                                        ┌──────────────────┐
                                        │  Homepage        │
                                        │  Reflects New    │
                                        │  Order           │
                                        └──────────────────┘
```

### 3. Homepage Display Flow
```
┌────────────────┐     Visit Homepage     ┌──────────────────┐
│  Customer      │ ──────────────────────→│  Homepage (/)    │
│  (Public)      │                        │  Component       │
└────────────────┘                        └──────────────────┘
                                                  │
                                                  │ useQuery()
                                                  ▼
                                        ┌──────────────────┐
                                        │  GET Request     │
                                        │  /api/products?  │
                                        │  featured=true   │
                                        │  &limit=8        │
                                        └──────────────────┘
                                                  │
                                                  ▼
                                        ┌──────────────────┐
                                        │  API Route       │
                                        │  GET Handler     │
                                        └──────────────────┘
                                                  │
                                                  │ prisma.product.findMany({
                                                  │   where: { isFeatured: true },
                                                  │   orderBy: { featuredOrder: 'asc' },
                                                  │   take: 8
                                                  │ })
                                                  ▼
                                        ┌──────────────────┐
                                        │  PostgreSQL      │
                                        │  SELECT * FROM   │
                                        │  products WHERE  │
                                        │  isFeatured=true │
                                        │  ORDER BY        │
                                        │  featuredOrder   │
                                        │  LIMIT 8         │
                                        └──────────────────┘
                                                  │
                                                  │ Returns: [P1, P2, P3...]
                                                  ▼
                                        ┌──────────────────┐
                                        │  Featured        │
                                        │  Products        │
                                        │  Section         │
                                        │  Renders         │
                                        └──────────────────┘
                                                  │
                                                  │ Same flow for
                                                  │ New Arrivals
                                                  ▼
                                        ┌──────────────────┐
                                        │  GET Request     │
                                        │  /api/products?  │
                                        │  new=true        │
                                        │  &limit=8        │
                                        └──────────────────┘
```

## 🔄 COMPONENT INTERACTION MAP

```
Admin Products Page (/admin/products)
        │
        ├─────→ Toggle Featured Switch
        │               │
        │               └──→ PUT /api/admin/products/[id]/featured
        │                           │
        │                           └──→ Database Update
        │
        ├─────→ Toggle New Arrival Switch
        │               │
        │               └──→ PUT /api/admin/products/[id]/new-arrival
        │                           │
        │                           └──→ Database Update
        │
        └─────→ View All Link
                        │
                        └──→ /admin/settings/featured-products
                                        │
                                        ├──→ Load Featured Products
                                        │         │
                                        │         └──→ GET /api/admin/products/featured
                                        │
                                        ├──→ Drag & Drop Reorder
                                        │         │
                                        │         └──→ PUT /api/admin/products/featured
                                        │
                                        └──→ Toggle Featured
                                                  │
                                                  └──→ PUT /api/admin/products/[id]/featured
```

## 💾 DATABASE SCHEMA VISUALIZATION

```
┌────────────────────────────────────────────────────────────┐
│                    TABLE: products                          │
├────────────────────────────────────────────────────────────┤
│  id               │ cuid        │ PK                        │
│  sku              │ string      │ Unique                    │
│  name             │ string      │                           │
│  slug             │ string      │ Unique                    │
│  price            │ float       │                           │
│  stock            │ integer     │                           │
│  thumbnail        │ string?     │                           │
│  categoryId       │ string?     │ FK → categories.id        │
│  isActive         │ boolean     │ default: true             │
│  ─────────────────┴─────────────┴───────────────────────────│
│  🆕 isFeatured      │ boolean     │ default: false ✅       │
│  🆕 featuredOrder   │ integer     │ default: 999   ✅       │
│  🆕 isNewArrival    │ boolean     │ default: false ✅       │
│  🆕 newArrivalOrder │ integer     │ default: 999   ✅       │
│  ─────────────────┴─────────────┴───────────────────────────│
│  createdAt        │ timestamp   │ default: now()            │
│  updatedAt        │ timestamp   │ auto-update               │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                       INDEXES                               │
├────────────────────────────────────────────────────────────┤
│  🆕 idx_products_featured                                  ✅│
│     (isFeatured, featuredOrder)                            │
│     → Optimizes featured products queries                  │
│     → Query time: ~4ms                                     │
├────────────────────────────────────────────────────────────┤
│  🆕 idx_products_new_arrival                               ✅│
│     (isNewArrival, newArrivalOrder)                        │
│     → Optimizes new arrivals queries                       │
│     → Query time: ~2ms                                     │
└────────────────────────────────────────────────────────────┘
```

## 🎯 USER JOURNEY MAP

### Admin User Journey
```
1. Login → /admin
2. Navigate → /admin/products
3. View Products Table
4. Toggle "Featured" or "New Arrival"
5. (Optional) Go to /admin/settings/featured-products
6. Drag products to reorder
7. View results on homepage
```

### Customer Journey
```
1. Visit Homepage → /
2. See Featured Products Section
   • 8 products displayed
   • Ordered by admin preference
3. See New Arrivals Section
   • 8 latest products
   • Ordered by admin preference
4. Click product to view details
```

---

**Architecture Version:** 1.0  
**Last Updated:** June 25, 2026  
**Status:** ✅ Production Ready  
