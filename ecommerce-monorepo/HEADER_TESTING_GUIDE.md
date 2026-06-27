# 🧪 HEADER TESTING GUIDE

## ✅ Quick Test Checklist

Test the new modern header design by following these steps:

---

## 🎯 MANUAL TESTING STEPS

### **1. Search Bar Functionality** 🔍
- [ ] Click the search icon button
- [ ] Verify search bar expands smoothly (500ms)
- [ ] Input automatically gets focus
- [ ] Type a search query
- [ ] Press Enter or click search icon
- [ ] Verify redirect to `/products?search={query}`
- [ ] Click search icon again to collapse
- [ ] Verify search bar collapses smoothly

**Expected Result**: Smooth expansion/collapse animation with golden border when active.

---

### **2. Cart Badge** 🛒
- [ ] Navigate to products page
- [ ] Add item(s) to cart
- [ ] Return to homepage
- [ ] Verify cart badge shows correct count
- [ ] Verify badge has pulse animation
- [ ] Verify badge shows "9+" for 10+ items
- [ ] Click cart icon
- [ ] Verify navigation to `/cart`

**Expected Result**: Red gradient badge with white ring and pulse animation.

---

### **3. Logo Hover Effects** 🎨
- [ ] Hover over the logo
- [ ] Verify gradient text color shift (navy → golden)
- [ ] Verify golden ring intensifies (20% → 40%)
- [ ] Verify scale effect (105%)
- [ ] Click logo
- [ ] Verify navigation to homepage

**Expected Result**: Smooth transitions with golden accents on hover.

---

### **4. Navigation Links** 🔗
- [ ] Hover over "Home" link
- [ ] Verify golden underline slides in from left
- [ ] Verify text color changes to navy
- [ ] Move to next link
- [ ] Verify previous underline disappears
- [ ] Test all navigation links:
  - [ ] Home
  - [ ] Products (MegaMenu)
  - [ ] Services
  - [ ] Track Shipment
  - [ ] Get Quote
  - [ ] About Us
  - [ ] Contact

**Expected Result**: Golden gradient underline animates smoothly (300ms).

---

### **5. Account Dropdown (Logged In)** 👤

#### **Open Dropdown**:
- [ ] Click user icon (gradient button)
- [ ] Verify dropdown slides down smoothly
- [ ] Verify dropdown has navy gradient header
- [ ] Verify all menu items visible:
  - [ ] Dashboard
  - [ ] My Orders
  - [ ] Business Profile
  - [ ] My Quotes
  - [ ] My Shipments
  - [ ] Logout (red text)

#### **Close Dropdown**:
- [ ] Click outside dropdown
- [ ] Verify dropdown closes
- [ ] Click user icon again to open
- [ ] Click a menu item
- [ ] Verify navigation + dropdown closes

**Expected Result**: Smooth slideDown animation with click-outside functionality.

---

### **6. Account Buttons (Logged Out)** 🔐
- [ ] Logout or use incognito mode
- [ ] Verify "Login" button visible
- [ ] Verify "Register" button visible with gradient
- [ ] Hover over "Login"
- [ ] Verify gray background appears
- [ ] Hover over "Register"
- [ ] Verify gradient hover effect (reverse)
- [ ] Click "Login" → verify redirect
- [ ] Click "Register" → verify redirect

**Expected Result**: Two buttons with distinct styling and hover effects.

---

### **7. Sticky Header on Scroll** 📜
- [ ] Load any page (with content to scroll)
- [ ] Scroll down 10+ pixels
- [ ] Verify header background changes to `white/98`
- [ ] Verify backdrop blur effect appears
- [ ] Verify shadow intensifies
- [ ] Scroll back to top
- [ ] Verify header returns to normal state

**Expected Result**: Smooth 500ms transition to glassmorphism effect.

---

### **8. Mobile Menu (< 1024px)** 📱

#### **Open Menu**:
- [ ] Resize browser to < 1024px
- [ ] Verify hamburger icon (☰) visible
- [ ] Click hamburger icon
- [ ] Verify mobile menu slides down
- [ ] Verify search bar at top
- [ ] Verify all navigation links visible
- [ ] Verify icons visible for key links
- [ ] Verify auth buttons at bottom (if logged out)

#### **Navigation**:
- [ ] Type in mobile search bar
- [ ] Submit search
- [ ] Verify redirect works
- [ ] Open menu again
- [ ] Click any navigation link
- [ ] Verify menu closes + navigation works

#### **Close Menu**:
- [ ] Open menu
- [ ] Click X icon
- [ ] Verify menu closes smoothly

**Expected Result**: Full-screen mobile menu with gradient hover states.

---

### **9. Responsive Behavior** 📐

#### **Desktop (1024px+)**:
- [ ] All navigation links visible in center
- [ ] Logo with text visible
- [ ] Search, Cart, User buttons on right
- [ ] No hamburger menu

#### **Tablet (768px - 1023px)**:
- [ ] Logo with text visible
- [ ] Navigation hidden (hamburger shown)
- [ ] Search, Cart, User, Menu buttons visible

#### **Mobile (< 768px)**:
- [ ] Logo icon only (no text)
- [ ] Search, Cart, Menu buttons only
- [ ] Compact layout

**Expected Result**: Smooth transitions between breakpoints.

---

### **10. All Icon Buttons** 🎯
- [ ] Hover over search button
- [ ] Verify gradient hover effect
- [ ] Verify scale to 105%
- [ ] Hover over cart button
- [ ] Verify same effects
- [ ] Hover over user button
- [ ] Verify same effects
- [ ] Hover over mobile menu button
- [ ] Verify same effects

**Expected Result**: Consistent 40×40px circular buttons with hover effects.

---

## 🎨 VISUAL INSPECTION

### **Colors Check** ✅
- [ ] Logo gradient: Navy (`#1a3a5c → #2a5a8c`)
- [ ] Golden accent: `#c9a84c` (underlines, rings)
- [ ] Cart badge: Red (`#ef4444 → #dc2626`)
- [ ] Dropdown header: Navy gradient
- [ ] Register button: Golden gradient

### **Shadows Check** ✅
- [ ] Logo has subtle shadow
- [ ] Cart badge has red shadow
- [ ] Dropdown has strong shadow (`shadow-2xl`)
- [ ] Scrolled header has custom shadow

### **Animations Check** ✅
- [ ] Search expansion: 500ms smooth
- [ ] Cart badge pulse: Infinite
- [ ] Dropdown slideDown: 300ms
- [ ] Navigation underline: 300ms
- [ ] Logo hover: 300ms
- [ ] Button scales: 300ms

---

## 🐛 COMMON ISSUES TO CHECK

### **Issue 1: Search Not Expanding**
- **Check**: `searchExpanded` state updates correctly
- **Check**: `searchInputRef` is attached to input
- **Fix**: Verify useState and useRef implementations

### **Issue 2: Cart Count Not Updating**
- **Check**: `fetchCartCount()` is called after adding items
- **Check**: API endpoint `/api/cart` returns correct data
- **Fix**: Add console.log to debug cart count

### **Issue 3: Dropdown Not Closing**
- **Check**: Click-outside handler is working
- **Check**: Fixed overlay div is rendering
- **Fix**: Verify z-index values (40 for overlay, 50 for dropdown)

### **Issue 4: Mobile Menu Not Opening**
- **Check**: `isMenuOpen` state updates on button click
- **Check**: Conditional rendering `{isMenuOpen && ...}`
- **Fix**: Check for console errors

### **Issue 5: Animations Not Smooth**
- **Check**: `@keyframes slideDown` is in globals.css
- **Check**: `.animate-slideDown` class is applied
- **Fix**: Clear browser cache and reload

---

## 🚀 BROWSER TESTING

Test on multiple browsers:

- [ ] **Chrome** (Latest)
- [ ] **Firefox** (Latest)
- [ ] **Safari** (Latest)
- [ ] **Edge** (Latest)
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

**Note**: Pay special attention to backdrop-blur support (may need fallback for older browsers).

---

## ⚡ PERFORMANCE TESTING

### **Lighthouse Audit**
1. Open DevTools → Lighthouse
2. Run performance audit
3. Check for:
   - [ ] No layout shifts (CLS = 0)
   - [ ] Fast interaction time (FID < 100ms)
   - [ ] Smooth animations (60fps)

### **Network Tab**
- [ ] No unnecessary re-renders
- [ ] Cart count fetched only once
- [ ] Settings API called only on mount

---

## ✅ ACCEPTANCE CRITERIA

Before marking as complete, verify:

1. ✅ All interactive elements work correctly
2. ✅ No console errors or warnings
3. ✅ Smooth animations on all interactions
4. ✅ Responsive on all screen sizes
5. ✅ Accessible (keyboard navigation works)
6. ✅ Brand colors consistent throughout
7. ✅ Logged in/out states both functional
8. ✅ Mobile menu fully functional
9. ✅ Search submission works correctly
10. ✅ Cart badge updates in real-time

---

## 🎉 TEST RESULTS

**Date Tested**: __________  
**Tested By**: __________  
**Browser**: __________  
**Screen Size**: __________  

**Status**: 
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues (list below)
- [ ] ❌ Major issues (list below)

**Issues Found**:
1. _______________________________
2. _______________________________
3. _______________________________

**Notes**:
________________________________
________________________________
________________________________

---

**Next Steps**:
- [ ] Fix any issues found
- [ ] Re-test failed scenarios
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: June 27, 2026  
**Created By**: Kiro AI Assistant
