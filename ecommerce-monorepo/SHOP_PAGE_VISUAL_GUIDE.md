# Product Listing Page - Visual Guide 📸

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR (Existing)                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: 🏠 / Shop / Cookware                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ HEADER:                                                                     │
│   All Products                                                              │
│   19 products available                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR:                                                                    │
│   19 Products  [Grid] [List]          [Filter] Sort by: Relevance ▼       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌────────────────────────────────────────────────────────┐│
│ │ FILTERS      │ │ PRODUCT GRID                                          ││
│ │              │ │                                                        ││
│ │ Filters      │ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        ││
│ │ Clear All    │ │ │ [IMG]  │ │ [IMG]  │ │ [IMG]  │ │ [IMG]  │        ││
│ │              │ │ │ Pan    │ │ Pot    │ │ Skillet│ │ Tray   │        ││
│ │ Availability │ │ │ $29.99 │ │ $49.99 │ │ $39.99 │ │ $19.99 │        ││
│ │ ☑ In Stock   │ │ │ [Cart] │ │ [Cart] │ │ [Cart] │ │ [Cart] │        ││
│ │ ☐ Out Stock  │ │ └────────┘ └────────┘ └────────┘ └────────┘        ││
│ │              │ │                                                        ││
│ │ Price        │ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        ││
│ │ $0 ━━━━ $200 │ │ │ [IMG]  │ │ [IMG]  │ │ [IMG]  │ │ [IMG]  │        ││
│ │              │ │ │ Bowl   │ │ Wok    │ │ Spoon  │ │ Knife  │        ││
│ │ Color        │ │ │ $14.99 │ │ $59.99 │ │ $8.99  │ │ $12.99 │        ││
│ │ ⚫ ⚪ 🔴 🔵    │ │ │ [Cart] │ │ [Cart] │ │ [Cart] │ │ [Cart] │        ││
│ │              │ │ └────────┘ └────────┘ └────────┘ └────────┘        ││
│ │ Material     │ │                                                        ││
│ │ ☑ Stainless  │ │                                                        ││
│ │ ☐ Cast Iron  │ │                                                        ││
│ │ ☐ Aluminum   │ │                                                        ││
│ │              │ │                                                        ││
│ │ Category     │ │                                                        ││
│ │ ☑ Cookware   │ │                                                        ││
│ │ ☐ Bakeware   │ │                                                        ││
│ │ ☐ Utensils   │ │                                                        ││
│ └──────────────┘ └────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ PAGINATION: ◀ 1 2 3 … 5 ▶                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER (Existing)                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Breadcrumb
```
🏠 / Shop / Cookware
└─┬─┘   └─┬─┘  └────┬────┘
  │       │         └─ Current (bold, navy)
  │       └─ Clickable link (gray)
  └─ Home icon (clickable)
```

### 2. Filter Sidebar

#### Desktop (256px fixed left)
```
┌──────────────────┐
│ Filters  Clear   │
├──────────────────┤
│ 🔷 Stainless ✕   │ ← Applied filter tag
├──────────────────┤
│ Availability ˅   │ ← Collapsible section
│ ☑ In Stock (15)  │
│ ☐ Out of Stock   │
├──────────────────┤
│ Price ˅          │
│ $0 ━━━━━━ $150   │ ← Range slider
│        $150      │
├──────────────────┤
│ Color ˅          │
│ ⚫ ⚪ 🔴 🔵 🟡 ⚪  │ ← Color swatches
├──────────────────┤
│ Material ˅       │
│ ☑ Stainless      │
│ ☐ Cast Iron      │
│ ☐ Aluminum       │
└──────────────────┘
```

#### Mobile (Overlay)
```
          ┌─────────────────────┐
          │ Filters    Clear  ✕ │
          ├─────────────────────┤
          │ (Same as desktop)   │
          │                     │
          ├─────────────────────┤
          │ [Apply Filters]     │
          └─────────────────────┘
```

### 3. Product Toolbar
```
┌─────────────────────────────────────────────────────────────┐
│ 19 Products  [Grid🔲] [List📄]    [🔍Filter] Sort: Price ▼ │
│ └────┬────┘  └────┬────────┘       └──┬──┘   └─────┬─────┘ │
│      │            │                   │           │         │
│      │            └─ View toggle      │           └─ Sort   │
│      └─ Count                         └─ Mobile only        │
└─────────────────────────────────────────────────────────────┘
```

### 4. Product Grid

#### Grid View (4 columns)
```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ [IMG]  │ │ [IMG]  │ │ [IMG]  │ │ [IMG]  │
│ 🆕     │ │ SOLD   │ │        │ │        │
├────────┤ ├────────┤ ├────────┤ ├────────┤
│Cookware│ │Bakeware│ │Utensils│ │Tableware│
│Fry Pan │ │Cake Pan│ │Spatula │ │Plate   │
│⭐4.5(12)│ │⭐4.8(8)│ │⭐4.2(5)│ │⭐4.6(20)│
│$29.99  │ │$39.99  │ │$8.99   │ │$14.99  │
│$49.99  │ │        │ │        │ │        │
│[Cart]♥│ │[Cart]♥│ │[Cart]♥│ │[Cart]♥│
└────────┘ └────────┘ └────────┘ └────────┘
```

#### List View
```
┌─────────────────────────────────────────────────────────┐
│ ┌────┐  Stainless Steel Fry Pan                        │
│ │IMG │  Cookware                                        │
│ │    │  ⭐⭐⭐⭐⭐ 4.5 (12 reviews)                       │
│ └────┘  $29.99  $49.99  -40%                           │
│         [Add to Cart]  ♥                                │
├─────────────────────────────────────────────────────────┤
│ ┌────┐  Non-Stick Cake Pan                             │
│ │IMG │  Bakeware                                        │
│ │    │  ⭐⭐⭐⭐⭐ 4.8 (8 reviews)                        │
│ └────┘  $39.99                                          │
│         [Add to Cart]  ♥                                │
└─────────────────────────────────────────────────────────┘
```

### 5. Pagination
```
┌─────────────────────────────────────────┐
│  ◀   1   [2]  3  …  10   ▶             │
│  │   │    │   │   │   │   │             │
│  │   │    │   │   │   │   └─ Next       │
│  │   │    │   │   │   └─ Last page      │
│  │   │    │   │   └─ Ellipsis           │
│  │   │    │   └─ Regular page           │
│  │   │    └─ Current page (navy bg)     │
│  │   └─ Page 1                          │
│  └─ Previous (disabled if page 1)       │
└─────────────────────────────────────────┘
```

---

## Color Guide

### Primary Colors
- **Navy Blue**: `#1a3a5c` - Headers, buttons, current page
- **Gold**: `#c9a84c` - NEW badges, accents
- **Red**: `#e74c3c` - Discount badges, wishlist active

### Text Colors
- **Dark Gray**: `#1f2937` - Primary text
- **Medium Gray**: `#6b7280` - Secondary text
- **Light Gray**: `#9ca3af` - Disabled text

### Background Colors
- **White**: `#ffffff` - Cards, sidebar
- **Light Gray**: `#f9fafb` - Page background
- **Navy**: `#1a3a5c` - Active buttons

### Interactive States
- **Hover**: Darker shade + shadow increase
- **Active**: Navy background + white text
- **Disabled**: Light gray + reduced opacity

---

## Responsive Breakpoints

### Mobile (< 640px)
- 1 column grid
- Filter button in toolbar
- Sidebar as right overlay
- Simplified pagination

### Tablet (640px - 1024px)
- 2-3 column grid
- Filter sidebar visible
- Full toolbar

### Desktop (> 1024px)
- 4 column grid
- Fixed left sidebar (256px)
- Grid/List toggle visible
- Full toolbar

---

## Interactive Elements

### Product Card Hover
```
Normal:               Hovered:
┌────────┐           ┌────────┐
│ [IMG]  │           │ [IMG]  │ ← Image zooms 110%
│        │    →      │🔍Quick │ ← Quick view appears
├────────┤           ├────────┤
│Product │           │Product │
│$29.99  │           │$29.99  │
│[Cart]♥│           │[Cart]♥│ ← Shadow increases
└────────┘           └────────┘
```

### Filter Section Toggle
```
Collapsed:           Expanded:
Availability ˅       Availability ˄
                     ☑ In Stock (15)
                     ☐ Out of Stock (3)
```

### Applied Filter Tag
```
┌─────────────────────┐
│ Stainless Steel  ✕ │ ← Click ✕ to remove
└─────────────────────┘
     Hover: red X
```

---

## Loading States

### Product Grid Loading
```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│ ← Animated
│░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│    skeleton
├────────┤ ├────────┤ ├────────┤ ├────────┤
│░░░░░░  │ │░░░░░░  │ │░░░░░░  │ │░░░░░░  │
│░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│
│░░░░    │ │░░░░    │ │░░░░    │ │░░░░    │
│░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│ │░░░░░░░░│
└────────┘ └────────┘ └────────┘ └────────┘
```

### List View Loading
```
┌─────────────────────────────────────────┐
│ ┌────┐  ░░░░░░░░░░░░░░░░░░░░░░░        │
│ │░░░░│  ░░░░░░░░                        │
│ │░░░░│  ░░░░░░░░░░░░░░░░                │
│ └────┘  ░░░░░░                          │
│         ░░░░░░░░░░░░                    │
└─────────────────────────────────────────┘
```

---

## Empty States

### No Products
```
┌─────────────────────────────────────┐
│                                     │
│         📦                          │
│         ┃                           │
│         ┗━━━                        │
│                                     │
│    No Products Found                │
│    Try adjusting your filters       │
│                                     │
│    [Clear all filters]              │
│                                     │
└─────────────────────────────────────┘
```

---

## Mobile Filter Overlay

```
┌─────────────────────────────────────────┐
│                                         │ ← Dark backdrop
│                                         │   (50% black)
│                                         │
│                    ┌────────────────────┤
│                    │ Filters  Clear  ✕ │
│                    ├────────────────────┤
│                    │ Availability ˅     │
│                    │ ☑ In Stock         │
│                    │ ☐ Out of Stock     │
│                    ├────────────────────┤
│                    │ Price ˅            │
│                    │ $0 ━━━━━ $200      │
│                    ├────────────────────┤
│                    │ (more filters)     │
│                    │                    │
│                    ├────────────────────┤
│                    │ [Apply Filters]    │
│                    └────────────────────┘
└─────────────────────────────────────────┘
         Tap backdrop to close
```

---

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys for pagination
- Escape to close mobile filter

### Screen Reader
- Proper ARIA labels on all buttons
- Breadcrumb navigation landmark
- Current page indicator
- Product count announcements
- Filter state changes

### Focus States
- Visible focus rings (2px blue)
- Skip to content link
- Focus trap in mobile filter overlay

---

## Animation Details

### Transitions
- **Product hover**: 300ms ease-in-out
- **Filter toggle**: 200ms ease
- **Mobile overlay**: 300ms slide-in
- **Page change**: Smooth scroll

### Hover Effects
- Product image: scale(1.1)
- Buttons: darker background
- Cards: shadow increase
- Links: color change

---

## Testing Scenarios

### User Flow 1: Browse Products
1. User lands on `/products`
2. Sees all 19 products in grid view
3. Scrolls through products
4. Clicks product card → Detail page

### User Flow 2: Filter Products
1. User clicks "Cookware" in filter
2. Products filter to cookware only
3. Applied filter appears as tag
4. User clicks X on tag → Filter removed

### User Flow 3: Sort Products
1. User selects "Price: Low to High"
2. Products re-sort by price
3. Page resets to 1

### User Flow 4: Mobile Filter
1. User on mobile device
2. Clicks "Filter" button
3. Overlay slides in from right
4. Applies filters
5. Clicks "Apply Filters"
6. Overlay closes, products update

### User Flow 5: Pagination
1. User on page 1
2. Clicks page 2
3. Page scrolls to top
4. New products load

---

## Performance Metrics

### Target Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

### Optimization Techniques
- Image lazy loading (Next.js Image)
- Skeleton loading screens
- Debounced filter changes
- Pagination (12 products per page)
- CSS-only animations

---

## 🎉 Summary

The product listing page is a fully-featured, Tramontina-inspired shop with:
- ✅ Beautiful, responsive design
- ✅ Advanced filtering system
- ✅ Dual view modes (grid/list)
- ✅ Smart pagination
- ✅ Loading states
- ✅ Empty states
- ✅ Mobile-first approach
- ✅ Accessibility compliant
- ✅ Performance optimized

**Ready to test at**: `http://localhost:3001/products`
