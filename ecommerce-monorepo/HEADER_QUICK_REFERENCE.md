# ⚡ MODERN HEADER - QUICK REFERENCE

## 🎯 ONE-PAGE CHEAT SHEET

---

## 📍 COMPONENT LOCATION
```
c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\components\navbar.tsx
```

---

## 🎨 BRAND COLORS

```css
Navy Primary:   #1a3a5c
Navy Secondary: #2a5a8c
Golden Accent:  #c9a84c
Red Badge:      #ef4444
```

---

## 🔧 KEY STATE VARIABLES

```typescript
searchExpanded        // Search bar open/closed
searchQuery          // Search input value
showAccountDropdown  // Dropdown visible/hidden
cartItemCount        // Number in cart badge
scrolled            // Header scroll state
isLoggedIn          // User authentication
isMenuOpen          // Mobile menu open/closed
```

---

## ⚡ KEY FEATURES

### 1. **Expandable Search**
- Click 🔍 → Expands to input field
- Golden border when active
- Auto-focus on expansion
- Submit → `/products?search={query}`

### 2. **Cart Badge**
- Red gradient with pulse
- Shows count (or "9+" for 10+)
- Updates on cart changes

### 3. **Account Dropdown**
- Click 👤 → Opens menu
- 6 menu items with icons
- Click outside → Closes

### 4. **Sticky Header**
- Scroll > 10px → Glassmorphism
- Backdrop blur effect
- Enhanced shadow

### 5. **Mobile Menu**
- Click ☰ → Full menu
- Search + navigation
- Auth buttons at bottom

---

## 🎭 ANIMATIONS

| Feature | Duration | Effect |
|---------|----------|--------|
| Search Expand | 500ms | Width: 40px → 256px |
| Navigation Underline | 300ms | Slides in from left |
| Dropdown Open | 300ms | slideDown animation |
| Cart Badge | 2s | Pulse (infinite) |
| Scroll Effect | 500ms | Glassmorphism fade |
| Button Hover | 300ms | Scale to 105% |

---

## 📱 RESPONSIVE

| Screen | Logo | Navigation | Actions |
|--------|------|------------|---------|
| Desktop 1024px+ | Icon + Text | Visible | Search, Cart, User |
| Tablet 768-1023px | Icon + Text | Hidden | Search, Cart, User, Menu |
| Mobile < 768px | Icon Only | Hidden | Search, Cart, Menu |

---

## 🔍 QUICK FIXES

### Search Not Working?
```typescript
// Check state
console.log('Expanded:', searchExpanded)
console.log('Query:', searchQuery)

// Verify ref
console.log('Ref:', searchInputRef.current)
```

### Cart Count Wrong?
```typescript
// Force refresh
fetchCartCount()

// Check API
fetch('/api/cart?userId=XXX').then(r => r.json())
```

### Dropdown Not Closing?
```typescript
// Check overlay click
<div onClick={() => setShowAccountDropdown(false)} />

// Verify z-index
z-40 for overlay, z-50 for dropdown
```

---

## 🎨 STYLE CLASSES

### Logo
```jsx
className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a3a5c] via-[#2a5a8c] to-[#1a3a5c] ring-2 ring-[#c9a84c]/20 hover:ring-[#c9a84c]/40 hover:scale-105 transition-all duration-300"
```

### Navigation Link
```jsx
className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#1a3a5c] transition-all duration-300 relative group"
```

### Golden Underline
```jsx
<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c9a84c] to-[#1a3a5c] group-hover:w-full transition-all duration-300" />
```

### Action Button
```jsx
className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 hover:from-[#c9a84c]/20 hover:to-[#1a3a5c]/20 flex items-center justify-center transition-all duration-300 hover:scale-105"
```

### Cart Badge
```jsx
className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse ring-2 ring-white"
```

---

## 📋 TESTING SHORTCUTS

### Test Search
1. Click search icon
2. Type "test"
3. Press Enter
4. Should redirect to `/products?search=test`

### Test Cart Badge
1. Add item to cart
2. Check badge shows count
3. Verify pulse animation

### Test Dropdown
1. Click user icon
2. Dropdown should slide down
3. Click outside
4. Dropdown should close

### Test Mobile
1. Resize to < 1024px
2. Click hamburger menu
3. Full menu should appear

---

## 🚨 IMPORTANT NOTES

⚠️ **Search Auto-Focus**: Uses `useRef` + `useEffect`
⚠️ **Dropdown Close**: Uses overlay div with z-index
⚠️ **Cart Count**: Fetched from `/api/cart`
⚠️ **Scroll Effect**: Threshold at 10px
⚠️ **Mobile Breakpoint**: 1024px (lg:)

---

## 📞 NEED HELP?

### Documentation Files
1. **MODERN_HEADER_REDESIGN_COMPLETE.md** - Full feature docs
2. **HEADER_VISUAL_GUIDE.md** - Visual diagrams
3. **HEADER_TESTING_GUIDE.md** - Testing procedures
4. **TASK_9_COMPLETE_SUMMARY.md** - Executive summary

### Key Sections in navbar.tsx
- Lines 1-15: Imports & state
- Lines 16-60: Effects & handlers
- Lines 61-80: Logout & cart functions
- Lines 81-100: Nav items config
- Lines 101-400: JSX rendering

---

## ✅ QUICK VALIDATION

Run these checks:
```bash
# 1. Check for TypeScript errors
npm run type-check

# 2. Check for build errors
npm run build

# 3. Start dev server
npm run dev

# 4. Open browser
http://localhost:3000
```

---

## 🎉 SUCCESS INDICATORS

✅ No console errors  
✅ Smooth 60fps animations  
✅ All buttons clickable  
✅ Search redirects work  
✅ Cart badge updates  
✅ Dropdown opens/closes  
✅ Mobile menu functional  
✅ Sticky header activates  

---

**Quick Reference v1.0**  
**Last Updated**: June 27, 2026  
**For**: YIWU EXPRESS Modern Header  
**Status**: ✅ Production Ready
