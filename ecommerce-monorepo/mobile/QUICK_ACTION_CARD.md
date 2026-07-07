# ⚡ MOBILE APP DESIGN FIXES - QUICK ACTION CARD

## 🔴 P1: FIX IMMEDIATELY (This Week)

### 1. Touch Targets ❌ WCAG FAIL
**Current:** 28-32px buttons  
**Required:** 44px minimum  
**Impact:** 20%+ users affected

**Files to Fix:**
- `HomeScreen.tsx` - wishlistBtn, quoteBtn, searchIconBtn
- `ProductCard.tsx` - favoriteButton, quoteButton
- `CartScreen.tsx` - qtyBtn, removeButton
- `AppHeader.tsx` - bellBtn

**Quick Fix:**
```typescript
// Add to all interactive elements
style={{
  minWidth: 44,
  minHeight: 44,
  justifyContent: 'center',
  alignItems: 'center',
}}
```

### 2. Font Sizes ❌ TOO SMALL
**Change:**
- 9px → 12px (badges)
- 10px → 12px (ratings, reviews)
- 11px → 14px (buttons, product names)

### 3. Theme System ❌ DUPLICATE
**Problem:** Two theme files with conflicts  
**Fix:** Delete `constants/theme.ts`, use only `theme/index.ts`

---

## 🟡 P2: FIX THIS SPRINT (Next 2 Weeks)

### 4. Add Animations
```bash
# Already installed, just use them!
"react-native-reanimated": "~3.16.4"
"expo-haptics": "~0.29.0"
```

### 5. Create Custom Hooks
- `useAuth()` - Replace duplicate AsyncStorage logic
- `useCart()` - Centralize cart operations
- `useFavorites()` - Share favorite state

### 6. Add Accessibility Labels
```typescript
accessible={true}
accessibilityLabel="Add to cart"
accessibilityRole="button"
```

---

## 🟢 P3: POLISH (Backlog)

- Onboarding screens
- Image zoom/gallery
- Swipe gestures
- Biometric auth
- Premium animations

---

## 📊 Current Scores

| Category | Score | Target |
|----------|-------|--------|
| Accessibility | **5.5/10** ❌ | 9.5/10 |
| Visual Design | 7.5/10 | 9.0/10 |
| UX | 7.0/10 | 9.5/10 |
| Premium Feel | 6.5/10 | 9.5/10 |
| Code Quality | 7.8/10 | 9.0/10 |
| **OVERALL** | **7.2/10** | **9.3/10** |

---

## 🎯 Quick Wins (< 1 Hour Each)

1. ✅ Change all 28px buttons to 44px
2. ✅ Find/replace font sizes (9px→12px, 11px→14px)
3. ✅ Add accessibilityLabel to all buttons
4. ✅ Remove inline COLORS, import from theme
5. ✅ Add haptic feedback to button presses

---

**See MOBILE_APP_DESIGN_AUDIT_REPORT.md for full details**
