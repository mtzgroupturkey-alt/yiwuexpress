# ❤️ WISHLIST MODULE - VISUAL GUIDE

## 🎨 User Interface Overview

This document shows what users will see when using the Wishlist/Favorites feature.

---

## 1. PRODUCT CARD - HEART BUTTON

### Before Adding (Not Favorited)
```
┌─────────────────────────────┐
│ [Product Image]         🤍  │  ← Gray heart (outline)
│                             │
│  Product Name               │
│  $29.99                     │
│  [Add to Cart]              │
└─────────────────────────────┘
```

### After Adding (Favorited)
```
┌─────────────────────────────┐
│ [Product Image]         ❤️  │  ← Red heart (filled)
│                             │
│  Product Name               │
│  $29.99                     │
│  [Add to Cart]              │
└─────────────────────────────┘
```

**Interaction:**
- Click heart → Adds to wishlist
- Toast appears: "Added to favorites ❤️"
- Heart animates (scales up to 110%)
- Header badge updates

---

## 2. HEADER NAVIGATION

### No Items in Wishlist
```
┌───────────────────────────────────────────────┐
│  LOGO    HOME  SHOP  SERVICES    🔍 🇺🇸 🤍 🛒 👤 │
│                                                │
└───────────────────────────────────────────────┘
```

### With Items in Wishlist
```
┌───────────────────────────────────────────────┐
│  LOGO    HOME  SHOP  SERVICES    🔍 🇺🇸 ❤️³ 🛒⁵ 👤│
│                                        └─┘    │
│                                         Badge │
└───────────────────────────────────────────────┘
```

**Badge Details:**
- Red circle background (#EF4444)
- White text
- Shows count (1-99, then "99+")
- Position: top-right of heart icon

---

## 3. WISHLIST PAGE - FULL

### With Items
```
┌───────────────────────────────────────────────────────┐
│  ← Continue Shopping                                  │
│                                                       │
│  My Favorites                                         │
│  3 items saved                                        │
│                                                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │[Image] 🗑│  │[Image] 🗑│  │[Image] 🗑│             │
│  │         │  │         │  │         │             │
│  │Product 1│  │Product 2│  │Product 3│             │
│  │$29.99   │  │$39.99   │  │$49.99   │             │
│  │[🛒 Add] │  │[🛒 Add] │  │[🛒 Add] │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Empty State
```
┌───────────────────────────────────────────────────────┐
│  ← Continue Shopping                                  │
│                                                       │
│  My Favorites                                         │
│  0 items saved                                        │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │                                                 │ │
│  │                    🤍                           │ │
│  │                                                 │ │
│  │        Your favorites list is empty            │ │
│  │                                                 │ │
│  │   Start adding products you love by clicking   │ │
│  │   the heart icon on any product.               │ │
│  │                                                 │ │
│  │           [Browse Products]                     │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 4. TOAST NOTIFICATIONS

### Add to Favorites
```
┌────────────────────────────────┐
│ Added to favorites ❤️          │
│ Product has been added to      │
│ your wishlist.                 │
└────────────────────────────────┘
Position: Top-right
Duration: 3 seconds
Color: Green background
```

### Remove from Favorites
```
┌────────────────────────────────┐
│ Removed from favorites         │
│ Product has been removed from  │
│ your wishlist.                 │
└────────────────────────────────┘
Position: Top-right
Duration: 3 seconds
Color: Gray background
```

### Error (Not Logged In)
```
┌────────────────────────────────┐
│ Error                          │
│ Please login to add to         │
│ favorites.                     │
└────────────────────────────────┘
Position: Top-right
Duration: 3 seconds
Color: Red background
```

---

## 5. PRODUCT CARD STATES

### Normal State
```
┌──────────────────┐
│  [Product Image] │
│       🤍         │  ← Top-right corner
│                  │
│  Category Name   │
│  Product Name    │
│  $29.99          │
│  [Add to Cart]   │
└──────────────────┘
```

### Hover State
```
┌──────────────────┐
│  [Product Image] │  ← Image scales 105%
│       ❤️         │  ← Heart glows
│                  │
│  Category Name   │
│  Product Name    │
│  $29.99          │
│  [Add to Cart]   │  ← Button darker
└──────────────────┘
```

### Loading State (Adding)
```
┌──────────────────┐
│  [Product Image] │
│       ⏳         │  ← Pulsing animation
│                  │
│  Category Name   │
│  Product Name    │
│  $29.99          │
│  [Add to Cart]   │
└──────────────────┘
```

### Favorited State
```
┌──────────────────┐
│  [Product Image] │
│       ❤️         │  ← Solid red heart
│                  │
│  Category Name   │
│  Product Name    │
│  $29.99          │
│  [Add to Cart]   │
└──────────────────┘
```

---

## 6. WISHLIST PAGE - PRODUCT CARD

### Desktop View
```
┌─────────────────────────────────────────┐
│  ┌────────────┐                         │
│  │ [Image]  🗑│  ← Trash icon top-right │
│  │            │                         │
│  │            │                         │
│  └────────────┘                         │
│                                         │
│  CATEGORY NAME                          │
│  Product Full Name Here                 │
│  ★★★★☆ 4.5 (120)                       │
│                                         │
│  $29.99  $39.99                        │
│                                         │
│  [🛒 Add to Cart]                       │
└─────────────────────────────────────────┘
```

### Mobile View (2 Columns)
```
┌──────────┐  ┌──────────┐
│[Image] 🗑│  │[Image] 🗑│
│          │  │          │
│Product 1 │  │Product 2 │
│$29.99    │  │$39.99    │
│[🛒 Add]  │  │[🛒 Add]  │
└──────────┘  └──────────┘
```

---

## 7. ANIMATIONS

### Heart Icon Animation
```
Click → Scale(100% → 110%) + Color(gray → red) + Fill
Duration: 200ms
Easing: ease-in-out
```

### Toast Animation
```
Enter: Slide from right + Fade in
Exit: Slide to right + Fade out
Duration: 300ms
```

### Product Card Hover
```
Image: Scale(100% → 105%)
Heart: Shadow glow
Duration: 500ms
Easing: ease-out
```

### Trash Button
```
Removing: Spin animation (360°)
Product: Fade out + Scale down
Duration: 300ms
```

---

## 8. RESPONSIVE BREAKPOINTS

### Mobile (< 640px)
- 2 columns grid
- Smaller heart icon (3.5px)
- Compact spacing

### Tablet (640px - 1024px)
- 3 columns grid
- Medium heart icon (4px)
- Normal spacing

### Desktop (> 1024px)
- 4 columns grid
- Large heart icon (5px)
- Wide spacing

---

## 9. COLOR PALETTE

### Primary Colors
```
Heart (Favorited):    #EF4444  ■ Red 500
Heart (Not):          #9CA3AF  ■ Gray 400
Badge Background:     #EF4444  ■ Red 500
Badge Text:           #FFFFFF  ■ White
```

### Background Colors
```
Page Background:      #F9FAFB  ■ Gray 50
Card Background:      #FFFFFF  ■ White
Empty State:          #F3F4F6  ■ Gray 100
```

### Text Colors
```
Title:               #1A3A5C  ■ Primary
Body:                #374151  ■ Gray 700
Light:               #6B7280  ■ Gray 500
Category:            #9CA3AF  ■ Gray 400
```

### Button Colors
```
Primary:             #1A3A5C  ■ Primary
Hover:               #2A5A8C  ■ Primary Dark
Danger:              #EF4444  ■ Red 500
Success:             #10B981  ■ Green 500
```

---

## 10. TYPOGRAPHY

### Headings
```
Page Title:          text-2xl md:text-3xl font-bold
Section Title:       text-xl font-semibold
Card Title:          text-sm font-medium
```

### Body Text
```
Description:         text-sm text-gray-500
Price:               text-lg font-bold
Category:            text-[10px] uppercase tracking-wider
Badge:               text-[10px] font-bold
```

---

## 11. SPACING & SIZING

### Container
```
Max Width:           1280px (2xl)
Padding X:           1rem (mobile) → 2rem (desktop)
Padding Y:           1.5rem (mobile) → 2rem (desktop)
```

### Product Card
```
Aspect Ratio:        1:1 (square)
Border Radius:       0.75rem (rounded-xl)
Shadow:              hover:shadow-lg
Gap:                 0.75rem (3)
```

### Buttons
```
Height:              2.25rem (h-9)
Padding X:           1rem
Border Radius:       0.5rem (rounded-lg)
Font Weight:         font-medium
```

---

## 12. ICONS & BADGES

### Heart Icon
```
Normal:   Outline stroke
Filled:   Solid fill
Size:     w-4 h-4 (16px)
Color:    Gray → Red on favorite
```

### Badge (Count)
```
Size:     w-5 h-5 (20px)
Position: -top-0.5 -right-0.5
Shape:    Rounded full
Shadow:   shadow-lg
```

### Trash Icon
```
Size:     w-4 h-4 (16px)
Color:    Gray 400 → Red 500 on hover
Stroke:   2px
```

---

## 13. USER FLOW DIAGRAM

```
[Product Page]
      ↓
  Click Heart
      ↓
  [Authenticated?] ──No──> Show Error Toast
      ↓ Yes
  Add to Database
      ↓
  Update UI (fill heart)
      ↓
  Show Success Toast
      ↓
  Update Header Badge
      ↓
  [Wishlist Page]
      ↓
  View All Favorites
      ↓
  Click Trash
      ↓
  Remove from Database
      ↓
  Update UI (remove card)
      ↓
  Show Success Toast
      ↓
  Update Header Badge
```

---

## 14. INTERACTION PATTERNS

### Adding to Wishlist
1. User hovers over product card
2. Heart button becomes more visible
3. User clicks heart button
4. Heart fills with red color (scales 110%)
5. Toast notification appears
6. Header badge updates
7. Animation completes

### Viewing Wishlist
1. User clicks heart icon in header
2. Page transitions to /wishlist
3. Grid of products loads
4. Each product shows trash button
5. User can click product to view details
6. User can add to cart directly

### Removing from Wishlist
1. User clicks trash button
2. Button shows loading spinner
3. Product fades out
4. Toast notification appears
5. Grid re-flows
6. Header badge updates

---

## 15. ACCESSIBILITY

### ARIA Labels
```html
<button aria-label="Add to favorites">
<button aria-label="Remove from favorites">
<nav aria-label="Main navigation">
```

### Keyboard Navigation
- Tab: Navigate through interactive elements
- Enter/Space: Activate buttons
- Escape: Close modals/toasts

### Screen Reader
- Announces when product added/removed
- Reads wishlist count
- Describes button states

---

## 🎨 DESIGN PRINCIPLES

1. **Clarity** - Clear visual feedback for all actions
2. **Consistency** - Same patterns across all pages
3. **Feedback** - Toast notifications for all operations
4. **Accessibility** - Keyboard and screen reader support
5. **Performance** - Fast loading and smooth animations
6. **Responsiveness** - Works on all screen sizes

---

**This is what users will experience! ❤️**
