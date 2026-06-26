# Shop Page Testing Guide 🧪

## Quick Start

### 1. Start the Development Server
```bash
cd ecommerce-monorepo/web
npm run dev
```

### 2. Open in Browser
```
http://localhost:3001/products
```

---

## ✅ Desktop Testing (> 1024px)

### Test 1: Initial Page Load
- [ ] Page loads without errors
- [ ] Navbar displays correctly
- [ ] Breadcrumb shows: 🏠 / Shop
- [ ] Header shows "All Products"
- [ ] Product count displays (e.g., "19 products available")
- [ ] Toolbar shows with all controls
- [ ] Filter sidebar visible on left (256px)
- [ ] Products display in 4-column grid
- [ ] Footer displays correctly

### Test 2: Filter Sidebar
- [ ] All filter sections visible
- [ ] Click "Availability" - section collapses/expands
- [ ] Click "Price" - section collapses/expands
- [ ] Click "Color" - section collapses/expands
- [ ] Click "Material" - section collapses/expands
- [ ] Click "Category" - section collapses/expands

### Test 3: Checkbox Filters
- [ ] Check "In Stock" - products filter
- [ ] Applied filter tag appears above sections
- [ ] Product count updates in toolbar
- [ ] Check "Stainless Steel" - additional filter applies
- [ ] Multiple tags appear
- [ ] Click X on tag - filter removes
- [ ] Products update immediately

### Test 4: Price Range Filter
- [ ] Expand "Price" section
- [ ] Drag slider to $100
- [ ] Price updates below slider
- [ ] Products filter to < $100
- [ ] Applied filter tag shows "$0 - $100"
- [ ] Reset slider - all products return

### Test 5: Color Filter
- [ ] Expand "Color" section
- [ ] Click red color swatch
- [ ] Swatch gets checkmark
- [ ] Applied filter shows "Red"
- [ ] Click again - filter removes
- [ ] Try multiple colors

### Test 6: Clear All Filters
- [ ] Apply 3-4 filters
- [ ] Multiple tags appear
- [ ] Click "Clear All" button
- [ ] All tags disappear
- [ ] All products return
- [ ] Filter sections reset

### Test 7: Sort Dropdown
- [ ] Click sort dropdown
- [ ] All 7 options visible:
  - Relevance
  - Price: Low to High
  - Price: High to Low
  - Newest First
  - Popularity
  - Name: A-Z
  - Name: Z-A
- [ ] Select "Price: Low to High"
- [ ] Products re-sort (cheapest first)
- [ ] Select "Price: High to Low"
- [ ] Products re-sort (most expensive first)

### Test 8: View Mode Toggle
- [ ] Grid icon highlighted by default
- [ ] Click List icon
- [ ] Products switch to list view
- [ ] Each product shows horizontally
- [ ] Image on left, info on right
- [ ] Click Grid icon
- [ ] Products switch back to grid view
- [ ] 4 columns display

### Test 9: Product Card (Grid View)
- [ ] Hover over product card
- [ ] Image zooms in (scale 110%)
- [ ] Shadow increases
- [ ] "Quick View" button fades in
- [ ] NEW badge visible (if new product)
- [ ] SOLD OUT overlay (if out of stock)
- [ ] Category name displays
- [ ] Product name displays (max 2 lines)
- [ ] Star rating displays
- [ ] Review count displays
- [ ] Price displays correctly
- [ ] Compare-at-price strikethrough (if discount)
- [ ] Discount badge shows (e.g., "-40%")
- [ ] Heart icon (wishlist) visible
- [ ] "Add to Cart" button visible

### Test 10: Product Card Interactions
- [ ] Click heart icon
- [ ] Icon fills red (added to wishlist)
- [ ] Click again - icon empties (removed)
- [ ] Click "Add to Cart" button
- [ ] Button shows loading state
- [ ] Success message appears
- [ ] Click product card (anywhere)
- [ ] Navigates to product detail page

### Test 11: Pagination
- [ ] If > 12 products, pagination appears
- [ ] Page 1 highlighted in navy
- [ ] Previous button disabled
- [ ] Click page 2
- [ ] Page smoothly scrolls to top
- [ ] New products load
- [ ] Page 2 now highlighted
- [ ] Previous button enabled
- [ ] Click Next button
- [ ] Advances to next page
- [ ] Click Previous button
- [ ] Returns to previous page
- [ ] Test ellipsis (if many pages)

### Test 12: Empty State
- [ ] Apply filters with no matches
- [ ] Empty state displays:
  - 📦 Empty box icon
  - "No Products Found" heading
  - "Try adjusting your filters" text
  - "Clear all filters" button
- [ ] Click "Clear all filters"
- [ ] Products return

---

## 📱 Mobile Testing (< 640px)

### Test 13: Mobile Layout
- [ ] Page loads correctly on mobile
- [ ] Navbar adapts to mobile
- [ ] Breadcrumb displays (smaller)
- [ ] Header stacks vertically
- [ ] Toolbar adapts:
  - Product count on left
  - Filter button visible
  - Sort dropdown on right
  - View toggle HIDDEN
- [ ] Filter sidebar HIDDEN by default
- [ ] Products display in 1 column
- [ ] Footer adapts to mobile

### Test 14: Mobile Filter Button
- [ ] Click "Filter" button in toolbar
- [ ] Dark backdrop (50% black) appears
- [ ] Filter drawer slides in from right
- [ ] Drawer is 320px wide (max 90% viewport)
- [ ] Drawer has X button in header
- [ ] "Apply Filters" button at bottom

### Test 15: Mobile Filter Interaction
- [ ] Apply several filters in drawer
- [ ] Applied filter tags appear in drawer
- [ ] Scroll drawer content
- [ ] Click "Apply Filters" button
- [ ] Drawer closes
- [ ] Products filter
- [ ] Product count updates

### Test 16: Mobile Filter Close
- [ ] Open filter drawer
- [ ] Click X button - drawer closes
- [ ] Open drawer again
- [ ] Click dark backdrop - drawer closes
- [ ] Filters not applied (unless "Apply" clicked)

### Test 17: Mobile Product Cards
- [ ] Each card takes full width
- [ ] Image displays correctly
- [ ] Product info readable
- [ ] Tap product card
- [ ] Navigates to detail page

### Test 18: Mobile Pagination
- [ ] Pagination displays at bottom
- [ ] Fewer page numbers shown (3-5)
- [ ] Previous/Next buttons larger
- [ ] Tap page number
- [ ] Page changes smoothly
- [ ] Scroll to top works

---

## 🎯 Tablet Testing (640px - 1024px)

### Test 19: Tablet Layout
- [ ] Filter sidebar visible (not overlay)
- [ ] Products display in 2-3 columns
- [ ] View toggle visible
- [ ] All controls accessible

### Test 20: Tablet Interactions
- [ ] Switch between grid/list view
- [ ] Apply filters
- [ ] Sort products
- [ ] Navigate pages
- [ ] Click product cards

---

## 🔗 URL Parameter Testing

### Test 21: Category Filter
- [ ] Navigate to: `/products?category=cookware`
- [ ] Only cookware products display
- [ ] Breadcrumb shows: 🏠 / Shop / Cookware
- [ ] Header shows "Cookware"
- [ ] Product count for category only

### Test 22: Search Query
- [ ] Navigate to: `/products?search=pan`
- [ ] Products with "pan" in name display
- [ ] Header shows: 'Search Results for "pan"'
- [ ] Product count for results

### Test 23: Combined Parameters
- [ ] Navigate to: `/products?category=bakeware&search=tray`
- [ ] Both filters apply
- [ ] Products match both criteria

---

## 🚨 Error Handling

### Test 24: API Error
- [ ] Stop API server
- [ ] Refresh page
- [ ] Loading state shows
- [ ] Empty state with error message
- [ ] No console errors

### Test 25: Missing Images
- [ ] Product with invalid image URL
- [ ] Placeholder image displays
- [ ] Shopping cart icon in gray
- [ ] No broken image icons

### Test 26: Long Product Names
- [ ] Product with very long name
- [ ] Name truncates to 2 lines
- [ ] Ellipsis appears (...)
- [ ] Tooltip shows full name on hover

---

## ⚡ Performance Testing

### Test 27: Page Load Speed
- [ ] Open DevTools Network tab
- [ ] Hard refresh page (Ctrl+Shift+R)
- [ ] Initial load < 3 seconds
- [ ] Images lazy load
- [ ] No layout shifts

### Test 28: Filter Performance
- [ ] Apply multiple filters rapidly
- [ ] No lag or stuttering
- [ ] Products update smoothly
- [ ] No duplicate API calls

### Test 29: Smooth Scrolling
- [ ] Change page
- [ ] Smooth scroll to top (not jump)
- [ ] Scroll completes before products load

---

## ♿ Accessibility Testing

### Test 30: Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus visible on each element
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in pagination
- [ ] Escape closes mobile filter

### Test 31: Screen Reader
- [ ] Use screen reader (NVDA/JAWS/VoiceOver)
- [ ] Breadcrumb announces correctly
- [ ] Product count announced
- [ ] Filter labels read correctly
- [ ] Product cards have proper labels
- [ ] Button purposes clear

### Test 32: Color Contrast
- [ ] All text meets WCAG AA (4.5:1)
- [ ] Focus indicators visible
- [ ] Active states clear
- [ ] Disabled states distinguishable

---

## 🎨 Visual Regression

### Test 33: Brand Colors
- [ ] Navy blue `#1a3a5c` for primary
- [ ] Gold `#c9a84c` for NEW badges
- [ ] Red `#e74c3c` for discounts
- [ ] Consistent throughout

### Test 34: Spacing & Alignment
- [ ] Consistent padding (16px)
- [ ] Grid gaps uniform (24px)
- [ ] Text properly aligned
- [ ] No overlapping elements

### Test 35: Responsive Images
- [ ] All images load correctly
- [ ] No distortion or stretching
- [ ] Aspect ratios maintained
- [ ] Hover zoom smooth

---

## 🐛 Edge Cases

### Test 36: Zero Products
- [ ] Navigate to category with 0 products
- [ ] Empty state displays correctly
- [ ] No errors in console

### Test 37: Single Product
- [ ] Filter to 1 product only
- [ ] Grid displays correctly
- [ ] Pagination hidden
- [ ] No layout issues

### Test 38: Exactly 12 Products
- [ ] Products equal page limit
- [ ] All 12 display
- [ ] Pagination shows only page 1
- [ ] Next button disabled

### Test 39: Very Large Product Count
- [ ] Many products (50+)
- [ ] Pagination shows ellipsis
- [ ] Page numbers smart
- [ ] No performance issues

### Test 40: Rapid Filter Changes
- [ ] Apply filter
- [ ] Immediately apply another
- [ ] Change sort while loading
- [ ] No race conditions
- [ ] Final state correct

---

## 📊 Test Results Template

```markdown
## Test Results - [Date]

**Browser**: Chrome/Firefox/Safari/Edge
**Device**: Desktop/Mobile/Tablet
**Viewport**: 1920x1080 / 375x667 / etc.

### Desktop Tests (1-12)
- [ ] ✅ Test 1: Initial Page Load
- [ ] ✅ Test 2: Filter Sidebar
- [ ] ✅ Test 3: Checkbox Filters
- [ ] ❌ Test 4: Price Range Filter - FAILED: Slider not smooth
- [ ] ... (continue)

### Mobile Tests (13-18)
- [ ] ✅ Test 13: Mobile Layout
- [ ] ... (continue)

### Issues Found:
1. **Issue**: Slider not smooth on drag
   **Severity**: Medium
   **Steps**: 1. Open filters, 2. Drag price slider
   **Expected**: Smooth drag
   **Actual**: Jumpy movement

### Overall Result: ✅ PASS / ❌ FAIL

**Pass Rate**: 38/40 (95%)
**Critical Issues**: 0
**Minor Issues**: 2
```

---

## 🎯 Quick Smoke Test (5 minutes)

For rapid testing, run these essential checks:

1. **Load** - Page loads without errors
2. **Filter** - Apply one checkbox filter → products update
3. **Sort** - Change sort option → products re-sort
4. **View** - Toggle grid/list view → layout changes
5. **Page** - Click next page → new products load
6. **Mobile** - Resize to mobile → filter button appears
7. **Card** - Click product card → detail page loads

**All 7 pass?** ✅ Basic functionality working!

---

## 🚀 Ready to Test!

Navigate to: `http://localhost:3001/products`

Start with the Quick Smoke Test, then run full test suite for comprehensive validation.

**Good luck! 🎉**
